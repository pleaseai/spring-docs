---
title: "Filter Registrations"
source: "ROOT:testing/spring-mvc-test-framework/server-filters.adoc"
---

<a id="spring-mvc-test-server-filters"></a>

# Filter Registrations

When setting up a `MockMvc` instance, you can register one or more Servlet `Filter`
instances, as the following example shows:

#### Java

```java
mockMvc = standaloneSetup(new PersonController()).addFilters(new CharacterEncodingFilter()).build();
```

#### Kotlin

```kotlin
// Not possible in Kotlin until {kotlin-issues}/KT-22208 is fixed
```

Registered filters are invoked through the `MockFilterChain` from `spring-test`, and the
last filter delegates to the `DispatcherServlet`.
