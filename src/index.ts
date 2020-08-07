import { Page } from 'playwright'
import * as fs from 'fs'
import assert from 'assert'
import {
  AxeResults,
  Check,
  ElementContext,
  ImpactValue,
  Locale,
  Result,
  Rule,
  RunOptions,
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
  detailedReportOptions?: { html?: boolean }
} & axeOptionsConfig

export interface ConfigOptions {
  branding?: {
    brand?: string
    application?: string
  }
  reporter?: 'v1' | 'v2' | 'no-passes'
  checks?: Check[]
  rules?: Rule[]
  locale?: Locale
  axeVersion?: string
}

export const injectAxe = async (page: Page) => {
  const axe: string = fs.readFileSync(
    'node_modules/axe-core/axe.min.js',
    'utf8',
  )
  await page.evaluate((axe: string) => window.eval(axe), axe)
}

export const configureAxe = async (
  page: Page,
  configurationOptions: ConfigOptions = {},
) => {
  await page.evaluate(
    (configOptions: Spec) => window.axe.configure(configOptions),
    configurationOptions as Spec,
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

  const {
    includedImpacts,
    detailedReport = false,
    detailedReportOptions = { html: false },
  } = options || {}
  const violations: Result[] = getImpactedViolations(
    axeResults.violations,
    includedImpacts,
  )

  printViolationTerminal(
    violations,
    detailedReport,
    !!detailedReportOptions.html,
  )
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
  violations: string
}

interface Aggregate {
  [key: string]: {
    target: string
    html: string
    violations: number[]
  }
}

const describeViolations = (violations: Result[]): NodeViolation[] => {
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

const printViolationTerminal = (
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
  }
}
