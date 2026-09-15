---
title: "Defining Expectations"
source: "ROOT:testing/mockmvc/assertj/assertions.adoc"
---

<a id="mockmvc-tester-assertions"></a>

# Defining Expectations

Assertions work the same way as any AssertJ assertions. The support provides dedicated
assert objects for the various pieces of the `MvcTestResult`, as shown in the following
example:

#### Java

```java
assertThat(mockMvc.get().uri("/hotels/{id}", 42))
		.hasStatusOk()
		.hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON)
		.bodyJson().isLenientlyEqualTo("sample/hotel-42.json");
```

#### Kotlin

```kotlin
assertThat(mockMvc.get().uri("/hotels/{id}", 42))
	.hasStatusOk()
	.hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON)
	.bodyJson().isLenientlyEqualTo("sample/hotel-42.json")
```

If a request fails, the exchange does not throw the exception. Rather, you can assert
that the result of the exchange has failed:

#### Java

```java
assertThat(mockMvc.get().uri("/hotels/{id}", -1))
		.hasFailed()
		.hasStatus(HttpStatus.BAD_REQUEST)
		.failure().hasMessageContaining("Identifier should be positive");
```

#### Kotlin

```kotlin
assertThat(mockMvc.get().uri("/hotels/{id}", -1))
	.hasFailed()
	.hasStatus(HttpStatus.BAD_REQUEST)
	.failure().hasMessageContaining("Identifier should be positive")
```

The request could also fail unexpectedly, that is the exception thrown by the handler
has not been handled and is thrown as is. You can still use `.hasFailed()` and
`.failure()` but any attempt to access part of the result will throw an exception as
the exchange hasn’t completed.

<a id="mockmvc-tester-assertions-json"></a>

## JSON Support

The AssertJ support for `MvcTestResult` provides JSON support via `bodyJson()`.

If [JSONPath](https://github.com/jayway/JsonPath) is available, you can apply an expression
on the JSON document. The returned value provides convenient methods to return a dedicated
assert object for the various supported JSON data types:

#### Java

```java
assertThat(mockMvc.get().uri("/family")).bodyJson()
		.extractingPath("$.members[0]")
		.asMap()
		.contains(entry("name", "Homer"));
```

#### Kotlin

```kotlin
assertThat(mockMvc.get().uri("/family")).bodyJson()
	.extractingPath("$.members[0]")
	.asMap()
	.contains(entry("name", "Homer"))
```

You can also convert the raw content to any of your data types as long as the message
converter is configured properly:

#### Java

```java
assertThat(mockMvc.get().uri("/family")).bodyJson()
		.extractingPath("$.members[0]")
		.convertTo(Member.class)
		.satisfies(member -> assertThat(member.name).isEqualTo("Homer"));
```

#### Kotlin

```kotlin
assertThat(mockMvc.get().uri("/family")).bodyJson()
	.extractingPath("$.members[0]")
	.convertTo(Member::class.java)
	.satisfies(ThrowingConsumer { member: Member ->
		assertThat(member.name).isEqualTo("Homer")
	})
```

Converting to a target `Class` provides a generic assert object. For more complex types,
you may want to use `AssertFactory` instead that returns a dedicated assert type, if
possible:

#### Java

```java
assertThat(mockMvc.get().uri("/family")).bodyJson()
		.extractingPath("$.members")
		.convertTo(InstanceOfAssertFactories.list(Member.class))
		.hasSize(5)
		.element(0).satisfies(member -> assertThat(member.name).isEqualTo("Homer"));
```

#### Kotlin

```kotlin
assertThat(mockMvc.get().uri("/family")).bodyJson()
	.extractingPath("$.members")
	.convertTo(InstanceOfAssertFactories.list(Member::class.java))
	.hasSize(5)
	.element(0).satisfies(ThrowingConsumer { member: Member ->
		assertThat(member.name).isEqualTo("Homer")
	})
```

[JSONAssert](https://jsonassert.skyscreamer.org) is also supported. The body of the
response can be matched against a `Resource` or a content. If the content ends with
`.json ` we look for a file matching that name on the classpath:

#### Java

```java
assertThat(mockMvc.get().uri("/family")).bodyJson()
		.isStrictlyEqualTo("sample/simpsons.json");
```

#### Kotlin

```kotlin
assertThat(mockMvc.get().uri("/family")).bodyJson()
	.isStrictlyEqualTo("sample/simpsons.json")
```

If you prefer to use another library, you can provide an implementation of
[`JsonComparator`](https://docs.spring.io/spring-framework/docs/7.0.8/javadoc-api/org/springframework/test/json/JsonComparator.html).
