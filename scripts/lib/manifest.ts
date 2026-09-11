import { z } from 'zod'

/**
 * Schema and builder for the per-archive `manifest.json`.
 *
 * Every published archive ships one (ARCHITECTURE.md, Release Invariants). It
 * carries enough metadata to reproduce the build: upstream `(repo, ref, commit)`,
 * the converter toolchain, the file count, and a content checksum.
 *
 * This module owns the public manifest shape; changes require an ADR.
 */

/**
 * Manifest schema version.
 *
 * Bumped only on a breaking shape change. Consumers MUST refuse mismatches.
 */
export const MANIFEST_VERSION = '1' as const

const Sha256 = z
  .string()
  .regex(/^[0-9a-f]{64}$/, { message: 'Expected a lowercase hex SHA-256 digest' })

/** A git object name. SHA-1 today; SHA-256 repositories produce 64 characters. */
const GitCommit = z
  .string()
  .regex(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/, { message: 'Expected a full lowercase hex git commit SHA' })

const Upstream = z.object({
  repo: z.string().min(1).describe('Upstream GitHub repository, e.g. "spring-projects/spring-boot"'),
  ref: z.string().min(1).describe('Git ref built from, e.g. "v4.1.1"'),
  commit: GitCommit.describe('Commit the ref resolves to; annotated tags are peeled'),
  archives: z
    .array(z.string().min(1))
    .describe('Maven classifiers of the published content archives merged into the source'),
})

const Converter = z.object({
  commit: z
    .string()
    .regex(/^[0-9a-f]{7,40}$/, { message: 'Expected a hex git SHA' })
    .nullable()
    .describe('This repository\'s commit; null when built from a dirty working tree'),
  antora: z.string().min(1).describe('Antora pipeline version'),
  asciidoctor: z.string().min(1).describe('Asciidoctor.js version'),
})

export const ManifestSchema = z.object({
  schema_version: z.literal(MANIFEST_VERSION),
  project: z.string().min(1),
  version: z.string().min(1),
  upstream: Upstream,
  converter: Converter,
  generated_at: z
    .string()
    .datetime({ offset: true })
    .describe('ISO-8601 build timestamp. The only non-deterministic field, and the reason it lives here rather than in converted content'),
  file_count: z.number().int().nonnegative(),
  content_sha256: Sha256.describe('Checksum over the converted tree; independent of archive packaging'),
})

export type Manifest = z.infer<typeof ManifestSchema>
export type ManifestUpstream = z.infer<typeof Upstream>
export type ManifestConverter = z.infer<typeof Converter>

/** One converted file, as fed to the content checksum. */
export interface ContentEntry {
  /** Path relative to the converted tree root. Always forward-slashed. */
  readonly path: string
  /** SHA-256 of the file's bytes. */
  readonly sha256: string
}

/**
 * Build the canonical string that {@link contentChecksum} digests.
 *
 * Entries are sorted by path so the checksum depends only on content, never on
 * filesystem traversal order. Exported for tests and for debugging a checksum
 * mismatch, where seeing the pre-image is what actually tells you which file moved.
 */
export function contentChecksumPreimage(entries: readonly ContentEntry[]): string {
  return [...entries]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map(entry => `${entry.sha256}  ${entry.path}\n`)
    .join('')
}

/**
 * Deterministic checksum over a converted tree.
 *
 * Distinct from the archive's own `.sha256`: this one is stable across
 * repackaging, because it ignores tar metadata entirely.
 */
export async function contentChecksum(entries: readonly ContentEntry[]): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(contentChecksumPreimage(entries)),
  )
  return hex(digest)
}

/** Lowercase hex encoding of a digest. */
export function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** Inputs for {@link buildManifest}, minus the fields it derives. */
export interface ManifestInput {
  readonly project: string
  readonly version: string
  readonly upstream: ManifestUpstream
  readonly converter: ManifestConverter
  readonly generatedAt: Date
  readonly entries: readonly ContentEntry[]
}

/**
 * Assemble and validate a manifest.
 *
 * @throws if the assembled manifest violates {@link ManifestSchema}.
 */
export async function buildManifest(input: ManifestInput): Promise<Manifest> {
  const manifest = {
    schema_version: MANIFEST_VERSION,
    project: input.project,
    version: input.version,
    upstream: input.upstream,
    converter: input.converter,
    generated_at: input.generatedAt.toISOString(),
    file_count: input.entries.length,
    content_sha256: await contentChecksum(input.entries),
  }

  const result = ManifestSchema.safeParse(manifest)
  if (!result.success) {
    const issues = result.error.issues
      .map(issue => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Assembled manifest failed schema validation:\n${issues}`)
  }
  return result.data
}
