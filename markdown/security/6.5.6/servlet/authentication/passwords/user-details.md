---
title: "UserDetails"
source: "ROOT:servlet/authentication/passwords/user-details.adoc"
---

<a id="servlet-authentication-userdetails"></a>

# UserDetails

[`UserDetails`](https://docs.spring.io/spring-security/site/docs/6.5.6/api/org/springframework/security/core/userdetails/UserDetails.html) is returned by the [`UserDetailsService`](user-details-service.md#servlet-authentication-userdetailsservice).
The [`DaoAuthenticationProvider`](dao-authentication-provider.md#servlet-authentication-daoauthenticationprovider) validates the `UserDetails` and then returns an [`Authentication`](../architecture.md#servlet-authentication-authentication) that has a principal that is the `UserDetails` returned by the configured `UserDetailsService`.

<a id="_credentials_management"></a>

## Credentials Management

Implementing the `CredentialsContainer` interface in classes that store user credentials, such as those extending or implementing `UserDetails`, is strongly recommended, especially in applications where user details are not cached.
This practice enhances security by ensuring that sensitive data, such as passwords, are not retained in memory longer than necessary.

> [!TIP]
> In cases where user details are cached, consider creating a copy of the `UserDetails` that does not include credentials and returning the copy in the response from a custom `AuthenticationProvider` instead of the original object.
> This can help prevent the cached instance containing credentials from being referenced by the rest of the application once the authentication process is complete.

<a id="_when_to_implement_credentialscontainer"></a>

### When to Implement `CredentialsContainer`

Applications that do not employ caching mechanisms for `UserDetails` should particularly consider implementing `CredentialsContainer`.
This approach helps in mitigating the risk associated with retaining sensitive information in memory, which can be vulnerable to attack vectors such as memory dumps.

```java
public class MyUserDetails implements UserDetails, CredentialsContainer {

    private String username;

    private String password;

    // UserDetails implementation...

    @Override
    public void eraseCredentials() {
        this.password = null; // Securely dereference the password field
    }

}
```

<a id="_implementation_guidelines"></a>

### Implementation Guidelines

- **Immediate Erasure**: Credentials should be erased immediately after they are no longer needed, typically post-authentication.
- **Automatic Invocation**: Ensure that `eraseCredentials()` is automatically called by your authentication framework, such as `AuthenticationManager`, once the authentication process is complete.
- **Consistency**: Apply this practice uniformly across all applications to prevent security lapses that could lead to data breaches.

<a id="_beyond_basic_interface_implementation"></a>

### Beyond Basic Interface Implementation

While interfaces like `CredentialsContainer` provide a framework for credential management, the practical implementation often depends on specific classes and their interactions.

For example, the `DaoAuthenticationProvider` class, adhering to the contract of `AuthenticationProvider`, does not perform credential erasure within its own `authenticate` method.
Instead, it relies on `ProviderManager`—Spring Security’s default implementation of `AuthenticationManager`—to handle the erasure of credentials and other sensitive data post-authentication.
This separation emphasizes the principle that the `AuthenticationProvider` should not assume the responsibility for credentials management.

Incorporating `CredentialsContainer` into your `UserDetails` implementation aligns with security best practices, reducing potential exposure to data breaches by minimizing the lifespan of sensitive data in memory.
