# ADR-0005: Classify a Superseded Tag as `complete` Whether or Not It Was Published

## Status

Accepted — 2026-09-16

## Context

ADR-0003 derives what a release run still owes from two observable facts — whether the GitHub
Release exists, and which tag `catalog.json` records for this `(project, version)` on the
default branch — and folds one more case into them: a catalog that has moved past this tag to a
*newer* `+rebuild.N` owes nothing, because registering the older tag is a legal catalog write
(`catalog-update.ts` repoints an entry at any rebuild of its own pair, deliberately recording
the rebuild last published rather than the highest one) that walks consumers backwards onto a
superseded archive.

That check sat inside the branch for a release that already exists. Row 5 of the decision
table — release absent, catalog naming a newer rebuild — was therefore left as `publish*`, with
the asterisk pointing at a Negative bullet explaining why: closing it means answering a question
recovery did not raise, namely whether a superseded tag should still be publishable at all.

The row is reachable, and `publish` is the damaging answer. `release.yml` gates registration on
`mode != 'complete'`, so `publish` runs *both* phases:

1. `boot-4.1.1+rebuild.1` is tagged; its run fails during build, so no release is created.
2. The operator cuts `boot-4.1.1+rebuild.2` rather than re-running; it publishes and registers.
3. Someone re-runs the failed `rebuild.1` job, or re-pushes its tag.
4. `releaseExists === false` → `publish` → `rebuild.1` is published, and the catalog pull
   request that follows repoints the entry from `rebuild.2` back to `rebuild.1`, dragging
   `released_at` backwards with it.

Publication itself is harmless — `rebuild.1` is a tag of its own and no published asset is
replaced. The catalog write is the damaging half, and it lands as a pull request titled
`chore(catalog): record boot-4.1.1+rebuild.1`, which reads as routine to whoever merges it.

Step 1 is not hypothetical. Of the 47 Boot rebuild releases cut on 2026-09-16, four runs —
`boot-3.3.6`, `boot-3.3.7`, `boot-3.5.6` and `boot-3.5.7`, all `+rebuild.1` — were cancelled at
the Build step's 30-minute timeout, before any release existed. Had a `+rebuild.2` been cut for
any of them instead of a re-run, step 4 was one stale job re-run away.

This supersedes ADR-0003's row 5 and closes the Negative bullet that recorded it; the rest of
ADR-0003 stands.

## Decision

**Supersession is decided before publication is considered.** `classifyRelease` asks whether the
catalog has moved past this tag first, and only then splits on whether the release exists:

| Release exists | Catalog entry for this `(project, version)` | Mode       |
| -------------- | ------------------------------------------- | ---------- |
| no             | absent, or a tag this one supersedes         | `publish`  |
| yes            | absent, or a tag this one supersedes         | `register` |
| yes            | this tag                                     | `complete` |
| yes            | a newer rebuild of the pair                  | `complete` |
| no             | a newer rebuild of the pair                  | `complete` |
| no             | this tag                                     | refuse     |

Only the fifth row changes. `register` still proves the published bytes before indexing them,
`publish` still runs both phases, and the refusal for a catalog entry whose release is gone is
unchanged — it is checked first, since "the catalog names *this* tag" and "the catalog names a
*newer* rebuild" cannot both hold.

**It stays in `classifyRelease`, not in `applyEntry`.** `applyEntry`'s permissiveness about
suffix ordering is the deliberate design ADR-0003 relied on and this decision leaves intact: the
catalog records the rebuild last published, so a genuine republication of `rebuild.1` after
`rebuild.2` — an operator correcting a bad `rebuild.2` by re-publishing the known-good
predecessor — must remain expressible. What is wrong is not the write; it is a *run* making it
by accident. Ordering is a fact about which run owes what, so it belongs where the other two
facts are already weighed.

**No fourth mode.** The modes name what a run still owes (ADR-0003), and a run the catalog has
moved past owes nothing whichever phases it has left. The workflow's `complete` notice names
the tag the catalog actually resolves to, so an operator can still tell the cases apart, and it
no longer claims `$TAG is published` — which this row makes false.

## Consequences

### Positive

- **The last backwards-catalog path is closed.** Both halves of the hazard ADR-0003 identified
  now answer the same way, so no sequence of failed runs, rebuilds and re-runs can open a
  pull request moving an entry onto a superseded archive.
- **Re-running a stale failed job stays a no-op rather than becoming an error.** The idempotence
  ADR-0003 chose — re-running the tag is always the right instinct — now holds on this row too.
- **The rule got simpler, not larger.** Supersession was already implemented; moving it ahead of
  the `releaseExists` split removed a branch rather than adding one, and the decision table
  loses its footnote.

### Negative

- **A superseded tag can no longer be published at all.** Back-filling an older rebuild as an
  archived artifact — publishing `rebuild.1`'s bytes for provenance after `rebuild.2` has taken
  over the entry — is now a `complete` no-op. Nothing in the pipeline needs this today: the
  catalog is the only way consumers discover a release (ARCHITECTURE.md), so an archive it does
  not name is not reachable, and every one of the 155 published versions is the entry's own tag.
  If it ever matters, the fourth mode rejected below is what to add.
- **Two facts no longer fully separate the modes.** `releaseExists` is now ignored on the
  superseded rows, so the mode is not a function of the two booleans alone but of the tag
  ordinals as well. That was already true for row 4; this makes it true for a second row.

### Neutral

- **The `complete` notice changed wording** to stop asserting that `$TAG` is published, since
  the new row is reached precisely when it is not.
- **No workflow gating changed.** `publish` and `register` still key on the same step
  conditions; the only difference is which runs reach them.

## Alternatives Considered

- **Publish but do not register — a fourth mode running phase 1 and skipping phase 2.** The only
  option that preserves publishing a superseded tag, and the one to revisit if the Negative
  above ever bites. Rejected now: it adds a mode whose name has to explain itself against the
  "name what the run owes" rule, plus a third `if:` shape in `release.yml`, to serve a use case
  that has never arisen in 155 releases. Speculative structure on the release path is the code
  least likely to be correct when it finally runs.

- **Refuse, naming the newer rebuild.** Loudest, and it would catch an operator re-pushing a tag
  by mistake. Rejected: it makes a re-run of a stale failed job an error rather than a no-op,
  which is exactly the reflex ADR-0003 set out to make safe. The `complete` notice already names
  the tag the catalog resolves to, so the operator gets the same information without a red run.

- **Enforce suffix ordering in `applyEntry`.** It would block the bad write at the last possible
  moment, covering any future caller rather than this one path. Rejected: it removes a
  capability the catalog's design states on purpose — the entry records the rebuild last
  published, not the highest — and it would fail the run *after* a release has been published,
  leaving the half-done state this whole area exists to avoid.

- **Do nothing; rely on the pull-request merge gate.** Rejected: the gate is real but weak. The
  pull request is titled `chore(catalog): record <tag>` like every other one, and its diff shows
  a tag and a timestamp changing, which is what a legitimate rebuild registration also looks
  like.

## Related

- ADR-0003 (`0003-idempotent-release-recovery.md`) — the recovery decision this amends; its
  decision table row 5 and the matching § Consequences → Negative bullet are superseded here.
- `scripts/lib/release-state.ts` — `classifyRelease`, the pure decision.
- `scripts/release-mode.ts` — the entry point `release.yml` calls.
- `scripts/lib/catalog-update.ts` — `applyEntry`, the permissive repoint this decision
  deliberately leaves alone.
- `.github/workflows/release.yml` — the `complete` notice this reworded.
- Issue #9 — where the gap was filed, with the three options weighed above.
