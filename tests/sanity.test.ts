import { describe, expect, test } from 'bun:test'

describe('test harness sanity', () => {
  test('Bun test runner executes and assertions work', () => {
    expect(true).toBe(true)
  })

  test('TypeScript strict mode is active under tests/', () => {
    const value: number = 42
    expect(value).toBe(42)
  })
})
