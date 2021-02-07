import { Browser, chromium, Page } from 'playwright'
import { checkA11y, injectAxe } from '../src'
import each from 'jest-each'

let browser: Browser
let page: Page

describe('Playwright web page accessibility test', () => {
  each([
    ['on page with detectable accessibility issues', `file://${process.cwd()}/test/site.html`],
    ['on page with no detectable accessibility issues', `file://${process.cwd()}/test/site-no-accessibility-issues.html`],
  ]).it('check a11y %s', async (description, site) => {
    browser = await chromium.launch({ args: ['--no-sandbox'] })
    page = await browser.newPage()
    await page.goto(site)
    await injectAxe(page)
    await checkA11y(
      page,
      'form',
      {
        axeOptions: {
          runOnly: {
            type: 'tag',
            values: ['wcag2a'],
          },
        },
      },
      true,
    )
  })

  afterEach(async () => {
    await browser.close()
  })
})
