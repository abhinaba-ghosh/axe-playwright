import JUnitReporter from '../../src/reporter/junitReporter'
import { Result } from 'axe-core'
import * as fs from 'fs'
import * as path from 'path'

describe('JUnit Reporter XML Generation', () => {
  const testOutputDir = path.join(process.cwd(), 'test-output')
  const testXmlFile = path.join(testOutputDir, 'test-results.xml')

  beforeEach(() => {
    // Clean up before each test
    if (fs.existsSync(testXmlFile)) {
      fs.unlinkSync(testXmlFile)
    }
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true })
    }
  })

  afterEach(() => {
    // Clean up after each test
    if (fs.existsSync(testXmlFile)) {
      fs.unlinkSync(testXmlFile)
    }
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true })
    }
  })

  it('generates valid XML when violations exist', async () => {
    const violations: Result[] = [
      {
        id: 'label',
        description: 'Form elements must have labels',
        help: 'Form elements must have labels',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
        impact: 'critical',
        nodes: [
          {
            target: ['#username'],
            html: '<input type="text" name="username">',
            failureSummary: 'Fix any of the following:\n  Element does not have a label'
          }
        ]
      } as Result
    ]

    const reporter = new JUnitReporter(false, undefined, testXmlFile)

    try {
      await reporter.report(violations)
    } catch (e) {
      // Expected to throw, but XML should still be generated
    }

    // Check that XML file was created
    expect(fs.existsSync(testXmlFile)).toBe(true)

    // Read and validate XML content
    const xmlContent = fs.readFileSync(testXmlFile, 'utf8')

    // Basic XML structure checks
    expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xmlContent).toContain('<testsuite')
    expect(xmlContent).toContain('<testcase')
    expect(xmlContent).toContain('</testsuite>')

    // Violation-specific checks
    expect(xmlContent).toContain('label')
    expect(xmlContent).toContain('Form elements must have labels')
    expect(xmlContent).toContain('<failure')
  })

  it('generates valid XML when no violations exist', async () => {
    const reporter = new JUnitReporter(false, undefined, testXmlFile)

    await reporter.report([])

    // Check that XML file was created
    expect(fs.existsSync(testXmlFile)).toBe(true)

    // Read and validate XML content
    const xmlContent = fs.readFileSync(testXmlFile, 'utf8')

    // Basic XML structure checks
    expect(xmlContent).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xmlContent).toContain('<testsuite')
    expect(xmlContent).toContain('<testcase')
    expect(xmlContent).toContain('</testsuite>')

    // Should contain the success test case
    expect(xmlContent).toContain('Accesibility testing - A11Y')

    // Should NOT contain failure tags
    expect(xmlContent).not.toContain('<failure>')
  })

  it('creates directory structure if missing', async () => {
    const deepPath = path.join(testOutputDir, 'nested', 'deeper', 'results.xml')
    const reporter = new JUnitReporter(false, undefined, deepPath)

    await reporter.report([])

    expect(fs.existsSync(deepPath)).toBe(true)
  })

  it('validates XML structure with real XML parser', async () => {
    const violations: Result[] = [
      {
        id: 'color-contrast',
        description: 'Elements must have sufficient color contrast',
        help: 'Elements must have sufficient color contrast',
        nodes: [
          {
            target: ['.text'],
            html: '<span class="text">Low contrast text</span>',
            failureSummary: 'Element has insufficient color contrast'
          }
        ]
      } as Result
    ]

    const reporter = new JUnitReporter(false, undefined, testXmlFile)

    try {
      await reporter.report(violations)
    } catch (e) {
      // Expected to throw
    }

    const xmlContent = fs.readFileSync(testXmlFile, 'utf8')

    // Try to parse as XML (will throw if invalid)
    const parseXML = require('xml2js').parseString
    expect(() => {
      parseXML(xmlContent, (err: any, result: any) => {
        if (err) throw err
        expect(result).toBeDefined()
      })
    }).not.toThrow()
  })
})