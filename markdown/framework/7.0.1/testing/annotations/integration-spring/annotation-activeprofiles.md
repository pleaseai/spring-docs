---
title: "`@ActiveProfiles`"
source: "ROOT:testing/annotations/integration-spring/annotation-activeprofiles.adoc"
---

<a id="spring-testing-annotation-activeprofiles"></a>

# `@ActiveProfiles`

`@ActiveProfiles` is an annotation that can be applied to a test class to declare which
bean definition profiles should be active when loading an `ApplicationContext` for an
integration test.

The following example indicates that the `dev` profile should be active:

#### Java

```java
@ContextConfiguration
@ActiveProfiles("dev") // <1>
class DeveloperTests {
	// class body...
}
```

1. Indicate that the `dev` profile should be active.

#### Kotlin

```kotlin
@ContextConfiguration
@ActiveProfiles("dev") // <1>
class DeveloperTests {
	// class body...
}
```

1. Indicate that the `dev` profile should be active.

The following example indicates that both the `dev` and the `integration` profiles should
be active:

#### Java

```java
@ContextConfiguration
@ActiveProfiles({"dev", "integration"}) // <1>
class DeveloperIntegrationTests {
	// class body...
}
```

1. Indicate that the `dev` and `integration` profiles should be active.

#### Kotlin

```kotlin
@ContextConfiguration
@ActiveProfiles(["dev", "integration"]) // <1>
class DeveloperIntegrationTests {
	// class body...
}
```

1. Indicate that the `dev` and `integration` profiles should be active.

> [!NOTE]
> `@ActiveProfiles` provides support for inheriting active bean definition profiles
> declared by superclasses and enclosing classes by default. You can also resolve active
> bean definition profiles programmatically by implementing a custom
> [`ActiveProfilesResolver`](../../testcontext-framework/ctx-management/env-profiles.md#testcontext-ctx-management-env-profiles-ActiveProfilesResolver)
> and registering it by using the `resolver` attribute of `@ActiveProfiles`.

See [Context Configuration with Environment Profiles](../../testcontext-framework/ctx-management/env-profiles.md),
[`@Nested` test class configuration](../../testcontext-framework/support-classes.md#testcontext-junit-jupiter-nested-test-configuration), and the
[`@ActiveProfiles`](https://docs.spring.io/spring-framework/docs/7.0.1/javadoc-api/org/springframework/test/context/ActiveProfiles.html) javadoc for
examples and further details.
