---
title: "RestTestClient"
source: "ROOT:testing/resttestclient.adoc"
---

<a id="resttestclient"></a>

# RestTestClient

`RestTestClient` is an HTTP client designed for testing server applications. It wraps
Spring’s [`RestClient`](../integration/rest-clients.md#rest-restclient) and uses it to perform requests,
but exposes a testing facade for verifying responses. `RestTestClient` can be used to
perform end-to-end HTTP tests. It can also be used to test Spring MVC
applications without a running server via MockMvc.

<a id="resttestclient-setup"></a>

## Setup

To set up a `RestTestClient` you need to choose a server setup to bind to. This can be one
of several MockMvc setup choices, or a connection to a live server.

<a id="resttestclient-controller-config"></a>

### Bind to Controller

This setup allows you to test specific controller(s) via mock request and response objects,
without a running server.

#### Java

```java
RestTestClient client =
		RestTestClient.bindToController(new TestController()).build();
```

#### Kotlin

```kotlin
val client = RestTestClient.bindToController(TestController()).build()
```

<a id="resttestclient-context-config"></a>

### Bind to `ApplicationContext`

This setup allows you to load Spring configuration with Spring MVC
infrastructure and controller declarations and use it to handle requests via mock request
and response objects, without a running server.

#### Java

```java
@SpringJUnitConfig(WebConfig.class) // <1>
class MyTests {

	RestTestClient client;

	@BeforeEach
	void setUp(ApplicationContext context) {  // <2>
		client = RestTestClient.bindToApplicationContext(context).build(); // <3>
	}
}
```

1. Specify the configuration to load
1. Inject the configuration
1. Create the `RestTestClient`

#### Kotlin

```kotlin
@SpringJUnitConfig(WebConfig::class) // <1>
class MyTests {

	lateinit var client: RestTestClient

	@BeforeEach
	fun setUp(context: ApplicationContext) { // <2>
		client = RestTestClient.bindToApplicationContext(context).build() // <3>
	}
}
```

1. Specify the configuration to load
1. Inject the configuration
1. Create the `RestTestClient`

<a id="resttestclient-fn-config"></a>

### Bind to Router Function

This setup allows you to test [functional endpoints](../web/webmvc-functional.md) via
mock request and response objects, without a running server.

#### Java

```java
RouterFunction<?> route = ...
client = RestTestClient.bindToRouterFunction(route).build();
```

#### Kotlin

```kotlin
val route: RouterFunction<*> = ...
val client = RestTestClient.bindToRouterFunction(route).build()
```

<a id="resttestclient-server-config"></a>

### Bind to Server

This setup connects to a running server to perform full, end-to-end HTTP tests:

#### Java

```java
client = RestTestClient.bindToServer().baseUrl("http://localhost:8080").build();
```

#### Kotlin

```kotlin
client = RestTestClient.bindToServer().baseUrl("http://localhost:8080").build()
```

<a id="resttestclient-client-config"></a>

### Client Config

In addition to the server setup options described earlier, you can also configure client
options, including base URL, default headers, client filters, and others. These options
are readily available following the initial `bindTo` call, as follows:

#### Java

```java
client = RestTestClient.bindToController(new TestController())
		.baseUrl("/test")
		.build();
```

#### Kotlin

```kotlin
client = RestTestClient.bindToController(TestController())
		.baseUrl("/test")
		.build()
```

<a id="resttestclient-tests"></a>

## Writing Tests

[`RestClient`](../integration/rest-clients.md#rest-restclient) and `RestTestClient` have
the same API up to the point of the call to `exchange()`. After that, `RestTestClient`
provides two alternative ways to verify the response:

1. [Built-in Assertions](#resttestclient-workflow) extend the request workflow with a chain of expectations
1. [AssertJ Integration](#resttestclient-assertj) to verify the response via `assertThat()` statements

<a id="resttestclient-workflow"></a>

### Built-in Assertions

To use the built-in assertions, remain in the workflow after the call to `exchange()`, and
use one of the expectation methods. For example:

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
- `expectBody()`: Decode to `byte[]` for [JSON Content](#resttestclient-json) or an empty body.

If the built-in assertions are insufficient, you can consume the object instead and
perform any other assertions:

#### Java

```java
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

Or you can exit the workflow and obtain a `EntityExchangeResult`:

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
val result = client.get().uri("/persons/1")
		.exchange()
		.expectStatus().isOk
		.expectBody<Person>()
		.returnResult()
```

> [!TIP]
> When you need to decode to a target type with generics, look for the overloaded methods
> that accept [`ParameterizedTypeReference`](https://docs.spring.io/spring-framework/docs/7.0.2/javadoc-api/org/springframework/core/ParameterizedTypeReference.html)
> instead of `Class<T>`.

<a id="resttestclient-no-content"></a>

#### No Content

If the response is not expected to have content, you can assert that as follows:

#### Java

```java
client.post().uri("/persons")
		.body(person)
		.exchange()
		.expectStatus().isCreated()
		.expectBody().isEmpty();
```

#### Kotlin

```kotlin
client.post().uri("/persons")
		.body(person)
		.exchange()
		.expectStatus().isCreated()
		.expectBody().isEmpty()
```

If you want to ignore the response content, the following releases the content without any assertions:

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

<a id="resttestclient-json"></a>

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

<a id="resttestclient-assertj"></a>

### AssertJ Integration

`RestTestClientResponse` is the main entry point for the AssertJ integration.
It is an `AssertProvider` that wraps the `ResponseSpec` of an exchange in order to enable
use of `assertThat()` statements. For example:

#### Java

```java
ResponseSpec spec = client.get().uri("/persons").exchange();

RestTestClientResponse response = RestTestClientResponse.from(spec);
assertThat(response).hasStatusOk();
assertThat(response).hasContentTypeCompatibleWith(MediaType.TEXT_PLAIN);
// ...
```

#### Kotlin

```kotlin
val spec = client.get().uri("/persons").exchange()

val response = RestTestClientResponse.from(spec)
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

RestTestClientResponse response = RestTestClientResponse.from(result);
assertThat(response).hasStatusOk();
assertThat(response).hasContentTypeCompatibleWith(MediaType.TEXT_PLAIN);
// ...
```

#### Kotlin

```kotlin
val result = client.get().uri("/persons").exchange()
		. // ...
		.returnResult()

val response = RestTestClientResponse.from(spec)
assertThat(response).hasStatusOk()
assertThat(response).hasContentTypeCompatibleWith(MediaType.TEXT_PLAIN)
// ...
```
