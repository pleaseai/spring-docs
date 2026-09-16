---
title: "OAuth 2.0 Changes"
source: "ROOT:migration-7/oauth2.adoc"
---

# OAuth 2.0 Changes

<a id="_validate_typ_header_with_jwttypevalidator"></a>

## Validate `typ` Header with `JwtTypeValidator`

`NimbusJwtDecoder` in Spring Security 7 will move `typ` header validation to `JwtTypeValidator` instead of relying on Nimbus.
This brings it in line with `NimbusJwtDecoder` validating claims instead of relying on Nimbus to validate them.

If you are changing Nimbus’s default type validation in a `jwtProcessorCustomizer` method, then you should move that to `JwtTypeValidator` or an implementation of `OAuth2TokenValidator` of your own.

To check if you are prepared for this change, add the default `JwtTypeValidator` to your list of validators, as this will be included by default in 7:

#### Java

```java
@Bean
JwtDecoder jwtDecoder() {
	NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withIssuerLocation(location)
        .validateTypes(false) <1>
        // ... your remaining configuration
        .build();
	jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithValidators(
		new JwtIssuerValidator(location), JwtTypeValidator.jwt())); <2>
	return jwtDecoder;
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): JwtDecoder {
    val jwtDecoder = NimbusJwtDecoder.withIssuerLocation(location)
        .validateTypes(false) <1>
        // ... your remaining configuration
        .build()
    jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithValidators(
        JwtIssuerValidator(location), JwtTypeValidator.jwt())) <2>
    return jwtDecoder
}
```

1. - Switch off Nimbus verifying the `typ` (this will be off by default in 7)
1. - Add the default `typ` validator (this will be included by default in 7)

Note the default value verifies that the `typ` value either be `JWT` or not present, which is the same as the Nimbus default.
It is also aligned with [RFC 7515](https://datatracker.ietf.org/doc/html/rfc7515#section-4.1.9) which states that `typ` is optional.

<a id="_im_using_a_defaultjoseobjecttypeverifier"></a>

### I’m Using A `DefaultJOSEObjectTypeVerifier`

If you have something like the following in your configuration:

#### Java

```java
@Bean
JwtDecoder jwtDecoder() {
	NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withIssuerLocation(location)
        .jwtProcessorCustomizer((c) -> c
            .setJWSTypeVerifier(new DefaultJOSEObjectTypeVerifier<>("JOSE"))
        )
        .build();
	return jwtDecoder;
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): JwtDecoder {
    val jwtDecoder = NimbusJwtDecoder.withIssuerLocation(location)
        .jwtProcessorCustomizer {
            it.setJWSTypeVerifier(DefaultJOSEObjectTypeVerifier("JOSE"))
        }
        .build()
    return jwtDecoder
}
```

Then change this to:

#### Java

```java
@Bean
JwtDecoder jwtDecoder() {
	NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withIssuerLocation(location)
        .validateTypes(false)
        .build();
	jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithValidators(
		new JwtIssuerValidator(location), new JwtTypeValidator("JOSE")));
	return jwtDecoder;
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): JwtDecoder {
    val jwtDecoder = NimbusJwtDecoder.withIssuerLocation(location)
        .validateTypes(false)
        .build()
	jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithValidators(
		JwtIssuerValidator(location), JwtTypeValidator("JOSE")))
    return jwtDecoder
}
```

To indicate that the `typ` header is optional, use `#setAllowEmpty(true)` (this is the equivalent of including `null` in the list of allowed types in `DefaultJOSEObjectTypeVerifier`).

<a id="_i_want_to_opt_out"></a>

### I want to opt-out

If you want to keep doing things the way that you are, then the steps are similar, just in reverse:

#### Java

```java
@Bean
JwtDecoder jwtDecoder() {
	NimbusJwtDecoder jwtDecoder = NimbusJwtDecoder.withIssuerLocation(location)
        .validateTypes(true) <1>
        .jwtProcessorCustomizer((c) -> c
            .setJWSTypeVerifier(new DefaultJOSEObjectTypeVerifier<>("JOSE"))
        )
        .build();
	jwtDecoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
		new JwtTimestampValidator(), new JwtIssuerValidator(location))); <2>
	return jwtDecoder;
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): JwtDecoder {
    val jwtDecoder = NimbusJwtDecoder.withIssuerLocation(location)
        .validateTypes(true) <1>
        .jwtProcessorCustomizer {
            it.setJWSTypeVerifier(DefaultJOSEObjectTypeVerifier("JOSE"))
        }
        .build()
	jwtDecoder.setJwtValidator(DelegatingOAuth2TokenValidator(
        JwtTimestampValidator(), JwtIssuerValidator(location))) <2>
    return jwtDecoder
}
```

1. - leave Nimbus type verification on
1. - specify the list of validators you need, excluding `JwtTypeValidator`

For additional guidance, please see the [JwtDecoder Validators](../servlet/oauth2/resource-server/jwt.md#oauth2resourceserver-jwt-validation) section in the reference.

<a id="_opaque_token_credentials_will_be_encoded_for_you"></a>

## Opaque Token Credentials Will Be Encoded For You

In order to comply more closely with the Introspection RFC, Spring Security’s opaque token support will encode the client id and secret before creating the authorization header.
This change means you will no longer have to encode the client id and secret yourself.

If your client id or secret contain URL-unsafe characters, then you can prepare yourself for this change by doing the following:

<a id="_replace_usage_of_introspectionclientcredentials"></a>

### Replace Usage of `introspectionClientCredentials`

Since Spring Security can now do the encoding for you, replace [using `introspectionClientCredentials`](../servlet/oauth2/resource-server/opaque-token.md#oauth2resourceserver-opaque-introspectionuri-dsl) with publishing the following `@Bean`:

#### Java

```java
@Bean
OpaqueTokenIntrospector introspector() {
	return SpringOpaqueTokenIntrospector.withIntrospectionUri(introspectionUri)
            .clientId(unencodedClientId).clientSecret(unencodedClientSecret).build();
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): OpaqueTokenIntrospector {
    return SpringOpaqueTokenIntrospector.withIntrospectionUri(introspectionUri)
            .clientId(unencodedClientId).clientSecret(unencodedClientSecret).build()
}
```

The above will be the default in 7.0.

If this setting gives you trouble or you cannot apply it for now, you can use the `RestOperations` constructor instead:

#### Java

```java
@Bean
OpaqueTokenIntrospector introspector() {
	RestTemplate rest = new RestTemplate();
	rest.addInterceptor(new BasicAuthenticationInterceptor(encodedClientId, encodedClientSecret));
	return new SpringOpaqueTokenIntrospector(introspectionUri, rest);
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): OpaqueTokenIntrospector {
	val rest = RestTemplate()
	rest.addInterceptor(BasicAuthenticationInterceptor(encodedClientId, encodedClientSecret))
	return SpringOpaqueTokenIntrospector(introspectionUri, rest)
}
```
