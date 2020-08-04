import { Page } from "playwright";
import * as fs from "fs";
import assert from "assert";
import {
  AxeResults,
  ElementContext,
  ImpactValue,
  RunOptions,
  NodeResult,
  Result,
} from "axe-core";

declare global {
  interface Window {
    axe: any;
  }
}

interface axeOptionsConfig {
  axeOptions: RunOptions;
}

type Options = {
  includedImpacts?: ImpactValue[];
  detailedReport?: boolean;
} & axeOptionsConfig;

export const injectAxe = async (page: Page) => {
  const axe: string = fs.readFileSync(
    "node_modules/axe-core/axe.min.js",
    "utf8"
  );
  await page.evaluate((axe: string) => window.eval(axe), axe);
};

export const configureAxe = async (
  page: Page,
  configurationOptions: RunOptions = {}
) => {
  await page.evaluate(() => window.axe.configure(configurationOptions));
};

export const checkA11y = async (
  page: Page,
  context?: ElementContext | null,
  options?: Options,
  skipFailures: boolean = false
) => {
  let axeResults: AxeResults = await page.evaluate(
    ([context, options]) => {
      let isEmptyObjectorNull = function (value: any) {
        if (value == null) return true;
        return (
          Object.entries(value).length === 0 && value.constructor === Object
        );
      };

      if (isEmptyObjectorNull(context)) context = undefined;
      if (isEmptyObjectorNull(options)) options = undefined;
      const axeOptions: {} = options ? options["axeOptions"] : {};
      return window.axe.run(context || window.document, axeOptions);
    },
    [context, options]
  );

  const { includedImpacts, detailedReport = true } = options || {};
  const violations: Result[] = getImpactedViolations(
    axeResults.violations,
    includedImpacts
  );

  printViolationTerminal(violations, detailedReport);
  testResultDependsOnViolations(violations, skipFailures);
};

const getImpactedViolations = (
  violations: Result[],
  includedImpacts: ImpactValue[] = []
) => {
  return Array.isArray(includedImpacts) && includedImpacts.length
    ? violations.filter(
        (v: Result) => v.impact && includedImpacts.includes(v.impact)
      )
    : violations;
};

const testResultDependsOnViolations = (
  violations: Result[],
  skipFailures: boolean
) => {
  if (!skipFailures) {
    assert.strictEqual(
      violations.length,
      0,
      `${violations.length} accessibility violation${
        violations.length === 1 ? "" : "s"
      } ${violations.length === 1 ? "was" : "were"} detected`
    );
  } else {
    if (violations.length) {
      console.log({
        name: "a11y violation summary",
        message: `${violations.length} accessibility violation${
          violations.length === 1 ? "" : "s"
        } ${violations.length === 1 ? "was" : "were"} detected`,
      });
    }
  }
};

interface NodeViolation {
  key: string;
  violations: string[];
}

const describeViolations = (violations: Result[]) => {
  const nodeViolations: NodeViolation[] = [];
  const prefix = "Fix any of the following:\n  ";

  violations.map(({ nodes }) => {
    nodes.forEach((node: NodeResult) => {
      const key = `${node.html} > ${JSON.stringify(node.target)} `;
      const failure =
        node.failureSummary && node.failureSummary.startsWith(prefix)
          ? node.failureSummary.slice(prefix.length)
          : node.failureSummary || "";

      const nodeViolation: NodeViolation = {
        key,
        violations: [failure],
      };

      const index = nodeViolations.findIndex((nv) => nv.key === key);
      if (index > -1) {
        nodeViolations[index].violations.concat(nodeViolation.violations);
      } else {
        nodeViolations.push(nodeViolation);
      }
    });
  });

  return nodeViolations;
};

const printViolationTerminal = (
  violations: Result[],
  detailedReport: boolean
) => {
  const violationData = violations.map(({ id, impact, description, nodes }) => {
    return {
      id,
      impact,
      description,
      nodes: nodes.length,
    };
  });

  if (violationData.length > 0) {
    // summary
    console.table(violationData);
    if (detailedReport) {
      const nodeViolations = describeViolations(violations);
      // per node
      nodeViolations.map((nodeViolation) => console.table(nodeViolation));
    }
  }
};
