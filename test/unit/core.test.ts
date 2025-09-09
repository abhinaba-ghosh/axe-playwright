import { getImpactedViolations, describeViolations } from '../../src/utils'
import { Result, ImpactValue } from 'axe-core'

describe('Utils', () => {
  describe('getImpactedViolations', () => {
    const violations: Result[] = [
      { impact: 'critical', id: 'missing-alt' } as Result,
      { impact: 'serious', id: 'color-contrast' } as Result,
      { impact: 'moderate', id: 'heading-order' } as Result,
      { impact: 'minor', id: 'link-name' } as Result,
    ]

    it('returns all violations when no filter', () => {
      expect(getImpactedViolations(violations)).toHaveLength(4)
    })

    it('filters by critical impact only', () => {
      const result = getImpactedViolations(violations, ['critical'])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('missing-alt')
    })

    it('filters by multiple impact levels', () => {
      const result = getImpactedViolations(violations, ['critical', 'serious'])
      expect(result).toHaveLength(2)
    })

    it('returns empty array when no matches', () => {
      const result = getImpactedViolations(violations, ['critical'])
      expect(result.every(v => v.impact === 'critical')).toBe(true)
    })
  })

  describe('describeViolations', () => {
    const violations: Result[] = [
      {
        id: 'label-missing',
        nodes: [
          { target: ['#input1'], html: '<input type="text">' },
          { target: ['#input2'], html: '<input type="email">' }
        ]
      } as Result
    ]

    it('creates one entry per node', () => {
      const result = describeViolations(violations)
      expect(result).toHaveLength(2)
    })

    it('includes target selector and HTML', () => {
      const result = describeViolations(violations)
      expect(result[0].target).toBe('["#input1"]')
      expect(result[0].html).toBe('<input type="text">')
    })

    it('groups same nodes from different violations', () => {
      const duplicateViolations: Result[] = [
        {
          id: 'violation1',
          nodes: [{ target: ['#same'], html: '<div>test</div>' }]
        } as Result,
        {
          id: 'violation2',
          nodes: [{ target: ['#same'], html: '<div>test</div>' }]
        } as Result
      ]

      const result = describeViolations(duplicateViolations)
      expect(result).toHaveLength(1)
      expect(result[0].violations).toBe('[0,1]')
    })
  })
})