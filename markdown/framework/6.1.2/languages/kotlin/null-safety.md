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
(Kotlin allows using functional constructs with nullable values. See this
[comprehensive guide to Kotlin null-safety](https://www.baeldung.com/kotlin-null-safety).)

Although Java does not let you express null-safety in its type-system, the Spring Framework
provides [null-safety of the whole Spring Framework API](#)
via tooling-friendly annotations declared in the `org.springframework.lang` package.
By default, types from Java APIs used in Kotlin are recognized as
[platform types](https://kotlinlang.org/docs/java-interop.html#null-safety-and-platform-types),
for which null-checks are relaxed.
[Kotlin support for JSR-305 annotations](https://kotlinlang.org/docs/java-interop.html#jsr-305-support)
and Spring nullability annotations provide null-safety for the whole Spring Framework API to Kotlin developers,
with the advantage of dealing with `null`-related issues at compile time.

> [!NOTE]
> Libraries such as Reactor or Spring Data provide null-safe APIs to leverage this feature.

You can configure JSR-305 checks by adding the `-Xjsr305` compiler flag with the following
options: `-Xjsr305={strict|warn|ignore}`.

For kotlin versions 1.1+, the default behavior is the same as `-Xjsr305=warn`.
The `strict` value is required to have Spring Framework API null-safety taken into account
in Kotlin types inferred from Spring API but should be used with the knowledge that Spring
API nullability declaration could evolve even between minor releases and that more checks may
be added in the future.

> [!NOTE]
> Generic type arguments, varargs, and array elements nullability are not supported yet,
> but should be in an upcoming release. See [this discussion](https://github.com/Kotlin/KEEP/issues/79)
> for up-to-date information.
