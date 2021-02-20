import { Aggregate, NodeViolation } from './types'
import { ImpactValue, Result } from 'axe-core'
import assert from 'assert'

export const getImpactedViolations = (
  violations: Result[],
  includedImpacts: ImpactValue[] = [],
): Result[] => {
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
