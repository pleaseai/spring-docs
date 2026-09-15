---
title: "Static Imports"
source: "ROOT:testing/mockmvc/hamcrest/static-imports.adoc"
---

<a id="mockmvc-server-static-imports"></a>

# Static Imports

When using MockMvc directly to perform requests, you’ll need static imports for:

- `MockMvcBuilders.*`
- `MockMvcRequestBuilders.*`
- `MockMvcResultMatchers.*`
- `MockMvcResultHandlers.*`

An easy way to remember that is search for `MockMvc*`. If using Eclipse be sure to also
add the above as “favorite static members” in the Eclipse preferences.

When using MockMvc through the [WebTestClient](../../webtestclient.md) you do not need static imports.
The `WebTestClient` provides a fluent API without static imports.
