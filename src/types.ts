import { Result } from 'axe-core'

export interface NodeViolation {
  target: string
  html: string
  violations: string
}

export interface Aggregate {
  [key: string]: {
    target: string
    html: string
    violations: number[]
  }
}

export default interface Reporter {
  report(violations: Result[]): Promise<void>
}
