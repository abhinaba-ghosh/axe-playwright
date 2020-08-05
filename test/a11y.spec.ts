import { chromium, Browser, Page } from 'playwright'
import { injectAxe, checkA11y } from '../src'

let browser: Browser
let page: Page

describe('Playwright web page accessibility test', () => {
  beforeAll(async () => {
    browser = await chromium.launch()
    page = await browser.newPage()
    await page.goto(`file://${process.cwd()}/test/site.html`)
    await injectAxe(page)
  })

  it('check a11y', async () => {
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

  afterAll(async () => {
    await browser.close()
  })
})
