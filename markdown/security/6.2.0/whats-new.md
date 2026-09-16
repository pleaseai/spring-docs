---
title: "What’s New in Spring Security 6.2"
source: "ROOT:whats-new.adoc"
---

<a id="new"></a>

# What’s New in Spring Security 6.2

Spring Security 6.2 provides a number of new features.
Below are the highlights of the release.

<a id="_configuration"></a>

## Configuration

- [gh-5011](https://github.com/spring-projects/spring-security/issues/5011) - [(docs)](servlet/integrations/cors.md) Automatically enable `.cors()` if `CorsConfigurationSource` bean is present
- [gh-13204](https://github.com/spring-projects/spring-security/issues/13204) - [(docs)](migration-7/configuration.md#_use_with_instead_of_apply_for_custom_dsls) Add `AbstractConfiguredSecurityBuilder.with(…​)` method to apply configurers returning the builder
- [gh-13587](https://github.com/spring-projects/spring-security/pull/13587) - [blog post](https://spring.io/blog/2023/08/22/tackling-the-oauth2-client-component-model-in-spring-security/) Simplify configuration of OAuth2 Client component model
- [gh-13857](https://github.com/spring-projects/spring-security/pull/13857) - [docs](servlet/authorization/authorize-http-requests.md#match-by-mvc) Add servlet pattern support to AuthorizeHttpRequests

<a id="_oauth_2_0oidc"></a>

## OAuth 2.0/OIDC

- [gh-7845](https://github.com/spring-projects/spring-security/issues/7845) - [docs](reactive/oauth2/login/logout.md#configure-provider-initiated-oidc-logout) Add OIDC Back-channel Logout Support

<a id="_messaging"></a>

## Messaging

- [gh-12532](https://github.com/spring-projects/spring-security/pull/12532) - Add Security Context Propagation Support

<a id="_web"></a>

## Web

- [gh-12817](https://github.com/spring-projects/spring-security/pull/12817) - Make Configurable RedirectStrategy status code
- [gh-13988](https://github.com/spring-projects/spring-security/issues/13988) - Make Configurable HTTP Basic request parsing

<a id="_documentation"></a>

## Documentation

- [gh-13784](https://github.com/spring-projects/spring-security/issues/13784) - [docs](servlet/oauth2/index.md) - Update OAuth2 docs landing page with examples
- [gh-11926](https://github.com/spring-projects/spring-security/issues/11926) - [docs](servlet/authentication/passwords/index.md#publish-authentication-manager-bean) Document how to publish an `AuthenticationManager` `@Bean` without `WebSecurityConfigurerAdapter`
