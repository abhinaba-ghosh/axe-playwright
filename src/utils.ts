import { Aggregate, NodeViolation } from './types'
import { ImpactValue, Result } from 'axe-core'
import assert from 'assert'

export const getImpactedViolations = (
  violations: Result[],
  includedImpacts: ImpactValue[] = [],
) => {
  return Array.isArray(includedImpacts) && includedImpacts.length
    ? violations.filter(
        (v: Result) => v.impact && includedImpacts.includes(v.impact),
      )
    : violations
}

export const testResultDependsOnViolations = (
  violations: Result[],
  skipFailures: boolean,
) => {
  if (!skipFailures) {
    assert.strictEqual(
      violations.length,
      0,
      `${violations.length} accessibility violation${
        violations.length === 1 ? '' : 's'
      } ${violations.length === 1 ? 'was' : 'were'} detected`,
    )
  } else {
    if (violations.length) {
      console.warn({
        name: 'a11y violation summary',
        message: `${violations.length} accessibility violation${
          violations.length === 1 ? '' : 's'
        } ${violations.length === 1 ? 'was' : 'were'} detected`,
      })
    }
  }
}

export const describeViolations = (violations: Result[]): NodeViolation[] => {
  const aggregate: Aggregate = {}

  violations.map(({ nodes }, index) => {
    nodes.forEach(({ target, html }) => {
      const key = JSON.stringify(target) + html

      if (aggregate[key]) {
        aggregate[key].violations.push(index)
      } else {
        aggregate[key] = {
          target: JSON.stringify(target),
          html,
          violations: [index],
        }
      }
    })
  })
  return Object.values(aggregate).map(({ target, html, violations }) => {
    return { target, html, violations: JSON.stringify(violations) }
  })
}

export const printViolationTerminal = (
  violations: Result[],
  detailedReport: boolean,
  includeHtml: boolean,
) => {
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
    if (detailedReport) {
      const nodeViolations = describeViolations(violations).map(
        ({ target, html, violations }) => {
          if (!includeHtml) {
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
