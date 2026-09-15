---
title: "Context Configuration with Component Classes"
source: "ROOT:testing/testcontext-framework/ctx-management/javaconfig.adoc"
---

<a id="testcontext-ctx-management-javaconfig"></a>

# Context Configuration with Component Classes

To load an `ApplicationContext` for your tests by using component classes (see
[Java-based container configuration](../../../core/beans/java.md)), you can annotate your test
class with `@ContextConfiguration` and configure the `classes` attribute with an array
that contains references to component classes. The following example shows how to do so:

#### Java

```java
@ExtendWith(SpringExtension.class)
// ApplicationContext will be loaded from AppConfig and TestConfig
@ContextConfiguration(classes = {AppConfig.class, TestConfig.class}) // <1>
class MyTest {
	// class body...
}
```

1. Specifying component classes.

#### Kotlin

```kotlin
@ExtendWith(SpringExtension::class)
// ApplicationContext will be loaded from AppConfig and TestConfig
@ContextConfiguration(classes = [AppConfig::class, TestConfig::class]) // <1>
class MyTest {
	// class body...
}
```

1. Specifying component classes.

<a id="testcontext-ctx-management-javaconfig-component-classes"></a>

> [!TIP]
> The term “component class” can refer to any of the following:
>
> - A class annotated with `@Configuration`.
> - A component (that is, a class annotated with `@Component`, `@Service`, `@Repository`, or other stereotype annotations).
> - A JSR-330 compliant class that is annotated with `jakarta.inject` annotations.
> - Any class that contains `@Bean`-methods.
> - Any other class that is intended to be registered as a Spring component (i.e., a Spring
> bean in the `ApplicationContext`), potentially taking advantage of automatic autowiring
> of a single constructor without the use of Spring annotations.
>
> See the javadoc of
> [`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.16/javadoc-api/org/springframework/context/annotation/Configuration.html) and
> [`@Bean`](https://docs.spring.io/spring-framework/docs/6.1.16/javadoc-api/org/springframework/context/annotation/Bean.html) for further information
> regarding the configuration and semantics of component classes, paying special attention
> to the discussion of `@Bean` Lite Mode.

If you omit the `classes` attribute from the `@ContextConfiguration` annotation, the
TestContext framework tries to detect the presence of default configuration classes.
Specifically, `AnnotationConfigContextLoader` and `AnnotationConfigWebContextLoader`
detect all `static` nested classes of the test class that meet the requirements for
configuration class implementations, as specified in the
[`@Configuration`](https://docs.spring.io/spring-framework/docs/6.1.16/javadoc-api/org/springframework/context/annotation/Configuration.html) javadoc.
Note that the name of the configuration class is arbitrary. In addition, a test class can
contain more than one `static` nested configuration class if desired. In the following
example, the `OrderServiceTest` class declares a `static` nested configuration class
named `Config` that is automatically used to load the `ApplicationContext` for the test
class:

#### Java

```java
@SpringJUnitConfig <1>
// ApplicationContext will be loaded from the static nested Config class
class OrderServiceTest {

	@Configuration
	static class Config {

		// this bean will be injected into the OrderServiceTest class
		@Bean
		OrderService orderService() {
			OrderService orderService = new OrderServiceImpl();
			// set properties, etc.
			return orderService;
		}
	}

	@Autowired
	OrderService orderService;

	@Test
	void testOrderService() {
		// test the orderService
	}

}
```

1. Loading configuration information from the nested `Config` class.

#### Kotlin

```kotlin
@SpringJUnitConfig <1>
// ApplicationContext will be loaded from the nested Config class
class OrderServiceTest {

	@Autowired
	lateinit var orderService: OrderService

	@Configuration
	class Config {

		// this bean will be injected into the OrderServiceTest class
		@Bean
		fun orderService(): OrderService {
			// set properties, etc.
			return OrderServiceImpl()
		}
	}

	@Test
	fun testOrderService() {
		// test the orderService
	}
}
```

1. Loading configuration information from the nested `Config` class.
