---
title: "<a id=\"oauth2Client-client-auth-support\"></a>Client Authentication Support"
source: "ROOT:reactive/oauth2/client/client-authentication.adoc"
---

<a id="oauth2-client-authentication"></a>

# <a id="oauth2Client-client-auth-support"></a>Client Authentication Support

<a id="oauth2-client-authentication-client-credentials"></a>

## <a id="oauth2Client-client-credentials-auth"></a>Client Credentials

<a id="oauth2-client-authentication-client-credentials-client-secret-basic"></a>

### Authenticate using `client_secret_basic`

Client Authentication with HTTP Basic is supported out of the box and no customization is necessary to enable it.
The default implementation is provided by `DefaultOAuth2TokenRequestHeadersConverter`.

Given the following Spring Boot properties for an OAuth 2.0 client registration:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          okta:
            client-id: client-id
            client-secret: client-secret
            client-authentication-method: client_secret_basic
            authorization-grant-type: authorization_code
            ...
```

The following example shows how to configure `WebClientReactiveAuthorizationCodeTokenResponseClient` to disable URL encoding of the client credentials:

#### Java

```java
DefaultOAuth2TokenRequestHeadersConverter<OAuth2AuthorizationCodeGrantRequest> headersConverter =
		new DefaultOAuth2TokenRequestHeadersConverter<>();
headersConverter.setEncodeClientCredentials(false);

WebClientReactiveAuthorizationCodeTokenResponseClient tokenResponseClient =
		new WebClientReactiveAuthorizationCodeTokenResponseClient();
tokenResponseClient.setHeadersConverter(headersConverter);
```

#### Kotlin

```kotlin
val headersConverter = DefaultOAuth2TokenRequestHeadersConverter<OAuth2AuthorizationCodeGrantRequest>()
headersConverter.setEncodeClientCredentials(false)

val tokenResponseClient = WebClientReactiveAuthorizationCodeTokenResponseClient()
tokenResponseClient.setHeadersConverter(headersConverter)
```

<a id="oauth2-client-authentication-client-credentials-client-secret-post"></a>

### Authenticate using `client_secret_post`

Client Authentication with client credentials included in the request-body is supported out of the box and no customization is necessary to enable it.

The following Spring Boot properties for an OAuth 2.0 client registration demonstrate the configuration:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          okta:
            client-id: client-id
            client-secret: client-secret
            client-authentication-method: client_secret_post
            authorization-grant-type: authorization_code
            ...
```

<a id="oauth2-client-authentication-jwt-bearer"></a>

## <a id="oauth2Client-jwt-bearer-auth"></a>JWT Bearer

> [!NOTE]
> Please refer to JSON Web Token (JWT) Profile for OAuth 2.0 Client Authentication and Authorization Grants for further details on [JWT Bearer](https://datatracker.ietf.org/doc/html/rfc7523#section-2.2) Client Authentication.

The default implementation for JWT Bearer Client Authentication is `NimbusJwtClientAuthenticationParametersConverter`,
which is a `Converter` that customizes the Token Request parameters by adding
a signed JSON Web Token (JWS) in the `client_assertion` parameter.

The `java.security.PrivateKey` or `javax.crypto.SecretKey` used for signing the JWS
is supplied by the `com.nimbusds.jose.jwk.JWK` resolver associated with `NimbusJwtClientAuthenticationParametersConverter`.

<a id="oauth2-client-authentication-jwt-bearer-private-key-jwt"></a>

### Authenticate using `private_key_jwt`

Given the following Spring Boot properties for an OAuth 2.0 Client registration:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          okta:
            client-id: okta-client-id
            client-authentication-method: private_key_jwt
            authorization-grant-type: authorization_code
            ...
```

The following example shows how to configure `WebClientReactiveAuthorizationCodeTokenResponseClient`:

#### Java

```java
Function<ClientRegistration, JWK> jwkResolver = (clientRegistration) -> {
	if (clientRegistration.getClientAuthenticationMethod().equals(ClientAuthenticationMethod.PRIVATE_KEY_JWT)) {
		// Assuming RSA key type
		RSAPublicKey publicKey = ...
		RSAPrivateKey privateKey = ...
		return new RSAKey.Builder(publicKey)
				.privateKey(privateKey)
				.keyID(UUID.randomUUID().toString())
				.build();
	}
	return null;
};

WebClientReactiveAuthorizationCodeTokenResponseClient tokenResponseClient =
		new WebClientReactiveAuthorizationCodeTokenResponseClient();
tokenResponseClient.addParametersConverter(
		new NimbusJwtClientAuthenticationParametersConverter<>(jwkResolver));
```

#### Kotlin

```kotlin
val jwkResolver: Function<ClientRegistration, JWK> =
    Function<ClientRegistration, JWK> { clientRegistration ->
        if (clientRegistration.clientAuthenticationMethod.equals(ClientAuthenticationMethod.PRIVATE_KEY_JWT)) {
            // Assuming RSA key type
            var publicKey: RSAPublicKey = ...
            var privateKey: RSAPrivateKey = ...
            RSAKey.Builder(publicKey)
                    .privateKey(privateKey)
                    .keyID(UUID.randomUUID().toString())
                .build()
        }
        null
    }

val tokenResponseClient = WebClientReactiveAuthorizationCodeTokenResponseClient()
tokenResponseClient.addParametersConverter(
    NimbusJwtClientAuthenticationParametersConverter(jwkResolver)
)
```

<a id="oauth2-client-authentication-jwt-bearer-client-secret-jwt"></a>

### Authenticate using `client_secret_jwt`

Given the following Spring Boot properties for an OAuth 2.0 Client registration:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          okta:
            client-id: okta-client-id
            client-secret: okta-client-secret
            client-authentication-method: client_secret_jwt
            authorization-grant-type: client_credentials
            ...
```

The following example shows how to configure `WebClientReactiveClientCredentialsTokenResponseClient`:

#### Java

```java
Function<ClientRegistration, JWK> jwkResolver = (clientRegistration) -> {
	if (clientRegistration.getClientAuthenticationMethod().equals(ClientAuthenticationMethod.CLIENT_SECRET_JWT)) {
		SecretKeySpec secretKey = new SecretKeySpec(
				clientRegistration.getClientSecret().getBytes(StandardCharsets.UTF_8),
				"HmacSHA256");
		return new OctetSequenceKey.Builder(secretKey)
				.keyID(UUID.randomUUID().toString())
				.build();
	}
	return null;
};

WebClientReactiveClientCredentialsTokenResponseClient tokenResponseClient =
		new WebClientReactiveClientCredentialsTokenResponseClient();
tokenResponseClient.addParametersConverter(
		new NimbusJwtClientAuthenticationParametersConverter<>(jwkResolver));
```

#### Kotlin

```kotlin
val jwkResolver = Function<ClientRegistration, JWK?> { clientRegistration: ClientRegistration ->
    if (clientRegistration.clientAuthenticationMethod == ClientAuthenticationMethod.CLIENT_SECRET_JWT) {
        val secretKey = SecretKeySpec(
            clientRegistration.clientSecret.toByteArray(StandardCharsets.UTF_8),
            "HmacSHA256"
        )
        OctetSequenceKey.Builder(secretKey)
            .keyID(UUID.randomUUID().toString())
            .build()
    }
    null
}

val tokenResponseClient = WebClientReactiveClientCredentialsTokenResponseClient()
tokenResponseClient.addParametersConverter(
    NimbusJwtClientAuthenticationParametersConverter(jwkResolver)
)
```

<a id="oauth2-client-authentication-jwt-bearer-assertion"></a>

### Customizing the JWT assertion

The JWT produced by `NimbusJwtClientAuthenticationParametersConverter` contains the `iss`, `sub`, `aud`, `jti`, `iat` and `exp` claims by default. You can customize the headers and/or claims by providing a `Consumer<NimbusJwtClientAuthenticationParametersConverter.JwtClientAuthenticationContext<T>>` to `setJwtClientAssertionCustomizer()`. The following example shows how to customize claims of the JWT:

#### Java

```java
Function<ClientRegistration, JWK> jwkResolver = ...

NimbusJwtClientAuthenticationParametersConverter<OAuth2ClientCredentialsGrantRequest> converter =
		new NimbusJwtClientAuthenticationParametersConverter<>(jwkResolver);
converter.setJwtClientAssertionCustomizer((context) -> {
	context.getHeaders().header("custom-header", "header-value");
	context.getClaims().claim("custom-claim", "claim-value");
});
```

#### Kotlin

```kotlin
val jwkResolver = ...

val converter: NimbusJwtClientAuthenticationParametersConverter<OAuth2ClientCredentialsGrantRequest> =
    NimbusJwtClientAuthenticationParametersConverter(jwkResolver)
converter.setJwtClientAssertionCustomizer { context ->
    context.headers.header("custom-header", "header-value")
    context.claims.claim("custom-claim", "claim-value")
}
```

<a id="oauth2-client-authentication-public"></a>

## <a id="oauth2Client-public-auth"></a>Public Authentication

Public Client Authentication is supported out of the box and no customization is necessary to enable it.

The following Spring Boot properties for an OAuth 2.0 client registration demonstrate the configuration:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          okta:
            client-id: client-id
            client-authentication-method: none
            authorization-grant-type: authorization_code
            ...
```

> [!NOTE]
> Public Clients are supported using [Proof Key for Code Exchange](https://tools.ietf.org/html/rfc7636) (PKCE).
> PKCE will automatically be used when `client-authentication-method` is set to "none" (`ClientAuthenticationMethod.NONE`).
