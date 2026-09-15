---
title: "`@TestExecutionListeners`"
source: "ROOT:testing/annotations/integration-spring/annotation-testexecutionlisteners.adoc"
---

<a id="spring-testing-annotation-testexecutionlisteners"></a>

# `@TestExecutionListeners`

`@TestExecutionListeners` is used to register listeners for the annotated test class, its
subclasses, and its nested classes. If you wish to register a listener globally, you
should register it via the automatic discovery mechanism described in
[`TestExecutionListener` Configuration](../../testcontext-framework/tel-config.md).

The following example shows how to register two `TestExecutionListener` implementations:

#### Java

```java
@ContextConfiguration
@TestExecutionListeners({CustomTestExecutionListener.class, AnotherTestExecutionListener.class}) // <1>
class CustomTestExecutionListenerTests {
	// class body...
}
```

1. Register two `TestExecutionListener` implementations.

#### Kotlin

```kotlin
@ContextConfiguration
@TestExecutionListeners(CustomTestExecutionListener::class, AnotherTestExecutionListener::class) // <1>
class CustomTestExecutionListenerTests {
	// class body...
}
```

1. Register two `TestExecutionListener` implementations.

By default, `@TestExecutionListeners` provides support for inheriting listeners from
superclasses or enclosing classes. See
[`@Nested` test class configuration](../../testcontext-framework/support-classes.md#testcontext-junit-jupiter-nested-test-configuration) and the
[`@TestExecutionListeners`
javadoc](https://docs.spring.io/spring-framework/docs/6.2.6/javadoc-api/org/springframework/test/context/TestExecutionListeners.html) for an example and further details. If you discover that you need to switch
back to using the default `TestExecutionListener` implementations, see the note
in [Registering `TestExecutionListener` Implementations](../../testcontext-framework/tel-config.md#testcontext-tel-config-registering-tels).
