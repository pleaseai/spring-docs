import type { ManifestUpstream } from './manifest.ts'

/**
 * The NOTICE file shipped inside every release archive.
 */

/**
 * Attribution shipped inside every archive.
 *
 * ARCHITECTURE.md requires Apache-2.0 attribution to the upstream repo, pinned
 * to the exact commit the content was converted from.
 */
export function buildNotice(repoNotice: string, upstream: ManifestUpstream, project: string, version: string): string {
  return [
    `${project} ${version} — converted Spring documentation`,
    '',
    'This archive contains documentation converted from:',
    `  Repository: https://github.com/${upstream.repo}`,
    `  Ref:        ${upstream.ref}`,
    `  Commit:     ${upstream.commit}`,
    '',
    'The documentation is licensed under the Apache License, Version 2.0, by its',
    'original authors. Conversion changed formatting only; the meaning of the',
    'content is unmodified. The upstream license and attribution follow.',
    '',
    '---',
    '',
    repoNotice.trim(),
    '',
  ].join('\n')
}
