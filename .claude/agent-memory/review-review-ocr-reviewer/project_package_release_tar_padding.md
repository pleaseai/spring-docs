---
name: project-package-release-tar-padding
description: bsdtar skips last-record padding when -f names a regular file, so packArchive pins `-b 20`; check archive byte-identity on both tar flavors
metadata:
  type: project
---

`scripts/package-release.ts`'s `packArchive()` used to pipe `tar -cf -` into `gzip`. #351 replaced
the pipe with `tar -cf <archive>.tar` followed by `gzip -n -9 -f` on that file, because Bun's
JS-relayed pipe intermittently failed with EPIPE or stalled. See [[project-spring-docs-ocr-scope]]
for where this file sits in ocr's scope.

**Padding.** bsdtar/libarchive (macOS `tar`, and the bsdtar branch of `findTar()`) pads the last
record to the full blocking factor (10240 bytes) on stdout, even when stdout is redirected to a
file. It skips that padding when `-f` names a regular file. GNU tar pads identically either way.
With plain `-f <file>`, the first #351 commit therefore produced shorter archives, with a different
sha256, on bsdtar hosts only.

**The fix.** `packArchive` passes `-b 20`, the default for both implementations. Verified: bsdtar
`-b 20 -f file` is byte-identical to its pipe output on a multi-record archive, and GNU tar output
is unchanged. The published shas of `data-jpa-4.1.1`, `data-jpa-3.4.2` and
`security-7.1.1+rebuild.1` were reproduced in `oven/bun:1.3.14` (GNU tar 1.35, gzip 1.13).

**Why:** a byte-identity check on a Linux (GNU tar) host alone misses a bsdtar-only regression.

**How to apply:** when reviewing changes to `packArchive` or `findTar`, check archive bytes on both
flavors. macOS's Apple gzip and bsdtar never match CI's bytes, so compare old code against new code
on the same host, not against published shas.
