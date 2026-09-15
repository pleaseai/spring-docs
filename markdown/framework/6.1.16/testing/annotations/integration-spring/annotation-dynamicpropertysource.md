---
title: "`@DynamicPropertySource`"
source: "ROOT:testing/annotations/integration-spring/annotation-dynamicpropertysource.adoc"
---

<a id="spring-testing-annotation-dynamicpropertysource"></a>

# `@DynamicPropertySource`

`@DynamicPropertySource` is a method-level annotation that you can use to register
*dynamic* properties to be added to the set of `PropertySources` in the `Environment` for
an `ApplicationContext` loaded for an integration test. Dynamic properties are useful
when you do not know the value of the properties upfront – for example, if the properties
are managed by an external resource such as for a container managed by the
[Testcontainers](https://www.testcontainers.org) project.

The following example demonstrates how to register a dynamic property:

#### Java

```java
@ContextConfiguration
class MyIntegrationTests {

	static MyExternalServer server = // ...

	@DynamicPropertySource // <1>
	static void dynamicProperties(DynamicPropertyRegistry registry) { // <2>
		registry.add("server.port", server::getPort); // <3>
	}

	// tests ...
}
```

1. Annotate a `static` method with `@DynamicPropertySource`.
1. Accept a `DynamicPropertyRegistry` as an argument.
1. Register a dynamic `server.port` property to be retrieved lazily from the server.

#### Kotlin

```kotlin
@ContextConfiguration
class MyIntegrationTests {

	companion object {

		@JvmStatic
		val server: MyExternalServer = // ...

		@DynamicPropertySource // <1>
		@JvmStatic
		fun dynamicProperties(registry: DynamicPropertyRegistry) { // <2>
			registry.add("server.port", server::getPort) // <3>
		}
	}

	// tests ...
}
```

1. Annotate a `static` method with `@DynamicPropertySource`.
1. Accept a `DynamicPropertyRegistry` as an argument.
1. Register a dynamic `server.port` property to be retrieved lazily from the server.

See [Context Configuration with Dynamic Property Sources](../../testcontext-framework/ctx-management/dynamic-property-sources.md) for further details.
