---
title: "OAuth 2.0 Resource Server"
source: "ROOT:reactive/oauth2/resource-server/index.adoc"
---

<a id="webflux-oauth2-resource-server"></a>

# OAuth 2.0 Resource Server

Spring Security supports protecting endpoints by offering two forms of OAuth 2.0 [Bearer Tokens](https://tools.ietf.org/html/rfc6750.html):

- [JWT](https://tools.ietf.org/html/rfc7519)
- Opaque Tokens

This is handy in circumstances where an application has delegated its authority management to an [authorization server](https://tools.ietf.org/html/rfc6749) (for example, Okta or Ping Identity).
Resource serves can consult this authorization server to authorize requests.

> [!NOTE]
> A complete working example for [JWT](https://github.com/spring-projects/spring-security-samples/tree/6.2.x/reactive/webflux/java/oauth2/resource-server)  is available in the [Spring Security repository](https://github.com/spring-projects/spring-security-samples/tree/6.2.x).
