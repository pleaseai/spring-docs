---
title: "`@SessionAttribute`"
source: "ROOT:web/webflux/controller/ann-methods/sessionattribute.adoc"
---

<a id="webflux-ann-sessionattribute"></a>

# `@SessionAttribute`

[See equivalent in the Servlet stack](../../../webmvc/mvc-controller/ann-methods/sessionattribute.md)

If you need access to pre-existing session attributes that are managed globally
(that is, outside the controller — for example, by a filter) and may or may not be present,
you can use the `@SessionAttribute` annotation on a method parameter, as the following example shows:

#### Java

```java
@GetMapping("/")
public String handle(@SessionAttribute User user) { // <1>
	// ...
}
```

1. Using `@SessionAttribute`.

#### Kotlin

```kotlin
@GetMapping("/")
fun handle(@SessionAttribute user: User): String { // <1>
	// ...
}
```

1. Using `@SessionAttribute`.

For use cases that require adding or removing session attributes, consider injecting
`WebSession` into the controller method.

For temporary storage of model attributes in the session as part of a controller
workflow, consider using `SessionAttributes`, as described in
[`@SessionAttributes`](sessionattributes.md).
