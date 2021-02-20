import Reporter from '../types'
import { Result } from 'axe-core'
import { describeViolations } from '../utils'

export default class DefaultTerminalReporter implements Reporter {
  constructor(
    protected detailedReport: boolean | undefined,
    protected includeHtml: boolean | undefined,
  ) {}

  async report(violations: Result[]): Promise<void> {
    const violationData = violations.map(({ id, impact, description, nodes }) => {
      return {
        id,
        impact,
        description,
        nodes: nodes.length,
      }
    })

    if (violationData.length > 0) {
      // summary
      console.table(violationData)
      if (this.detailedReport) {
        const nodeViolations = describeViolations(violations).map(
          ({ target, html, violations }) => {
            if (!this.includeHtml) {
              return {
                target,
                violations,
              }
            }
            return { target, html, violations }
          },
        )
        // per node
        console.table(nodeViolations)
      }
    } else {
      console.log(`No accessibility violations detected!`)
    }
  }
}
