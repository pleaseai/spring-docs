---
title: "Null-safety"
source: "ROOT:core/null-safety.adoc"
---

<a id="null-safety"></a>

# Null-safety

Although Java does not let you express null-safety with its type system, the Spring Framework
provides the following annotations in the `org.springframework.lang` package to let you
declare nullability of APIs and fields:

- [`@Nullable`](https://docs.spring.io/spring-framework/docs/6.2.13/javadoc-api/org/springframework/lang/Nullable.html): Annotation to indicate that a
specific parameter, return value, or field can be `null`.
- [`@NonNull`](https://docs.spring.io/spring-framework/docs/6.2.13/javadoc-api/org/springframework/lang/NonNull.html): Annotation to indicate that a specific
parameter, return value, or field cannot be `null` (not needed on parameters, return values,
and fields where `@NonNullApi` and `@NonNullFields` apply, respectively).
- [`@NonNullApi`](https://docs.spring.io/spring-framework/docs/6.2.13/javadoc-api/org/springframework/lang/NonNullApi.html): Annotation at the package level
that declares non-null as the default semantics for parameters and return values.
- [`@NonNullFields`](https://docs.spring.io/spring-framework/docs/6.2.13/javadoc-api/org/springframework/lang/NonNullFields.html): Annotation at the package
level that declares non-null as the default semantics for fields.

The Spring Framework itself leverages these annotations, but they can also be used in any
Spring-based Java project to declare null-safe APIs and optionally null-safe fields.
Nullability declarations for generic type arguments, varargs, and array elements are not supported yet.
Nullability declarations are expected to be fine-tuned between Spring Framework releases,
including minor ones. Nullability of types used inside method bodies is outside the
scope of this feature.

> [!NOTE]
> Other common libraries such as Reactor and Spring Data provide null-safe APIs that
> use a similar nullability arrangement, delivering a consistent overall experience for
> Spring application developers.

<a id="use-cases"></a>

## Use cases

In addition to providing an explicit declaration for Spring Framework API nullability,
these annotations can be used by an IDE (such as IDEA or Eclipse) to provide useful
warnings related to null-safety in order to avoid `NullPointerException` at runtime.

They are also used to make Spring APIs null-safe in Kotlin projects, since Kotlin natively
supports [null-safety](https://kotlinlang.org/docs/null-safety.html). More details
are available in the [Kotlin support documentation](../languages/kotlin/null-safety.md).

<a id="jsr-305-meta-annotations"></a>

## JSR-305 meta-annotations

Spring annotations are meta-annotated with [JSR 305](https://www.jcp.org/en/jsr/detail?id=305)
annotations (a dormant but widespread JSR). JSR-305 meta-annotations let tooling vendors
like IDEA or Kotlin provide null-safety support in a generic way, without having to
hard-code support for Spring annotations.

It is neither necessary nor recommended to add a JSR-305 dependency to the project classpath to
take advantage of Spring’s null-safe APIs. Only projects such as Spring-based libraries that use
null-safety annotations in their codebase should add `com.google.code.findbugs:jsr305:3.0.2`
with `compileOnly` Gradle configuration or Maven `provided` scope to avoid compiler warnings.
