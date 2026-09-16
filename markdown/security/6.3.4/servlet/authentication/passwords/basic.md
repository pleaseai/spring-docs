---
title: "Basic Authentication"
source: "ROOT:servlet/authentication/passwords/basic.adoc"
---

<a id="servlet-authentication-basic"></a>

# Basic Authentication

This section provides details on how Spring Security provides support for [Basic HTTP Authentication](https://tools.ietf.org/html/rfc7617) for servlet-based applications.

This section describes how HTTP Basic Authentication works within Spring Security.
First, we see the [WWW-Authenticate](https://tools.ietf.org/html/rfc7235#section-4.1) header is sent back to an unauthenticated client:

#### Sending WWW-Authenticate Header

![basicauthenticationentrypoint](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.4/docs/modules/ROOT/assets/images/servlet/authentication/unpwd/basicauthenticationentrypoint.png)

The preceding figure builds off our [`SecurityFilterChain`](../../architecture.md#servlet-securityfilterchain) diagram.

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.4/docs/modules/ROOT/assets/images/icons/number_1.png) First, a user makes an unauthenticated request to the resource `/private` for which it is not authorized.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.4/docs/modules/ROOT/assets/images/icons/number_2.png) Spring Security’s [`AuthorizationFilter`](../../authorization/authorize-http-requests.md) indicates that the unauthenticated request is *Denied* by throwing an `AccessDeniedException`.

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.4/docs/modules/ROOT/assets/images/icons/number_3.png) Since the user is not authenticated, [`ExceptionTranslationFilter`](../../architecture.md#servlet-exceptiontranslationfilter) initiates *Start Authentication*.
The configured [`AuthenticationEntryPoint`](../architecture.md#servlet-authentication-authenticationentrypoint) is an instance of [`BasicAuthenticationEntryPoint`](https://docs.spring.io/spring-security/site/docs/6.3.4/api/org/springframework/security/web/authentication/www/BasicAuthenticationEntryPoint.html), which sends a WWW-Authenticate header.
The `RequestCache` is typically a `NullRequestCache` that does not save the request since the client is capable of replaying the requests it originally requested.

When a client receives the `WWW-Authenticate` header, it knows it should retry with a username and password.
The following image shows the flow for the username and password being processed:

<a id="servlet-authentication-basicauthenticationfilter"></a>

#### Authenticating Username and Password

![basicauthenticationfilter](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.4/docs/modules/ROOT/assets/images/servlet/authentication/unpwd/basicauthenticationfilter.png)

The preceding figure builds off our [`SecurityFilterChain`](../../architecture.md#servlet-securityfilterchain) diagram.

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.4/docs/modules/ROOT/assets/images/icons/number_1.png) When the user submits their username and password, the `BasicAuthenticationFilter` creates a `UsernamePasswordAuthenticationToken`, which is a type of [`Authentication`](../architecture.md#servlet-authentication-authentication) by extracting the username and password from the `HttpServletRequest`.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.4/docs/modules/ROOT/assets/images/icons/number_2.png) Next, the `UsernamePasswordAuthenticationToken` is passed into the `AuthenticationManager` to be authenticated.
The details of what `AuthenticationManager` looks like depend on how the [user information is stored](index.md#servlet-authentication-unpwd-storage).

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.4/docs/modules/ROOT/assets/images/icons/number_3.png) If authentication fails, then *Failure*.

1. The [SecurityContextHolder](../architecture.md#servlet-authentication-securitycontextholder) is cleared out.
1. `RememberMeServices.loginFail` is invoked.
If remember me is not configured, this is a no-op.
See the [`RememberMeServices`](https://docs.spring.io/spring-security/site/docs/6.3.4/api/org/springframework/security/web/authentication/RememberMeServices.html) interface in the Javadoc.
1. `AuthenticationEntryPoint` is invoked to trigger the WWW-Authenticate to be sent again.
See the [`AuthenticationEntryPoint`](https://docs.spring.io/spring-security/site/docs/6.3.4/api/org/springframework/security/web/AuthenticationEntryPoint.html) interface in the Javadoc.

![number 4](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.4/docs/modules/ROOT/assets/images/icons/number_4.png) If authentication is successful, then *Success*.

1. The [Authentication](../architecture.md#servlet-authentication-authentication) is set on the [SecurityContextHolder](../architecture.md#servlet-authentication-securitycontextholder).
1. `RememberMeServices.loginSuccess` is invoked.
If remember me is not configured, this is a no-op.
See the [`RememberMeServices`](https://docs.spring.io/spring-security/site/docs/6.3.4/api/org/springframework/security/web/authentication/RememberMeServices.html) interface in the Javadoc.
1. The `BasicAuthenticationFilter` invokes `FilterChain.doFilter(request,response)` to continue with the rest of the application logic.
See the [`BasicAuthenticationFilter`](https://docs.spring.io/spring-security/site/docs/6.3.4/api/org/springframework/security/web/authentication/www/BasicAuthenticationFilter.html) Class in the Javadoc

By default, Spring Security’s HTTP Basic Authentication support is enabled.
However, as soon as any servlet based configuration is provided, HTTP Basic must be explicitly provided.

The following example shows a minimal, explicit configuration:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
	http
		// ...
		.httpBasic(withDefaults());
	return http.build();
}
```

#### XML

```xml
<http>
	<!-- ... -->
	<http-basic />
</http>
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
	http {
		// ...
		httpBasic { }
	}
	return http.build()
}
```
