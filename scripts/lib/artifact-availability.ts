/**
 * Ask Maven Central which of a version's required artifacts it actually has.
 *
 * Upstream tags a release long before — and sometimes without ever — publishing
 * the artifacts this pipeline reads. That is a **publication** fact, and unlike
 * a layout era it changes: 4.1.0 is tagged today with no content archive, and
 * nothing stops Spring from publishing one tomorrow. Encoding it as an
 * unbuildable range beside the eras would refuse 4.1.0 permanently, including
 * after it becomes buildable, so it is probed over the network instead.
 *
 * Both callers ask the same question of the same URLs — `requiredArtifactUrls`
 * supplies them per era. `detect-upstream-versions.ts` asks so it never offers a
 * version nobody can build; `fetch-upstream.ts` asks so it fails before cloning
 * rather than on a 404 partway through a build.
 */

/** The slice of `fetch` this module uses — narrow enough for a test to supply. */
export type Fetcher = (
  url: string,
  init: { readonly method: 'HEAD' },
) => Promise<{ readonly status: number, readonly ok: boolean, readonly statusText: string }>

/**
 * Maximum HEAD requests in flight against Maven Central at once.
 *
 * The bound is the point: a synthesized-era version needs eight artifacts, so a
 * first sweep over the whole 3.3-3.5 line probes a few hundred URLs. Issuing
 * them one at a time costs about a minute of CI; issuing them all at once is
 * rude to a host this pipeline does not own.
 */
export const PROBE_CONCURRENCY = 8

/**
 * Whether a single remote artifact has been published.
 *
 * @throws if the URL cannot be reached, so a network fault is never mistaken for
 * an unpublished version.
 */
export async function artifactPublished(url: string, fetchImpl: Fetcher = fetch): Promise<boolean> {
  const response = await fetchImpl(url, { method: 'HEAD' })
  if (response.status === 404)
    return false
  if (!response.ok)
    throw new Error(`HEAD ${url} → ${response.status} ${response.statusText}`)
  return true
}

/**
 * The subset of `urls` upstream has not published, in the order given.
 *
 * Every URL is probed even once one is known missing: the bounded pool is what
 * makes a whole sweep cheap, and short-circuiting inside it would save nothing
 * measurable while making the result depend on completion order.
 *
 * @throws if any URL cannot be reached, or if `concurrency` is not a positive
 * integer.
 */
export async function unpublishedArtifacts(
  urls: readonly string[],
  options: { readonly fetchImpl?: Fetcher, readonly concurrency?: number } = {},
): Promise<string[]> {
  const { fetchImpl = fetch, concurrency = PROBE_CONCURRENCY } = options
  // A pool sized 0, -1 or NaN spawns no runner at all, so `missing` stays empty
  // and the sweep reports every artifact published without asking about one —
  // the single wrong answer this module exists to prevent. `number` does not
  // exclude those, so refuse them here rather than return a silent all-clear.
  if (!Number.isInteger(concurrency) || concurrency < 1)
    throw new RangeError(`Probe concurrency must be a positive integer, got ${concurrency}`)

  const missing = new Set<string>()
  let next = 0
  const runners = Array.from(
    { length: Math.min(concurrency, urls.length) },
    async () => {
      for (let index = next++; index < urls.length; index = next++) {
        const url = urls[index]
        if (url === undefined)
          return
        if (!await artifactPublished(url, fetchImpl))
          missing.add(url)
      }
    },
  )
  await Promise.all(runners)

  return urls.filter(url => missing.has(url))
}
