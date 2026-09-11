import type { ManifestUpstream } from '../../scripts/lib/manifest.ts'
import { describe, expect, test } from 'bun:test'
import { buildNotice } from '../../scripts/lib/notice.ts'

const UPSTREAM: ManifestUpstream = {
  repo: 'spring-projects/spring-boot',
  ref: 'v4.1.1',
  commit: '6fdf67ea1552691e932604d4bf67a5e08ff0b0ea',
  archives: ['root-aggregate-content'],
}

describe('buildNotice', () => {
  test('pins attribution to the exact upstream commit', () => {
    const notice = buildNotice('Upstream NOTICE body', UPSTREAM, 'boot', '4.1.1')

    expect(notice).toContain('https://github.com/spring-projects/spring-boot')
    expect(notice).toContain('v4.1.1')
    expect(notice).toContain('6fdf67ea1552691e932604d4bf67a5e08ff0b0ea')
  })

  test('names the license and states that meaning is unmodified', () => {
    const notice = buildNotice('Upstream NOTICE body', UPSTREAM, 'boot', '4.1.1')

    expect(notice).toContain('Apache License, Version 2.0')
    expect(notice).toContain('meaning of the')
  })

  test('preserves the repository NOTICE body rather than replacing it', () => {
    const notice = buildNotice('Copyright 2026 Someone\nAll rights reserved.', UPSTREAM, 'boot', '4.1.1')

    expect(notice).toContain('Copyright 2026 Someone')
    expect(notice).toContain('All rights reserved.')
  })

  test('is deterministic — no timestamp or environment metadata', () => {
    const first = buildNotice('body', UPSTREAM, 'boot', '4.1.1')
    const second = buildNotice('body', UPSTREAM, 'boot', '4.1.1')

    expect(first).toBe(second)
    expect(first).not.toMatch(/\d{4}-\d{2}-\d{2}T/)
  })
})
