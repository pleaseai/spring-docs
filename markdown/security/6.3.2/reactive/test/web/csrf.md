---
title: "Testing with CSRF"
source: "ROOT:reactive/test/web/csrf.adoc"
---

# Testing with CSRF

Spring Security also provides support for CSRF testing with `WebTestClient` — for example:

#### Java

```java
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf;

this.rest
	// provide a valid CSRF token
	.mutateWith(csrf())
	.post()
	.uri("/login")
	...
```

#### Kotlin

```kotlin
import org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.csrf

this.rest
    // provide a valid CSRF token
    .mutateWith(csrf())
    .post()
    .uri("/login")
    ...
```
