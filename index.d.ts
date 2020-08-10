import { ElementContext, ImpactValue, RunOptions } from 'axe-core'
import { Page } from 'playwright'
import { ConfigOptions } from './src'

export interface axeOptionsConfig {
  axeOptions: RunOptions
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
