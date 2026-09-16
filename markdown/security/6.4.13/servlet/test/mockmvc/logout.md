---
title: "Testing Logout"
source: "ROOT:servlet/test/mockmvc/logout.adoc"
---

<a id="test-logout"></a>

# Testing Logout

While fairly trivial using standard Spring MVC Test, you can use Spring Security’s testing support to make testing log out easier.
For example, the following `logout` [`RequestPostProcessor`](request-post-processors.md) will submit a POST to "/logout" with a valid CSRF token:

#### Java

```java
mvc
	.perform(logout())
```

#### Kotlin

```kotlin
mvc
    .perform(logout())
```

You can also customize the URL to post to.
For example, the snippet below will submit a POST to "/signout" with a valid CSRF token:

#### Java

```java
mvc
	.perform(logout("/signout"))
```

#### Kotlin

```kotlin
mvc
	.perform(logout("/signout"))
```
