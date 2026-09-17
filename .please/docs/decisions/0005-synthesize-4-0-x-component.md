# ADR-0005: Reconstruct the Generated Component for Spring Boot 4.0.0-4.0.7

## Status

Accepted — 2026-09-17

## Context

ADR-0004 models each project as a sequence of **layout eras** and reconstructs the generated
half of the Antora component for eras that publish no content archive. It left 4.0.0-4.0.7
belonging to no era at all, so `eraFor` returned `undefined`, `detect-upstream-versions.ts`
never offered them and `fetch-upstream.ts` refused them.

That gap was a statement about the era table, not about the versions. Measured 2026-09-17,
they are archive-less on the 4.x path — the same two-sided situation that produced ADR-0004:

1. **No content archive.** `spring-boot-docs-<v>-root-aggregate-content.zip` answers 404 for
   4.0.0 and 4.0.7, and 200 from 4.0.8. Spring's Maven Central sync exclusion outlives the
   4.0.0 restructure by eight patches.
2. **The component had already moved.** 4.0.0 relocated it from
   `spring-boot-project/spring-boot-docs/src/docs/antora` to
   `documentation/spring-boot-docs/src/docs/antora`, where the 3.3-3.x era's paths do not
   resolve.

So the component path and the assembly changed at different versions, and neither existing
era covers the eight releases between them.

Three of ADR-0004's four synthesis inputs also moved or changed shape, which is why this was
a conversion change rather than a range widening:

| `SynthesisSources` field | 3.3-3.x | 4.0.0 |
|---|---|---|
| `examplesPath` | `spring-boot-project/spring-boot-docs/src/main` | `documentation/spring-boot-docs/src/main` |
| `bomBuildScriptPath` | `spring-boot-project/spring-boot-dependencies/build.gradle` | `platform/spring-boot-dependencies/build.gradle` |
| `staticAttributesPath` | unchanged | unchanged — 123 entries against 3.5.16's 111, same `key=value` shape |
| `gradlePropertiesPath` | unchanged | unchanged |
| `metadataArtifacts` | 8 `spring-boot-*` jars | 103 — Boot 4 split three module trees into ~140 projects |

`AntoraAsciidocAttributes.java` changed with them: 4.x reads Jackson 3 from the
`tools.jackson` coordinates, keeps the 2.x line as a second `Jackson 2 Bom` library behind a
new `version-jackson2-databind`, and drops `pulsar-client-reactive-api`. The port in
`antora-attributes.ts` hard-coded the 3.x coordinates, so running it unchanged against a 4.x
BOM silently withholds four attributes the corpus links through.

## Decision

Declare a **third era** for `4.0.0`-`<4.0.8`: the 4.x component path with ADR-0004's
synthesized assembly, against the inputs 4.x moved.

Widening an existing era cannot express this. An era pins the component path *and* the
assembly together, and here the two moved apart — widening the 3.x era down would fetch
`spring-boot-project/…` from a tag that does not have it, and widening the archive era up
would merge a zip that 404s.

Alongside it, split the port's `addDependencyVersion` table into two era-scoped constants,
`BOOT_3_MANAGED_VERSIONS` and `BOOT_4_MANAGED_VERSIONS`, carried through
`SynthesisSources.managedVersionAttributes` into both `synthesizeAttributes` and
`versionSourceBoms`. Threading one table through both is what keeps the BOM fetch and the
attribute synthesis from disagreeing about which coordinates exist. The table is era-scoped
rather than a union because the difference lives in upstream's Java source, not in the
checkout: `com.fasterxml.jackson.core:jackson-databind` is managed in **both** lines, so a
union would emit `version-jackson2-databind` for 3.x, where upstream names no such attribute.

The 103-jar metadata set was measured two independent ways that agree exactly, rather than
derived from the 3.x list:

- the artifacts the 4.0.8 content archive ships a `spring-configuration-metadata.json`
  partial for, and
- the artifacts publishing a 4.0.0 *and* a 4.0.7 jar carrying
  `META-INF/spring-configuration-metadata.json`.

Of the 34 other modules v4.0.0 declares, 4 publish no jar and 30 publish one with no metadata
file — `spring-boot-test` among them, as in 3.x.

## Verification

4.0.8 is ground truth for this era the way 4.1.1 was for ADR-0004's, and a tighter one: it is
one patch above the range, so it shares the module split, the moved paths and the Jackson
coordinates. Running the reconstruction over 4.0.8's checked-out inputs and diffing against
the descriptor its content archive ships:

- 876 of 876 attributes **identical**, 0 differing, 0 missing
- 24 extra, all the `version-<spring-data-module>-docs` / `-javadoc` pairs #199 added
  deliberately for 3.3.4-3.3.5

End to end under `--strict`, against the 4.0.8 archive build as the control:

| Counter | 4.0.0 | 4.0.7 | 4.0.8 (archive) |
|---|---|---|---|
| exit code | 0 | 0 | 0 |
| pages | 147 | 147 | 239 |
| synthesized attributes | 899 | 900 | n/a |
| unresolved attribute references | **2** | **2** | **2** |
| unresolved `configprop:` | 0 | 0 | 0 |
| empty `include-code::` groups | 1 | 1 | 1 |

The two residual references are upstream's own: the `[source,shell]` blocks in
`tutorial/first-application` and `how-to/native-image/developing-your-first-application` omit
`subs="attributes"`, and docs.spring.io renders them literally too. They are the same two
files in all three builds, so the reconstruction leaves nothing the published archive resolves.

3.x was checked for regression at 3.3.0 and 3.5.16: no `version-jackson2-databind`, Jackson
values unchanged on the 2.x coordinates.

## Consequences

### Positive

- **Eight releases become buildable** with no change to the converter, the packager or the
  release workflow. `detect-upstream-versions.ts --project boot` reports 4.0.0-4.0.7.
- **The era model absorbed a layout change it had not seen.** The path move and the
  publication change happening at different versions is exactly the case
  `componentPath` + `assembly` were pinned together for, and it cost one era entry.
- **The attribute port is now honestly era-scoped.** The Jackson move would have withheld four
  attributes silently; the two tables make an upstream rename a visible diff in one place
  rather than a missing `{version-…}` in the output.

### Negative

- **The generated appendix is lost here too.** 92 pages of auto-configuration listings and
  configuration-property tables, so 4.0.0-4.0.7 ship 147 pages against 4.0.8's 239 — the same
  Gradle-output gap ADR-0004 accepted for 3.x.
- **A third era to keep true.** Every future upstream restructure now has three synthesis
  path sets and two managed-version tables to be checked against, not one.

### Neutral

- **Eras are no longer non-contiguous for Boot.** `eraFor` still returns `undefined` below
  3.3.0, and the ceiling logic is unchanged — 4.0.0 and 4.0.8 are simply now the two versions
  that prove `until` is exclusive.
- **4.1.0 stays unbuildable**, and deliberately so: it sits inside the archive era with its
  zip unpublished. That is a publication fact the availability gate catches, not an era gap.

## Alternatives Considered

- **Widen the 3.3-3.x era's ceiling to 4.0.8.** Rejected: an era pins one component path, and
  4.0.0 moved it. The sparse checkout would ask for `spring-boot-project/spring-boot-docs` at
  a tag where it does not exist, failing before conversion.

- **Widen the archive era's floor to 4.0.0.** Rejected on measurement: the
  `root-aggregate-content` zip 404s for 4.0.0 and 4.0.7, so the merge has nothing to merge.

- **Ship 4.0.0-4.0.7 from the git checkout alone.** Rejected for the reason ADR-0004 gives:
  measured on 3.5.16 it produces 350 unresolved attribute references, 837 unresolved
  `configprop:` macros and 326 empty `include-code::` groups, and unresolved markup reaches
  the reader as literal text.

- **One union table for both lines' `addDependencyVersion` calls.** Rejected: 3.x and 4.x both
  manage `com.fasterxml.jackson.core:jackson-databind`, so the union emits a
  `version-jackson2-databind` for 3.x that upstream never writes. Gating each row on its
  library being declared in the BOM was tried first and dropped — it produces the right answer
  for the wrong reason, since upstream resolves the coordinate without consulting the library.

## Related

- ADR-0004 — the era model and the reconstruction this extends; unchanged and still governing
  3.3-3.x.
- ADR-0002 — the two-half content source both rest on.
- `scripts/lib/upstream-sources.ts` — the era table and `BOOT_4_METADATA_ARTIFACTS`.
- `scripts/lib/antora-attributes.ts` — the two era-scoped managed-version tables.
- `.please/docs/knowledge/upstream-antora.md` — the measured upstream traps behind it.
- Issue #137.
