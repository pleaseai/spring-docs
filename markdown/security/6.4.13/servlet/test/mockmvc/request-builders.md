---
title: "SecurityMockMvcRequestBuilders"
source: "ROOT:servlet/test/mockmvc/request-builders.adoc"
---

# SecurityMockMvcRequestBuilders

Spring MVC Test also provides a `RequestBuilder` interface that can be used to create the `MockHttpServletRequest` used in your test.
Spring Security provides a few `RequestBuilder` implementations that can be used to make testing easier.
In order to use Spring Security’s `RequestBuilder` implementations ensure the following static import is used:

#### Java

```java
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.*;
```

#### Kotlin

```kotlin
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestBuilders.*
```
