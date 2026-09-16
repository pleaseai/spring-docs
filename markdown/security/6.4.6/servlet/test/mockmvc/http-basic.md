---
title: "Testing HTTP Basic Authentication"
source: "ROOT:servlet/test/mockmvc/http-basic.adoc"
---

# Testing HTTP Basic Authentication

While it has always been possible to authenticate with HTTP Basic, it was a bit tedious to remember the header name, format, and encode the values.
Now this can be done using Spring Security’s `httpBasic` [`RequestPostProcessor`](request-post-processors.md).
For example, the snippet below:

#### Java

```java
mvc
	.perform(get("/").with(httpBasic("user","password")))
```

#### Kotlin

```kotlin
mvc.get("/") {
    with(httpBasic("user","password"))
}
```

will attempt to use HTTP Basic to authenticate a user with the username "user" and the password "password" by ensuring the following header is populated on the HTTP Request:

```text
Authorization: Basic dXNlcjpwYXNzd29yZA==
```
