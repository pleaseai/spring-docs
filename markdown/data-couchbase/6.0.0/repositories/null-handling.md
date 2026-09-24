---
title: "Null Handling of Repository Methods"
source: "ROOT:repositories/null-handling.adoc"
---

<a id="repositories.nullability"></a>

# Null Handling of Repository Methods

Repository CRUD methods that return an individual aggregate instances can use `Optional` to indicate the potential absence of a value.
Besides that, Spring Data supports returning the following wrapper types on query methods:

- `com.google.common.base.Optional`
- `scala.Option`
- `io.vavr.control.Option`

Alternatively, query methods can choose not to use a wrapper type at all.
The absence of a query result is then indicated by returning `null`.
Repository methods returning collections, collection alternatives, wrappers, and streams are guaranteed never to return `null` but rather the corresponding empty representation.
See “[Repository query return types](query-return-types-reference.md)” for details.

<a id="repositories.nullability.annotations"></a>

## Nullability Annotations

<a id="_jspecify"></a>

### JSpecify

As on Spring Framework 7 and Spring Data 4, you can express nullability constraints for repository methods by using [JSpecify](https://jspecify.dev/docs/start-here/).
JSpecify is well integrated into IntelliJ and Eclipse to provide a tooling-friendly approach and opt-in `null` checks during runtime, as follows:

- [`@NullMarked`](https://jspecify.dev/docs/api/org/jspecify/annotations/NullMarked.html): Used on the module-, package- and class-level to declare that the default behavior for parameters and return values is, respectively, neither to accept nor to produce `null` values.
- [`@NonNull`](https://jspecify.dev/docs/api/org/jspecify/annotations/NonNull.html): Used on a type level for parameter or return values that must not be `null` (not needed value where `@NullMarked` applies).
- [`@Nullable`](https://jspecify.dev/docs/api/org/jspecify/annotations/Nullable.html): Used on the type level for parameter or return values that can be `null`.
- [`@NullUnmarked`](https://jspecify.dev/docs/api/org/jspecify/annotations/NullUnmarked.html): Used on the package-, class-, and method-level to roll back nullness declaration and opt-out from a previous `@NullMarked`.
Nullness changes to unspecified in such a case.

#### `@NullMarked` at the package level via a `package-info.java` file

```java
@NullMarked
package org.springframework.core;

import org.jspecify.annotations.NullMarked;
```

In the various Java files belonging to the package, nullable type usages are defined explicitly with
[`@Nullable`](https://jspecify.dev/docs/api/org/jspecify/annotations/Nullable.html).
It is recommended that this annotation is specified just before the related type.

For example, for a field:

```java
private @Nullable String fileEncoding;
```

Or for method parameters and return value:

```java
public static @Nullable String buildMessage(@Nullable String message,
                                            @Nullable Throwable cause) {
    // ...
}
```

When overriding a method, nullness annotations are not inherited from the superclass method.
That means those nullness annotations should be repeated if you just want to override the implementation and keep the same API nullness.

With arrays and varargs, you need to be able to differentiate the nullness of the elements from the nullness of the array itself.
Pay attention to the syntax
[defined by the Java specification](https://docs.oracle.com/javase/specs/jls/se17/html/jls-9.html#jls-9.7.4) which may be initially surprising:

- `@Nullable Object[] array` means individual elements can be null but the array itself can’t.
- `Object @Nullable [] array` means individual elements can’t be null but the array itself can.
- `@Nullable Object @Nullable [] array` means both individual elements and the array can be null.

The Java specifications also enforces that annotations defined with `@Target(ElementType.TYPE_USE)` like JSpecify
`@Nullable` should be specified after the last `.` with inner or fully qualified types:

- `Cache.@Nullable ValueWrapper`
- `jakarta.validation.@Nullable Validator`

[`@NonNull`](https://jspecify.dev/docs/api/org/jspecify/annotations/NonNull.html) and
[`@NullUnmarked`](https://jspecify.dev/docs/api/org/jspecify/annotations/NullUnmarked.html) should rarely be needed for typical use cases.

<a id="_spring_framework_nullability_and_jsr_305_annotations"></a>

### Spring Framework Nullability and JSR-305 Annotations

You can express nullability constraints for repository methods by using [Spring Framework’s nullability annotations](https://docs.spring.io/spring-framework/reference/7.0/core/null-safety.html).

> [!NOTE]
> As on Spring Framework 7, Spring’s nullability annotations are deprecated in favor of JSpecify.
> Consult the framework documentation on [Migrating from Spring null-safety annotations to JSpecify](https://docs.spring.io/spring-framework/reference/7.0/core/null-safety.html) for more information.

They provide a tooling-friendly approach and opt-in `null` checks during runtime, as follows:

- [`@NonNullApi`](https://docs.spring.io/spring-framework/docs/7.0.0/javadoc-api/org/springframework/lang/NonNullApi.html): Used on the package level to declare that the default behavior for parameters and return values is, respectively, neither to accept nor to produce `null` values.
- [`@NonNull`](https://docs.spring.io/spring-framework/docs/7.0.0/javadoc-api/org/springframework/lang/NonNull.html): Used on a parameter or return value that must not be `null` (not needed on a parameter and return value where `@NonNullApi` applies).
- [`@Nullable`](https://docs.spring.io/spring-framework/docs/7.0.0/javadoc-api/org/springframework/lang/Nullable.html): Used on a parameter or return value that can be `null`.

Spring annotations are meta-annotated with [JSR 305](https://jcp.org/en/jsr/detail?id=305) annotations (a dormant but widely used JSR).
JSR 305 meta-annotations let tooling vendors (such as [IDEA](https://www.jetbrains.com/help/idea/nullable-and-notnull-annotations.html), [Eclipse](https://help.eclipse.org/latest/index.jsp?topic=/org.eclipse.jdt.doc.user/tasks/task-using_external_null_annotations.htm), and [Kotlin](https://kotlinlang.org/docs/reference/java-interop.html#null-safety-and-platform-types)) provide null-safety support in a generic way, without having to hard-code support for Spring annotations.
To enable runtime checking of nullability constraints for query methods, you need to activate non-nullability on the package level by using Spring’s `@NonNullApi` in `package-info.java`, as shown in the following example:

#### Declaring Non-nullability in `package-info.java`

```java

```

Once non-null defaulting is in place, repository query method invocations get validated at runtime for nullability constraints.
If a query result violates the defined constraint, an exception is thrown.
This happens when the method would return `null` but is declared as non-nullable (the default with the annotation defined on the package in which the repository resides).
If you want to opt-in to nullable results again, selectively use `@Nullable` on individual methods.
Using the result wrapper types mentioned at the start of this section continues to work as expected: an empty result is translated into the value that represents absence.

The following example shows a number of the techniques just described:

#### Using different nullability constraints

```java
package com.acme;                                                       <1>

import org.springframework.lang.Nullable;

interface UserRepository extends Repository<User, Long> {

  User getByEmailAddress(EmailAddress emailAddress);                    <2>

  @Nullable
  User findByEmailAddress(@Nullable EmailAddress emailAdress);          <3>

  Optional<User> findOptionalByEmailAddress(EmailAddress emailAddress); <4>
}
```

1. The repository resides in a package (or sub-package) for which we have defined non-null behavior.
1. Throws an `EmptyResultDataAccessException` when the query does not produce a result.
Throws an `IllegalArgumentException` when the `emailAddress` handed to the method is `null`.
1. Returns `null` when the query does not produce a result.
Also accepts `null` as the value for `emailAddress`.
1. Returns `Optional.empty()` when the query does not produce a result.
Throws an `IllegalArgumentException` when the `emailAddress` handed to the method is `null`.

<a id="repositories.nullability.kotlin"></a>

## Nullability in Kotlin-based Repositories

Kotlin has the definition of [nullability constraints](https://kotlinlang.org/docs/reference/null-safety.html) baked into the language.
Kotlin code compiles to bytecode, which does not express nullability constraints through method signatures but rather through compiled-in metadata.
Make sure to include the `kotlin-reflect` JAR in your project to enable introspection of Kotlin’s nullability constraints.
Spring Data repositories use the language mechanism to define those constraints to apply the same runtime checks, as follows:

#### Using nullability constraints on Kotlin repositories

```kotlin
interface UserRepository : Repository<User, String> {

  fun findByUsername(username: String): User     <1>

  fun findByFirstname(firstname: String?): User? <2>
}
```

1. The method defines both the parameter and the result as non-nullable (the Kotlin default).
The Kotlin compiler rejects method invocations that pass `null` to the method.
If the query yields an empty result, an `EmptyResultDataAccessException` is thrown.
1. This method accepts `null` for the `firstname` parameter and returns `null` if the query does not produce a result.
