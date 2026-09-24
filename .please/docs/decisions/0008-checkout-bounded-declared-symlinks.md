# ADR-0008: Bound a Declared Symlink by the Store's Checkout, Not by Its Component

## Status

Proposed — 2026-09-25

## Context

#390 brought five Spring Data stores in through the template era of ADR-0007. It left out five
more: MongoDB, Neo4j, Redis, Relational and REST. They share the template shape, but their
components reach their `example$` trees through symlinks that point out of the component, into
the store's own Java sources.

Every GA tag of the five from the 2023.1 train on carries the same links with the same targets,
65 tags per store and 325 in all. Paths are relative to `src/main/antora/modules/ROOT/`, and
targets are relative to the repository root:

| Store | Link | Target | Files at latest | Includes at latest |
|---|---|---|---|---|
| MongoDB 4.2.0–5.1.1 | `examples/example` | `spring-data-mongodb/src/test/java/…/mongodb/example` | 3 | 4 |
| Neo4j 7.2.0–8.1.1 | `examples/config` | `src/main/java/…/neo4j/config` | 12 | 1 |
| | `examples/core` | `src/main/java/…/neo4j/core` | 144 | 4 |
| | `examples/documentation` | `src/test/java/…/neo4j/documentation` | 23 | 17 |
| | `examples/integration` | `src/test/java/…/neo4j/integration` | 503 | 10 |
| | `examples/repository` | `src/main/java/…/neo4j/repository` | 74 | 3 |
| Redis 3.2.0–4.1.1 | `examples/examples` | `src/test/java/…/redis/examples` | 2 | 2 |
| Relational 3.2.0–4.1.1 | `examples/r2dbc` | `spring-data-r2dbc/src/test/java/…/r2dbc/documentation` | 6 | 16 |
| REST 4.2.0–5.1.1 | `examples/mongodb` | `spring-data-rest-tests/spring-data-rest-tests-mongodb/src/main/java/…` | 10 | 1 |
| | `examples/security` | `spring-data-rest-tests/spring-data-rest-tests-security/src/test/java/…` | 4 | 3 |
| | `examples/support` | `spring-data-rest-webmvc/src/test/java/…/webmvc/support` | 6 | 1 |

"Files" counts the files in the target tree, all `.java`, none of them a symlink. "Includes"
counts `include::example$<link>/…` directives in the component's pages.

The copy guard in `scripts/lib/reject-symlinks.ts` refuses all of them, twice over:

1. **The template era declares no links.** `internalSymlinks` exists only on the overlay
   assembly, so `copyIntoContentSource` meets the link and `assertNoSymlinks` refuses it.
2. **A declared link may only resolve inside the component.** `materializeDeclaredSymlinks`
   takes the component root as its bound. Even when a link is declared, its target is outside the
   component and outside the era's sparse checkout. The link is then broken, and if the target
   were checked out it would count as an escape.

That bound was drawn for the only links known when the guard was written. Spring Framework and
Spring Security ship `modules/ROOT/examples/docs-src` → `../../../src`, which stays inside their
component (`framework-docs`, `docs`). The guard's purpose is broader than that bound. A link
under a page module could name anything on the runner, and `git add -A` in `initContentSource`
would store whatever the link reaches. Declaration and target pinning are what stop that: an
undeclared link fails, and a declared link that resolves anywhere but its pinned target fails
too. Beyond that, the component bound only catches a declaration whose own target climbs out
with `..`. A bound on the checkout catches that too, without forbidding targets like these.

Leaving the links out is not an option. Those trees hold the code samples the pages exist to
show. Without them, every include in the last column would lose its code.

## Decision

Keep the guard's rule, that every link is declared and pinned to one target, and move its bound
from the component to **the store's own checkout, restricted to the paths the era checks out**.

- **Targets become repository-relative.** `DeclaredSymlink.path` stays relative to the component
  root, because that is where the link lives. `target` becomes relative to the checkout root,
  because that is where the link can point. The two existing declarations are restated with the
  same meaning: Framework's `src` becomes `framework-docs/src`, and Security's becomes `docs/src`.
- **The era checks the targets out.** `checkoutPathsFor` adds every declared target to the sparse
  checkout, as it already adds a synthesized era's `examplesPath`. A target is therefore always a
  path the era named and fetched from the store's own tag.
- **The bound is the checkout, excluding what the pipeline puts there.** A link must resolve to
  exactly `realpath(<checkout>/<target>)`. A target under `.git/` or `.spring-docs-*` fails at
  declaration, not at build. Those directories hold git metadata and the template era's parent
  and companion checkouts, not content from the store's tag.
- **The template era declares links too.** Its assembly gains the same `internalSymlinks` field
  as the overlay assembly. `springDataStore(store, since, symlinks = [])` takes the store's
  declarations, and `fetch-upstream.ts` materializes them for both assemblies before the copy.
- **Everything else in the guard is unchanged.** It still refuses links inside a target, a
  link inside its own target, a declared path that is not a link, a broken link and a retargeted
  link. It still materializes each link as a dereferencing copy that `assertNoSymlinks` checks
  afterwards.

With that in place, MongoDB, Neo4j, Redis, Relational and REST each enter `PROJECTS` as one
`springDataStore` line with the declarations above. Their `since` values are 4.2.0, 7.2.0,
3.2.0, 3.2.0 and 4.2.0, each the store's version in the 2023.1 train.

## Consequences

### Positive

- **The five remaining stores become buildable**: 325 more versions, finishing the Spring Data
  generalization from #139.
- **One bound for every era.** Framework, Security and Spring Data use the same rule, with no
  Spring Data exception.
- **A reviewer still sees every link.** An upstream change that adds, moves or retargets a link
  fails the build with the link named. The guard rejects anything nobody declared.

### Negative

- **The content source takes in trees that are not documentation.** Neo4j copies about 750 Java
  files, mostly `integration` tests, to serve 35 includes. They exist only at build time. The
  release archive carries only the converted Markdown, so the cost is fetch and copy time, not
  published size.
- **A declaration is a statement about upstream's source layout, not only its documentation
  layout.** If a store renames a test package, every version from that tag on fails until the
  declaration moves. That is the failure the guard is designed to produce, but more upstream
  refactors will now cause one.
- **The Framework and Security declarations change spelling.** The resolved targets are the
  same, and the implementation has to show it by rebuilding one version of each byte for byte.

### Neutral

- **Upstream uses the same mechanism.** Antora follows these links in upstream's own build. This
  pipeline just requires them to be named first.

## Alternatives Considered

- **Copy each declared tree to the link's path without reading the link**, as a synthesized
  era's `copyExamples` does. Rejected: the tree would no longer be tied to the link. Upstream
  retargeting a link to a different package would build silently from the old tree.
- **Follow any link that stays inside the checkout, undeclared.** Rejected: that removes the
  review step the guard exists for. A new link would be absorbed the moment upstream added it.
- **Keep the component bound and add a second, repository bound for the template era only.**
  Rejected: that gives two rules for one guard. Pinning the target is what does the work in both
  cases.
- **Drop the linked examples.** Rejected: it loses 2 to 35 included code samples per store, the
  content the pages exist to show.
- **Check out the whole repository.** Rejected: it fetches every blob of the tag and leaves the
  bound question open.

## Related

- ADR-0007: the template era these stores build through.
- ADR-0004: the synthesized era, whose `examplesPath` is the precedent for checking out a tree
  outside the component.
- `scripts/lib/reject-symlinks.ts`: `materializeDeclaredSymlinks` and `assertNoSymlinks`.
- `scripts/lib/upstream-sources.ts`: `checkoutPathsFor`, `springDataStore`.
- Issue #139 and PR #390.
