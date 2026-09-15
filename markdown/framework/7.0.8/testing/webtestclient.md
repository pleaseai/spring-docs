---
title: "WebTestClient"
source: "ROOT:testing/webtestclient.adoc"
---

<a id="webtestclient"></a>

# WebTestClient

`WebTestClient` is an HTTP client designed for testing server applications. It wraps
Spring’s [WebClient](../web/webflux-webclient.md) and uses it to perform requests
but exposes a testing facade for verifying responses. `WebTestClient` can be used to
perform end-to-end HTTP tests. It can also be used to test Spring MVC and Spring WebFlux
applications without a running server via mock server request and response objects.

<a id="webtestclient-setup"></a>

## Setup

To set up a `WebTestClient` you need to choose a server setup to bind to. This can be one
of several mock server setup choices or a connection to a live server.

<a id="webtestclient-controller-config"></a>

### Bind to Controller

This setup allows you to test specific controller(s) via mock request and response objects,
without a running server.

For WebFlux applications, use the following which loads infrastructure equivalent to the
[WebFlux Java config](../web/webflux/dispatcher-handler.md#webflux-framework-config), registers the given
controller(s), and creates a [WebHandler chain](../web/webflux/reactive-spring.md#webflux-web-handler-api)
to handle requests:

#### Java

```java
WebTestClient client =
		WebTestClient.bindToController(new TestController()).build();
```

#### Kotlin

```kotlin
val client = WebTestClient.bindToController(TestController()).build()
```

For Spring MVC, use the following which delegates to the
[StandaloneMockMvcBuilder](https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/test/web/servlet/setup/StandaloneMockMvcBuilder.html)
to load infrastructure equivalent to the [WebMvc Java config](../web/webmvc/mvc-config.md),
registers the given controller(s), and creates an instance of
[MockMvc](mockmvc.md) to handle requests:

#### Java

```java
WebTestClient client =
		MockMvcWebTestClient.bindToController(new TestController()).build();
```

#### Kotlin

```kotlin
val client = MockMvcWebTestClient.bindToController(TestController()).build()
```

<a id="webtestclient-context-config"></a>

### Bind to `ApplicationContext`

This setup allows you to load Spring configuration with Spring MVC or Spring WebFlux
infrastructure and controller declarations and use it to handle requests via mock request
and response objects, without a running server.

For WebFlux, use the following where the Spring `ApplicationContext` is passed to
[WebHttpHandlerBuilder](<https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/web/server/adapter/WebHttpHandlerBuilder.html#applicationContext(org.springframework.context.ApplicationContext)>)
to create the [WebHandler chain](../web/webflux/reactive-spring.md#webflux-web-handler-api) to handle
requests:

#### Java

```java
@SpringJUnitConfig(WebConfig.class) // <1>
class MyTests {

	WebTestClient client;

	@BeforeEach
	void setUp(ApplicationContext context) {  // <2>
		client = WebTestClient.bindToApplicationContext(context).build(); // <3>
	}
}
```

1. Specify the configuration to load
1. Inject the configuration
1. Create the `WebTestClient`

#### Kotlin

```kotlin
@SpringJUnitConfig(WebConfig::class) // <1>
class MyTests {

	lateinit var client: WebTestClient

	@BeforeEach
	fun setUp(context: ApplicationContext) { // <2>
		client = WebTestClient.bindToApplicationContext(context).build() // <3>
	}
}
```

1. Specify the configuration to load
1. Inject the configuration
1. Create the `WebTestClient`

For Spring MVC, use the following where the Spring `ApplicationContext` is passed to
[MockMvcBuilders.webAppContextSetup](<https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/test/web/servlet/setup/MockMvcBuilders.html#webAppContextSetup(org.springframework.web.context.WebApplicationContext)>)
to create a [MockMvc](mockmvc.md) instance to handle
requests:

#### Java

```java
@ExtendWith(SpringExtension.class)
@WebAppConfiguration("classpath:META-INF/web-resources") // <1>
@ContextHierarchy({
	@ContextConfiguration(classes = RootConfig.class),
	@ContextConfiguration(classes = WebConfig.class)
})
class MyTests {

	@Autowired
	WebApplicationContext wac; // <2>

	WebTestClient client;

	@BeforeEach
	void setUp() {
		client = MockMvcWebTestClient.bindToApplicationContext(this.wac).build(); // <3>
	}
}
```

1. Specify the configuration to load
1. Inject the configuration
1. Create the `WebTestClient`

#### Kotlin

```kotlin
@ExtendWith(SpringExtension.class)
@WebAppConfiguration("classpath:META-INF/web-resources") // <1>
@ContextHierarchy({
	@ContextConfiguration(classes = RootConfig.class),
	@ContextConfiguration(classes = WebConfig.class)
})
class MyTests {

	@Autowired
	lateinit var wac: WebApplicationContext; // <2>

	lateinit var client: WebTestClient

	@BeforeEach
	fun setUp() { // <2>
		client = MockMvcWebTestClient.bindToApplicationContext(wac).build() // <3>
	}
}
```

1. Specify the configuration to load
1. Inject the configuration
1. Create the `WebTestClient`

<a id="webtestclient-fn-config"></a>

### Bind to Router Function

This setup allows you to test [functional endpoints](../web/webflux-functional.md) via
mock request and response objects, without a running server.

For WebFlux, use the following which delegates to `RouterFunctions.toWebHandler` to
create a server setup to handle requests:

#### Java

```java
RouterFunction<?> route = ...
client = WebTestClient.bindToRouterFunction(route).build();
```

#### Kotlin

```kotlin
val route: RouterFunction<*> = ...
val client = WebTestClient.bindToRouterFunction(route).build()
```

For Spring MVC there are currently no options to test
[WebMvc functional endpoints](../web/webmvc-functional.md).

<a id="webtestclient-server-config"></a>

### Bind to Server

This setup connects to a running server to perform full, end-to-end HTTP tests:

#### Java

```java
client = WebTestClient.bindToServer().baseUrl("http://localhost:8080").build();
```

#### Kotlin

```kotlin
client = WebTestClient.bindToServer().baseUrl("http://localhost:8080").build()
```

<a id="webtestclient-client-config"></a>

### Client Config

In addition to the server setup options described earlier, you can also configure client
options, including base URL, default headers, client filters, and others. These options
are readily available following `bindToServer()`. For all other configuration options,
you need to use `configureClient()` to transition from server to client configuration, as
follows:

#### Java

```java
client = WebTestClient.bindToController(new TestController())
		.configureClient()
		.baseUrl("/test")
		.apiVersionInserter(ApiVersionInserter.fromHeader("API-Version").build())
		.build();
```

#### Kotlin

```kotlin
client = WebTestClient.bindToController(TestController())
		.configureClient()
		.baseUrl("/test")
		.apiVersionInserter(ApiVersionInserter.fromHeader("API-Version").build())
		.build()
```

<a id="webtestclient-tests"></a>

## Writing Tests

[WebClient](../web/webflux-webclient.md) and `WebTestClient` have
the same API up to the point of the call to `exchange()`. After that, `WebTestClient`
provides two alternative ways to verify the response:

1. [Built-in Assertions](#webtestclient-workflow) extend the request workflow with a chain of expectations
1. [AssertJ Integration](#webtestclient-assertj) to verify the response via `assertThat()` statements

> [!TIP]
> See the [WebClient](../web/webflux-webclient/client-body.md) documentation for
> examples on how to prepare a request with any content including form data,
> multipart data, and more.

<a id="webtestclient-workflow"></a>

### Built-in Assertions

To assert the response status and headers, use the following:

#### Java

```java
client.get().uri("/persons/1")
	.accept(MediaType.APPLICATION_JSON)
	.exchange()
	.expectStatus().isOk()
	.expectHeader().contentType(MediaType.APPLICATION_JSON);
```

#### Kotlin

```kotlin
client.get().uri("/persons/1")
	.accept(MediaType.APPLICATION_JSON)
	.exchange()
	.expectStatus().isOk()
	.expectHeader().contentType(MediaType.APPLICATION_JSON)
```

If you would like for all expectations to be asserted even if one of them fails, you can
use `expectAll(..)` instead of multiple chained `expect*(..)` calls. This feature is
similar to the *soft assertions* support in AssertJ and the `assertAll()` support in
JUnit Jupiter.

#### Java

```java
client.get().uri("/persons/1")
	.accept(MediaType.APPLICATION_JSON)
	.exchange()
	.expectAll(
		spec -> spec.expectStatus().isOk(),
		spec -> spec.expectHeader().contentType(MediaType.APPLICATION_JSON)
	);
```

#### Kotlin

```kotlin
client.get().uri("/persons/1")
	.accept(MediaType.APPLICATION_JSON)
	.exchange()
	.expectAll(
		{ spec -> spec.expectStatus().isOk() },
		{ spec -> spec.expectHeader().contentType(MediaType.APPLICATION_JSON) }
	)
```

You can then choose to decode the response body through one of the following:

- `expectBody(Class<T>)`: Decode to single object.
- `expectBodyList(Class<T>)`: Decode and collect objects to `List<T>`.
- `expectBody()`: Decode to `byte[]` for [JSON Content](#webtestclient-json) or an empty body.

And perform assertions on the resulting higher level Object(s):

#### Java

```java
client.get().uri("/persons")
		.exchange()
		.expectStatus().isOk()
		.expectBodyList(Person.class).hasSize(3).contains(person);
```

#### Kotlin

```kotlin
import org.springframework.test.web.reactive.server.expectBodyList

client.get().uri("/persons")
		.exchange()
		.expectStatus().isOk()
		.expectBodyList<Person>().hasSize(3).contains(person)
```

If the built-in assertions are insufficient, you can consume the object instead and
perform any other assertions:

#### Java

```java
import org.springframework.test.web.reactive.server.expectBody

client.get().uri("/persons/1")
		.exchange()
		.expectStatus().isOk()
		.expectBody(Person.class)
		.consumeWith(result -> {
			// custom assertions (for example, AssertJ)...
		});
```

#### Kotlin

```kotlin
client.get().uri("/persons/1")
		.exchange()
		.expectStatus().isOk()
		.expectBody<Person>()
		.consumeWith {
			// custom assertions (for example, AssertJ)...
		}
```

Or you can exit the workflow and obtain an `EntityExchangeResult`:

#### Java

```java
EntityExchangeResult<Person> result = client.get().uri("/persons/1")
		.exchange()
		.expectStatus().isOk()
		.expectBody(Person.class)
		.returnResult();
```

#### Kotlin

```kotlin
import org.springframework.test.web.reactive.server.expectBody

val result = client.get().uri("/persons/1")
		.exchange()
		.expectStatus().isOk
		.expectBody<Person>()
		.returnResult()
```

> [!TIP]
> When you need to decode to a target type with generics, look for the overloaded methods
> that accept
> [`ParameterizedTypeReference`](https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/core/ParameterizedTypeReference.html)
> instead of `Class<T>`.

<a id="webtestclient-no-content"></a>

#### No Content

If the response is not expected to have content, you can assert that as follows:

#### Java

```java
client.post().uri("/persons")
		.body(personMono, Person.class)
		.exchange()
		.expectStatus().isCreated()
		.expectBody().isEmpty();
```

#### Kotlin

```kotlin
client.post().uri("/persons")
		.bodyValue(person)
		.exchange()
		.expectStatus().isCreated()
		.expectBody().isEmpty()
```

If you want to ignore the response content, the following releases the content without
any assertions:

#### Java

```java
client.get().uri("/persons/123")
		.exchange()
		.expectStatus().isNotFound()
		.expectBody(Void.class);
```

#### Kotlin

```kotlin
client.get().uri("/persons/123")
		.exchange()
		.expectStatus().isNotFound
		.expectBody<Unit>()
```

<a id="webtestclient-json"></a>

#### JSON Content

You can use `expectBody()` without a target type to perform assertions on the raw
content rather than through higher level Object(s).

To verify the full JSON content with [JSONAssert](https://jsonassert.skyscreamer.org):

#### Java

```java
client.get().uri("/persons/1")
		.exchange()
		.expectStatus().isOk()
		.expectBody()
		.json("{\"name\":\"Jane\"}")
```

#### Kotlin

```kotlin
client.get().uri("/persons/1")
		.exchange()
		.expectStatus().isOk()
		.expectBody()
		.json("{\"name\":\"Jane\"}")
```

To verify JSON content with [JSONPath](https://github.com/jayway/JsonPath):

#### Java

```java
client.get().uri("/persons")
		.exchange()
		.expectStatus().isOk()
		.expectBody()
		.jsonPath("$[0].name").isEqualTo("Jane")
		.jsonPath("$[1].name").isEqualTo("Jason");
```

#### Kotlin

```kotlin
client.get().uri("/persons")
		.exchange()
		.expectStatus().isOk()
		.expectBody()
		.jsonPath("$[0].name").isEqualTo("Jane")
		.jsonPath("$[1].name").isEqualTo("Jason")
```

<a id="webtestclient-stream"></a>

#### Streaming Responses

To test potentially infinite streams such as `"text/event-stream"` or
`"application/x-ndjson"`, start by verifying the response status and headers, and then
obtain a `FluxExchangeResult`:

#### Java

```java
FluxExchangeResult<MyEvent> result = client.get().uri("/events")
		.accept(TEXT_EVENT_STREAM)
		.exchange()
		.expectStatus().isOk()
		.returnResult(MyEvent.class);

```

#### Kotlin

```kotlin
import org.springframework.test.web.reactive.server.returnResult

val result = client.get().uri("/events")
		.accept(TEXT_EVENT_STREAM)
		.exchange()
		.expectStatus().isOk()
		.returnResult<MyEvent>()
```

Now you’re ready to consume the response stream with `StepVerifier` from `reactor-test`:

#### Java

```java
Flux<Event> eventFlux = result.getResponseBody();

StepVerifier.create(eventFlux)
		.expectNext(person)
		.expectNextCount(4)
		.consumeNextWith(p -> ...)
		.thenCancel()
		.verify();
```

#### Kotlin

```kotlin
val eventFlux = result.getResponseBody()

StepVerifier.create(eventFlux)
		.expectNext(person)
		.expectNextCount(4)
		.consumeNextWith { p -> ... }
		.thenCancel()
		.verify()
```

<a id="webtestclient-assertj"></a>

### AssertJ Integration

`WebTestClientResponse` is the main entry point for the AssertJ integration.
It is an `AssertProvider` that wraps the `ResponseSpec` of an exchange in order to enable
use of `assertThat()` statements. For example:

#### Java

```java
ResponseSpec spec = client.get().uri("/persons").exchange();

WebTestClientResponse response = WebTestClientResponse.from(spec);
assertThat(response).hasStatusOk();
assertThat(response).hasContentTypeCompatibleWith(MediaType.TEXT_PLAIN);
// ...
```

#### Kotlin

```kotlin
val spec = client.get().uri("/persons").exchange()

val response = WebTestClientResponse.from(spec)
assertThat(response).hasStatusOk()
assertThat(response).hasContentTypeCompatibleWith(MediaType.TEXT_PLAIN)
// ...
```

You can also use the built-in workflow first, and then obtain an `ExchangeResult` to wrap
and continue with AssertJ. For example:

#### Java

```java
ExchangeResult result = client.get().uri("/persons").exchange()
		. // ...
		.returnResult();

WebTestClientResponse response = WebTestClientResponse.from(result);
assertThat(response).hasStatusOk();
assertThat(response).hasContentTypeCompatibleWith(MediaType.TEXT_PLAIN);
// ...
```

#### Kotlin

```kotlin
val result = client.get().uri("/persons").exchange()
		. // ...
		.returnResult()

val response = WebTestClientResponse.from(spec)
assertThat(response).hasStatusOk()
assertThat(response).hasContentTypeCompatibleWith(MediaType.TEXT_PLAIN)
// ...
```

<a id="webtestclient-mockmvc"></a>

### MockMvc Assertions

`WebTestClient` is an HTTP client and as such it can only verify what is in the client
response including status, headers, and body.

When testing a Spring MVC application with a MockMvc server setup, you have the extra
choice to perform further assertions on the server response. To do that start by
obtaining an `ExchangeResult` after asserting the body:

#### Java

```java
// For a response with a body
EntityExchangeResult<Person> result = client.get().uri("/persons/1")
		.exchange()
		.expectStatus().isOk()
		.expectBody(Person.class)
		.returnResult();

// For a response without a body
EntityExchangeResult<Void> result = client.get().uri("/path")
		.exchange()
		.expectBody().isEmpty();
```

#### Kotlin

```kotlin
// For a response with a body
val result = client.get().uri("/persons/1")
		.exchange()
		.expectStatus().isOk()
		.expectBody<Person>()
		.returnResult()

// For a response without a body
val result = client.get().uri("/path")
		.exchange()
		.expectBody().isEmpty()
```

Then switch to MockMvc server response assertions:

#### Java

```java
MockMvcWebTestClient.resultActionsFor(result)
		.andExpect(model().attribute("integer", 3))
		.andExpect(model().attribute("string", "a string value"));
```

#### Kotlin

```kotlin
MockMvcWebTestClient.resultActionsFor(result)
		.andExpect(model().attribute("integer", 3))
		.andExpect(model().attribute("string", "a string value"));
```
