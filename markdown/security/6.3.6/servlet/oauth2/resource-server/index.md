---
title: "OAuth 2.0 Resource Server"
source: "ROOT:servlet/oauth2/resource-server/index.adoc"
---

<a id="oauth2resourceserver"></a>

# OAuth 2.0 Resource Server

Spring Security supports protecting endpoints by using two forms of OAuth 2.0 [Bearer Tokens](https://tools.ietf.org/html/rfc6750.html):

- [JWT](https://tools.ietf.org/html/rfc7519)
- Opaque Tokens

This is handy in circumstances where an application has delegated its authority management to an [authorization server](https://tools.ietf.org/html/rfc6749) (for example, Okta or Ping Identity).
This authorization server can be consulted by resource servers to authorize requests.

This section details how Spring Security provides support for OAuth 2.0 [Bearer Tokens](https://tools.ietf.org/html/rfc6750.html).

> [!NOTE]
> Working samples for both [JWTs](https://github.com/spring-projects/spring-security-samples/tree/6.3.x/servlet/spring-boot/java/oauth2/resource-server/jwe) and [Opaque Tokens](https://github.com/spring-projects/spring-security-samples/tree/6.3.x/servlet/spring-boot/java/oauth2/resource-server/opaque) are available in the [Spring Security Samples repository](https://github.com/spring-projects/spring-security-samples/tree/6.3.x).

Now we can consider how Bearer Token Authentication works within Spring Security.
First, we see that, as with [Basic Authentication](../../authentication/passwords/basic.md#servlet-authentication-basic), the [WWW-Authenticate](https://tools.ietf.org/html/rfc7235#section-4.1) header is sent back to an unauthenticated client:

#### Sending WWW-Authenticate Header

![bearerauthenticationentrypoint](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.6/docs/modules/ROOT/assets/images/servlet/oauth2/bearerauthenticationentrypoint.png)

The figure above builds off our [`SecurityFilterChain`](../../architecture.md#servlet-securityfilterchain) diagram.

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.6/docs/modules/ROOT/assets/images/icons/number_1.png) First, a user makes an unauthenticated request to the `/private` resource for which the user is not authorized.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.6/docs/modules/ROOT/assets/images/icons/number_2.png) Spring Security’s [`AuthorizationFilter`](../../authorization/authorize-http-requests.md) indicates that the unauthenticated request is *Denied* by throwing an `AccessDeniedException`.

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.6/docs/modules/ROOT/assets/images/icons/number_3.png) Since the user is not authenticated, [`ExceptionTranslationFilter`](../../architecture.md#servlet-exceptiontranslationfilter) initiates *Start Authentication*.
The configured [`AuthenticationEntryPoint`](../../authentication/architecture.md#servlet-authentication-authenticationentrypoint) is an instance of [`BearerTokenAuthenticationEntryPoint`](https://docs.spring.io/spring-security/site/docs/6.3.6/api/org/springframework/security/oauth2/server/resource/authentication/BearerTokenAuthenticationEntryPoint.html), which sends a `WWW-Authenticate` header.
The `RequestCache` is typically a `NullRequestCache` that does not save the request, since the client is capable of replaying the requests it originally requested.

When a client receives the `WWW-Authenticate: Bearer` header, it knows it should retry with a bearer token.
The following image shows the flow for the bearer token being processed:

<a id="oauth2resourceserver-authentication-bearertokenauthenticationfilter"></a>

#### Authenticating Bearer Token

![bearertokenauthenticationfilter](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.6/docs/modules/ROOT/assets/images/servlet/oauth2/bearertokenauthenticationfilter.png)

The figure builds off our [`SecurityFilterChain`](../../architecture.md#servlet-securityfilterchain) diagram.

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.6/docs/modules/ROOT/assets/images/icons/number_1.png) When the user submits their bearer token, the `BearerTokenAuthenticationFilter` creates a `BearerTokenAuthenticationToken` which is a type of [`Authentication`](../../authentication/architecture.md#servlet-authentication-authentication) by extracting the token from the `HttpServletRequest`.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.6/docs/modules/ROOT/assets/images/icons/number_2.png) Next, the `HttpServletRequest` is passed to the `AuthenticationManagerResolver`, which selects the `AuthenticationManager`. The `BearerTokenAuthenticationToken` is passed into the `AuthenticationManager` to be authenticated.
The details of what `AuthenticationManager` looks like depends on whether you’re configured for [JWT](jwt.md#oauth2resourceserver-jwt-minimalconfiguration) or [opaque token](opaque-token.md#oauth2resourceserver-opaque-minimalconfiguration).

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.6/docs/modules/ROOT/assets/images/icons/number_3.png) If authentication fails, then *Failure*

- The [SecurityContextHolder](../../authentication/architecture.md#servlet-authentication-securitycontextholder) is cleared out.
- The `AuthenticationEntryPoint` is invoked to trigger the WWW-Authenticate header to be sent again.

![number 4](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.6/docs/modules/ROOT/assets/images/icons/number_4.png) If authentication is successful, then *Success*.

- The [Authentication](../../authentication/architecture.md#servlet-authentication-authentication) is set on the [SecurityContextHolder](../../authentication/architecture.md#servlet-authentication-securitycontextholder).
- The `BearerTokenAuthenticationFilter` invokes `FilterChain.doFilter(request,response)` to continue with the rest of the application logic.
