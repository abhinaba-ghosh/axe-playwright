import { Browser, chromium, Page } from 'playwright'
import { injectAxe, checkA11y, getViolations } from '../../src'
import * as fs from 'fs'
import * as path from 'path'

let browser: Browser
let page: Page

describe('axe-playwright', () => {
  beforeAll(async () => {
    browser = await chromium.launch({ args: ['--no-sandbox'] })
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
  })

  afterEach(async () => {
    await page.close()
  })

  it('can inject axe', async () => {
    await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
    await injectAxe(page)

    const axeExists = await page.evaluate(() => typeof window.axe !== 'undefined')
    expect(axeExists).toBe(true)
  })

  it('detects missing form labels', async () => {
    await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
    await injectAxe(page)

    const violations = await getViolations(page)
    const labelViolations = violations.filter(v => v.id === 'label')

    expect(labelViolations.length).toBe(1)
    expect(labelViolations[0].nodes.length).toBe(2)
  })

  it('passes clean pages', async () => {
    await page.goto(`file://${process.cwd()}/test/e2e/site-no-accessibility-issues.html`)
    await injectAxe(page)

    const violations = await getViolations(page)
    expect(violations.length).toBe(0)
  })

  it('can run with skipFailures', async () => {
    await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
    await injectAxe(page)

    // Should not throw
    await checkA11y(page, undefined, undefined, true)
  })

  it('respects wcag2a rules only', async () => {
    await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
    await injectAxe(page)

    const violations = await getViolations(page, undefined, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a']
      }
    })

    expect(Array.isArray(violations)).toBe(true)
  })
})