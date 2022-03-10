import { AxeResults, Check, ElementContext, ImpactValue, Locale, Result, Rule, RunOptions } from 'axe-core'
import { Page } from 'playwright'

export interface axeOptionsConfig {
  axeOptions: RunOptions
}

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

/**
 * Implement this interface to be able to specific custom reporting behaviour for checkA11y method.
 * @see checkA11y
 */
export default interface Reporter {
  report(violations: Result[]): Promise<void>
}

/**
 * Default implementation of a reporter which prints a summary to the console.
 */
export class DefaultTerminalReporter implements Reporter {
  constructor(detailedReport: boolean | undefined, includeHtml: boolean | undefined)
  report(violations: Result[]): Promise<void>
}

export type Options = {
  includedImpacts?: ImpactValue[]
  detailedReport?: boolean
  detailedReportOptions?: { html?: boolean }
} & axeOptionsConfig

declare module 'axe-core' {
  interface Node {}
}

/**
 * Injects axe into browser-context
 */
export function injectAxe(page: Page): Promise<void>

/**
 * Performs accessibility checks in the web page
 * @param page
 * @param context
 * @param options
 * @param skipFailures
 */
export function checkA11y(
  page: Page,
  context?: ElementContext,
  options?: Options,
  skipFailures?: boolean,
): Promise<void>

/**
 * configure different axe configurations
 * @param page
 * @param options
 */
export function configureAxe(page: Page, options?: ConfigOptions): Promise<void>

/**
 * Runs axe-core tools on the relevant page and returns all results
 * @param page
 * @param context
 * @param options
 */
export function getAxeResults(page: Page, context?: ElementContext, options?: RunOptions): Promise<AxeResults>

/**
 * Runs axe-core tools on the relevant page and returns all accessibility violations detected on the page
 * @param page
 * @param context
 * @param options
 */
export function getViolations(page: Page, context?: ElementContext, options?: RunOptions): Promise<Result[]>

/**
 * Report violations given the reporter.
 * @param violations
 * @param reporter
 */
export function reportViolations(violations: Result[], reporter: Reporter): Promise<void>