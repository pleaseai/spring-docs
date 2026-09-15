---
title: "`@RequestAttribute`"
source: "ROOT:web/webmvc/mvc-controller/ann-methods/requestattrib.adoc"
---

<a id="mvc-ann-requestattrib"></a>

# `@RequestAttribute`

[See equivalent in the Reactive stack](../../../webflux/controller/ann-methods/requestattrib.md)

Similar to `@SessionAttribute`, you can use the `@RequestAttribute` annotations to
access pre-existing request attributes created earlier (for example, by a Servlet `Filter`
or `HandlerInterceptor`):

#### Java

```java
@GetMapping("/")
public String handle(@RequestAttribute Client client) { // <1>
	// ...
}
```

1. Using the `@RequestAttribute` annotation.

#### Kotlin

```kotlin
@GetMapping("/")
fun handle(@RequestAttribute client: Client): String { // <1>
	// ...
}
```

1. Using the `@RequestAttribute` annotation.
