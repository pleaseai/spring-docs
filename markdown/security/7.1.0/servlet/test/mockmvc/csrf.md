---
title: "Testing with CSRF Protection"
source: "ROOT:servlet/test/mockmvc/csrf.adoc"
---

<a id="test-mockmvc-csrf"></a>

# Testing with CSRF Protection

When testing any non-safe HTTP methods and using Spring Security’s CSRF protection, you must include a valid CSRF Token in the request.
To specify a valid CSRF token as a request parameter use the CSRF [`RequestPostProcessor`](request-post-processors.md) like so:

#### Java

```java
mvc
	.perform(post("/").with(csrf()))
```

#### Kotlin

```kotlin
mvc.post("/") {
    with(csrf())
}
```

If you like, you can include CSRF token in the header instead:

#### Java

```java
mvc
	.perform(post("/").with(csrf().asHeader()))
```

#### Kotlin

```kotlin
mvc.post("/") {
    with(csrf().asHeader())
}
```

You can also test providing an invalid CSRF token by using the following:

#### Java

```java
mvc
	.perform(post("/").with(csrf().useInvalidToken()))
```

#### Kotlin

```kotlin
mvc.post("/") {
    with(csrf().useInvalidToken())
}
```
