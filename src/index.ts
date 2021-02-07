import { Page } from 'playwright'
import * as fs from 'fs'
import { AxeResults, ElementContext, Result, RunOptions, Spec } from 'axe-core'
import { ConfigOptions, Options } from '../index'
import {
  getImpactedViolations,
  printViolationTerminal,
  testResultDependsOnViolations,
} from './utils'

declare global {
  interface Window {
    axe: any
  }
}

/**
 * Injects axe executable commands in the active window
 * @param page
 */
export const injectAxe = async (page: Page): Promise<void> => {
  const axe: string = fs.readFileSync(
    require.resolve('axe-core/axe.min.js'),
    'utf8',
  )
  await page.evaluate((axe: string) => window.eval(axe), axe)
}

/**
 * Configures axe runtime options
 * @param page
 * @param configurationOptions
 */
export const configureAxe = async (
  page: Page,
  configurationOptions: ConfigOptions = {},
): Promise<void> => {
  await page.evaluate(
    (configOptions: Spec) => window.axe.configure(configOptions),
    configurationOptions as Spec,
  )
}

/**
 * Performs Axe validations
 * @param page
 * @param context
 * @param options
 * @param skipFailures
 */
export const checkA11y = async (
  page: Page,
  context: ElementContext | undefined = undefined,
  options: Options | undefined = undefined,
  skipFailures: boolean = false,
): Promise<void> => {
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
