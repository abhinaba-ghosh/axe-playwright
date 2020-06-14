import { Page } from 'playwright';
import * as fs from 'fs';
import assert from 'assert';

declare global {
  interface Window {
    axe: any;
  }
}

export const injectAxe = async (page: Page) => {
  const axe: string = fs.readFileSync(
    'node_modules/axe-core/axe.min.js',
    'utf8'
  );
  await page.evaluate((axe: string) => window.eval(axe), axe);
};

export const configureAxe = async (page: Page, configurationOptions = {}) => {
  await page.evaluate(() => window.axe.configure(configurationOptions));
};

export const checkA11y = async (
  page: Page,
  context?: any,
  options?: any,
  skipFailures: boolean = false
) => {
  let violations: any = await page.evaluate(
    ([context, options]) => {
      let isEmptyObjectorNull = function (value: any) {
        if (value == null) return true;
        return (
          Object.entries(value).length === 0 && value.constructor === Object
        );
      };

      if (isEmptyObjectorNull(context)) context = undefined;
      if (isEmptyObjectorNull(options)) options = undefined;
      const { axeOptions } = options || {};
      return window.axe.run(context || window.document, axeOptions);
    },
    [context, options]
  );

  const { includedImpacts } = options || {};
  violations = getImpactedViolations(violations.violations, includedImpacts);
  console.log(`violations: ${JSON.stringify(violations, null, 2)}`);

  testResultDependsOnViolations(violations, skipFailures);

  //   return cy.wrap(violations, { log: false });
  // })
  // .then((violations) => {
  //   if (!skipFailures) {
  //     assert.equal(
  //       violations.length,
  //       0,
  //       `${violations.length} accessibility violation${
  //         violations.length === 1 ? '' : 's'
  //       } ${violations.length === 1 ? 'was' : 'were'} detected`
  //     );
  //   } else {
  //     if (violations.length) {
  //       Cypress.log({
  //         name: 'a11y violation summary',
  //         message: `${violations.length} accessibility violation${
  //           violations.length === 1 ? '' : 's'
  //         } ${violations.length === 1 ? 'was' : 'were'} detected`,
  //       });
  //     }
  //   }
  // });
};

const getImpactedViolations = (violations: any, includedImpacts: any) => {
  return includedImpacts &&
    Array.isArray(includedImpacts) &&
    Boolean(includedImpacts.length)
    ? violations.filter((v: any) => includedImpacts.includes(v.impact))
    : violations;
};

const testResultDependsOnViolations = (
  violations: any,
  skipFailures: boolean
) => {
  if (!skipFailures) {
    assert.equal(
      violations.length,
      0,
      `${violations.length} accessibility violation${
        violations.length === 1 ? '' : 's'
      } ${violations.length === 1 ? 'was' : 'were'} detected`
    );
  } else {
    if (violations.length) {
      console.log({
        name: 'a11y violation summary',
        message: `${violations.length} accessibility violation${
          violations.length === 1 ? '' : 's'
        } ${violations.length === 1 ? 'was' : 'were'} detected`,
      });
    }
  }
};
