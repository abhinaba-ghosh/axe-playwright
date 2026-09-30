import { checkA11y } from '../../src'
import { Page } from 'playwright'
import { Result } from 'axe-core'
import * as axeHtmlReporter from 'axe-html-reporter'
import JUnitReporter from '../../src/reporter/junitReporter'

jest.mock('axe-html-reporter', () => ({
  createHtmlReport: jest.fn().mockResolvedValue(undefined),
}))

describe('checkA11y includedImpacts handling', () => {
  const sampleViolations: Result[] = [
    {
      id: 'color-contrast',
      impact: 'serious',
      description: 'Elements must have sufficient color contrast',
      help: 'Elements must have sufficient color contrast',
      nodes: [{ target: ['.text'], html: '<span>text</span>' }],
    } as Result,
    {
      id: 'image-alt',
      impact: 'critical',
      description: 'Images must have alternate text',
      help: 'Images must have alternate text',
      nodes: [{ target: ['img'], html: '<img src="foo.png">' }],
    } as Result,
    {
      id: 'heading-order',
      impact: 'moderate',
      description: 'Heading levels should only increase by one',
      help: 'Heading levels should only increase by one',
      nodes: [{ target: ['h3'], html: '<h3>title</h3>' }],
    } as Result,
    {
      id: 'link-name',
      impact: 'minor',
      description: 'Links must have discernible text',
      help: 'Links must have discernible text',
      nodes: [{ target: ['a'], html: '<a href="#"></a>' }],
    } as Result,
  ]

  const createMockPage = (violations: Result[]) => {
    return {
      evaluate: jest.fn().mockResolvedValue({ violations }),
      url: jest.fn().mockReturnValue('https://example.com/test'),
    } as unknown as Page
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('option resolution', () => {
    it('filters violations when includedImpacts is defined at root of axeOptions', async () => {
      // Mock page returns only minor violation, but includedImpacts specifies critical
      const mockPage = createMockPage([sampleViolations[3]]) // minor violation

      // Should not throw because minor is not included
      await expect(
        checkA11y(mockPage, undefined, { includedImpacts: ['critical'] }),
      ).resolves.not.toThrow()
    })

    it('filters violations when includedImpacts is nested under axeOptions.axeOptions', async () => {
      // Mock page returns moderate violation
      const mockPage = createMockPage([sampleViolations[2]]) // moderate violation

      // Should not throw because moderate is excluded
      await expect(
        checkA11y(mockPage, undefined, {
          axeOptions: {
            includedImpacts: ['critical', 'serious'],
          },
        }),
      ).resolves.not.toThrow()
    })

    it('prioritizes root includedImpacts over nested axeOptions.axeOptions.includedImpacts', async () => {
      // Mock page returns critical violation
      const mockPage = createMockPage([sampleViolations[1]]) // critical violation

      // Root says ['minor'] (excludes critical), nested says ['critical']
      // If root is prioritized, critical is filtered out and no error is thrown
      await expect(
        checkA11y(mockPage, undefined, {
          includedImpacts: ['minor'],
          axeOptions: {
            includedImpacts: ['critical'],
          },
        }),
      ).resolves.not.toThrow()
    })

    it('fails when matching violation is present with root includedImpacts', async () => {
      const mockPage = createMockPage([sampleViolations[1]]) // critical violation

      await expect(
        checkA11y(mockPage, undefined, { includedImpacts: ['critical'] }),
      ).rejects.toThrow('1 accessibility violation was detected')
    })

    it('fails when matching violation is present with nested includedImpacts', async () => {
      const mockPage = createMockPage([sampleViolations[0]]) // serious violation

      await expect(
        checkA11y(mockPage, undefined, {
          axeOptions: {
            includedImpacts: ['serious'],
          },
        }),
      ).rejects.toThrow('1 accessibility violation was detected')
    })
  })

  describe('html reporter', () => {
    it('passes impactedViolations to createHtmlReport and testResultDependsOnViolations', async () => {
      const createHtmlReportSpy = jest.spyOn(
        axeHtmlReporter,
        'createHtmlReport',
      )
      // Page contains all 4 violations (serious, critical, moderate, minor)
      const mockPage = createMockPage(sampleViolations)

      // When includedImpacts is ['critical'], only 1 violation is impacted
      await expect(
        checkA11y(
          mockPage,
          undefined,
          { includedImpacts: ['critical'] },
          false,
          'html',
        ),
      ).rejects.toThrow('1 accessibility violation was detected')

      expect(createHtmlReportSpy).toHaveBeenCalledTimes(1)
      const reportArg = createHtmlReportSpy.mock.calls[0][0]
      expect(reportArg.results.violations).toHaveLength(1)
      const reportViolations = reportArg.results.violations!
      expect(reportViolations[0].impact).toBe('critical')
      expect(reportViolations[0].id).toBe('image-alt')
    })

    it('does not create html report or fail when all violations are filtered out', async () => {
      const createHtmlReportSpy = jest.spyOn(
        axeHtmlReporter,
        'createHtmlReport',
      )
      // Page contains only moderate and minor violations
      const mockPage = createMockPage([
        sampleViolations[2],
        sampleViolations[3],
      ])

      // Filtering to ['critical'] leaves 0 impacted violations
      await expect(
        checkA11y(
          mockPage,
          undefined,
          { includedImpacts: ['critical'] },
          false,
          'html',
        ),
      ).resolves.not.toThrow()

      expect(createHtmlReportSpy).not.toHaveBeenCalled()
    })

    it('creates html report with nested includedImpacts configuration', async () => {
      const createHtmlReportSpy = jest.spyOn(
        axeHtmlReporter,
        'createHtmlReport',
      )
      const mockPage = createMockPage(sampleViolations)

      await expect(
        checkA11y(
          mockPage,
          undefined,
          {
            axeOptions: {
              includedImpacts: ['serious', 'critical'],
            },
          },
          false,
          'html',
        ),
      ).rejects.toThrow('2 accessibility violations were detected')

      expect(createHtmlReportSpy).toHaveBeenCalledTimes(1)
      const reportArg = createHtmlReportSpy.mock.calls[0][0]
      expect(reportArg.results.violations).toHaveLength(2)
      const reportViolations = reportArg.results.violations!
      expect(reportViolations.map((v: Result) => v.impact)).toEqual([
        'serious',
        'critical',
      ])
    })
  })

  describe('junit reporter', () => {
    it('calls JUnitReporter.report with impactedViolations', async () => {
      const junitReportSpy = jest
        .spyOn(JUnitReporter.prototype, 'report')
        .mockResolvedValue(undefined)

      // Page contains all violations
      const mockPage = createMockPage(sampleViolations)

      await checkA11y(
        mockPage,
        undefined,
        { includedImpacts: ['critical'] },
        false,
        'junit',
      )

      expect(junitReportSpy).toHaveBeenCalledTimes(1)
      const reportedViolations = junitReportSpy.mock.calls[0][0]
      expect(reportedViolations).toHaveLength(1)
      expect(reportedViolations[0].impact).toBe('critical')
      expect(reportedViolations[0].id).toBe('image-alt')

      junitReportSpy.mockRestore()
    })

    it('calls JUnitReporter.report with empty array when all violations are excluded', async () => {
      const junitReportSpy = jest
        .spyOn(JUnitReporter.prototype, 'report')
        .mockResolvedValue(undefined)

      // Page contains moderate and minor violations
      const mockPage = createMockPage([
        sampleViolations[2],
        sampleViolations[3],
      ])

      await checkA11y(
        mockPage,
        undefined,
        {
          axeOptions: {
            includedImpacts: ['critical'],
          },
        },
        false,
        'junit',
      )

      expect(junitReportSpy).toHaveBeenCalledTimes(1)
      const reportedViolations = junitReportSpy.mock.calls[0][0]
      expect(reportedViolations).toHaveLength(0)

      junitReportSpy.mockRestore()
    })

    it('calls JUnitReporter.report with nested includedImpacts configuration', async () => {
      const junitReportSpy = jest
        .spyOn(JUnitReporter.prototype, 'report')
        .mockResolvedValue(undefined)

      const mockPage = createMockPage(sampleViolations)

      await checkA11y(
        mockPage,
        undefined,
        {
          axeOptions: {
            includedImpacts: ['minor'],
          },
        },
        false,
        'junit',
      )

      expect(junitReportSpy).toHaveBeenCalledTimes(1)
      const reportedViolations = junitReportSpy.mock.calls[0][0]
      expect(reportedViolations).toHaveLength(1)
      expect(reportedViolations[0].impact).toBe('minor')

      junitReportSpy.mockRestore()
    })
  })

  describe('custom reporter', () => {
    it('passes impactedViolations to custom reporter', async () => {
      const mockReporter = {
        report: jest.fn().mockResolvedValue(undefined),
      }

      const mockPage = createMockPage(sampleViolations)

      await expect(
        checkA11y(
          mockPage,
          undefined,
          { includedImpacts: ['serious'] },
          false,
          mockReporter,
        ),
      ).rejects.toThrow('1 accessibility violation was detected')

      expect(mockReporter.report).toHaveBeenCalledTimes(1)
      const reported = mockReporter.report.mock.calls[0][0]
      expect(reported).toHaveLength(1)
      expect(reported[0].impact).toBe('serious')
    })
  })
})
