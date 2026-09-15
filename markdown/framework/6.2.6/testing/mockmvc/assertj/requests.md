---
title: "Performing Requests"
source: "ROOT:testing/mockmvc/assertj/requests.adoc"
---

<a id="mockmvc-tester-requests"></a>

# Performing Requests

This section shows how to use `MockMvcTester` to perform requests and its integration
with AssertJ to verify responses.

`MockMvcTester` provides a fluent API to compose the request that reuses the same
`MockHttpServletRequestBuilder` as the Hamcrest support, except that there is no need
to import a static method. The builder that is returned is AssertJ-aware so that
wrapping it in the regular `assertThat()` factory method triggers the exchange and
provides access to a dedicated Assert object for `MvcTestResult`.

Here is a simple example that performs a `POST` on `/hotels/42` and configures the
request to specify an `Accept` header:

#### Java

```java
assertThat(mockMvc.post().uri("/hotels/{id}", 42).accept(MediaType.APPLICATION_JSON))
		. // ...
```

#### Kotlin

```kotlin
assertThat(mockMvc.post().uri("/hotels/{id}", 42).accept(MediaType.APPLICATION_JSON))
	. // ...
```

AssertJ often consists of multiple `assertThat()` statements to validate the different
parts of the exchange. Rather than having a single statement as in the case above, you
can use `.exchange()` to return a `MvcTestResult` that can be used in multiple
`assertThat` statements:

#### Java

```java
MvcTestResult result = mockMvc.post().uri("/hotels/{id}", 42)
		.accept(MediaType.APPLICATION_JSON).exchange();
assertThat(result). // ...
```

#### Kotlin

```kotlin
val result = mockMvc.post().uri("/hotels/{id}", 42)
	.accept(MediaType.APPLICATION_JSON).exchange()
assertThat(result)
	. // ...
```

You can specify query parameters in URI template style, as the following example shows:

#### Java

```java
assertThat(mockMvc.get().uri("/hotels?thing={thing}", "somewhere"))
		. // ...
```

#### Kotlin

```kotlin
assertThat(mockMvc.get().uri("/hotels?thing={thing}", "somewhere"))
	. // ...
```

You can also add Servlet request parameters that represent either query or form
parameters, as the following example shows:

#### Java

```java
assertThat(mockMvc.get().uri("/hotels").param("thing", "somewhere"))
		. // ...
```

#### Kotlin

```kotlin
assertThat(mockMvc.get().uri("/hotels").param("thing", "somewhere"))
	. // ...
```

If application code relies on Servlet request parameters and does not check the query
string explicitly (as is most often the case), it does not matter which option you use.
Keep in mind, however, that query parameters provided with the URI template are decoded
while request parameters provided through the `param(…​)` method are expected to already
be decoded.

<a id="mockmvc-tester-requests-async"></a>

## Async

If the processing of the request is done asynchronously, `exchange()` waits for
the completion of the request so that the result to assert is effectively immutable.
The default timeout is 10 seconds but it can be controlled on a request-by-request
basis as shown in the following example:

#### Java

```java
assertThat(mockMvc.get().uri("/compute").exchange(Duration.ofSeconds(5)))
		. // ...
```

#### Kotlin

```kotlin
assertThat(mockMvc.get().uri("/compute").exchange(Duration.ofSeconds(5)))
	. // ...
```

If you prefer to get the raw result and manage the lifecycle of the asynchronous
request yourself, use `asyncExchange` rather than `exchange`.

<a id="mockmvc-tester-requests-multipart"></a>

## Multipart

You can perform file upload requests that internally use
`MockMultipartHttpServletRequest` so that there is no actual parsing of a multipart
request. Rather, you have to set it up to be similar to the following example:

#### Java

```java
assertThat(mockMvc.post().uri("/upload").multipart()
		.file("file1.txt", "Hello".getBytes(StandardCharsets.UTF_8))
		.file("file2.txt", "World".getBytes(StandardCharsets.UTF_8)))
	. // ...
```

#### Kotlin

```kotlin
assertThat(mockMvc.post().uri("/upload").multipart()
		.file("file1.txt", "Hello".toByteArray(StandardCharsets.UTF_8))
		.file("file2.txt", "World".toByteArray(StandardCharsets.UTF_8)))
	. // ...
```

<a id="mockmvc-tester-requests-paths"></a>

## Using Servlet and Context Paths

In most cases, it is preferable to leave the context path and the Servlet path out of the
request URI. If you must test with the full request URI, be sure to set the `contextPath`
and `servletPath` accordingly so that request mappings work, as the following example
shows:

#### Java

```java
assertThat(mockMvc.get().uri("/app/main/hotels/{id}", 42)
		.contextPath("/app").servletPath("/main"))
		. // ...
```

#### Kotlin

```kotlin
assertThat(mockMvc.get().uri("/app/main/hotels/{id}", 42)
		.contextPath("/app").servletPath("/main"))
	. // ...
```

In the preceding example, it would be cumbersome to set the `contextPath` and
`servletPath` with every performed request. Instead, you can set up default request
properties, as the following example shows:

#### Java

```java
MockMvcTester mockMvc = MockMvcTester.of(List.of(new HotelController()),
		builder -> builder.defaultRequest(get("/")
				.contextPath("/app").servletPath("/main")
				.accept(MediaType.APPLICATION_JSON)).build());
```

#### Kotlin

```kotlin
val mockMvc =
	MockMvcTester.of(listOf(HotelController())) { builder: StandaloneMockMvcBuilder ->
		builder.defaultRequest<StandaloneMockMvcBuilder>(
			MockMvcRequestBuilders.get("/")
				.contextPath("/app").servletPath("/main")
				.accept(MediaType.APPLICATION_JSON)
		).build()
	}
```

The preceding properties affect every request performed through the `mockMvc` instance.
If the same property is also specified on a given request, it overrides the default
value. That is why the HTTP method and URI in the default request do not matter, since
they must be specified on every request.
