# ADR-0003: Recover a Published-but-Unregistered Release by Re-running the Tag

## Status

Accepted — 2026-09-12

## Context

Publishing a release is two phases, not one:

1. `gh release create` uploads the archive, its checksum and `manifest.json` under the tag.
2. A pull request records `(project, version) → tag` in `catalog.json` and commits the
   converted tree under `markdown/<project>/<version>/`.

Only the first is protected by tag immutability, and `release.yml` guarded it accordingly:

```yaml
- name: Refuse to overwrite an existing release
  run: |
    if gh release view "$TAG" >/dev/null 2>&1; then
      echo "::error::Release $TAG already exists; tags are immutable. Publish a +rebuild.N tag." >&2
      exit 1
    fi
```

That guard does its job for phase 1 — it runs before the build, so no asset is ever replaced.
But it makes phase 2 unrecoverable. If the catalog branch push or the pull request creation
fails *after* `gh release create` succeeded, the release exists and the catalog does not name
it. `catalog.json` is the index consumers MUST resolve through (ARCHITECTURE.md), so that
version is downloadable but undiscoverable, and re-running the tag exits at the guard before
it can finish registration. Recovery required a human running the registration steps by hand.

Two further facts were established while investigating, and both move the decision:

- **Registration cannot skip the build.** The registration step runs
  `promote-markdown.ts "dist/$PROJECT-$VERSION"`, which needs the converted tree. Any path
  that completes registration — automatic or human-triggered — pays fetch → convert anyway.
  So "verifying the existing release costs a full build" is not an added cost; the build is
  already there, and hashing its output afterwards is nearly free.
- **The archive is reproducible, the manifest is not.** `package-release.ts` sorts entries,
  pins timestamps to 1980-02-01, zeroes ownership and passes `gzip -n`, so the same converted
  tree yields byte-identical `.tar.gz`. `manifest.json` carries `generated_at`, documented in
  `lib/manifest.ts` as "the only non-deterministic field", and is packaged outside the
  archive. A rebuild can therefore be compared against the published archive, but not against
  the published manifest.

ARCHITECTURE.md claimed "A failed release does not update `catalog.json`. Partial state is
rolled back." The first sentence was true; the second described a rollback that does not
exist. Raised by Greptile on PR #5, triaged to issue #6 as a semantics decision rather than a
defect repair.

## Decision

**Re-running a tag is the recovery path.** The workflow determines which of the two phases are
still outstanding and completes only those.

1. **The guard is narrowed, not removed.** It no longer keys on "does the release exist" but
   on the pair of facts that actually describe the release's state, yielding three modes
   (`scripts/lib/release-state.ts`, a pure function):

   | Release exists | Catalog names this tag | Mode       |
   | -------------- | ---------------------- | ---------- |
   | no             | no                     | `publish`  |
   | yes            | no                     | `register` |
   | yes            | yes                    | `complete` |
   | no             | yes                    | refuse     |

   `publish` runs both phases. `register` skips publication and runs registration only.
   `complete` is a successful no-op. The fourth row cannot arise from an interrupted run —
   registration only ever follows publication — so it means the release was deleted or the
   catalog was hand-edited, and the run fails rather than papering over an index that is
   already lying.

2. **The catalog consulted is the one on the default branch**, read with
   `git show "origin/$DEFAULT_BRANCH:catalog.json"`. The checked-out tag's copy predates its
   own registration commit by construction, so reading it would answer `register` on every
   run and defeat the guard entirely.

3. **`register` proves the bytes before indexing them.** The run rebuilds, downloads the
   published `.tar.gz`, and compares SHA-256 against the rebuild. A mismatch is a hard failure
   directing the operator to a `+rebuild.N` tag. The archive itself is hashed, not the
   published `.sha256` sidecar — a sidecar only restates whatever produced it.
   `manifest.json` is deliberately not compared, for the `generated_at` reason above.

4. **Asset immutability is unchanged.** `gh release create` runs only in `publish` mode.
   No mode replaces a published asset; correcting an archive still means a `+rebuild.N` tag.

5. **Registration itself is made re-runnable**, since it is the phase that gets resumed and a
   second attempt may meet its own leftovers: the catalog branch is recreated from the default
   branch and force-pushed, the commit is skipped when nothing changed, and the pull request
   is only created when one is not already open.

6. **The catalog branch is based on the default branch** rather than on the tag. This is
   required by the decision rather than incidental to it: a recovery run arrives an arbitrary
   time after publication, and a pull request based on the tag's tree would delete every
   catalog entry recorded in between.

## Consequences

### Positive

- **The failure mode recovers itself.** Re-running the tag — the operator's first instinct —
  is now the correct and complete action.
- **The index never points at unverified bytes.** The objection to automatic completion was
  that it could register a tag whose assets nobody checked; the rebuild-and-compare removes
  it, at a cost the run was already paying.
- **A stale-base bug is closed on the way.** Registration from an old tag could previously
  revert newer catalog entries.
- **ARCHITECTURE.md becomes true.** The "partial state is rolled back" claim is replaced by a
  description of forward recovery, which is what the pipeline actually does.
- **The decision is unit-testable.** Mode selection is a pure function over two booleans-worth
  of state, not shell embedded in a workflow.

### Negative

- **Recovery costs a full fetch → convert.** Unavoidable — `promote-markdown.ts` needs the
  converted tree — but it means recovery is a ~30-minute job, not a one-minute one.
- **`fetch-depth: 0`.** Reading the default branch's catalog and branching off it need the
  ref and a history GitHub will accept a push from. `markdown/` grows about 3 MB per version,
  so this clone gets more expensive as coverage widens; it is a release-only cost, and if it
  starts to bite, the fix is to read the catalog over the API and push from a shallow
  worktree.
- **The published manifest is not verified.** If a release were published with a manifest
  inconsistent with its archive, `register` would not notice. The manifest is generated from
  the same tree in the same step as the archive, so this is a narrow gap, and closing it
  properly means making `generated_at` reproducible.
- **The catalog branch is force-pushed.** Safe because the branch name carries the tag and
  only this workflow writes it, but it is a force-push in CI.

### Neutral

- **A completed release re-run now succeeds instead of failing.** That is what idempotence
  means, but it removes a signal: someone force-pushing a tag to correct an archive gets a
  no-op rather than an error. The `complete` notice says so and names `+rebuild.N`.
- **Registration now runs the default branch's scripts, not the tag's**, because the step
  switches the worktree to the default branch before invoking them. That is the right way
  round — the catalog entry is applied to the default branch's state — but it means a
  registration behaves like `main`, not like the commit the archive was built from. The build
  phase is unaffected: it runs before the switch, on the tag.
- The workflow gains one entry point, `scripts/release-mode.ts`, and one pure module,
  `scripts/lib/release-state.ts`.
- Mode is evaluated after `bun install`, so a `complete` run still pays setup and install
  before it reports there is nothing to do. Splitting that into a separate job was rejected as
  more workflow structure than the ~1 minute is worth.

## Alternatives Considered

- **Explicit recovery input** — keep the hard guard on the tag-push path and add a
  `workflow_dispatch` input that performs registration only. Rejected: the argument for it was
  that automatic completion buys convenience at the price of an unverified-bytes risk, but the
  verification is cheap once the build is known to be unavoidable, so the trade it is pricing
  does not exist. What remains is a manual step on an on-call path and a second code path that
  only executes during incidents — the code least likely to be correct when it runs.

- **Accept the manual repair** — document the procedure, change no code. Rejected: it leaves a
  known automatable hole in the publishing path, and the documentation would have to describe
  reproducing the archive by hand to be safe, which is exactly the work being avoided.

- **Compare the published `.sha256` sidecar instead of the archive.** Rejected: it avoids
  downloading a few MB and proves strictly less. The sidecar is generated alongside the
  archive; hashing the archive is the check the sidecar is a summary of.

- **Register without verifying, trusting determinism.** Rejected: the pipeline's determinism
  is a property of `package-release.ts`, not of every archive that has ever been uploaded
  under a tag. Asserting it once per recovery is the cheap way to keep the claim honest.

## Notes

- The three modes are named after what a run still owes, not after the state it found, so the
  workflow's `if:` conditions read as intent.
- Issue #6 framed this as three options; this ADR takes option 1 with the byte check that its
  own framing identified as the precondition.

## Related

- `.github/workflows/release.yml` — the workflow this governs.
- `scripts/lib/release-state.ts` — the pure mode decision.
- `scripts/release-mode.ts` — the entry point the workflow calls.
- `scripts/lib/catalog-update.ts` — the tag-immutability rules this decision leaves intact.
- `ARCHITECTURE.md` § "Release Invariants" — updated by this decision.
- Issue #6, and the Greptile review thread on PR #5 that raised it.
