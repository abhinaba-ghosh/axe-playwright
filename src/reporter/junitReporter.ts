import Reporter from '../types'
import { Result } from 'axe-core'
import { Page } from 'playwright'
import builder from 'junit-report-builder'
import pc from 'picocolors'
import assert from 'assert'
import * as fs from 'fs'
import * as path from 'path'

export default class JUnitReporter implements Reporter {
  constructor(
    protected verbose: boolean | undefined,
    protected page: Page | undefined,
    protected outputFilename: string | undefined,
  ) {}

  async report(violations: Result[]): Promise<void> {
    let lineBreak = '\n'
    let pageUrl = this.page?.url() || 'Page'
    let suite = builder.testSuite().name(pageUrl)

    const message =
      violations.length === 0
        ? 'No accessibility violations detected!'
        : `Found ${violations.length} accessibility violations`

    violations.map((violation) => {
      const errorBody = violation.nodes
        .map((node) => {
          const selector = node.target.join(', ')
          const expectedText =
            `Expected the HTML found at $('${selector}') to have no violations:` +
            '\n'
          return (
            expectedText +
            node.html +
            lineBreak +
            `Received:\n` +
            `${violation.help} (${violation.id})` +
            lineBreak +
            node.failureSummary +
            lineBreak +
            (violation.helpUrl
              ? `You can find more information on this issue here: \n${violation.helpUrl}`
              : '') +
            '\n'
          )
        })
        .join(lineBreak)

      suite
        .testCase()
        .className(violation.id)
        .name(violation.description)
        .failure(errorBody)
    })

    const pass = violations.length === 0

    if (pass) {
      suite.testCase().name('Accesibility testing - A11Y')
      this.verbose && console.log(`No accessibility violations detected!`)
    }
    let location = this.outputFilename || 'a11y-tests.xml'

    const dir = path.dirname(location)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Check if the file exists, if not create it
    if (!fs.existsSync(location)) {
      fs.writeFileSync(location, '') // Create an empty file
    }

    builder.writeTo(location)

    if (!pass) {
      assert.fail(message)
    }
  }
}
