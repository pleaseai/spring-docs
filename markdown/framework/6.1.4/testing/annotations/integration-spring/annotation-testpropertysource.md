---
title: "`@TestPropertySource`"
source: "ROOT:testing/annotations/integration-spring/annotation-testpropertysource.adoc"
---

<a id="spring-testing-annotation-testpropertysource"></a>

# `@TestPropertySource`

`@TestPropertySource` is a class-level annotation that you can use to configure the
locations of properties files and inlined properties to be added to the set of
`PropertySources` in the `Environment` for an `ApplicationContext` loaded for an
integration test.

The following example demonstrates how to declare a properties file from the classpath:

#### Java

```java
@ContextConfiguration
@TestPropertySource("/test.properties") // <1>
class MyIntegrationTests {
	// class body...
}
```

1. Get properties from `test.properties` in the root of the classpath.

#### Kotlin

```kotlin
@ContextConfiguration
@TestPropertySource("/test.properties") // <1>
class MyIntegrationTests {
	// class body...
}
```

1. Get properties from `test.properties` in the root of the classpath.

The following example demonstrates how to declare inlined properties:

#### Java

```java
@ContextConfiguration
@TestPropertySource(properties = { "timezone = GMT", "port: 4242" }) // <1>
class MyIntegrationTests {
	// class body...
}
```

1. Declare `timezone` and `port` properties.

#### Kotlin

```kotlin
@ContextConfiguration
@TestPropertySource(properties = ["timezone = GMT", "port: 4242"]) // <1>
class MyIntegrationTests {
	// class body...
}
```

1. Declare `timezone` and `port` properties.

See [Context Configuration with Test Property Sources](../../testcontext-framework/ctx-management/property-sources.md) for examples and further details.
