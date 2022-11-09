import { Browser, chromium, Page } from 'playwright'
import { checkA11y, injectAxe } from '../src'
import each from 'jest-each'

let browser: Browser
let page: Page

describe('Playwright web page accessibility test', () => {
  each([
    [
      'on page with detectable accessibility issues',
      `file://${process.cwd()}/test/site.html`,
    ],
    [
      'on page with no detectable accessibility issues',
      `file://${process.cwd()}/test/site-no-accessibility-issues.html`,
    ],
  ]).it('check a11y %s', async (description, site) => {
    const log = jest.spyOn(global.console, 'log')

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

    // condition to check console logs for both the cases
    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/(accessibility|impact)/i),
    )
  })

  afterEach(async () => {
    await browser.close()
  })
})

describe('Playwright web page accessibility test using reporter v2', () => {
  each([
    [
      'on page with detectable accessibility issues',
      `file://${process.cwd()}/test/site.html`,
    ],
    [
      'on page with no detectable accessibility issues',
      `file://${process.cwd()}/test/site-no-accessibility-issues.html`,
    ],
  ]).it('check a11y %s', async (description, site) => {
    try {
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
        'v2',
      )
      description === 'on page with detectable accessibility issues'
        ? expect.assertions(1)
        : expect.assertions(0)
    } catch (e) {
      console.log(e)
    }
  })

  afterEach(async () => {
    await browser.close()
  })
})

describe('Playwright web page accessibility test using verbose false on default reporter', () => {
  each([
    [
      'on page with no detectable accessibility issues',
      `file://${process.cwd()}/test/site-no-accessibility-issues.html`,
    ],
  ]).it('check a11y %s', async (description, site) => {
    const log = jest.spyOn(global.console, 'log')

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
        verbose: false,
      },
      true,
    )
    expect(log).toHaveBeenCalledWith(
      expect.not.stringMatching(/accessibility/i),
    )
  })

  afterEach(async () => {
    await browser.close()
  })
})

describe('Playwright web page accessibility test using verbose true on reporter v2', () => {
  each([
    [
      'on page with no detectable accessibility issues',
      `file://${process.cwd()}/test/site-no-accessibility-issues.html`,
    ],
  ]).it('check a11y %s', async (description, site) => {
    const log = jest.spyOn(global.console, 'log')

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
        verbose: true,
      },
      true,
      'v2',
    )

    expect(log).toHaveBeenCalledWith(expect.stringMatching(/accessibility/i))
  })

  afterEach(async () => {
    await browser.close()
  })
})
