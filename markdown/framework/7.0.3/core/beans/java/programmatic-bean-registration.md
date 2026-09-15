---
title: "Programmatic Bean Registration"
source: "ROOT:core/beans/java/programmatic-bean-registration.adoc"
---

<a id="beans-java-programmatic-registration"></a>

# Programmatic Bean Registration

As of Spring Framework 7, a first-class support for programmatic bean registration is
provided via the [`BeanRegistrar`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/beans/factory/BeanRegistrar.html)
interface that can be implemented to register beans programmatically in a flexible and
efficient way.

Those bean registrar implementations are typically imported with an `@Import` annotation
on `@Configuration` classes.

#### Java

```java
@Configuration
@Import(MyBeanRegistrar.class)
class MyConfiguration {
}
```

#### Kotlin

```kotlin
@Configuration
@Import(MyBeanRegistrar::class)
class MyConfiguration {
}
```

> [!NOTE]
> You can leverage type-level conditional annotations ([`@Conditional`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/context/annotation/Conditional.html),
> but also other variants) to conditionally import the related bean registrars.

The bean registrar implementation uses [`BeanRegistry`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/beans/factory/BeanRegistry.html) and
[`Environment`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/core/env/Environment.html) APIs to register beans programmatically in a concise
and flexible way. For example, it allows custom registration through an `if` expression, a
`for` loop, etc.

#### Java

```java
class MyBeanRegistrar implements BeanRegistrar {

	@Override
	public void register(BeanRegistry registry, Environment env) {
		registry.registerBean("foo", Foo.class);
		registry.registerBean("bar", Bar.class, spec -> spec
				.prototype()
				.lazyInit()
				.description("Custom description")
				.supplier(context -> new Bar(context.bean(Foo.class))));
		if (env.matchesProfiles("baz")) {
			registry.registerBean(Baz.class, spec -> spec
					.supplier(context -> new Baz("Hello World!")));
		}
		registry.registerBean(MyRepository.class);
		registry.registerBean(RouterFunction.class, spec ->
				spec.supplier(context -> router(context.bean(MyRepository.class))));
	}

	RouterFunction<ServerResponse> router(MyRepository myRepository) {
		return RouterFunctions.route()
				// ...
				.build();
	}

}
```

#### Kotlin

```kotlin
class MyBeanRegistrar : BeanRegistrarDsl({
	registerBean<Foo>()
	registerBean(
		name = "bar",
		prototype = true,
		lazyInit = true,
		description = "Custom description") {
		Bar(bean<Foo>()) // Also possible with Bar(bean())
	}
	profile("baz") {
		registerBean { Baz("Hello World!") }
	}
	registerBean<MyRepository>()
	registerBean {
		myRouter(bean<MyRepository>()) // Also possible with myRouter(bean())
	}
})

fun myRouter(myRepository: MyRepository) = router {
	// ...
}
```

> [!NOTE]
> Bean registrars are supported with [Ahead of Time Optimizations](../../aot.md),
> either on the JVM or with GraalVM native images, including when instance suppliers are used.
