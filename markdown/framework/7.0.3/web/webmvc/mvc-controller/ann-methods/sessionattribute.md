---
title: "`@SessionAttribute`"
source: "ROOT:web/webmvc/mvc-controller/ann-methods/sessionattribute.adoc"
---

<a id="mvc-ann-sessionattribute"></a>

# `@SessionAttribute`

[See equivalent in the Reactive stack](../../../webflux/controller/ann-methods/sessionattribute.md)

If you need access to pre-existing session attributes that are managed globally
(that is, outside the controller — for example, by a filter) and may or may not be present,
you can use the `@SessionAttribute` annotation on a method parameter,
as the following example shows:

#### Java

```java
@RequestMapping("/")
public String handle(@SessionAttribute User user) { <1>
	// ...
}
```

1. Using a `@SessionAttribute` annotation.

#### Kotlin

```kotlin
@RequestMapping("/")
fun handle(@SessionAttribute user: User): String { // <1>
	// ...
}
```

1. Using a `@SessionAttribute` annotation.======

For use cases that require adding or removing session attributes, consider injecting
`org.springframework.web.context.request.WebRequest` or
`jakarta.servlet.http.HttpSession` into the controller method.

For temporary storage of model attributes in the session as part of a controller
workflow, consider using `@SessionAttributes` as described in
[`@SessionAttributes`](sessionattributes.md).
