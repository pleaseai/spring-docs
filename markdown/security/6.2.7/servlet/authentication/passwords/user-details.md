---
title: "UserDetails"
source: "ROOT:servlet/authentication/passwords/user-details.adoc"
---

<a id="servlet-authentication-userdetails"></a>

# UserDetails

[`UserDetails`](https://docs.spring.io/spring-security/site/docs/6.2.7/api/org/springframework/security/core/userdetails/UserDetails.html) is returned by the [`UserDetailsService`](user-details-service.md#servlet-authentication-userdetailsservice).
The [`DaoAuthenticationProvider`](dao-authentication-provider.md#servlet-authentication-daoauthenticationprovider) validates the `UserDetails` and then returns an [`Authentication`](../architecture.md#servlet-authentication-authentication) that has a principal that is the `UserDetails` returned by the configured `UserDetailsService`.
