---
title: "Authentication"
source: "ROOT:servlet/authentication/index.adoc"
---

<a id="servlet-authentication"></a>

# Authentication

Spring Security provides comprehensive support for [Authentication](../../features/authentication/index.md#authentication).
We start by discussing the overall [Servlet Authentication Architecture](architecture.md).
As you might expect, this section is more abstract describing the architecture without much discussion on how it applies to concrete flows.

If you prefer, you can refer to [Authentication Mechanisms](#servlet-authentication-mechanisms) for concrete ways in which users can authenticate.
These sections focus on specific ways you may want to authenticate and point back at the architecture sections to describe how the specific flows work.

<a id="servlet-authentication-mechanisms"></a>

## Authentication Mechanisms

- [Username and Password](passwords/index.md#servlet-authentication-unpwd) - how to authenticate with a username/password
- [OAuth 2.0 Login](../oauth2/login/index.md#oauth2login) - OAuth 2.0 Log In with OpenID Connect and non-standard OAuth 2.0 Login (i.e. GitHub)
- [SAML 2.0 Login](../saml2/index.md#servlet-saml2) - SAML 2.0 Log In
- [Central Authentication Server (CAS)](cas.md#servlet-cas) - Central Authentication Server (CAS) Support
- [Remember Me](rememberme.md#servlet-rememberme) - how to remember a user past session expiration
- [JAAS Authentication](jaas.md#servlet-jaas) - authenticate with JAAS
- [Pre-Authentication Scenarios](preauth.md#servlet-preauth) - authenticate with an external mechanism such as [SiteMinder](https://www.siteminder.com/) or Java EE security but still use Spring Security for authorization and protection against common exploits.
- [X509 Authentication](x509.md#servlet-x509) - X509 Authentication
