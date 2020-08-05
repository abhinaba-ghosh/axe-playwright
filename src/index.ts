import { Page } from 'playwright'
import * as fs from 'fs'
import assert from 'assert'
import {
  AxeResults,
  ElementContext,
  ImpactValue,
  RunOptions,
  NodeResult,
  Result,
  Spec,
} from 'axe-core'

declare global {
  interface Window {
    axe: any
  }
}

interface axeOptionsConfig {
  axeOptions: RunOptions
}

type Options = {
  includedImpacts?: ImpactValue[]
  detailedReport?: boolean
} & axeOptionsConfig

export const injectAxe = async (page: Page) => {
  const axe: string = fs.readFileSync(
    'node_modules/axe-core/axe.min.js',
    'utf8',
  )
  await page.evaluate((axe: string) => window.eval(axe), axe)
}

export const configureAxe = async (
  page: Page,
  configurationOptions: Spec = {},
) => {
  await page.evaluate(
    (configOptions: Spec) => window.axe.configure(configOptions),
    configurationOptions,
  )
}

export const checkA11y = async (
  page: Page,
  context: ElementContext | undefined = undefined,
  options: Options | undefined = undefined,
  skipFailures: boolean = false,
) => {
  let axeResults: AxeResults = await page.evaluate(
    ([context, options]) => {
      const axeOptions: RunOptions = options ? options['axeOptions'] : {}
      return window.axe.run(context || window.document, axeOptions)
    },
    [context, options],
  )

  const { includedImpacts, detailedReport = true } = options || {}
  const violations: Result[] = getImpactedViolations(
    axeResults.violations,
    includedImpacts,
  )

  printViolationTerminal(violations, detailedReport)
  testResultDependsOnViolations(violations, skipFailures)
}

const getImpactedViolations = (
  violations: Result[],
  includedImpacts: ImpactValue[] = [],
) => {
  return Array.isArray(includedImpacts) && includedImpacts.length
    ? violations.filter(
        (v: Result) => v.impact && includedImpacts.includes(v.impact),
      )
    : violations
}

const testResultDependsOnViolations = (
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
      console.log({
        name: 'a11y violation summary',
        message: `${violations.length} accessibility violation${
          violations.length === 1 ? '' : 's'
        } ${violations.length === 1 ? 'was' : 'were'} detected`,
      })
    }
  }
}

interface NodeViolation {
  target: string
  html: string
  violation: string
}

const describeViolations = (violations: Result[]) => {
  const nodeViolations: NodeViolation[] = []
  const prefix = 'Fix any of the following:\n  '

  violations.map(({ nodes }) => {
    nodes.forEach((node: NodeResult) => {
      const failure =
        node.failureSummary && node.failureSummary.startsWith(prefix)
          ? node.failureSummary.slice(prefix.length)
          : node.failureSummary || ''

      nodeViolations.push({
        html: node.html,
        target: JSON.stringify(node.target),
        violation: failure,
      })
    })
  })

  return nodeViolations
}

const printViolationTerminal = (
  violations: Result[],
  detailedReport: boolean,
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
      const nodeViolations = describeViolations(violations)
      // per node
      console.table(nodeViolations)
    }
  }
}
