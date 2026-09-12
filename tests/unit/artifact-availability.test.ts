import type { Fetcher } from '../../scripts/lib/artifact-availability.ts'
import { describe, expect, test } from 'bun:test'
import { artifactPublished, unpublishedArtifacts } from '../../scripts/lib/artifact-availability.ts'

/** A fetcher answering from a status map, defaulting to 200, counting calls. */
function stub(statuses: Readonly<Record<string, number>> = {}): Fetcher & { calls: string[] } {
  const calls: string[] = []
  const fetcher = (url: string): Promise<{ status: number, ok: boolean, statusText: string }> => {
    calls.push(url)
    const status = statuses[url] ?? 200
    return Promise.resolve({ status, ok: status >= 200 && status < 300, statusText: `status ${status}` })
  }
  return Object.assign(fetcher, { calls })
}

describe('artifactPublished', () => {
  test('is true for a published artifact', async () => {
    expect(await artifactPublished('https://example.com/a.jar', stub())).toBe(true)
  })

  test('is false for a 404, which is the whole point of the probe', async () => {
    expect(await artifactPublished('https://example.com/a.jar', stub({ 'https://example.com/a.jar': 404 })))
      .toBe(false)
  })

  test('throws on any other failure, so a network fault is not read as unpublished', async () => {
    // A 500 or a 403 says nothing about whether the artifact exists. Reporting
    // it as absent would make the pipeline silently skip a buildable version.
    for (const status of [403, 500, 503]) {
      await expect(artifactPublished('https://example.com/a.jar', stub({ 'https://example.com/a.jar': status })))
        .rejects
        .toThrow(new RegExp(String(status)))
    }
  })

  test('names the URL it could not resolve', async () => {
    await expect(artifactPublished('https://example.com/x.jar', stub({ 'https://example.com/x.jar': 500 })))
      .rejects
      .toThrow('https://example.com/x.jar')
  })

  test('sends HEAD, not GET — these artifacts are megabytes', async () => {
    let method: string | undefined
    const spy: Fetcher = (_url, init) => {
      method = init.method
      return Promise.resolve({ status: 200, ok: true, statusText: 'OK' })
    }

    await artifactPublished('https://example.com/a.jar', spy)

    expect(method).toBe('HEAD')
  })
})

describe('unpublishedArtifacts', () => {
  const urls = ['https://e.com/1.jar', 'https://e.com/2.jar', 'https://e.com/3.jar']

  test('is empty when every artifact is published', async () => {
    expect(await unpublishedArtifacts(urls, { fetchImpl: stub() })).toEqual([])
  })

  test('returns only the missing ones, in the order given', async () => {
    // Deliberately answered back-to-front: the probes run concurrently, so the
    // order results arrive in is the network's, not the caller's. The report
    // names artifacts of one version and has to read in the order they were
    // asked for, so completion order must not leak into it.
    const backwards: Fetcher = async (url) => {
      const index = urls.indexOf(url)
      await new Promise(resolve => setTimeout(resolve, (urls.length - index) * 5))
      return { status: 404, ok: false, statusText: 'Not Found' }
    }

    expect(await unpublishedArtifacts(urls, { fetchImpl: backwards })).toEqual([...urls])
  })

  test('drops the published ones while keeping the rest in the order given', async () => {
    const fetcher = stub({ 'https://e.com/3.jar': 404, 'https://e.com/1.jar': 404 })

    expect(await unpublishedArtifacts(urls, { fetchImpl: fetcher }))
      .toEqual(['https://e.com/1.jar', 'https://e.com/3.jar'])
  })

  test('probes every URL even after one is known missing', async () => {
    // Short-circuiting would make the result depend on completion order, and
    // the caller reports how many artifacts are missing, not merely whether any.
    const fetcher = stub({ 'https://e.com/1.jar': 404 })

    const missing = await unpublishedArtifacts(urls, { fetchImpl: fetcher })

    expect([...fetcher.calls].sort()).toEqual([...urls].sort())
    expect(missing).toEqual(['https://e.com/1.jar'])
  })

  test('propagates an unreachable URL rather than calling it unpublished', async () => {
    await expect(unpublishedArtifacts(urls, { fetchImpl: stub({ 'https://e.com/2.jar': 500 }) }))
      .rejects
      .toThrow(/500/)
  })

  test('holds the concurrency bound, which is what keeps a sweep polite', async () => {
    let inFlight = 0
    let peak = 0
    const slow: Fetcher = async () => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await new Promise(resolve => setTimeout(resolve, 1))
      inFlight--
      return { status: 200, ok: true, statusText: 'OK' }
    }
    const many = Array.from({ length: 40 }, (_, i) => `https://e.com/${i}.jar`)

    await unpublishedArtifacts(many, { fetchImpl: slow, concurrency: 4 })

    expect(peak).toBe(4)
  })

  test('handles an empty list without spawning a runner', async () => {
    const fetcher = stub()

    expect(await unpublishedArtifacts([], { fetchImpl: fetcher })).toEqual([])
    expect(fetcher.calls).toEqual([])
  })
})
