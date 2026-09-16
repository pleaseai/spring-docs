---
title: "Reactive"
source: "ROOT:migration/reactive.adoc"
---

# Reactive

If you have already performed the [initial migration steps](index.md) for your Reactive application, you’re now ready to perform steps specific to Reactive applications.

<a id="_use_authorizationmanager_for_method_security"></a>

## Use `AuthorizationManager` for Method Security

In 6.0, `@EnableReactiveMethodSecurity` defaults `useAuthorizationManager` to `true`.
So, to complete migration, [`@EnableReactiveMethodSecurity`](https://docs.spring.io/spring-security/site/docs/6.5.11/api/org/springframework/security/config/annotation/method/configuration/EnableReactiveMethodSecurity.html) remove the `useAuthorizationManager` attribute:

#### Java

```java
@EnableReactiveMethodSecurity(useAuthorizationManager = true)
```

#### Kotlin

```kotlin
@EnableReactiveMethodSecurity(useAuthorizationManager = true)
```

changes to:

#### Java

```java
@EnableReactiveMethodSecurity
```

#### Kotlin

```kotlin
@EnableReactiveMethodSecurity
```

<a id="_propagate_authenticationserviceexceptions"></a>

## Propagate `AuthenticationServiceException`s

[`AuthenticationWebFilter`](https://docs.spring.io/spring-security/site/docs/6.5.11/api/org/springframework/security/web/server/authentication/AuthenticationWebFilter.html) propagates [`AuthenticationServiceException`](https://docs.spring.io/spring-security/site/docs/6.5.11/api/org/springframework/security/authentication/AuthenticationServiceException.html)s to the [`ServerAuthenticationEntryPoint`](https://docs.spring.io/spring-security/site/docs/6.5.11/api/org/springframework/security/web/server/ServerAuthenticationEntryPoint.html).
Because `AuthenticationServiceException`s represent a server-side error instead of a client-side error, in 6.0, this changes to propagate them to the container.

So, if you opted into this behavior by setting `rethrowAuthenticationServiceException` too `true`, you can now remove it like so:

#### Java

```java
AuthenticationFailureHandler bearerFailureHandler = new ServerAuthenticationEntryPointFailureHandler(bearerEntryPoint);
bearerFailureHandler.setRethrowAuthenticationServiceException(true);
AuthenticationFailureHandler basicFailureHandler = new ServerAuthenticationEntryPointFailureHandler(basicEntryPoint);
basicFailureHandler.setRethrowAuthenticationServiceException(true);
```

#### Kotlin

```kotlin
val bearerFailureHandler: AuthenticationFailureHandler = ServerAuthenticationEntryPointFailureHandler(bearerEntryPoint)
bearerFailureHandler.setRethrowAuthenticationServiceException(true)
val basicFailureHandler: AuthenticationFailureHandler = ServerAuthenticationEntryPointFailureHandler(basicEntryPoint)
basicFailureHandler.setRethrowAuthenticationServiceException(true)
```

changes to:

#### Java

```java
AuthenticationFailureHandler bearerFailureHandler = new ServerAuthenticationEntryPointFailureHandler(bearerEntryPoint);
AuthenticationFailureHandler basicFailureHandler = new ServerAuthenticationEntryPointFailureHandler(basicEntryPoint);
```

#### Kotlin

```kotlin
val bearerFailureHandler: AuthenticationFailureHandler = ServerAuthenticationEntryPointFailureHandler(bearerEntryPoint)
val basicFailureHandler: AuthenticationFailureHandler = ServerAuthenticationEntryPointFailureHandler(basicEntryPoint)
```

> [!NOTE]
> If you configured the `ServerAuthenticationFailureHandler` only for the purpose of updating to 6.0, you can remove it completely.
