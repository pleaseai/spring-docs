---
name: tooling-ocr-mise-shim
description: The ocr CLI mise shim in this worktree fails with "No version is set for shim: ocr" unless invoked through a pinned node version
metadata:
  type: project
---

Running the bare `ocr` binary (resolved from `command -v ocr` at
`~/.local/share/mise/shims/ocr`) in this worktree fails with:

```
mise ERROR No version is set for shim: ocr
```

**Why:** the worktree has no `.mise.toml` / node version pin that the `ocr` shim
can resolve against, even though `ocr --version` works fine once a node version
is supplied explicitly.

**How to apply:** prefix every `ocr delegate ...` invocation with
`mise exec node@<version> -- ` (e.g. `mise exec node@24.19.0 -- ocr delegate
preview ...`), using any installed node version from `mise ls node`. Don't fall
back to `bunx @alibaba-group/open-code-review@1` just because the bare shim
errors — try the mise-pinned form first, it is faster and avoids a package
fetch.
