import { Page } from 'playwright';
import * as fs from 'fs';

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
  violationCallback?: any,
  skipFailures: boolean = false
) => {
  const violations: any = await page.evaluate(() => {
    return window.axe.run();
  });

  console.log(`violations: ${JSON.stringify(violations, null, 2)}`);

  // .then(({ violations }) => {
  //   return includedImpacts &&
  //     Array.isArray(includedImpacts) &&
  //     Boolean(includedImpacts.length)
  //     ? violations.filter((v) => includedImpacts.includes(v.impact))
  //     : violations;
  // });

  // .then((violations) => {
  //   if (violations.length) {
  //     if (violationCallback) {
  //       violationCallback(violations);
  //     }
  //     cy.wrap(violations, { log: false }).each((v) => {
  //       const selectors = v.nodes
  //         .reduce((acc, node) => acc.concat(node.target), [])
  //         .join(', ');

  //       Cypress.log({
  //         $el: Cypress.$(selectors),
  //         name: 'a11y error!',
  //         consoleProps: () => v,
  //         message: `${v.id} on ${v.nodes.length} Node${
  //           v.nodes.length === 1 ? '' : 's'
  //         }`,
  //       });
  //     });
  //   }

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

function isEmptyObjectorNull(value: any) {
  if (value == null) return true;
  return Object.entries(value).length === 0 && value.constructor === Object;
}
