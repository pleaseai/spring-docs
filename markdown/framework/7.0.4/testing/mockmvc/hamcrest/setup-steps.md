---
title: "Setup Features"
source: "ROOT:testing/mockmvc/hamcrest/setup-steps.adoc"
---

<a id="mockmvc-server-setup-steps"></a>

# Setup Features

No matter which MockMvc builder you use, all `MockMvcBuilder` implementations provide
some common and very useful features. For example, you can declare an `Accept` header for
all requests and expect a status of 200 as well as a `Content-Type` header in all
responses, as follows:

#### Java

```java
// static import of MockMvcBuilders.standaloneSetup

MockMvc mockMvc = standaloneSetup(new MusicController())
	.defaultRequest(get("/").accept(MediaType.APPLICATION_JSON))
	.alwaysExpect(status().isOk())
	.alwaysExpect(content().contentType("application/json;charset=UTF-8"))
	.build();
```

#### Kotlin

```kotlin
// static import of MockMvcBuilders.standaloneSetup

val mockMvc = standaloneSetup(MusicController())
	.defaultRequest<StandaloneMockMvcBuilder>(get("/").accept(MediaType.APPLICATION_JSON))
	.alwaysExpect<StandaloneMockMvcBuilder>(status().isOk())
	.alwaysExpect<StandaloneMockMvcBuilder>(content().contentType("application/json;charset=UTF-8"))
	.build()
```

In addition, third-party frameworks (and applications) can pre-package setup
instructions, such as those in a `MockMvcConfigurer`. The Spring Framework has one such
built-in implementation that helps to save and re-use the HTTP session across requests.
You can use it as follows:

#### Java

```java
// static import of SharedHttpSessionConfigurer.sharedHttpSession

MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
		.apply(sharedHttpSession())
		.build();

// Use mockMvc to perform requests...
```

#### Kotlin

```kotlin
// static import of SharedHttpSessionConfigurer.sharedHttpSession

val mockMvc = MockMvcBuilders.standaloneSetup(TestController())
		.apply<StandaloneMockMvcBuilder>(sharedHttpSession())
		.build()

// Use mockMvc to perform requests...
```

See the javadoc for
[`ConfigurableMockMvcBuilder`](https://docs.spring.io/spring-framework/docs/7.0.4/javadoc-api/org/springframework/test/web/servlet/setup/ConfigurableMockMvcBuilder.html)
for a list of all MockMvc builder features or use the IDE to explore the available options.
