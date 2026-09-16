---
title: "What’s New in Spring Security 7.1"
source: "ROOT:whats-new.adoc"
---

<a id="new"></a>

# What’s New in Spring Security 7.1

<a id="_core"></a>

## Core

- [gh-18634](https://github.com/spring-projects/spring-security/pull/18634) - Added [`InetAddressMatcher`](https://docs.spring.io/spring-security/site/docs/7.1.1/api/org/springframework/security/util/matcher/InetAddressMatcher.html)
- [gh-18960](https://github.com/spring-projects/spring-security/issues/18960) - Added [AllRequiredFactorsAuthorizationManager.anyOf](servlet/authentication/mfa.md#all-factors-anyof)

<a id="_web"></a>

## Web

- [gh-18755](https://github.com/spring-projects/spring-security/issues/18755) - Include `charset` in `WWW-Authenticate` header
- Added [ConditionalAuthorizationManager](servlet/authorization/architecture.md#authz-conditional-authorization-manager)
- Added `when` and `withWhen` conditions to `AuthorizationManagerFactories.multiFactor()` for [Programmatic MFA](servlet/authentication/mfa.md#programmatic-mfa)
- Added `MultiFactorCondition.WEBAUTHN_REGISTERED` to `@EnableMultiFactorAuthentication(when = …​)` for [conditionally requiring MFA for WebAuthn Users](servlet/authentication/mfa.md#mfa-when-webauthn-registered)
- [gh-18926](https://github.com/spring-projects/spring-security/issues/18926) - [Add `PreFlightRequestFilter` Support](servlet/integrations/cors.md)

<a id="_oauth_2_0"></a>

## OAuth 2.0

- [gh-18745](https://github.com/spring-projects/spring-security/issues/18745) - Add RestClientOpaqueTokenIntrospector

<a id="_webauthn"></a>

## WebAuthn

- [gh-18113](https://github.com/spring-projects/spring-security/issues/18113) - Publish Authentication Events in WebAuthn
