---
title: "DaoAuthenticationProvider"
source: "ROOT:servlet/authentication/passwords/dao-authentication-provider.adoc"
---

<a id="servlet-authentication-daoauthenticationprovider"></a>

# DaoAuthenticationProvider

[`DaoAuthenticationProvider`](https://docs.spring.io/spring-security/site/docs/6.2.7/api/org/springframework/security/authentication/dao/DaoAuthenticationProvider.html) is an [`AuthenticationProvider`](../architecture.md#servlet-authentication-authenticationprovider) implementation that uses a [`UserDetailsService`](user-details-service.md#servlet-authentication-userdetailsservice) and [`PasswordEncoder`](password-encoder.md#servlet-authentication-password-storage) to authenticate a username and password.

This section examines how `DaoAuthenticationProvider` works within Spring Security.
The following figure explains the workings of the [`AuthenticationManager`](../architecture.md#servlet-authentication-authenticationmanager) in figures from the [Reading the Username & Password](index.md#servlet-authentication-unpwd-input) section.

#### `DaoAuthenticationProvider` Usage

![daoauthenticationprovider](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.7/docs/modules/ROOT/assets/images/servlet/authentication/unpwd/daoauthenticationprovider.png)

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.7/docs/modules/ROOT/assets/images/icons/number_1.png) The authentication `Filter` from the [Reading the Username & Password](index.md#servlet-authentication-unpwd-input) section passes a `UsernamePasswordAuthenticationToken` to the `AuthenticationManager`, which is implemented by [`ProviderManager`](../architecture.md#servlet-authentication-providermanager).

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.7/docs/modules/ROOT/assets/images/icons/number_2.png) The `ProviderManager` is configured to use an [AuthenticationProvider](../architecture.md#servlet-authentication-authenticationprovider) of type `DaoAuthenticationProvider`.

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.7/docs/modules/ROOT/assets/images/icons/number_3.png) `DaoAuthenticationProvider` looks up the `UserDetails` from the `UserDetailsService`.

![number 4](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.7/docs/modules/ROOT/assets/images/icons/number_4.png) `DaoAuthenticationProvider` uses the [`PasswordEncoder`](password-encoder.md#servlet-authentication-password-storage) to validate the password on the `UserDetails` returned in the previous step.

![number 5](https://raw.githubusercontent.com/spring-projects/spring-security/6.2.7/docs/modules/ROOT/assets/images/icons/number_5.png) When authentication is successful, the [`Authentication`](../architecture.md#servlet-authentication-authentication) that is returned is of type `UsernamePasswordAuthenticationToken` and has a principal that is the `UserDetails` returned by the configured `UserDetailsService`.
Ultimately, the returned `UsernamePasswordAuthenticationToken` is set on the [`SecurityContextHolder`](../architecture.md#servlet-authentication-securitycontextholder) by the authentication `Filter`.
