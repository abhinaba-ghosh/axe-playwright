import { Browser, chromium, Page } from 'playwright'
import { injectAxe, getViolations, getAxeResults, checkA11y } from '../../src'

let browser: Browser
let page: Page

describe('Axe Integration', () => {
  beforeAll(async () => {
    browser = await chromium.launch({ args: ['--no-sandbox'] })
  })

  beforeEach(async () => {
    page = await browser.newPage()
  })

  afterEach(async () => {
    await page.close()
  })

  afterAll(async () => {
    await browser.close()
  })

  it('injects axe into page', async () => {
    await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
    await injectAxe(page)

    const hasAxe = await page.evaluate(() => typeof window.axe !== 'undefined')
    expect(hasAxe).toBe(true)
  })

  it('detects violations on bad page', async () => {
    await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
    await injectAxe(page)

    const violations = await getViolations(page)
    expect(violations.length).toBeGreaterThan(0)
  })

  it('finds no violations on good page', async () => {
    await page.goto(
      `file://${process.cwd()}/test/e2e/site-no-accessibility-issues.html`,
    )
    await injectAxe(page)

    const violations = await getViolations(page)
    expect(violations.length).toBe(0)
  })

  it('returns complete axe results', async () => {
    await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
    await injectAxe(page)

    const results = await getAxeResults(page)
    expect(results).toHaveProperty('violations')
    expect(results).toHaveProperty('passes')
    expect(results).toHaveProperty('url')
  })

  it('works with context selectors', async () => {
    await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
    await injectAxe(page)

    const formViolations = await getViolations(page, 'form')
    expect(Array.isArray(formViolations)).toBe(true)
  })

  it('checkA11y runs without error when skipFailures=true', async () => {
    await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
    await injectAxe(page)

    await expect(
      checkA11y(page, undefined, undefined, true),
    ).resolves.not.toThrow()
  })

  describe('includedImpacts integration', () => {
    it('filters out violations when includedImpacts is set at root', async () => {
      await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
      await injectAxe(page)

      // site.html has no 'minor' violations, only critical, serious, and moderate
      await expect(
        checkA11y(page, undefined, { includedImpacts: ['minor'] }),
      ).resolves.not.toThrow()

      // site.html has 'critical' violations, so this should fail
      await expect(
        checkA11y(page, undefined, { includedImpacts: ['critical'] }),
      ).rejects.toThrow()
    })

    it('filters out violations when includedImpacts is nested under axeOptions', async () => {
      await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
      await injectAxe(page)

      await expect(
        checkA11y(page, undefined, {
          axeOptions: {
            includedImpacts: ['minor'],
          },
        }),
      ).resolves.not.toThrow()

      await expect(
        checkA11y(page, undefined, {
          axeOptions: {
            includedImpacts: ['critical'],
          },
        }),
      ).rejects.toThrow()
    })

    it('respects includedImpacts when using html reporter', async () => {
      await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
      await injectAxe(page)

      // When filtering out all impacts present on the page, html reporter should not fail
      await expect(
        checkA11y(
          page,
          undefined,
          { includedImpacts: ['minor'] },
          false,
          'html',
          { doNotCreateReportFile: true },
        ),
      ).resolves.not.toThrow()

      // When includedImpacts matches violations, html reporter fails
      await expect(
        checkA11y(
          page,
          undefined,
          { includedImpacts: ['critical'] },
          false,
          'html',
          { doNotCreateReportFile: true },
        ),
      ).rejects.toThrow()
    })

    it('respects includedImpacts and calls JUnit reporter with impactedViolations', async () => {
      await page.goto(`file://${process.cwd()}/test/e2e/site.html`)
      await injectAxe(page)

      // When filtering to an impact not on the page, JUnit reporter should generate pass without failing
      await expect(
        checkA11y(
          page,
          undefined,
          { includedImpacts: ['minor'] },
          false,
          'junit',
          {
            outputDirPath: 'artifacts',
            reportFileName: 'test-junit-integration.xml',
          },
        ),
      ).resolves.not.toThrow()

      // When included impact is present, JUnit reporter fails
      await expect(
        checkA11y(
          page,
          undefined,
          { includedImpacts: ['critical'] },
          false,
          'junit',
          {
            outputDirPath: 'artifacts',
            reportFileName: 'test-junit-integration.xml',
          },
        ),
      ).rejects.toThrow()
    })
  })
})
