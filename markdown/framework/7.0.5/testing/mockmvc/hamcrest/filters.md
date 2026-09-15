---
title: "Filter Registrations"
source: "ROOT:testing/mockmvc/hamcrest/filters.adoc"
---

<a id="mockmvc-server-filters"></a>

# Filter Registrations

When setting up a `MockMvc` instance, you can register one or more Servlet `Filter`
instances, as the following example shows:

#### Java

```java
mockMvc = standaloneSetup(new PersonController()).addFilters(new CharacterEncodingFilter()).build();
```

#### Kotlin

```kotlin
mockMvc = standaloneSetup(PersonController()).addFilters<StandaloneMockMvcBuilder>(CharacterEncodingFilter()).build()
```

Registered filters are invoked through the `MockFilterChain` from `spring-test`, and the
last filter delegates to the `DispatcherServlet`.
