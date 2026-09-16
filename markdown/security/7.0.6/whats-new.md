---
title: "What’s New in Spring Security 7.0"
source: "ROOT:whats-new.adoc"
---

<a id="new"></a>

# What’s New in Spring Security 7.0

Spring Security 7.0 provides a number of new features.
Below are the highlights of the release, or you can view [the release notes](https://github.com/spring-projects/spring-security/releases) for a detailed listing of each feature and bug fix.

<a id="_removals"></a>

## Removals

Being a major release, there are a number of deprecated APIs that are removed in Spring Security 7.
Each section that follows will indicate the more notable removals as well as the new features in that module

<a id="_modules"></a>

## Modules

- The [Spring Security Kerberos Extension](https://github.com/spring-projects/spring-security-kerberos) is now part of Spring Security. See the [Kerberos](servlet/authentication/kerberos/index.md) section of the reference for details.
- [Spring Authorization Server](https://github.com/spring-projects/spring-authorization-server) is now part of Spring Security. See the [OAuth 2.0 Authorization Server](servlet/oauth2/authorization-server/index.md) section of the reference for details.

<a id="_core"></a>

## Core

- Added Support for [Multi-Factor Authentication](servlet/authentication/mfa.md)
- Removed `AuthorizationManager#check` in favor of `AuthorizationManager#authorize`
- Added [`AllAuthoritiesAuthorizationManager`](https://docs.spring.io/spring-security/site/docs/7.0.6/api/org/springframework/security/authorization/AllAuthoritiesAuthorizationManager.html) and [`AllAuthoritiesReactiveAuthorizationManager`](https://docs.spring.io/spring-security/site/docs/7.0.6/api/org/springframework/security/authorization/AllAuthoritiesReactiveAuthorizationManager.html) along with corresponding methods for [Authorizing `HttpServletRequests`](servlet/authorization/authorize-http-requests.md#authorize-requests) and [method security expressions](servlet/authorization/method-security.md#using-authorization-expression-fields-and-methods).
- Added [`AuthorizationManagerFactory`](servlet/authorization/architecture.md#authz-authorization-manager-factory) for creating `AuthorizationManager` instances in [request-based](servlet/authorization/authorize-http-requests.md#customizing-authorization-managers) and [method-based](servlet/authorization/method-security.md#customizing-authorization-managers) authorization components
- Added [`Authentication.Builder`](https://docs.spring.io/spring-security/site/docs/7.0.6/api/org/springframework/security/core/Authentication.Builder.html) for mutating and merging `Authentication` instances
- Moved Access API (`AccessDecisionManager`, `AccessDecisionVoter`, etc.) to a new module, `spring-security-access`

<a id="_config"></a>

## Config

- Support modular configuration in [Servlets](servlet/configuration/java.md#modular-httpsecurity-configuration) and [WebFlux](reactive/configuration/webflux.md#modular-serverhttpsecurity-configuration)
- Removed `and()` from the `HttpSecurity` DSL in favor of using the lambda methods
- Removed `authorizeRequests` in favor of `authorizeHttpRequests`
- Simplified expression migration for `authorizeRequests`
- Added support for SPA-based CSRF configuration
- Added support for [binding missing authorities to authentication mechanisms](https://docs.spring.io/spring-security/site/docs/7.0.6/api/org/springframework/security/web/access/DelegatingMissingAuthorityAccessDeniedHandler.html).

  **Java**

  ```java
  http.csrf((csrf) -> csrf.spa());
  ```

<a id="_crypto"></a>

## Crypto

- Added Password4j-based password encoders providing alternative implementations for popular hashing algorithms:

  - `Argon2Password4jPasswordEncoder` - [Argon2](features/authentication/password-storage.md#password4j-argon2)
  - `BcryptPassword4jPasswordEncoder` - [BCrypt](features/authentication/password-storage.md#password4j-bcrypt)
  - `ScryptPassword4jPasswordEncoder` - [SCrypt](features/authentication/password-storage.md#password4j-scrypt)
  - `Pbkdf2Password4jPasswordEncoder` - [PBKDF2](features/authentication/password-storage.md#password4j-pbkdf2)
  - `BalloonHashingPassword4jPasswordEncoder` - [Balloon Hashing](features/authentication/password-storage.md#password4j-balloon)

<a id="_data"></a>

## Data

- Added support to Authorized objects for Spring Data types

<a id="_ldap"></a>

## LDAP

- Removed `ApacheDsContainer` and related Apache DS support in favor of UnboundID

<a id="_oauth_2_0"></a>

## OAuth 2.0

- Removed support for password grant
- Added OAuth2 Support for [HTTP Service Clients](features/integrations/rest/http-service-client.md)
- Added support for custom `JwkSource` in `NimbusJwtDecoder`, allowing usage of Nimbus’s `JwkSourceBuilder` API
- Added builder for `NimbusJwtEncoder`, supports specifying an EC or RSA key pair or a secret key
- Added support for `@ClientRegistrationId` at the [type level](features/integrations/rest/http-service-client.md#type), eliminating the need for method level repetition
- Added support for [OAuth 2.0 Dynamic Registration Protocol](https://github.com/spring-projects/spring-security/issues/17964)
- Enabled [PKCE by default](https://github.com/spring-projects/spring-security/issues/18020) in OAuth 2.0 Authorization Server

<a id="_saml_2_0"></a>

## SAML 2.0

- Removed API methods based on `AssertingPartyDetails` class in favor of `AssertingPartyMetadata` interface
- Removed GET request support from `Saml2AuthenticationTokenConverter`
- Added JDBC-based `AssertingPartyMetadataRepository`
- Made so that SLO still returns `<saml2:LogoutResponse>` even when validation fails
- Removed Open SAML 4 support; applications should migrate to Open SAML 5

<a id="_test"></a>

## Test

- [Add SecurityMockMvcResultMatchers.withAuthorities(String…​)](https://github.com/spring-projects/spring-security/issues/17974)

<a id="_web"></a>

## Web

- Removed `MvcRequestMatcher` and `AntPathRequestMatcher` in favor of `PathPatternRequestMatcher`
- Added [`SubjectX500PrincipalExtractor`](https://docs.spring.io/spring-security/site/docs/7.0.6/api/org/springframework/security/web/authentication/preauth/x509/SubjectX500PrincipalExtractor.html)
- Added support for propagating exceptions in Authorized proxies through Spring MVC controllers
- Added support to Authorized objects for Spring MVC types
- Added support to Default Login Page to show factors based on `factor.type` and `factor.reason` parameters
- Changed LoginUrlAuthenticationEntryPoint to favor relative redirects by default
