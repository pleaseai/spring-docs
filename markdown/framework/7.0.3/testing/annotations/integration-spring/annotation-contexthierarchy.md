---
title: "`@ContextHierarchy`"
source: "ROOT:testing/annotations/integration-spring/annotation-contexthierarchy.adoc"
---

<a id="spring-testing-annotation-contexthierarchy"></a>

# `@ContextHierarchy`

`@ContextHierarchy` is an annotation that can be applied to a test class to define a
hierarchy of `ApplicationContext` instances for integration tests. `@ContextHierarchy`
should be declared with a list of one or more `@ContextConfiguration` instances, each of
which defines a level in the context hierarchy. The following examples demonstrate the
use of `@ContextHierarchy` within a single test class (`@ContextHierarchy` can also be
used within a test class hierarchy):

#### Java

```java
@ContextHierarchy({
	@ContextConfiguration("/parent-config.xml"),
	@ContextConfiguration("/child-config.xml")
})
class ContextHierarchyTests {
	// class body...
}
```

#### Kotlin

```kotlin
@ContextHierarchy(
	ContextConfiguration("/parent-config.xml"),
	ContextConfiguration("/child-config.xml"))
class ContextHierarchyTests {
	// class body...
}
```

#### Java

```java
@WebAppConfiguration
@ContextHierarchy({
	@ContextConfiguration(classes = AppConfig.class),
	@ContextConfiguration(classes = WebConfig.class)
})
class WebIntegrationTests {
	// class body...
}
```

#### Kotlin

```kotlin
@WebAppConfiguration
@ContextHierarchy(
		ContextConfiguration(classes = [AppConfig::class]),
		ContextConfiguration(classes = [WebConfig::class]))
class WebIntegrationTests {
	// class body...
}
```

If you need to merge or override the configuration for a given level of the context
hierarchy within a test class hierarchy, you must explicitly name that level by supplying
the same value to the `name` attribute in `@ContextConfiguration` at each corresponding
level in the class hierarchy. See [Context Hierarchies](../../testcontext-framework/ctx-management/hierarchies.md)
and the [`@ContextHierarchy`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/test/context/ContextHierarchy.html) javadoc
for further examples.
