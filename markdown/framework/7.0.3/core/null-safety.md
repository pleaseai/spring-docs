---
title: "Null-safety"
source: "ROOT:core/null-safety.adoc"
---

<a id="null-safety"></a>

# Null-safety

Although Java does not let you express nullness markers with its type system yet, the Spring Framework codebase is
annotated with [JSpecify](https://jspecify.dev/docs/start-here/) annotations to declare the nullability of its APIs,
fields, and related type usages. Reading the [JSpecify user guide](https://jspecify.dev/docs/user-guide/) is highly
recommended in order to get familiar with those annotations and semantics.

The primary goal of this null-safety arrangement is to prevent a `NullPointerException` from being thrown at
runtime via build time checks and to use explicit nullability as a way to express the possible absence of value.
It is useful in Java by leveraging nullability checkers such as [NullAway](https://github.com/uber/NullAway) or IDEs
supporting JSpecify annotations such as IntelliJ IDEA and Eclipse (the latter requiring manual configuration). In Kotlin,
JSpecify annotations are automatically translated to [Kotlin’s null safety](https://kotlinlang.org/docs/null-safety.html).

The [`Nullness` Spring API](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/core/Nullness.html) can be used at runtime to detect the
nullness of a type usage, a field, a method return type, or a parameter. It provides full support for
JSpecify annotations, Kotlin null safety, and Java primitive types, as well as a pragmatic check on any
`@Nullable` annotation (regardless of the package).

<a id="null-safety-libraries"></a>

## Annotating libraries with JSpecify annotations

As of Spring Framework 7, the Spring Framework codebase leverages JSpecify annotations to expose null-safe APIs
and to check the consistency of those nullability declarations with [NullAway](https://github.com/uber/NullAway)
as part of its build. It is recommended for each library depending on Spring Framework and Spring portfolio projects,
as well as other libraries related to the Spring ecosystem (Reactor, Micrometer, and Spring community projects),
to do the same.

<a id="null-safety-applications"></a>

## Leveraging JSpecify annotations in Spring applications

Developing applications with IDEs that support nullness annotations will provide warnings in Java and errors in
Kotlin when the nullability contracts are not honored, allowing Spring application developers to refine their
null handling to prevent a `NullPointerException` from being thrown at runtime.

Optionally, Spring application developers can annotate their codebase and use build plugins like
[NullAway](https://github.com/uber/NullAway) to enforce null-safety at the application level during build time.

<a id="null-safety-guidelines"></a>

## Guidelines

The purpose of this section is to share some proposed guidelines for explicitly specifying the nullability of
Spring-related libraries or applications.

<a id="null-safety-guidelines-jspecify"></a>

### JSpecify

<a id="_defaults_to_non_null"></a>

#### Defaults to non-null

A key point to understand is that the nullness of types is unknown by default in Java and that non-null type usage
is by far more frequent than nullable usage. In order to keep codebases readable, we typically want to define by
default that type usage is non-null unless marked as nullable for a specific scope. This is exactly the purpose
of [`@NullMarked`](https://jspecify.dev/docs/api/org/jspecify/annotations/NullMarked.html) which is typically set
in Spring projects at the package level via a `package-info.java` file, for example:

```java
@NullMarked
package org.springframework.core;

import org.jspecify.annotations.NullMarked;
```

<a id="_explicit_nullability"></a>

#### Explicit nullability

In `@NullMarked` code, nullable type usage is defined explicitly with
[`@Nullable`](https://jspecify.dev/docs/api/org/jspecify/annotations/Nullable.html).

A key difference between JSpecify `@Nullable` / `@NonNull` annotations and most other variants is that the JSpecify
annotations are meta-annotated with `@Target(ElementType.TYPE_USE)`, so they apply only to type usage. This impacts
where such annotations should be placed, either to comply with
[related Java specifications](https://docs.oracle.com/javase/specs/jls/se17/html/jls-9.html#jls-9.7.4) or to follow code
style best practices. From a style perspective, it is recommended to embrace the type-use nature of those annotations
by placing them on the same line as and immediately preceding the annotated type.

For example, for a field:

```java
private @Nullable String fileEncoding;
```

Or for method parameters and method return types:

```java
public @Nullable String buildMessage(@Nullable String message,
                                     @Nullable Throwable cause) {
    // ...
}
```

> [!NOTE]
> When overriding a method, JSpecify annotations are not inherited from the original
> method. That means the JSpecify annotations should be copied to the overriding method if
> you want to override the implementation and keep the same nullability semantics.

[`@NonNull`](https://jspecify.dev/docs/api/org/jspecify/annotations/NonNull.html) and
[`@NullUnmarked`](https://jspecify.dev/docs/api/org/jspecify/annotations/NullUnmarked.html) should rarely be needed for
typical use cases.

<a id="_arrays_and_varargs"></a>

#### Arrays and varargs

With arrays and varargs, you need to be able to differentiate the nullness of the elements from the nullness of
the array itself. Pay attention to the syntax
[defined by the Java specification](https://docs.oracle.com/javase/specs/jls/se17/html/jls-9.html#jls-9.7.4) which may be
initially surprising. For example, in `@NullMarked` code:

- `@Nullable Object[] array` means individual elements can be `null` but the array itself cannot.
- `Object @Nullable [] array` means individual elements cannot be `null` but the array itself can.
- `@Nullable Object @Nullable [] array` means both individual elements and the array can be `null`.

<a id="_generics"></a>

#### Generics

JSpecify annotations apply to generics as well. For example, in `@NullMarked` code:

- `List<String>` means a list of non-null elements (equivalent of `List<@NonNull String>`)
- `List<@Nullable String>` means a list of nullable elements

Things are a bit more complicated when you are declaring generic types or generic methods. See the related
[JSpecify generics documentation](https://jspecify.dev/docs/user-guide/#generics) for more details.

> [!WARNING]
> The nullability of generic types and generic methods
> [is not yet fully supported by NullAway](https://github.com/uber/NullAway/issues?q=is%3Aissue+is%3Aopen+label%3Ajspecify).

<a id="_nested_and_fully_qualified_types"></a>

#### Nested and fully qualified types

The Java specification also enforces that annotations defined with `@Target(ElementType.TYPE_USE)` – like JSpecify’s
`@Nullable` annotation – must be declared after the last dot (`.`) within inner or fully qualified type names:

- `Cache.@Nullable ValueWrapper`
- `jakarta.validation.@Nullable Validator`

<a id="null-safety-guidelines-nullaway"></a>

### NullAway

<a id="_configuration"></a>

#### Configuration

The recommended configuration is:

- `NullAway:OnlyNullMarked=true` in order to perform nullability checks only for packages annotated with `@NullMarked`.
- `NullAway:CustomContractAnnotations=org.springframework.lang.Contract` which makes NullAway aware of the
[@Contract](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/lang/Contract.html) annotation in the `org.springframework.lang` package which
can be used to express complementary semantics to avoid irrelevant warnings in your codebase.

A good example of the benefits of a `@Contract` declaration can be seen with
[`Assert.notNull()`](<https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/util/Assert.html#notNull(java.lang.Object,java.lang.String)>)
which is annotated with `@Contract("null, _ → fail")`. With that contract declaration, NullAway will understand
that the value passed as a parameter cannot be null after a successful invocation of `Assert.notNull()`.

Optionally, it is possible to set `NullAway:JSpecifyMode=true` to enable
[checks on the full JSpecify semantics](https://github.com/uber/NullAway/wiki/JSpecify-Support), including annotations on
arrays, varargs, and generics. Be aware that this mode is
[still under development](https://github.com/uber/NullAway/issues?q=is%3Aissue+is%3Aopen+label%3Ajspecify) and requires
JDK 22 or later (typically combined with the `--release` Java compiler flag to configure the
expected baseline). It is recommended to enable the JSpecify mode only as a second step, after making sure the codebase
generates no warning with the recommended configuration mentioned previously in this section.

<a id="_warnings_suppression"></a>

#### Warnings suppression

There are a few valid use cases where NullAway will incorrectly detect nullability problems. In such cases,
it is recommended to suppress related warnings and to document the reason:

- `@SuppressWarnings("NullAway.Init")` at field, constructor, or class level can be used to avoid unnecessary warnings
due to the lazy initialization of fields – for example, due to a class implementing
[`InitializingBean`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/beans/factory/InitializingBean.html).
- `@SuppressWarnings("NullAway") // Dataflow analysis limitation` can be used when NullAway dataflow analysis is not
able to detect that the path involving a nullability problem will never happen.
- `@SuppressWarnings("NullAway") // Lambda` can be used when NullAway does not take into account assertions performed
outside of a lambda for the code path within the lambda.
- `@SuppressWarnings("NullAway") // Reflection` can be used for some reflection operations that are known to return
non-null values even if that cannot be expressed by the API.
- `@SuppressWarnings("NullAway") // Well-known map keys` can be used when `Map#get` invocations are performed with keys
that are known to be present and when non-null related values have been inserted previously.
- `@SuppressWarnings("NullAway") // Overridden method does not define nullability` can be used when the superclass does
not define nullability (typically when the superclass comes from an external dependency).
- `@SuppressWarnings("NullAway") // See github.com/uber/NullAway/issues/1075` can be used when NullAway is not able to detect type variable nullness in generic methods.

<a id="null-safety-migrating"></a>

## Migrating from Spring null-safety annotations

Spring null-safety annotations [`@Nullable`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/lang/Nullable.html),
[`@NonNull`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/lang/NonNull.html),
[`@NonNullApi`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/lang/NonNullApi.html), and
[`@NonNullFields`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/lang/NonNullFields.html) in the `org.springframework.lang` package were
introduced in Spring Framework 5 when JSpecify did not exist, and the best option at that time was to leverage
meta-annotations from JSR 305 (a dormant but widespread JSR). They are deprecated as of Spring Framework 7 in favor of
[JSpecify](https://jspecify.dev/docs/start-here/) annotations, which provide significant enhancements such as properly
defined specifications, a canonical dependency with no split-package issues, better tooling, better Kotlin integration,
and the capability to specify nullability more precisely for more use cases.

A key difference is that Spring’s deprecated null-safety annotations, which follow JSR 305 semantics, apply to fields,
parameters, and return values; while JSpecify annotations apply to type usage. This subtle difference
is pretty significant in practice, since it allows developers to differentiate between the nullness of elements and the
nullness of arrays/varargs as well as to define the nullness of generic types.

That means array and varargs null-safety declarations have to be updated to keep the same semantics. For example
`@Nullable Object[] array` with Spring annotations needs to be changed to `Object @Nullable [] array` with JSpecify
annotations. The same applies to varargs.

It is also recommended to move field and return value annotations closer to the type and on the same line, for example:

- For fields, instead of `@Nullable private String field` with Spring annotations, use `private @Nullable String field`
with JSpecify annotations.
- For method return types, instead of `@Nullable public String method()` with Spring annotations, use
`public @Nullable String method()` with JSpecify annotations.

Also, with JSpecify, you do not need to specify `@NonNull` when overriding a type usage annotated with `@Nullable`
in the super method to "undo" the nullable declaration in null-marked code. Just declare it unannotated, and the
null-marked defaults will apply (type usage is considered non-null unless explicitly annotated as nullable).
