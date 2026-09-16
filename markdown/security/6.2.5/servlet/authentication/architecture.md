---
title: "Servlet Authentication Architecture"
source: "ROOT:servlet/authentication/architecture.adoc"
---

<a id="servlet-authentication-architecture"></a>

# Servlet Authentication Architecture

This discussion expands on [Servlet Security: The Big Picture](../architecture.md#servlet-architecture) to describe the main architectural components of Spring Security’s used in Servlet authentication.
If you need concrete flows that explain how these pieces fit together, look at the [Authentication Mechanism](index.md#servlet-authentication-mechanisms) specific sections.

- [SecurityContextHolder](#servlet-authentication-securitycontextholder) - The `SecurityContextHolder` is where Spring Security stores the details of who is [authenticated](../../features/authentication/index.md#authentication).
- [SecurityContext](#servlet-authentication-securitycontext) - is obtained from the `SecurityContextHolder` and contains the `Authentication` of the currently authenticated user.
- [Authentication](#servlet-authentication-authentication) - Can be the input to `AuthenticationManager` to provide the credentials a user has provided to authenticate or the current user from the `SecurityContext`.
- [GrantedAuthority](#servlet-authentication-granted-authority) - An authority that is granted to the principal on the `Authentication` (i.e. roles, scopes, etc.)
- [AuthenticationManager](#servlet-authentication-authenticationmanager) -  the API that defines how Spring Security’s Filters perform  [authentication](../../features/authentication/index.md#authentication).
- [ProviderManager](#servlet-authentication-providermanager) -  the most common implementation of `AuthenticationManager`.
- [AuthenticationProvider](#servlet-authentication-authenticationprovider) - used by `ProviderManager` to perform a specific type of authentication.
- [Request Credentials with `AuthenticationEntryPoint`](#servlet-authentication-authenticationentrypoint) - used for requesting credentials from a client (i.e. redirecting to a log in page, sending a `WWW-Authenticate` response, etc.)
- [AbstractAuthenticationProcessingFilter](#servlet-authentication-abstractprocessingfilter) - a base `Filter` used for authentication.
This also gives a good idea of the high level flow of authentication and how pieces work together.

<a id="servlet-authentication-securitycontextholder"></a>

## SecurityContextHolder

At the heart of Spring Security’s authentication model is the `SecurityContextHolder`.
It contains the [SecurityContext](#servlet-authentication-securitycontext).

![securitycontextholder](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.5/docs/modules/ROOT/assets/images/servlet/authentication/architecture/securitycontextholder.png)

The `SecurityContextHolder` is where Spring Security stores the details of who is [authenticated](../../features/authentication/index.md#authentication).
Spring Security does not care how the `SecurityContextHolder` is populated.
If it contains a value, it is used as the currently authenticated user.

The simplest way to indicate a user is authenticated is to set the `SecurityContextHolder` directly:

#### Java

```java
SecurityContext context = SecurityContextHolder.createEmptyContext(); // <1>
Authentication authentication =
    new TestingAuthenticationToken("username", "password", "ROLE_USER"); // <2>
context.setAuthentication(authentication);

SecurityContextHolder.setContext(context); // <3>
```

#### Kotlin

```kotlin
val context: SecurityContext = SecurityContextHolder.createEmptyContext() // <1>
val authentication: Authentication = TestingAuthenticationToken("username", "password", "ROLE_USER") // <2>
context.authentication = authentication

SecurityContextHolder.setContext(context) // <3>
```

1. We start by creating an empty `SecurityContext`.
You should create a new `SecurityContext` instance instead of using `SecurityContextHolder.getContext().setAuthentication(authentication)` to avoid race conditions across multiple threads.
1. Next, we create a new [`Authentication`](#servlet-authentication-authentication) object.
Spring Security does not care what type of `Authentication` implementation is set on the `SecurityContext`.
Here, we use `TestingAuthenticationToken`, because it is very simple.
A more common production scenario is `UsernamePasswordAuthenticationToken(userDetails, password, authorities)`.
1. Finally, we set the `SecurityContext` on the `SecurityContextHolder`.
Spring Security uses this information for [authorization](../authorization/index.md#servlet-authorization).

To obtain information about the authenticated principal, access the `SecurityContextHolder`.

#### Java

```java
SecurityContext context = SecurityContextHolder.getContext();
Authentication authentication = context.getAuthentication();
String username = authentication.getName();
Object principal = authentication.getPrincipal();
Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
```

#### Kotlin

```kotlin
val context = SecurityContextHolder.getContext()
val authentication = context.authentication
val username = authentication.name
val principal = authentication.principal
val authorities = authentication.authorities
```

By default, `SecurityContextHolder` uses a `ThreadLocal` to store these details, which means that the `SecurityContext` is always available to methods in the same thread, even if the `SecurityContext` is not explicitly passed around as an argument to those methods.
Using a `ThreadLocal` in this way is quite safe if you take care to clear the thread after the present principal’s request is processed.
Spring Security’s [FilterChainProxy](../architecture.md#servlet-filterchainproxy) ensures that the `SecurityContext` is always cleared.

Some applications are not entirely suitable for using a `ThreadLocal`, because of the specific way they work with threads.
For example, a Swing client might want all threads in a Java Virtual Machine to use the same security context.
You can configure `SecurityContextHolder` with a strategy on startup to specify how you would like the context to be stored.
For a standalone application, you would use the `SecurityContextHolder.MODE_GLOBAL` strategy.
Other applications might want to have threads spawned by the secure thread also assume the same security identity.
You can achieve this by using `SecurityContextHolder.MODE_INHERITABLETHREADLOCAL`.
You can change the mode from the default `SecurityContextHolder.MODE_THREADLOCAL` in two ways.
The first is to set a system property.
The second is to call a static method on `SecurityContextHolder`.
Most applications need not change from the default.
However, if you do, take a look at the JavaDoc for `SecurityContextHolder` to learn more.

<a id="servlet-authentication-securitycontext"></a>

## SecurityContext

The [`SecurityContext`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/core/context/SecurityContext.html) is obtained from the [SecurityContextHolder](#servlet-authentication-securitycontextholder).
The `SecurityContext` contains an [Authentication](#servlet-authentication-authentication) object.

<a id="servlet-authentication-authentication"></a>

## Authentication

The [`Authentication`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/core/Authentication.html) interface serves two main purposes within Spring Security:

- An input to [`AuthenticationManager`](#servlet-authentication-authenticationmanager) to provide the credentials a user has provided to authenticate.
When used in this scenario, `isAuthenticated()` returns `false`.
- Represent the currently authenticated user.
You can obtain the current `Authentication` from the [SecurityContext](#servlet-authentication-securitycontext).

The `Authentication` contains:

- `principal`: Identifies the user.
When authenticating with a username/password this is often an instance of [`UserDetails`](passwords/user-details.md#servlet-authentication-userdetails).
- `credentials`: Often a password.
In many cases, this is cleared after the user is authenticated, to ensure that it is not leaked.
- `authorities`: The [`GrantedAuthority`](#servlet-authentication-granted-authority) instances are high-level permissions the user is granted.
Two examples are roles and scopes.

<a id="servlet-authentication-granted-authority"></a>

## GrantedAuthority

[`GrantedAuthority`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/core/GrantedAuthority.html) instances are high-level permissions that the user is granted.
Two examples are roles and scopes.

You can obtain `GrantedAuthority` instances from the [`Authentication.getAuthorities()`](#servlet-authentication-authentication) method.
This method provides a `Collection` of `GrantedAuthority` objects.
A `GrantedAuthority` is, not surprisingly, an authority that is granted to the principal.
Such authorities are usually “roles”, such as `ROLE_ADMINISTRATOR` or `ROLE_HR_SUPERVISOR`.
These roles are later configured for web authorization, method authorization, and domain object authorization.
Other parts of Spring Security interpret these authorities and expect them to be present.
When using username/password based authentication `GrantedAuthority` instances are usually loaded by the [`UserDetailsService`](passwords/user-details-service.md#servlet-authentication-userdetailsservice).

Usually, the `GrantedAuthority` objects are application-wide permissions.
They are not specific to a given domain object.
Thus, you would not likely have a `GrantedAuthority` to represent a permission to `Employee` object number 54, because if there are thousands of such authorities you would quickly run out of memory (or, at the very least, cause the application to take a long time to authenticate a user).
Of course, Spring Security is expressly designed to handle this common requirement, but you should instead use the project’s domain object security capabilities for this purpose.

<a id="servlet-authentication-authenticationmanager"></a>

## AuthenticationManager

[`AuthenticationManager`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authentication/AuthenticationManager.html) is the API that defines how Spring Security’s Filters perform  [authentication](../../features/authentication/index.md#authentication).
The [`Authentication`](#servlet-authentication-authentication) that is returned is then set on the [SecurityContextHolder](#servlet-authentication-securitycontextholder) by the controller (that is, by [Spring Security’s `Filters` instances](../architecture.md#servlet-security-filters)) that invoked the `AuthenticationManager`.
If you are not integrating with Spring Security’s `Filters` instances, you can set the `SecurityContextHolder` directly and are not required to use an `AuthenticationManager`.

While the implementation of `AuthenticationManager` could be anything, the most common implementation is [`ProviderManager`](#servlet-authentication-providermanager).

<a id="servlet-authentication-providermanager"></a>

## ProviderManager

[`ProviderManager`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authentication/ProviderManager.html) is the most commonly used implementation of [`AuthenticationManager`](#servlet-authentication-authenticationmanager).
`ProviderManager` delegates to a `List` of [`AuthenticationProvider`](#servlet-authentication-authenticationprovider) instances.
Each `AuthenticationProvider` has an opportunity to indicate that authentication should be successful, fail, or indicate it cannot make a decision and allow a downstream `AuthenticationProvider` to decide.
If none of the configured `AuthenticationProvider` instances can authenticate, authentication fails with a `ProviderNotFoundException`, which is a special `AuthenticationException` that indicates that the `ProviderManager` was not configured to support the type of `Authentication` that was passed into it.

![providermanager](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.5/docs/modules/ROOT/assets/images/servlet/authentication/architecture/providermanager.png)

In practice each `AuthenticationProvider` knows how to perform a specific type of authentication.
For example, one `AuthenticationProvider` might be able to validate a username/password, while another might be able to authenticate a SAML assertion.
This lets each `AuthenticationProvider` do a very specific type of authentication while supporting multiple types of authentication and expose only a single `AuthenticationManager` bean.

`ProviderManager` also allows configuring an optional parent `AuthenticationManager`, which is consulted in the event that no `AuthenticationProvider` can perform authentication.
The parent can be any type of `AuthenticationManager`, but it is often an instance of `ProviderManager`.

![providermanager parent](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.5/docs/modules/ROOT/assets/images/servlet/authentication/architecture/providermanager-parent.png)

In fact, multiple `ProviderManager` instances might share the same parent `AuthenticationManager`.
This is somewhat common in scenarios where there are multiple [`SecurityFilterChain`](../architecture.md#servlet-securityfilterchain) instances that have some authentication in common (the shared parent `AuthenticationManager`), but also different authentication mechanisms (the different `ProviderManager` instances).

![providermanagers parent](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.5/docs/modules/ROOT/assets/images/servlet/authentication/architecture/providermanagers-parent.png)

<a id="servlet-authentication-providermanager-erasing-credentials"></a>

By default, `ProviderManager` tries to clear any sensitive credentials information from the `Authentication` object that is returned by a successful authentication request.
This prevents information, such as passwords, being retained longer than necessary in the `HttpSession`.

This may cause issues when you use a cache of user objects, for example, to improve performance in a stateless application.
If the `Authentication` contains a reference to an object in the cache (such as a `UserDetails` instance) and this has its credentials removed, it is no longer possible to authenticate against the cached value.
You need to take this into account if you use a cache.
An obvious solution is to first make a copy of the object, either in the cache implementation or in the `AuthenticationProvider` that creates the returned `Authentication` object.
Alternatively, you can disable the `eraseCredentialsAfterAuthentication` property on `ProviderManager`.
See the Javadoc for the [ProviderManager](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authentication/ProviderManager.html) class.

<a id="servlet-authentication-authenticationprovider"></a>

## AuthenticationProvider

You can inject multiple [`AuthenticationProvider`s](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/authentication/AuthenticationProvider.html) instances into [`ProviderManager`](#servlet-authentication-providermanager).
Each `AuthenticationProvider` performs a specific type of authentication.
For example, [`DaoAuthenticationProvider`](passwords/dao-authentication-provider.md#servlet-authentication-daoauthenticationprovider) supports username/password-based authentication, while `JwtAuthenticationProvider` supports authenticating a JWT token.

<a id="servlet-authentication-authenticationentrypoint"></a>

## Request Credentials with `AuthenticationEntryPoint`

[`AuthenticationEntryPoint`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/web/AuthenticationEntryPoint.html) is used to send an HTTP response that requests credentials from a client.

Sometimes, a client proactively includes credentials (such as a username and password) to request a resource.
In these cases, Spring Security does not need to provide an HTTP response that requests credentials from the client, since they are already included.

In other cases, a client makes an unauthenticated request to a resource that they are not authorized to access.
In this case, an implementation of `AuthenticationEntryPoint` is used to request credentials from the client.
The `AuthenticationEntryPoint` implementation might perform a [redirect to a log in page](passwords/form.md#servlet-authentication-form), respond with an [WWW-Authenticate](passwords/basic.md#servlet-authentication-basic) header, or take other action.

<a id="servlet-authentication-abstractprocessingfilter"></a>

## AbstractAuthenticationProcessingFilter

[`AbstractAuthenticationProcessingFilter`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/web/authentication/AbstractAuthenticationProcessingFilter.html) is used as a base `Filter` for authenticating a user’s credentials.
Before the credentials can be authenticated, Spring Security typically requests the credentials by using [`AuthenticationEntryPoint`](#servlet-authentication-authenticationentrypoint).

Next, the `AbstractAuthenticationProcessingFilter` can authenticate any authentication requests that are submitted to it.

![abstractauthenticationprocessingfilter](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.5/docs/modules/ROOT/assets/images/servlet/authentication/architecture/abstractauthenticationprocessingfilter.png)

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.5/docs/modules/ROOT/assets/images/icons/number_1.png) When the user submits their credentials, the `AbstractAuthenticationProcessingFilter` creates an [`Authentication`](#servlet-authentication-authentication) from the `HttpServletRequest` to be authenticated.
The type of `Authentication` created depends on the subclass of `AbstractAuthenticationProcessingFilter`.
For example, [`UsernamePasswordAuthenticationFilter`](passwords/form.md#servlet-authentication-usernamepasswordauthenticationfilter) creates a `UsernamePasswordAuthenticationToken` from a *username* and *password* that are submitted in the `HttpServletRequest`.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.5/docs/modules/ROOT/assets/images/icons/number_2.png) Next, the [`Authentication`](#servlet-authentication-authentication) is passed into the [`AuthenticationManager`](#servlet-authentication-authenticationmanager) to be authenticated.

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.5/docs/modules/ROOT/assets/images/icons/number_3.png) If authentication fails, then *Failure*.

- The [SecurityContextHolder](#servlet-authentication-securitycontextholder) is cleared out.
- `RememberMeServices.loginFail` is invoked.
If remember me is not configured, this is a no-op.
See the [`rememberme`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/web/authentication/rememberme/package-frame.html) package.
- `AuthenticationFailureHandler` is invoked.
See the [`AuthenticationFailureHandler`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/web/authentication/AuthenticationFailureHandler.html) interface.

![number 4](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.5/docs/modules/ROOT/assets/images/icons/number_4.png) If authentication is successful, then *Success*.

- `SessionAuthenticationStrategy` is notified of a new login.
See the [`SessionAuthenticationStrategy`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/web/authentication/session/SessionAuthenticationStrategy.html) interface.
- The [Authentication](#servlet-authentication-authentication) is set on the [SecurityContextHolder](#servlet-authentication-securitycontextholder).
Later, if you need to save the `SecurityContext` so that it can be automatically set on future requests, `SecurityContextRepository#saveContext` must be explicitly invoked.
See the [`SecurityContextHolderFilter`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/web/context/SecurityContextHolderFilter.html) class.
- `RememberMeServices.loginSuccess` is invoked.
If remember me is not configured, this is a no-op.
See the [`rememberme`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/web/authentication/rememberme/package-frame.html) package.
- `ApplicationEventPublisher` publishes an `InteractiveAuthenticationSuccessEvent`.
- `AuthenticationSuccessHandler` is invoked.
See the [`AuthenticationSuccessHandler`](https://docs.spring.io/spring-security/site/docs/6.2.5/api/org/springframework/security/web/authentication/AuthenticationSuccessHandler.html) interface.
