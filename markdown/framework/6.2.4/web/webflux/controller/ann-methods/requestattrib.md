---
title: "`@RequestAttribute`"
source: "ROOT:web/webflux/controller/ann-methods/requestattrib.adoc"
---

<a id="webflux-ann-requestattrib"></a>

# `@RequestAttribute`

[See equivalent in the Servlet stack](../../../webmvc/mvc-controller/ann-methods/requestattrib.md)

Similarly to `@SessionAttribute`, you can use the `@RequestAttribute` annotation to
access pre-existing request attributes created earlier (for example, by a `WebFilter`),
as the following example shows:

#### Java

```java
@GetMapping("/")
public String handle(@RequestAttribute Client client) { <1>
	// ...
}
```

1. Using `@RequestAttribute`.

#### Kotlin

```kotlin
@GetMapping("/")
fun handle(@RequestAttribute client: Client): String { // <1>
	// ...
}
```

1. Using `@RequestAttribute`.
