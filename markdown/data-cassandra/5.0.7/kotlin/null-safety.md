---
title: "Null Safety"
source: "ROOT:kotlin/null-safety.adoc"
---

<a id="kotlin.null-safety"></a>

# Null Safety

One of Kotlin’s key features is [null safety](https://kotlinlang.org/docs/null-safety.html), which cleanly deals with `null` values at compile time.
This makes applications safer through nullability declarations and the expression of “value or no value” semantics without paying the cost of wrappers, such as `Optional`.
(Kotlin allows using functional constructs with nullable values. See this [comprehensive guide to Kotlin null safety](https://www.baeldung.com/kotlin/null-safety).)

> [!NOTE]
> As of Spring Framework 7 and Spring Data 4, Spring Data uses [JSpecify](https://jspecify.dev/docs/start-here/) for nullability annotations.
> The earlier [JSR-305](https://jcp.org/en/jsr/detail?id=305)-based `org.springframework.lang` annotations are deprecated and should no longer be relied upon.
> See [Null Handling of Repository Methods](../repositories/null-handling.md) for the current recommended approach.

Although Java does not let you express null safety in its type system, the Spring Data API is annotated with JSpecify annotations.
By default, types from Java APIs used in Kotlin are recognized as [platform types](https://kotlinlang.org/docs/reference/java-interop.html#null-safety-and-platform-types), for which null checks are relaxed.
JSpecify annotations provide null safety for the whole Spring Data API to Kotlin developers, with the advantage of dealing with `null`-related issues at compile time.

See [Null Handling of Repository Methods](../repositories/null-handling.md) for details on how null safety applies to Spring Data repositories.

> [!NOTE]
> Generic type arguments, varargs, and array element nullability are not supported yet, but should be in an upcoming release.
