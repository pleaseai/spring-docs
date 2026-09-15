---
title: "Null-safety"
source: "ROOT:languages/kotlin/null-safety.adoc"
---

<a id="kotlin-null-safety"></a>

# Null-safety

One of Kotlin’s key features is [null-safety](https://kotlinlang.org/docs/null-safety.html),
which cleanly deals with `null` values at compile time rather than bumping into the famous
`NullPointerException` at runtime. This makes applications safer through nullability
declarations and expressing “value or no value” semantics without paying the cost of wrappers, such as `Optional`.
Kotlin allows using functional constructs with nullable values. See this
[comprehensive guide to Kotlin null-safety](https://www.baeldung.com/kotlin-null-safety).

Although Java does not let you express null-safety in its type-system, the Spring Framework
provides [null-safety of the whole Spring Framework API](../../core/null-safety.md)
via tooling-friendly [JSpecify](https://jspecify.dev/) annotations.

As of Kotlin 2.1, Kotlin enforces strict handling of nullability annotations from `org.jspecify.annotations` package.
