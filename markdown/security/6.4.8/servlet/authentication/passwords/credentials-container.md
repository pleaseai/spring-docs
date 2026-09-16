---
title: "CredentialsContainer"
source: "ROOT:servlet/authentication/passwords/credentials-container.adoc"
---

<a id="servlet-authentication-credentialscontainer"></a>

# CredentialsContainer

The [`CredentialsContainer`](https://docs.spring.io/spring-security/site/docs/6.4.8/api/org/springframework/security/core/CredentialsContainer.html) interface indicates that the implementing object contains sensitive data, and is used internally by Spring Security to erase the authentication credentials after a successful authentication.
This interface is implemented by most of Spring Security internal domain classes, like [`User`](https://docs.spring.io/spring-security/site/docs/6.4.8/api/org/springframework/security/core/userdetails/User.html) and [`UsernamePasswordAuthenticationToken`](https://docs.spring.io/spring-security/site/docs/6.4.8/api/org/springframework/security/authentication/UsernamePasswordAuthenticationToken.html).

The `ProviderManager` manager checks whether the returned `Authentication` implements this interface.
If so, [it calls the `eraseCredentials` method](../architecture.md#servlet-authentication-providermanager-erasing-credentials) to remove the credentials from the object.

If you want your custom authentication objects to have their credentials erased after authentication, you should ensure that the classes implement the `CredentialsContainer` interface.

Users who are writing their own `AuthenticationProvider` implementations should create and return an appropriate `Authentication` object there, minus any sensitive data, rather than using this interface.
