import Reporter from '../types'
import { Result } from 'axe-core'
import assert from 'assert'
import pc from 'picocolors'

export default class TerminalReporterV2 implements Reporter {
  constructor(
    protected verbose: boolean | undefined,
  ) {}

  async report(violations: Result[]) {
    const lineBreak = '\n\n'

    const message =
      violations.length === 0
        ? 'No accessibility violations detected!'
        : `Found ${violations.length} accessibility violations: \n`

    const horizontalLine = pc.bold('-'.repeat(message.length))

    const reporter = (violations: Result[]) => {
      if (violations.length === 0) {
        return []
      }

      return violations
        .map((violation) => {
          const errorBody = violation.nodes
            .map((node) => {
              const selector = node.target.join(', ')
              const expectedText =
                `Expected the HTML found at $('${selector}') to have no violations:` +
                '\n'
              return (
                pc.bold(expectedText) +
                pc.gray(node.html) +
                lineBreak +
                `Received:\n` +
                pc.red(`${violation.help} (${violation.id})`) +
                lineBreak +
                pc.bold(pc.yellow(node.failureSummary)) +
                lineBreak +
                (violation.helpUrl
                  ? `You can find more information on this issue here: \n${pc.bold(
                      pc.blue(violation.helpUrl),
                    )}`
                  : '') +
                '\n' +
                horizontalLine
              )
            })
            .join(lineBreak)

          return errorBody
        })
        .join(lineBreak)
    }
    const formatedViolations = reporter(violations)
    const pass = formatedViolations.length === 0

    if (pass) {
      this.verbose && console.log(message)
    } else {
      assert.fail(message + horizontalLine + '\n' + formatedViolations)
    }
  }
}
