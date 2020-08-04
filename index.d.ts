import { ElementContext, ImpactValue, RunOptions } from 'axe-core'
import { Page } from 'playwright'

export interface axeOptionsConfig {
  axeOptions: RunOptions
}

export type Options = { includedImpacts?: ImpactValue[] } & axeOptionsConfig

declare module 'axe-core' {
  interface Node {}
}

/**
 * Injects axe into browser-context
 */
export function injectAxe(page: Page): void

/**
 * Performs accessibility checks in the web page
 * @param context
 * @param options
 * @param skipFailures
 */
export function checkA11y(
  page: Page,
  context?: ElementContext,
  options?: Options,
  skipFailures?: boolean,
): void

/**
 * configure different axe configurations
 * @param options
 */
export function configureAxe(page: Page, options?: RunOptions): void
