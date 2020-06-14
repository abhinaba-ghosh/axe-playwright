import { chromium, Browser, Page } from 'playwright';
import { injectAxe, checkA11y } from '../src';

let browser: Browser;
let page: Page;

describe('Playwright web page accessibility test', () => {
  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
    await page.goto('https://angular.io/');
    await injectAxe(page);
  });

  it('check a11y', async () => {
    await checkA11y(page);
  });

  afterAll(async () => {
    await browser.close();
  });
});
