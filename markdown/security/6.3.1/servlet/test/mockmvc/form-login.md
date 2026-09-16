---
title: "Testing Form Based Authentication"
source: "ROOT:servlet/test/mockmvc/form-login.adoc"
---

# Testing Form Based Authentication

You can easily create a request to test a form based authentication using Spring Security’s testing support.
For example, the following `formLogin` [`RequestPostProcessor`](request-post-processors.md) will submit a POST to "/login" with the username "user", the password "password", and a valid CSRF token:

#### Java

```java
mvc
	.perform(formLogin())
```

#### Kotlin

```kotlin
mvc
	.perform(formLogin())
```

It is easy to customize the request.
For example, the following will submit a POST to "/auth" with the username "admin", the password "pass", and a valid CSRF token:

#### Java

```java
mvc
	.perform(formLogin("/auth").user("admin").password("pass"))
```

#### Kotlin

```kotlin
mvc
    .perform(formLogin("/auth").user("admin").password("pass"))
```

We can also customize the parameters names that the username and password are included on.
For example, this is the above request modified to include the username on the HTTP parameter "u" and the password on the HTTP parameter "p".

#### Java

```java
mvc
	.perform(formLogin("/auth").user("u","admin").password("p","pass"))
```

#### Kotlin

```kotlin
mvc
    .perform(formLogin("/auth").user("u","admin").password("p","pass"))
```
