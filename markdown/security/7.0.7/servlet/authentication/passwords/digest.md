---
title: "Digest Authentication"
source: "ROOT:servlet/authentication/passwords/digest.adoc"
---

<a id="servlet-authentication-digest"></a>

# Digest Authentication

This section provides details on how Spring Security provides support for [Digest Authentication](https://tools.ietf.org/html/rfc2617), which is provided `DigestAuthenticationFilter`.

> [!WARNING]
> You should not use Digest Authentication in modern applications, because it is not considered to be secure.
> The most obvious problem is that you must store your passwords in plaintext or an encrypted or MD5 format.
> All of these storage formats are considered insecure.
> Instead, you should store credentials by using a one way adaptive password hash (bCrypt, PBKDF2, SCrypt, and others), which is not supported by Digest Authentication.

Digest Authentication tries to solve many of the weaknesses of [Basic authentication](basic.md#servlet-authentication-basic), specifically by ensuring credentials are never sent in clear text across the wire.
Many [browsers support Digest Authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Digest#Browser_compatibility).

The standard governing HTTP Digest Authentication is defined by [RFC 2617](https://tools.ietf.org/html/rfc2617), which updates an earlier version of the Digest Authentication standard prescribed by [RFC 2069](https://tools.ietf.org/html/rfc2069).
Most user agents implement RFC 2617.
Spring Security’s Digest Authentication support is compatible with the “auth” quality of protection (`qop`) prescribed by RFC 2617, which also provides backward compatibility with RFC 2069.
Digest Authentication was seen as a more attractive option if you need to use unencrypted HTTP (no TLS or HTTPS) and wish to maximize security of the authentication process.
However, everyone should use [HTTPS](../../../features/exploits/http.md#http).

Central to Digest Authentication is a “nonce”.
This is a value the server generates.
Spring Security’s nonce adopts the following format:

#### Digest Syntax

```txt
base64(expirationTime + ":" + md5Hex(expirationTime + ":" + key))
expirationTime:   The date and time when the nonce expires, expressed in milliseconds
key:              A private key to prevent modification of the nonce token
```

You need to ensure that you [configure](../../../features/authentication/password-storage.md#authentication-password-storage-configuration) insecure plain text [Password Storage](../../../features/authentication/password-storage.md#authentication-password-storage) using `NoOpPasswordEncoder`.
(See the [`NoOpPasswordEncoder`](https://docs.spring.io/spring-security/site/docs/7.0.7/api/org/springframework/security/crypto/password/NoOpPasswordEncoder.html) class in the Javadoc.)
The following provides an example of configuring Digest Authentication with Java Configuration:

#### Java

```java
@Autowired
UserDetailsService userDetailsService;

DigestAuthenticationEntryPoint authenticationEntryPoint() {
	DigestAuthenticationEntryPoint result = new DigestAuthenticationEntryPoint();
	result.setRealmName("My App Realm");
	result.setKey("3028472b-da34-4501-bfd8-a355c42bdf92");
	return result;
}

DigestAuthenticationFilter digestAuthenticationFilter() {
	DigestAuthenticationFilter result = new DigestAuthenticationFilter();
	result.setUserDetailsService(userDetailsService);
	result.setAuthenticationEntryPoint(authenticationEntryPoint());
	return result;
}

@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	http
		// ...
		.exceptionHandling((e) -> e.authenticationEntryPoint(authenticationEntryPoint()))
		.addFilter(digestAuthenticationFilter());
	return http.build();
}
```

#### XML

```xml
<b:bean id="digestFilter"
        class="org.springframework.security.web.authentication.www.DigestAuthenticationFilter"
    p:userDetailsService-ref="jdbcDaoImpl"
    p:authenticationEntryPoint-ref="digestEntryPoint"
/>

<b:bean id="digestEntryPoint"
        class="org.springframework.security.web.authentication.www.DigestAuthenticationEntryPoint"
    p:realmName="My App Realm"
	p:key="3028472b-da34-4501-bfd8-a355c42bdf92"
/>

<http>
	<!-- ... -->
	<custom-filter ref="userFilter" position="DIGEST_AUTH_FILTER"/>
</http>
```
