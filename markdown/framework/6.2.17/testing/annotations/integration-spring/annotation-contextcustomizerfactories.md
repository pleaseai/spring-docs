---
title: "`@ContextCustomizerFactories`"
source: "ROOT:testing/annotations/integration-spring/annotation-contextcustomizerfactories.adoc"
---

<a id="spring-testing-annotation-contextcustomizerfactories"></a>

# `@ContextCustomizerFactories`

`@ContextCustomizerFactories` is an annotation that can be applied to a test class to
register `ContextCustomizerFactory` implementations for the particular test class, its
subclasses, and its nested classes. If you wish to register a factory globally, you
should register it via the automatic discovery mechanism described in
[`ContextCustomizerFactory` Configuration](../../testcontext-framework/ctx-management/context-customizers.md).

The following example shows how to register two `ContextCustomizerFactory` implementations:

#### Java

```java
@ContextConfiguration
@ContextCustomizerFactories({CustomContextCustomizerFactory.class, AnotherContextCustomizerFactory.class}) // <1>
class CustomContextCustomizerFactoryTests {
	// class body...
}
```

1. Register two `ContextCustomizerFactory` implementations.

#### Kotlin

```kotlin
@ContextConfiguration
@ContextCustomizerFactories([CustomContextCustomizerFactory::class, AnotherContextCustomizerFactory::class]) // <1>
class CustomContextCustomizerFactoryTests {
	// class body...
}
```

1. Register two `ContextCustomizerFactory` implementations.

By default, `@ContextCustomizerFactories` provides support for inheriting factories from
superclasses or enclosing classes. See
[`@Nested` test class configuration](../../testcontext-framework/support-classes.md#testcontext-junit-jupiter-nested-test-configuration)
and the [`@ContextCustomizerFactories` javadoc](https://docs.spring.io/spring-framework/docs/6.2.17/javadoc-api/org/springframework/test/context/ContextCustomizerFactories.html)
for an example and further details.
