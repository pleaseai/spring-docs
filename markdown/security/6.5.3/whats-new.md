---
title: "What’s New in Spring Security 6.5"
source: "ROOT:whats-new.adoc"
---

<a id="new"></a>

# What’s New in Spring Security 6.5

Spring Security 6.5 provides a number of new features.
Below are the highlights of the release, or you can view [the release notes](https://github.com/spring-projects/spring-security/releases) for a detailed listing of each feature and bug fix.

<a id="_new_features"></a>

## New Features

- Support for automatic context-propagation with Micrometer ([gh-16665](https://github.com/spring-projects/spring-security/issues/16665))
- OAuth 2.0 Demonstrating Proof of Possession (DPoP) ([gh-16574](https://github.com/spring-projects/spring-security/pull/16574))

<a id="_breaking_changes"></a>

## Breaking Changes

<a id="_observability"></a>

### Observability

The `security.security.reached.filter.section` key name was corrected to `spring.security.reached.filter.section`.
Note that this may affect reports that operate on this key name.

<a id="_oauth"></a>

## OAuth

- [gh-16386](https://github.com/spring-projects/spring-security/pull/16386) - Enable PKCE for confidential clients using `ClientRegistration.clientSettings.requireProofKey=true` for [servlet](servlet/oauth2/client/core.md#oauth2Client-client-registration-requireProofKey) and [reactive](reactive/oauth2/client/core.md#oauth2Client-client-registration-requireProofKey) applications
- [gh-16913](https://github.com/spring-projects/spring-security/issues/16913) - Prepare OAuth2 Client deprecations for removal in Spring Security 7

<a id="_webauthn"></a>

## WebAuthn

- [gh-16282](https://github.com/spring-projects/spring-security/pull/16282) - [JDBC Persistence](servlet/authentication/passkeys.md#passkeys-configuration-persistence) for WebAuthn/Passkeys
- [gh-16397](https://github.com/spring-projects/spring-security/pull/16397) - Added the ability to configure a custom `HttpMessageConverter` for Passkeys using the optional [`messageConverter` property](servlet/authentication/passkeys.md#passkeys-configuration) on the `webAuthn` DSL.
- [gh-16396](https://github.com/spring-projects/spring-security/pull/16396) - Added the ability to configure a custom [`PublicKeyCredentialCreationOptionsRepository`](servlet/authentication/passkeys.md#passkeys-configuration-pkccor)

<a id="_one_time_token_login"></a>

## One-Time Token Login

- [gh-16291](https://github.com/spring-projects/spring-security/issues/16291) - `oneTimeTokenLogin()` now supports customizing GenerateOneTimeTokenRequest [via GenerateOneTimeTokenRequestResolver](servlet/authentication/onetimetoken.md#customize-generate-token-request)
