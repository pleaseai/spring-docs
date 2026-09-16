---
title: "Authentication"
source: "ROOT:features/authentication/index.adoc"
---

<a id="authentication"></a>

# Authentication

Spring Security provides comprehensive support for [authentication](https://en.wikipedia.org/wiki/Authentication).
Authentication is how we verify the identity of who is trying to access a particular resource.
A common way to authenticate users is by requiring the user to enter a username and password.
Once authentication is performed we know the identity and can perform authorization.

Spring Security provides built-in support for authenticating users.
This section is dedicated to generic authentication support that applies in both Servlet and WebFlux environments.
Refer to the sections on authentication for [Servlet](../../servlet/authentication/index.md#servlet-authentication) and [WebFlux](../../servlet/authentication/index.md) for details on what is supported for each stack.
