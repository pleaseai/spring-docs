---
title: "Authorization"
source: "ROOT:features/authorization/index.adoc"
---

<a id="authorization"></a>

# Authorization

Spring Security provides comprehensive support for [authorization](https://en.wikipedia.org/wiki/Authorization).
Authorization is determining who is allowed to access a particular resource.
Spring Security provides [defense in depth](<https://en.wikipedia.org/wiki/Defense_in_depth_(computing)>) by allowing for request based authorization and method based authorization.

<a id="authorization-request"></a>

## Request Based Authorization

Spring Security provides authorization based upon the request for both [Servlet](../../servlet/authorization/authorize-http-requests.md) and [WebFlux](../../reactive/authorization/authorize-http-requests.md) environments.

<a id="authorization-method"></a>

## Method Based Authorization

Spring Security provides authorization based on the method invocation for both [Servlet](../../servlet/authorization/method-security.md) and [WebFlux](../../reactive/authorization/method.md) environments.
