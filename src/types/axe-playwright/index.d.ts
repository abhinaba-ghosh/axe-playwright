import { Page } from 'playwright';
import {
  AxeResults,
  ElementContext,
  Result,
  RunOptions,
  Spec,
  ImpactValue,
  Locale,
  Rule,
  Check
} from 'axe-core';

export interface NodeViolation {
  target: string;
  html: string;
  violations: string;
}

export interface Aggregate {
  [key: string]: {
    target: string;
    html: string;
    violations: number[];
  };
}

export interface Reporter {
  report(violations: Result[]): Promise<void>;
}

export interface axeOptionsConfig {
  axeOptions?: RunOptions;
}

export interface ConfigOptions {
  branding?: {
    brand?: string;
    application?: string;
  };
  reporter?: 'v1' | 'v2' | 'no-passes';
  checks?: Check[];
  rules?: Rule[];
  locale?: Locale;
  axeVersion?: string;
}

export type AxeOptions = {
  includedImpacts?: ImpactValue[];
  detailedReport?: boolean;
  detailedReportOptions?: { html?: boolean };
  verbose?: boolean;
} & axeOptionsConfig;

/**
 * Injects axe executable commands in the active window
 * @param page Playwright Page object
 */
export function injectAxe(page: Page): Promise<void>;
/**
 * Configures axe runtime options
 * @param page Playwright Page object
 * @param configurationOptions Axe configuration options
 */
export function configureAxe(page: Page, configurationOptions?: ConfigOptions): Promise<void>;
/**
 * Runs axe-core tools on the relevant page and returns all results
 * @param page Playwright Page object
 * @param context Optional element context
 * @param options Optional axe run options
 */
export function getAxeResults(page: Page, context?: ElementContext, options?: RunOptions): Promise<AxeResults>;
/**
 * Runs axe-core tools and returns all accessibility violations detected on the page
 * @param page Playwright Page object
 * @param context Optional element context
 * @param options Optional axe run options
 */
export function getViolations(page: Page, context?: ElementContext, options?: RunOptions): Promise<Result[]>;
/**
 * Report violations using the provided reporter
 * @param violations Array of axe-core Result objects
 * @param reporter Reporter instance
 */
export function reportViolations(violations: Result[], reporter: Reporter): Promise<void>;
/**
 * Performs Axe validations and reporting
 * @param page Playwright Page object
 * @param context Optional element context
 * @param axeOptions Axe options
 * @param skipFailures Whether to skip failures
 * @param reporter Reporter instance or type
 * @param options Additional options
 */
export function checkA11y(
  page: Page,
  context?: ElementContext,
  axeOptions?: AxeOptions,
  skipFailures?: boolean,
  reporter?: Reporter | 'default' | 'html' | 'junit' | 'v2',
  options?: any
): Promise<void>;
/**
 * Filters violations by impact values
 * @param violations Array of axe-core Result objects
 * @param includedImpacts Array of impact values to include
 */
export function getImpactedViolations(
  violations: Result[],
  includedImpacts?: ImpactValue[]
): Result[];
/**
 * Asserts or warns based on the presence of violations and skipFailures flag
 * @param violations Array of axe-core Result objects
 * @param skipFailures Whether to skip failures
 */
export function testResultDependsOnViolations(
  violations: Result[],
  skipFailures: boolean
): void;
/**
 * Aggregates and describes violations for reporting
 * @param violations Array of axe-core Result objects
 * @returns Array of NodeViolation objects
 */
export function describeViolations(violations: Result[]): NodeViolation[];
