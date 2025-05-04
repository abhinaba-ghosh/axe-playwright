import { Page } from 'playwright'
import * as fs from 'fs'
import axe, {
  AxeResults,
  ElementContext,
  Result,
  RunOptions,
  Spec,
} from 'axe-core'
import { getImpactedViolations, testResultDependsOnViolations } from './utils'
import DefaultTerminalReporter from './reporter/defaultTerminalReporter'
import TerminalReporterV2 from './reporter/terminalReporterV2'
import Reporter, { ConfigOptions, AxeOptions } from './types'
import { CreateReport, createHtmlReport, Options } from 'axe-html-reporter'
import JUnitReporter from './reporter/junitReporter'
import * as path from 'path'

declare global {
  interface Window {
    axe: any
  }
}

declare module 'axe-core' {
  interface Node {}
}

/**
 * Injects axe executable commands in the active window
 * @param page
 */
export const injectAxe = async (page: Page): Promise<void> => {
  const axe: string = fs.readFileSync(require.resolve('axe-core/axe.min.js'), {
    encoding: 'utf8',
  })
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
 * Runs axe-core tools on the relevant page and returns all results
 * @param page
 * @param context
 * @param options
 */
export const getAxeResults = async (
  page: Page,
  context?: ElementContext,
  options?: RunOptions,
): Promise<AxeResults> => {
  const result = await page.evaluate(
    ([context, options]) => {
      return window.axe.run(context || window.document, options)
    },
    [context, options],
  )

  return result as Promise<AxeResults>
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
  options?: RunOptions,
): Promise<Result[]> => {
  const result = await getAxeResults(page, context, options)
  return result.violations
}

/**
 * Report violations given the reporter.
 * @param violations
 * @param reporter
 */
export const reportViolations = async (
  violations: Result[],
  reporter: Reporter,
): Promise<void> => {
  await reporter.report(violations)
}

/**
 * Performs Axe validations
 * @param page
 * @param context
 * @param axeOptions
 * @param skipFailures
 * @param reporter
 * @param options
 */
export const checkA11y = async (
  page: Page,
  context: ElementContext | undefined = undefined,
  axeOptions: AxeOptions | undefined = undefined,
  skipFailures: boolean = false,
  reporter: Reporter | 'default' | 'html' | 'junit' | 'v2' = 'default',
  options: Options | undefined = undefined,
): Promise<void> => {
  const violations = await getViolations(page, context, axeOptions?.axeOptions)

  const impactedViolations = getImpactedViolations(
    violations,
    axeOptions?.includedImpacts,
  )

  let reporterWithOptions: Promise<void> | Reporter | void | any

  if (reporter === 'default') {
    reporterWithOptions = new DefaultTerminalReporter(
      axeOptions?.detailedReport,
      axeOptions?.detailedReportOptions?.html,
      axeOptions?.verbose ?? true,
    )
  } else if (reporter === 'v2') {
    reporterWithOptions = new TerminalReporterV2(axeOptions?.verbose ?? false)
  } else if (reporter === 'html') {
    if (violations.length > 0) {
      await createHtmlReport({
        results: { violations },
        options,
      } as CreateReport)
      testResultDependsOnViolations(violations, skipFailures)
    } else console.log('There were no violations to save in report')
  } else if (reporter === 'junit') {
    // Get the system root directory
    // Construct the file path
    const outputFilePath = path.join(
      process.cwd(),
      options?.outputDirPath as any,
      options?.outputDir as any,
      options?.reportFileName as any,
    )

    reporterWithOptions = new JUnitReporter(
      axeOptions?.detailedReport,
      page,
      outputFilePath,
    )
  } else {
    reporterWithOptions = reporter
  }

  if (reporter !== 'html' && reporter !== 'junit')
    await reportViolations(impactedViolations, reporterWithOptions)

  if (reporter === 'v2' || (reporter !== 'html'))
    testResultDependsOnViolations(impactedViolations, skipFailures)
}

export { DefaultTerminalReporter }
