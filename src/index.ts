import { Page } from 'playwright'
import * as fs from 'fs'
import { ElementContext, Result, RunOptions, Spec } from 'axe-core'
import { ConfigOptions, Options } from '../index'
import { getImpactedViolations, testResultDependsOnViolations } from './utils'
import DefaultTerminalReporter from './reporter/defaultTerminalReporter'
import Reporter from './types'

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
 * Runs axe-core tools on the relevant page and returns all accessibility violations detected on the page
 * @param page
 * @param context
 * @param options
 */
export const getViolations = async (
  page: Page,
  context?: ElementContext,
  options?: Options,
): Promise<Result[]> => {
  const result = await page.evaluate(
    ([context, options]) => {
      const axeOptions: RunOptions = options ? options['axeOptions'] : {}
      return window.axe.run(context || window.document, axeOptions)
    },
    [context, options],
  )

  return result.violations
}

/**
 * Report violations given the reporter.
 * @param violations
 * @param reporter
 */
export const reportViolations = async (violations: Result[], reporter: Reporter): Promise<void> => {
  await reporter.report(violations)
}

/**
 * Performs Axe validations
 * @param page
 * @param context
 * @param options
 * @param skipFailures
 * @param reporter
 */
export const checkA11y = async (
  page: Page,
  context: ElementContext | undefined = undefined,
  options: Options | undefined = undefined,
  skipFailures: boolean = false,
  reporter: Reporter = new DefaultTerminalReporter(options?.detailedReport, options?.detailedReportOptions?.html),
): Promise<void> => {
  const violations = await getViolations(page, context, options)

  const impactedViolations = getImpactedViolations(
    violations,
    options?.includedImpacts,
  )

  await reportViolations(
    impactedViolations,
    reporter,
  )

  testResultDependsOnViolations(impactedViolations, skipFailures)
}
