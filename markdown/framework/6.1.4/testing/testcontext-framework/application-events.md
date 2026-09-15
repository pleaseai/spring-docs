---
title: "Application Events"
source: "ROOT:testing/testcontext-framework/application-events.adoc"
---

<a id="testcontext-application-events"></a>

# Application Events

Since Spring Framework 5.3.3, the TestContext framework provides support for recording
[application events](../../core/beans/context-introduction.md#context-functionality-events) published in the
`ApplicationContext` so that assertions can be performed against those events within
tests. All events published during the execution of a single test are made available via
the `ApplicationEvents` API which allows you to process the events as a
`java.util.Stream`.

To use `ApplicationEvents` in your tests, do the following.

- Ensure that your test class is annotated or meta-annotated with
[`@RecordApplicationEvents`](../annotations/integration-spring/annotation-recordapplicationevents.md).
- Ensure that the `ApplicationEventsTestExecutionListener` is registered. Note, however,
that `ApplicationEventsTestExecutionListener` is registered by default and only needs
to be manually registered if you have custom configuration via
`@TestExecutionListeners` that does not include the default listeners.
- Annotate a field of type `ApplicationEvents` with `@Autowired` and use that instance of
`ApplicationEvents` in your test and lifecycle methods (such as `@BeforeEach` and
`@AfterEach` methods in JUnit Jupiter).

  - When using the [SpringExtension for JUnit Jupiter](support-classes.md#testcontext-junit-jupiter-extension), you may declare a method
  parameter of type `ApplicationEvents` in a test or lifecycle method as an alternative
  to an `@Autowired` field in the test class.

The following test class uses the `SpringExtension` for JUnit Jupiter and
[AssertJ](https://assertj.github.io/doc) to assert the types of application events
published while invoking a method in a Spring-managed component:

#### Java

```java
@SpringJUnitConfig(/* ... */)
@RecordApplicationEvents // <1>
class OrderServiceTests {

	@Autowired
	OrderService orderService;

	@Autowired
	ApplicationEvents events; // <2>

	@Test
	void submitOrder() {
		// Invoke method in OrderService that publishes an event
		orderService.submitOrder(new Order(/* ... */));
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

	@Autowired
	lateinit var orderService: OrderService

	@Autowired
	lateinit var events: ApplicationEvents // <2>

	@Test
	fun submitOrder() {
		// Invoke method in OrderService that publishes an event
		orderService.submitOrder(Order(/* ... */))
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
javadoc](https://docs.spring.io/spring-framework/docs/6.1.4/javadoc-api/org/springframework/test/context/event/ApplicationEvents.html) for further details regarding the `ApplicationEvents` API.
