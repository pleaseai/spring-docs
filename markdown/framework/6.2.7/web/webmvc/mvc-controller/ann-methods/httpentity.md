---
title: "HttpEntity"
source: "ROOT:web/webmvc/mvc-controller/ann-methods/httpentity.adoc"
---

<a id="mvc-ann-httpentity"></a>

# HttpEntity

[See equivalent in the Reactive stack](../../../webflux/controller/ann-methods/httpentity.md)

`HttpEntity` is more or less identical to using [`@RequestBody`](requestbody.md) but is based on a
container object that exposes request headers and body. The following listing shows an example:

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
