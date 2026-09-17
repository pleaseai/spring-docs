---
name: docs-spring-io-version-collapse
description: docs.spring.io 301-collapses a patch version to its minor, so reference-site URLs can never be version-pinned — use release-tag raw URLs for per-version assets
metadata:
  type: project
---

`docs.spring.io` redirects any patch-level path segment to its minor alias
(`/spring-framework/reference/6.2.14/_images/x.png` → 301 →
`/reference/6.2/_images/x.png`), and older minors stop serving assets entirely
(6.1 image paths 404 while the asset is present in tag v6.1.0). A URL built from
a catalog version therefore *looks* pinned but serves whatever that minor
currently publishes.

**Why:** a Spring Framework `imageBaseFor` built on the reference site published
404ing image URLs across the whole declared 6.1.x range; fixed by pointing at
`raw.githubusercontent.com/spring-projects/<repo>/v<version>/<componentPath>/modules/ROOT/assets/images`.

**How to apply:** when adding or reviewing a project's `imageBaseFor` /
`javadocLocationFor` in `scripts/lib/upstream-sources.ts`, verify with `curl -o
/dev/null -w '%{http_code} %{redirect_url}'` *without* `-L` — a `-L` check hides
the collapse behind a 200. Prefer a release-tag raw URL for anything that must
be exact per patch version.
