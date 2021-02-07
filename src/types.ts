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
