#!/usr/bin/env bun
/**
 * Package one converted tree as a release archive.
 *
 * Produces, for `<project>-<version>`:
 *   <project>-<version>.tar.gz
 *   <project>-<version>.tar.gz.sha256
 *   manifest.json
 *
 * The archive is built deterministically: entries sorted, timestamps pinned,
 * ownership zeroed, and gzip's own mtime field suppressed. Same converted tree
 * in, byte-identical archive out.
 *
 * Usage:
 *   bun run scripts/package-release.ts dist/boot-4.1.1 --out releases
 *
 * Exit codes:
 *   0 — archive, checksum and manifest written
 *   1 — packaging failed
 *   2 — bad arguments
 */

import type { ContentEntry, ManifestUpstream } from './lib/manifest.ts'
import { chmod, mkdir, readdir, readFile, rm, utimes, writeFile } from 'node:fs/promises'
import { basename, join, relative, resolve } from 'node:path'
import process from 'node:process'
import {
  buildManifest,

  hex,

} from './lib/manifest.ts'
import { buildNotice } from './lib/notice.ts'
import { parseReleaseName } from './lib/release-name.ts'

/**
 * Fixed archive timestamp: 1980-02-01 UTC, the same instant Spring's own content
 * zips are stamped with.
 */
const EPOCH_SECONDS = Date.UTC(1980, 1, 1) / 1000

/** Leading semver range operator in a package.json dependency spec. */
const RANGE_PREFIX = /^[\^~]/

interface Args {
  readonly source: string
  readonly out: string
  readonly dryRun: boolean
}

function parseArgs(argv: readonly string[]): Args {
  const positional: string[] = []
  let out: string | undefined
  let dryRun = false

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run')
      dryRun = true
    else if (arg === '--out')
      out = argv[++i]
    else if (arg?.startsWith('--out='))
      out = arg.slice('--out='.length)
    else if (arg !== undefined)
      positional.push(arg)
  }

  const source = positional[0]
  if (!source || !out) {
    throw new Error(
      'Usage: package-release.ts <converted-dir> --out <dir> [--dry-run]\n'
      + '  e.g. package-release.ts dist/boot-4.1.1 --out releases',
    )
  }
  return { source, out, dryRun }
}

async function run(cmd: readonly string[], cwd: string): Promise<string> {
  const proc = Bun.spawn([...cmd], { cwd, stdout: 'pipe', stderr: 'pipe' })
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])
  if (exitCode !== 0) {
    throw new Error(`${cmd.join(' ')} failed (exit ${exitCode})\n${stderr.trim()}`)
  }
  return stdout.trim()
}

/**
 * Pipe `tar -cf -` into `gzip -n -9`, writing the result straight to
 * `archivePath` — without a shell.
 *
 * `source`, `parentDir` and `fileList` all ultimately derive from CLI
 * arguments. A shell string built with `JSON.stringify()` quoting is not safe
 * against them: POSIX double quotes still expand `$`, `$(...)` and backticks.
 * Spawning argv arrays directly sidesteps that class of injection entirely,
 * since no shell ever parses the values.
 *
 * Both processes' exit codes are checked — a tar failure whose stderr
 * `gzip` swallows must still fail the run, not just a `gzip` failure.
 */
async function packArchive(
  tar: TarFlavor,
  cwd: string,
  parentDir: string,
  fileList: string,
  archivePath: string,
): Promise<void> {
  const tarProc = Bun.spawn(
    [tar.command, ...tar.flags, '-cf', '-', '-C', parentDir, '-T', fileList],
    { cwd, stdout: 'pipe', stderr: 'pipe' },
  )
  const gzipProc = Bun.spawn(
    ['gzip', '-n', '-9'],
    { cwd, stdin: tarProc.stdout, stdout: Bun.file(archivePath), stderr: 'pipe' },
  )

  const [tarStderr, gzipStderr, tarExit, gzipExit] = await Promise.all([
    new Response(tarProc.stderr).text(),
    new Response(gzipProc.stderr).text(),
    tarProc.exited,
    gzipProc.exited,
  ])

  if (tarExit !== 0)
    throw new Error(`${tar.command} failed (exit ${tarExit})\n${tarStderr.trim()}`)
  if (gzipExit !== 0)
    throw new Error(`gzip failed (exit ${gzipExit})\n${gzipStderr.trim()}`)
}

/** A tar implementation and the flags it needs for a reproducible archive. */
interface TarFlavor {
  readonly command: string
  readonly flags: readonly string[]
}

/**
 * Pick a tar and the flags that make its output reproducible.
 *
 * GNU tar and BSD tar spell ownership differently and disagree on the default
 * archive format, so `ustar` is requested explicitly — otherwise the same tree
 * yields different bytes depending on which tar ran. Entry order and timestamps
 * are normalized by the caller rather than by tar, so neither implementation
 * needs `--sort`.
 */
async function findTar(cwd: string): Promise<TarFlavor> {
  for (const command of ['gtar', 'tar']) {
    let version: string
    try {
      version = await run([command, '--version'], cwd)
    }
    catch {
      continue
    }
    if (version.includes('GNU tar')) {
      return { command, flags: ['--owner=0', '--group=0', '--numeric-owner', '--format=ustar'] }
    }
    if (version.includes('bsdtar') || version.includes('libarchive')) {
      return { command, flags: ['--uid', '0', '--gid', '0', '--numeric-owner', '--format', 'ustar'] }
    }
  }
  throw new Error('No GNU tar or BSD tar found on PATH; cannot build the release archive.')
}

/**
 * Normalize the metadata tar records, so the archive depends only on content.
 *
 * File mtimes come from whenever conversion happened and modes from the
 * process umask; both would otherwise leak into the archive bytes and break the
 * determinism invariant.
 */
async function normalizeMetadata(root: string, files: readonly string[]): Promise<void> {
  for (const file of files) {
    const path = join(root, file)
    await chmod(path, 0o644)
    await utimes(path, EPOCH_SECONDS, EPOCH_SECONDS)
  }
}

/** Every file under `root`, relative and forward-slashed, sorted. */
async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { recursive: true, withFileTypes: true })
  return entries
    .filter(entry => entry.isFile())
    .map(entry => relative(root, join(entry.parentPath, entry.name)).split('\\').join('/'))
    .sort()
}

/** SHA-256 of a file's bytes. */
async function fileChecksum(path: string): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', await Bun.file(path).arrayBuffer()))
}

/** SHA-256 of the NOTICE content, computed in memory rather than from disk. */
function noticeChecksum(notice: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(notice)).then(hex)
}

/**
 * Insert an entry into an already-sorted entry list, keeping it sorted.
 *
 * Used only for the dry-run NOTICE entry: the real write path gets NOTICE for
 * free from `listFiles`, already in position.
 */
function insertSorted(entries: readonly ContentEntry[], entry: ContentEntry): ContentEntry[] {
  const index = entries.findIndex(existing => existing.path > entry.path)
  const result = [...entries]
  result.splice(index === -1 ? result.length : index, 0, entry)
  return result
}

/** Read one required, non-empty string field of a provenance sidecar. */
function requiredString(record: Record<string, unknown>, field: string, sidecar: string): string {
  const value = record[field]
  if (typeof value !== 'string' || value === '')
    throw new Error(`Malformed provenance sidecar at ${sidecar}: "${field}" must be a non-empty string`)
  return value
}

/** Read the provenance sidecar written by `fetch-upstream.ts`. */
async function readUpstream(source: string, project: string, version: string): Promise<ManifestUpstream> {
  const sidecar = resolve(source, '..', 'upstream', `${project}-${version}.upstream.json`)
  const raw: unknown = JSON.parse(await readFile(sidecar, 'utf8'))
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`Malformed provenance sidecar at ${sidecar}`)
  }
  const record = raw as Record<string, unknown>
  const archives = Array.isArray(record.archives)
    ? record.archives.filter((a): a is string => typeof a === 'string')
    : []
  return {
    repo: requiredString(record, 'repo', sidecar),
    ref: requiredString(record, 'ref', sidecar),
    commit: requiredString(record, 'commit', sidecar),
    archives,
  }
}

/** This repository's commit, or null when the working tree is dirty. */
async function converterCommit(cwd: string): Promise<string | null> {
  try {
    const status = await run(['git', 'status', '--porcelain'], cwd)
    if (status.length > 0)
      return null
    return await run(['git', 'rev-parse', 'HEAD'], cwd)
  }
  catch {
    return null
  }
}

/** Pinned version of a direct dependency, read from package.json. */
async function dependencyVersion(cwd: string, name: string): Promise<string> {
  const pkg: unknown = JSON.parse(await readFile(join(cwd, 'package.json'), 'utf8'))
  const deps = (pkg as { dependencies?: Record<string, string> }).dependencies ?? {}
  const version = deps[name]
  if (!version)
    throw new Error(`${name} is not a direct dependency; cannot record its version`)
  return version.replace(RANGE_PREFIX, '')
}

async function main(): Promise<void> {
  let args: Args
  try {
    args = parseArgs(process.argv.slice(2))
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
  }

  const cwd = process.cwd()
  const source = resolve(cwd, args.source)
  const outDir = resolve(cwd, args.out)
  const name = basename(source)
  let project: string
  let version: string
  try {
    ({ project, version } = parseReleaseName(name))
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(2)
  }

  try {
    const tar = await findTar(cwd)
    const upstream = await readUpstream(source, project, version)

    // NOTICE is content, so it must exist before the tree is checksummed. A
    // dry run never writes it, so its entry is computed from the in-memory
    // bytes instead and spliced in — otherwise dry-run's file_count and
    // content_sha256 would not match what the same invocation actually packages.
    const notice = buildNotice(await readFile(join(cwd, 'NOTICE'), 'utf8'), upstream, project, version)
    if (!args.dryRun)
      await writeFile(join(source, 'NOTICE'), notice)

    const files = await listFiles(source)
    let entries: ContentEntry[] = []
    for (const path of files) {
      entries.push({ path, sha256: await fileChecksum(join(source, path)) })
    }
    if (args.dryRun)
      entries = insertSorted(entries, { path: 'NOTICE', sha256: await noticeChecksum(notice) })

    const manifest = await buildManifest({
      project,
      version,
      upstream,
      converter: {
        commit: await converterCommit(cwd),
        antora: await dependencyVersion(cwd, '@antora/content-classifier'),
        asciidoctor: await dependencyVersion(cwd, '@asciidoctor/core'),
      },
      generatedAt: new Date(),
      entries,
    })

    if (args.dryRun) {
      console.log(`[dry-run] ${entries.length} files, content_sha256=${manifest.content_sha256}`)
      return
    }

    await mkdir(outDir, { recursive: true })
    const archivePath = join(outDir, `${name}.tar.gz`)

    // Entries are fed in sorted order so the archive does not depend on
    // directory traversal, and `gzip -n` drops gzip's own mtime field, which
    // `tar -z` would otherwise reintroduce.
    //
    // Every entry is prefixed with `<project>-<version>/` by archiving from the
    // parent directory, so extraction creates one directory instead of spilling
    // hundreds of files into the consumer's working directory. Doing it this way
    // rather than with a rename flag keeps GNU tar and BSD tar on the same path:
    // they spell that flag differently (`--transform` vs `-s`).
    await normalizeMetadata(source, files)
    const fileList = join(outDir, `${name}.files`)
    await writeFile(fileList, `${files.map(file => `${name}/${file}`).join('\n')}\n`)
    await packArchive(tar, cwd, resolve(source, '..'), fileList, archivePath)
    await rm(fileList, { force: true })

    const archiveSha = await fileChecksum(archivePath)
    await writeFile(join(outDir, `${name}.tar.gz.sha256`), `${archiveSha}  ${name}.tar.gz\n`)
    await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)

    const sizeMb = (Bun.file(archivePath).size / 1024 / 1024).toFixed(1)
    console.log(
      `Packaged ${entries.length} files to ${archivePath} (${sizeMb} MB, sha256 ${archiveSha.slice(0, 12)})`,
    )
  }
  catch (error) {
    console.error(`✗ package-release failed: ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  }
}

await main()
