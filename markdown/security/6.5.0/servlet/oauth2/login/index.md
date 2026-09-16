---
title: "OAuth 2.0 Login"
source: "ROOT:servlet/oauth2/login/index.adoc"
---

<a id="oauth2login"></a>

# OAuth 2.0 Login

The OAuth 2.0 Login feature lets an application have users log in to the application by using their existing account at an OAuth 2.0 Provider (such as GitHub) or OpenID Connect 1.0 Provider (such as Google).
OAuth 2.0 Login implements two use cases: “Login with Google” or “Login with GitHub”.

> [!NOTE]
> OAuth 2.0 Login is implemented by using the **Authorization Code Grant**, as specified in the [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749#section-4.1) and [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth).
