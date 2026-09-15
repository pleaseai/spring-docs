---
title: "Context Configuration with Dynamic Property Sources"
source: "ROOT:testing/testcontext-framework/ctx-management/dynamic-property-sources.adoc"
---

<a id="testcontext-ctx-management-dynamic-property-sources"></a>

# Context Configuration with Dynamic Property Sources

As of Spring Framework 5.2.5, the TestContext framework provides support for *dynamic*
properties via the `@DynamicPropertySource` annotation. This annotation can be used in
integration tests that need to add properties with dynamic values to the set of
`PropertySources` in the `Environment` for the `ApplicationContext` loaded for the
integration test.

> [!NOTE]
> The `@DynamicPropertySource` annotation and its supporting infrastructure were
> originally designed to allow properties from
> [Testcontainers](https://www.testcontainers.org) based tests to be exposed easily to
> Spring integration tests. However, this feature may also be used with any form of
> external resource whose lifecycle is maintained outside the test’s `ApplicationContext`.

In contrast to the [`@TestPropertySource`](property-sources.md)
annotation that is applied at the class level, `@DynamicPropertySource` must be applied
to a `static` method that accepts a single `DynamicPropertyRegistry` argument which is
used to add *name-value* pairs to the `Environment`. Values are dynamic and provided via
a `Supplier` which is only invoked when the property is resolved. Typically, method
references are used to supply values, as can be seen in the following example which uses
the Testcontainers project to manage a Redis container outside of the Spring
`ApplicationContext`. The IP address and port of the managed Redis container are made
available to components within the test’s `ApplicationContext` via the `redis.host` and
`redis.port` properties. These properties can be accessed via Spring’s `Environment`
abstraction or injected directly into Spring-managed components – for example, via
`@Value("${redis.host}")` and `@Value("${redis.port}")`, respectively.

> [!TIP]
> If you use `@DynamicPropertySource` in a base class and discover that tests in subclasses
> fail because the dynamic properties change between subclasses, you may need to annotate
> your base class with [`@DirtiesContext`](../../annotations/integration-spring/annotation-dirtiescontext.md) to
> ensure that each subclass gets its own `ApplicationContext` with the correct dynamic
> properties.

#### Java

```java
@SpringJUnitConfig(/* ... */)
@Testcontainers
class ExampleIntegrationTests {

	@Container
	static GenericContainer redis =
		new GenericContainer("redis:5.0.3-alpine").withExposedPorts(6379);

	@DynamicPropertySource
	static void redisProperties(DynamicPropertyRegistry registry) {
		registry.add("redis.host", redis::getHost);
		registry.add("redis.port", redis::getFirstMappedPort);
	}

	// tests ...

}
```

#### Kotlin

```kotlin
@SpringJUnitConfig(/* ... */)
@Testcontainers
class ExampleIntegrationTests {

	companion object {

		@Container
		@JvmStatic
		val redis: GenericContainer =
			GenericContainer("redis:5.0.3-alpine").withExposedPorts(6379)

		@DynamicPropertySource
		@JvmStatic
		fun redisProperties(registry: DynamicPropertyRegistry) {
			registry.add("redis.host", redis::getHost)
			registry.add("redis.port", redis::getFirstMappedPort)
		}
	}

	// tests ...

}
```

<a id="precedence"></a>

## Precedence

Dynamic properties have higher precedence than those loaded from `@TestPropertySource`,
the operating system’s environment, Java system properties, or property sources added by
the application declaratively by using `@PropertySource` or programmatically. Thus,
dynamic properties can be used to selectively override properties loaded via
`@TestPropertySource`, system property sources, and application property sources.
