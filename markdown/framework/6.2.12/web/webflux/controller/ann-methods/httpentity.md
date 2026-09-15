---
title: "`HttpEntity`"
source: "ROOT:web/webflux/controller/ann-methods/httpentity.adoc"
---

<a id="webflux-ann-httpentity"></a>

# `HttpEntity`

[See equivalent in the Servlet stack](../../../webmvc/mvc-controller/ann-methods/httpentity.md)

`HttpEntity` is more or less identical to using [`@RequestBody`](requestbody.md) but is based on a
container object that exposes request headers and the body. The following example uses an
`HttpEntity`:

#### Java

```java
@PostMapping("/accounts")
public void handle(HttpEntity<Account> entity) {
	// ...
}
```

#### Kotlin

```kotlin
@PostMapping("/accounts")
fun handle(entity: HttpEntity<Account>) {
	// ...
}
```
