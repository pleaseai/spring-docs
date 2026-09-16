---
title: "UserDetailsService"
source: "ROOT:servlet/authentication/passwords/user-details-service.adoc"
---

<a id="servlet-authentication-userdetailsservice"></a>

# UserDetailsService

[`UserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.5.4/api/org/springframework/security/core/userdetails/UserDetailsService.html) is used by [`DaoAuthenticationProvider`](dao-authentication-provider.md#servlet-authentication-daoauthenticationprovider) for retrieving a username, a password, and other attributes for authenticating with a username and password.
Spring Security provides [in-memory](in-memory.md#servlet-authentication-inmemory), [JDBC](jdbc.md#servlet-authentication-jdbc), and [caching](caching.md#servlet-authentication-caching-user-details) implementations of `UserDetailsService`.

You can define custom authentication by exposing a custom `UserDetailsService` as a bean.
For example, the following listing customizes authentication, assuming that `CustomUserDetailsService` implements `UserDetailsService`:

> [!NOTE]
> This is only used if the `AuthenticationManagerBuilder` has not been populated and no `AuthenticationProviderBean` is defined.

#### Java

```java
@Bean
CustomUserDetailsService customUserDetailsService() {
	return new CustomUserDetailsService();
}
```

#### XML

```java
<b:bean class="example.CustomUserDetailsService"/>
```

#### Kotlin

```kotlin
@Bean
fun customUserDetailsService() = CustomUserDetailsService()
```
