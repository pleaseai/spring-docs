---
title: "Application Events"
source: "ROOT:testing/testcontext-framework/application-events.adoc"
---

<a id="testcontext-application-events"></a>

# Application Events

The TestContext framework provides support for recording
[application events](../../core/beans/context-introduction.md#context-functionality-events)
published in the `ApplicationContext` so that assertions can be performed against those
events within tests. All events published during the execution of a single test are made
available via the `ApplicationEvents` API which allows you to process the events as a
`java.util.Stream`.

To use `ApplicationEvents` in your tests, do the following.

- Ensure that your test class is annotated or meta-annotated with
[`@RecordApplicationEvents`](../annotations/integration-spring/annotation-recordapplicationevents.md).
- Ensure that the `ApplicationEventsTestExecutionListener` is registered. Note, however,
that `ApplicationEventsTestExecutionListener` is registered by default and only needs
to be manually registered if you have custom configuration via
`@TestExecutionListeners` that does not include the default listeners.
- When using the
[SpringExtension for JUnit Jupiter](support-classes.md#testcontext-junit-jupiter-extension),
declare a method parameter of type `ApplicationEvents` in a `@Test`, `@BeforeEach`, or
`@AfterEach` method.

  - Since `ApplicationEvents` is scoped to the lifecycle of the current test method, this
  is the recommended approach.
- Alternatively, you can annotate a field of type `ApplicationEvents` with `@Autowired`
and use that instance of `ApplicationEvents` in your test and lifecycle methods.

> [!NOTE]
> `ApplicationEvents` is registered with the `ApplicationContext` as a *resolvable
> dependency* which is scoped to the lifecycle of the current test method. Consequently,
> `ApplicationEvents` cannot be accessed outside the lifecycle of a test method and cannot be
> `@Autowired` into the constructor of a test class.

The following test class uses the `SpringExtension` for JUnit Jupiter and
[AssertJ](https://assertj.github.io/doc) to assert the types of application events published while
invoking a method in a Spring-managed component:

#### Java

```java
@SpringJUnitConfig(/* ... */)
@RecordApplicationEvents // <1>
class OrderServiceTests {

	@Test
	void submitOrder(@Autowired OrderService service, ApplicationEvents events) { // <2>
		// Invoke method in OrderService that publishes an event
		service.submitOrder(new Order(/* ... */));
		// Verify that an OrderSubmitted event was published
		long numEvents = events.stream(OrderSubmitted.class).count(); // <3>
		assertThat(numEvents).isEqualTo(1);
	}
}
```

1. Annotate the test class with `@RecordApplicationEvents`.
1. Inject the `ApplicationEvents` instance for the current test.
1. Use the `ApplicationEvents` API to count how many `OrderSubmitted` events were published.

#### Kotlin

```kotlin
@SpringJUnitConfig(/* ... */)
@RecordApplicationEvents // <1>
class OrderServiceTests {

	@Test
	fun submitOrder(@Autowired service: OrderService, events: ApplicationEvents) { // <2>
		// Invoke method in OrderService that publishes an event
		service.submitOrder(Order(/* ... */))
		// Verify that an OrderSubmitted event was published
		val numEvents = events.stream(OrderSubmitted::class).count() // <3>
		assertThat(numEvents).isEqualTo(1)
	}
}
```

1. Annotate the test class with `@RecordApplicationEvents`.
1. Inject the `ApplicationEvents` instance for the current test.
1. Use the `ApplicationEvents` API to count how many `OrderSubmitted` events were published.

See the
[`ApplicationEvents`
javadoc](https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/test/context/event/ApplicationEvents.html) for further details regarding the `ApplicationEvents` API.
