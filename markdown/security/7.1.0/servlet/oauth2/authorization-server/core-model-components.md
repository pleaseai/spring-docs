---
title: "Core Model / Components"
source: "ROOT:servlet/oauth2/authorization-server/core-model-components.adoc"
---

<a id="oauth2AuthorizationServer-core-model-components"></a>

# Core Model / Components

<a id="oauth2AuthorizationServer-registered-client"></a>

## RegisteredClient

A `RegisteredClient` is a representation of a client that is [registered](https://datatracker.ietf.org/doc/html/rfc6749#section-2) with the authorization server.
A client must be registered with the authorization server before it can initiate an authorization grant flow, such as `authorization_code` or `client_credentials`.

During client registration, the client is assigned a unique [client identifier](https://datatracker.ietf.org/doc/html/rfc6749#section-2.2), (optionally) a client secret (depending on [client type](https://datatracker.ietf.org/doc/html/rfc6749#section-2.1)), and metadata associated with its unique client identifier.
The client’s metadata can range from human-facing display strings (such as client name) to items specific to a protocol flow (such as the list of valid redirect URIs).

> [!TIP]
> The corresponding client registration model in Spring Security’s OAuth2 Client support is [ClientRegistration](../client/core.md#oauth2Client-client-registration).

The primary purpose of a client is to request access to protected resources.
The client first requests an access token by authenticating with the authorization server and presenting the authorization grant.
The authorization server authenticates the client and authorization grant, and, if they are valid, issues an access token.
The client can now request the protected resource from the resource server by presenting the access token.

The following example shows how to configure a `RegisteredClient` that is allowed to perform the [authorization\_code grant](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1) flow to request an access token:

```java
RegisteredClient registeredClient = RegisteredClient.withId(UUID.randomUUID().toString())
	.clientId("client-a")
	.clientSecret("{noop}secret")   <1>
	.clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
	.authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
	.redirectUri("http://127.0.0.1:8080/authorized")
	.scope("scope-a")
	.clientSettings(ClientSettings.builder().requireAuthorizationConsent(true).build())
	.build();
```

1. `{noop}` represents the `PasswordEncoder` id for Spring Security’s [NoOpPasswordEncoder](../../../features/authentication/password-storage.md#authentication-password-storage-dpe).

The corresponding configuration in Spring Security’s [OAuth2 Client support](../client/index.md) is:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          client-a:
            provider: spring
            client-id: client-a
            client-secret: secret
            authorization-grant-type: authorization_code
            redirect-uri: "http://127.0.0.1:8080/authorized"
            scope: scope-a
        provider:
          spring:
            issuer-uri: http://localhost:9000
```

A `RegisteredClient` has metadata (attributes) associated with its unique Client Identifier and is defined as follows:

```java
public class RegisteredClient implements Serializable {
	private String id;  <1>
	private String clientId;    <2>
	private Instant clientIdIssuedAt;   <3>
	private String clientSecret;    <4>
	private Instant clientSecretExpiresAt;  <5>
	private String clientName;  <6>
	private Set<ClientAuthenticationMethod> clientAuthenticationMethods;    <7>
	private Set<AuthorizationGrantType> authorizationGrantTypes;    <8>
	private Set<String> redirectUris;   <9>
	private Set<String> postLogoutRedirectUris; <10>
	private Set<String> scopes; <11>
	private ClientSettings clientSettings;  <12>
	private TokenSettings tokenSettings;    <13>

	...

}
```

1. `id`: The ID that uniquely identifies the `RegisteredClient`.
1. `clientId`: The client identifier.
1. `clientIdIssuedAt`: The time at which the client identifier was issued.
1. `clientSecret`: The client’s secret. The value should be encoded using Spring Security’s [PasswordEncoder](../../../features/authentication/password-storage.md#authentication-password-storage-dpe).
1. `clientSecretExpiresAt`: The time at which the client secret expires.
1. `clientName`: A descriptive name used for the client. The name may be used in certain scenarios, such as when displaying the client name in the consent page.
1. `clientAuthenticationMethods`: The authentication method(s) that the client may use. The supported values are `client_secret_basic`, `client_secret_post`, [`private_key_jwt`](https://datatracker.ietf.org/doc/html/rfc7523), `client_secret_jwt`, and `none` [(public clients)](https://datatracker.ietf.org/doc/html/rfc7636).
1. `authorizationGrantTypes`: The [authorization grant type(s)](https://datatracker.ietf.org/doc/html/rfc6749#section-1.3) that the client can use. The supported values are `authorization_code`, `client_credentials`, `refresh_token`, `urn:ietf:params:oauth:grant-type:device_code`, and `urn:ietf:params:oauth:grant-type:token-exchange`.
1. `redirectUris`: The registered [redirect URI(s)](https://datatracker.ietf.org/doc/html/rfc6749#section-3.1.2) that the client may use in redirect-based flows – for example, `authorization_code` grant.
1. `postLogoutRedirectUris`: The post logout redirect URI(s) that the client may use for logout.
1. `scopes`: The scope(s) that the client is allowed to request.
1. `clientSettings`: The custom settings for the client – for example, require [PKCE](https://datatracker.ietf.org/doc/html/rfc7636), require authorization consent, and others.
1. `tokenSettings`: The custom settings for the OAuth2 tokens issued to the client – for example, access/refresh token time-to-live, reuse refresh tokens, and others.

<a id="oauth2AuthorizationServer-client-settings"></a>

## ClientSettings

`ClientSettings` contains the configuration settings associated to a `RegisteredClient`.

`ClientSettings` provides the following accessors:

```java
public final class ClientSettings extends AbstractSettings {

    public boolean isRequireProofKey() ...  <1>

    public boolean isRequireAuthorizationConsent() ...  <2>

    public String getJwkSetUrl() ...    <3>

    public JwsAlgorithm getTokenEndpointAuthenticationSigningAlgorithm() ...    <4>

    public String getX509CertificateSubjectDN() ... <5>

	...

}
```

1. `isRequireProofKey()`: If `true`, the client is required to provide a proof key challenge and verifier when performing the Authorization Code Grant flow (PKCE). The default is `true`.
1. `isRequireAuthorizationConsent()`: If `true`, authorization consent is required when the client requests access. The default is `false`.
1. `getJwkSetUrl()`: The `URL` for the client’s JSON Web Key Set. Used for `private_key_jwt`, `self_signed_tls_client_auth` and `client_secret_jwt` client authentication methods.
1. `getTokenEndpointAuthenticationSigningAlgorithm()`: The `JwsAlgorithm` that must be used for signing the JWT used to authenticate the client at the Token Endpoint for `private_key_jwt` and `client_secret_jwt` authentication methods.
1. `getX509CertificateSubjectDN()`: The expected subject distinguished name associated to the client `X509Certificate` received during client authentication when using the `tls_client_auth` method.

> [!NOTE]
> [Proof Key for Code Exchange (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636) is enabled by default for all clients using the Authorization Code grant. To disable PKCE, set `requireProofKey` to `false`.

<a id="oauth2AuthorizationServer-registered-client-repository"></a>

## RegisteredClientRepository

The `RegisteredClientRepository` is the central component where new clients can be registered and existing clients can be queried.
It is used by other components when following a specific protocol flow, such as client authentication, authorization grant processing, token introspection, dynamic client registration, and others.

The provided implementations of `RegisteredClientRepository` are `InMemoryRegisteredClientRepository` and `JdbcRegisteredClientRepository`.
The `InMemoryRegisteredClientRepository` implementation stores `RegisteredClient` instances in-memory and is recommended **ONLY** to be used during development and testing.
`JdbcRegisteredClientRepository` is a JDBC implementation that persists `RegisteredClient` instances by using `JdbcOperations`.

> [!NOTE]
> The `RegisteredClientRepository` is a **REQUIRED** component.

The following example shows how to register a `RegisteredClientRepository` `@Bean`:

```java
@Bean
public RegisteredClientRepository registeredClientRepository() {
	List<RegisteredClient> registrations = ...
	return new InMemoryRegisteredClientRepository(registrations);
}
```

Alternatively, you can configure the `RegisteredClientRepository` through the [`OAuth2AuthorizationServerConfigurer`](configuration-model.md#oauth2AuthorizationServer-customizing-the-configuration):

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.registeredClientRepository(registeredClientRepository)
		)
	    ...

	return http.build();
}
```

> [!NOTE]
> The `OAuth2AuthorizationServerConfigurer` is useful when applying multiple configuration options simultaneously.

<a id="oauth2AuthorizationServer-oauth2-authorization"></a>

## OAuth2Authorization

An `OAuth2Authorization` is a representation of an OAuth2 authorization, which holds state related to the authorization granted to a [client](#oauth2AuthorizationServer-registered-client), by the resource owner or itself in the case of the `client_credentials` authorization grant type.

> [!TIP]
> The corresponding authorization model in Spring Security’s OAuth2 Client support is [OAuth2AuthorizedClient](../client/core.md#oauth2Client-authorized-client).

After the successful completion of an authorization grant flow, an `OAuth2Authorization` is created and associates an [`OAuth2AccessToken`](https://docs.spring.io/spring-security/site/docs/7.1.0/api//org/springframework/security/oauth2/core/OAuth2AccessToken.html), an (optional) [`OAuth2RefreshToken`](https://docs.spring.io/spring-security/site/docs/7.1.0/api//org/springframework/security/oauth2/core/OAuth2RefreshToken.html), and additional state specific to the executed authorization grant type.

The [`OAuth2Token`](https://docs.spring.io/spring-security/site/docs/7.1.0/api//org/springframework/security/oauth2/core/OAuth2Token.html) instances associated with an `OAuth2Authorization` vary, depending on the authorization grant type.

For the OAuth2 [authorization\_code grant](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1), an `OAuth2AuthorizationCode`, an `OAuth2AccessToken`, and an (optional) `OAuth2RefreshToken` are associated.

For the OpenID Connect 1.0 [authorization\_code grant](https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowAuth), an `OAuth2AuthorizationCode`, an [`OidcIdToken`](https://docs.spring.io/spring-security/site/docs/7.1.0/api//org/springframework/security/oauth2/core/oidc/OidcIdToken.html), an `OAuth2AccessToken`, and an (optional) `OAuth2RefreshToken` are associated.

For the OAuth2 [client\_credentials grant](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4), only an `OAuth2AccessToken` is associated.

`OAuth2Authorization` and its attributes are defined as follows:

```java
public class OAuth2Authorization implements Serializable {
	private String id;  <1>
	private String registeredClientId;  <2>
	private String principalName;   <3>
	private AuthorizationGrantType authorizationGrantType;  <4>
	private Set<String> authorizedScopes;   <5>
	private Map<Class<? extends OAuth2Token>, Token<?>> tokens; <6>
	private Map<String, Object> attributes; <7>

	...

}
```

1. `id`: The ID that uniquely identifies the `OAuth2Authorization`.
1. `registeredClientId`: The ID that uniquely identifies the [RegisteredClient](#oauth2AuthorizationServer-registered-client).
1. `principalName`: The principal name of the resource owner (or client).
1. `authorizationGrantType`: The `AuthorizationGrantType` used.
1. `authorizedScopes`: The `Set` of scope(s) authorized for the client.
1. `tokens`: The `OAuth2Token` instances (and associated metadata) specific to the executed authorization grant type.
1. `attributes`: The additional attributes specific to the executed authorization grant type – for example, the authenticated `Principal`, `OAuth2AuthorizationRequest`, and others.

`OAuth2Authorization` and its associated `OAuth2Token` instances have a set lifespan.
A newly issued `OAuth2Token` is active and becomes inactive when it either expires or is invalidated (revoked).
The `OAuth2Authorization` is (implicitly) inactive when all associated `OAuth2Token` instances are inactive.
Each `OAuth2Token` is held in an `OAuth2Authorization.Token`, which provides accessors for `isExpired()`, `isInvalidated()`, and `isActive()`.

`OAuth2Authorization.Token` also provides `getClaims()`, which returns the claims (if any) associated with the `OAuth2Token`.

<a id="oauth2AuthorizationServer-oauth2-authorization-service"></a>

## OAuth2AuthorizationService

The `OAuth2AuthorizationService` is the central component where new authorizations are stored and existing authorizations are queried.
It is used by other components when following a specific protocol flow – for example, client authentication, authorization grant processing, token introspection, token revocation, dynamic client registration, and others.

The provided implementations of `OAuth2AuthorizationService` are `InMemoryOAuth2AuthorizationService` and `JdbcOAuth2AuthorizationService`.
The `InMemoryOAuth2AuthorizationService` implementation stores `OAuth2Authorization` instances in-memory and is recommended **ONLY** to be used during development and testing.
`JdbcOAuth2AuthorizationService` is a JDBC implementation that persists `OAuth2Authorization` instances by using `JdbcOperations`.

> [!NOTE]
> The `OAuth2AuthorizationService` is an **OPTIONAL** component and defaults to `InMemoryOAuth2AuthorizationService`.

The following example shows how to register an `OAuth2AuthorizationService` `@Bean`:

```java
@Bean
public OAuth2AuthorizationService authorizationService() {
	return new InMemoryOAuth2AuthorizationService();
}
```

Alternatively, you can configure the `OAuth2AuthorizationService` through the [`OAuth2AuthorizationServerConfigurer`](configuration-model.md#oauth2AuthorizationServer-customizing-the-configuration):

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.authorizationService(authorizationService)
		)
	    ...

	return http.build();
}
```

> [!NOTE]
> The `OAuth2AuthorizationServerConfigurer` is useful when applying multiple configuration options simultaneously.

<a id="oauth2AuthorizationServer-oauth2-authorization-consent"></a>

## OAuth2AuthorizationConsent

An `OAuth2AuthorizationConsent` is a representation of an authorization "consent" (decision) from an [OAuth2 authorization request flow](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1) – for example, the `authorization_code` grant, which holds the authorities granted to a [client](#oauth2AuthorizationServer-registered-client) by the resource owner.

When authorizing access to a client, the resource owner may grant only a subset of the authorities requested by the client.
The typical use case is the `authorization_code` grant flow, in which the client requests scope(s) and the resource owner grants (or denies) access to the requested scope(s).

After the completion of an OAuth2 authorization request flow, an `OAuth2AuthorizationConsent` is created (or updated) and associates the granted authorities with the client and resource owner.

`OAuth2AuthorizationConsent` and its attributes are defined as follows:

```java
public final class OAuth2AuthorizationConsent implements Serializable {
	private final String registeredClientId;    <1>
	private final String principalName; <2>
	private final Set<GrantedAuthority> authorities;    <3>

	...

}
```

1. `registeredClientId`: The ID that uniquely identifies the [RegisteredClient](#oauth2AuthorizationServer-registered-client).
1. `principalName`: The principal name of the resource owner.
1. `authorities`: The authorities granted to the client by the resource owner. An authority can represent a scope, a claim, a permission, a role, and others.

<a id="oauth2AuthorizationServer-oauth2-authorization-consent-service"></a>

## OAuth2AuthorizationConsentService

The `OAuth2AuthorizationConsentService` is the central component where new authorization consents are stored and existing authorization consents are queried.
It is primarily used by components that implement an OAuth2 authorization request flow – for example, the `authorization_code` grant.

The provided implementations of `OAuth2AuthorizationConsentService` are `InMemoryOAuth2AuthorizationConsentService` and `JdbcOAuth2AuthorizationConsentService`.
The `InMemoryOAuth2AuthorizationConsentService` implementation stores `OAuth2AuthorizationConsent` instances in-memory and is recommended **ONLY** for development and testing.
`JdbcOAuth2AuthorizationConsentService` is a JDBC implementation that persists `OAuth2AuthorizationConsent` instances by using `JdbcOperations`.

> [!NOTE]
> The `OAuth2AuthorizationConsentService` is an **OPTIONAL** component and defaults to `InMemoryOAuth2AuthorizationConsentService`.

The following example shows how to register an `OAuth2AuthorizationConsentService` `@Bean`:

```java
@Bean
public OAuth2AuthorizationConsentService authorizationConsentService() {
	return new InMemoryOAuth2AuthorizationConsentService();
}
```

Alternatively, you can configure the `OAuth2AuthorizationConsentService` through the [`OAuth2AuthorizationServerConfigurer`](configuration-model.md#oauth2AuthorizationServer-customizing-the-configuration):

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.authorizationConsentService(authorizationConsentService)
		)
	    ...

	return http.build();
}
```

> [!NOTE]
> The `OAuth2AuthorizationServerConfigurer` is useful when applying multiple configuration options simultaneously.

<a id="oauth2AuthorizationServer-oauth2-token-context"></a>

## OAuth2TokenContext

An `OAuth2TokenContext` is a context object that holds information associated with an `OAuth2Token` and is used by an [OAuth2TokenGenerator](#oauth2AuthorizationServer-oauth2-token-generator) and [OAuth2TokenCustomizer](#oauth2AuthorizationServer-oauth2-token-customizer).

`OAuth2TokenContext` provides the following accessors:

```java
public interface OAuth2TokenContext extends Context {

	default RegisteredClient getRegisteredClient() ...  <1>

	default <T extends Authentication> T getPrincipal() ... <2>

	default AuthorizationServerContext getAuthorizationServerContext() ...    <3>

	@Nullable
	default OAuth2Authorization getAuthorization() ...  <4>

	default Set<String> getAuthorizedScopes() ...   <5>

	default OAuth2TokenType getTokenType() ...  <6>

	default AuthorizationGrantType getAuthorizationGrantType() ...  <7>

	default <T extends Authentication> T getAuthorizationGrant() ...    <8>

	...

}
```

1. `getRegisteredClient()`: The [RegisteredClient](#oauth2AuthorizationServer-registered-client) associated with the authorization grant.
1. `getPrincipal()`: The `Authentication` instance of the resource owner (or client).
1. `getAuthorizationServerContext()`: The [`AuthorizationServerContext`](configuration-model.md#oauth2AuthorizationServer-configuring-authorization-server-settings) object that holds information of the Authorization Server runtime environment.
1. `getAuthorization()`: The [OAuth2Authorization](#oauth2AuthorizationServer-oauth2-authorization) associated with the authorization grant.
1. `getAuthorizedScopes()`: The scope(s) authorized for the client.
1. `getTokenType()`: The `OAuth2TokenType` to generate. The supported values are `code`, `access_token`, `refresh_token`, and `id_token`.
1. `getAuthorizationGrantType()`: The `AuthorizationGrantType` associated with the authorization grant.
1. `getAuthorizationGrant()`: The `Authentication` instance used by the `AuthenticationProvider` that processes the authorization grant.

<a id="oauth2AuthorizationServer-oauth2-token-generator"></a>

## OAuth2TokenGenerator

An `OAuth2TokenGenerator` is responsible for generating an `OAuth2Token` from the information contained in the provided [OAuth2TokenContext](#oauth2AuthorizationServer-oauth2-token-context).

The `OAuth2Token` generated primarily depends on the type of `OAuth2TokenType` specified in the `OAuth2TokenContext`.

For example, when the `value` for `OAuth2TokenType` is:

- `code`, then `OAuth2AuthorizationCode` is generated.
- `access_token`, then `OAuth2AccessToken` is generated.
- `refresh_token`, then `OAuth2RefreshToken` is generated.
- `id_token`, then `OidcIdToken` is generated.

Furthermore, the format of the generated `OAuth2AccessToken` varies, depending on the `TokenSettings.getAccessTokenFormat()` configured for the [RegisteredClient](#oauth2AuthorizationServer-registered-client).
If the format is `OAuth2TokenFormat.SELF_CONTAINED` (the default), then a `Jwt` is generated.
If the format is `OAuth2TokenFormat.REFERENCE`, then an "opaque" token is generated.

Finally, if the generated `OAuth2Token` has a set of claims and implements `ClaimAccessor`, the claims are made accessible from [OAuth2Authorization.Token.getClaims()](#oauth2AuthorizationServer-oauth2-authorization).

The `OAuth2TokenGenerator` is primarily used by components that implement authorization grant processing – for example, `authorization_code`, `client_credentials`, and `refresh_token`.

The provided implementations are `OAuth2AccessTokenGenerator`, `OAuth2RefreshTokenGenerator`, and `JwtGenerator`.
The `OAuth2AccessTokenGenerator` generates an "opaque" (`OAuth2TokenFormat.REFERENCE`) access token, and the `JwtGenerator` generates a `Jwt` (`OAuth2TokenFormat.SELF_CONTAINED`).

> [!NOTE]
> The `OAuth2TokenGenerator` is an **OPTIONAL** component and defaults to a `DelegatingOAuth2TokenGenerator` composed of an `OAuth2AccessTokenGenerator` and `OAuth2RefreshTokenGenerator`.

> [!NOTE]
> If a `JwtEncoder` `@Bean` or `JWKSource<SecurityContext>` `@Bean` is registered, then a `JwtGenerator` is additionally composed in the `DelegatingOAuth2TokenGenerator`.

The `OAuth2TokenGenerator` provides great flexibility, as it can support any custom token format for `access_token` and `refresh_token`.

The following example shows how to register an `OAuth2TokenGenerator` `@Bean`:

```java
@Bean
public OAuth2TokenGenerator<?> tokenGenerator() {
	JwtEncoder jwtEncoder = ...
	JwtGenerator jwtGenerator = new JwtGenerator(jwtEncoder);
	OAuth2AccessTokenGenerator accessTokenGenerator = new OAuth2AccessTokenGenerator();
	OAuth2RefreshTokenGenerator refreshTokenGenerator = new OAuth2RefreshTokenGenerator();
	return new DelegatingOAuth2TokenGenerator(
			jwtGenerator, accessTokenGenerator, refreshTokenGenerator);
}
```

Alternatively, you can configure the `OAuth2TokenGenerator` through the [`OAuth2AuthorizationServerConfigurer`](configuration-model.md#oauth2AuthorizationServer-customizing-the-configuration):

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.tokenGenerator(tokenGenerator)
		)
	    ...

	return http.build();
}
```

> [!NOTE]
> The `OAuth2AuthorizationServerConfigurer` is useful when applying multiple configuration options simultaneously.

<a id="oauth2AuthorizationServer-oauth2-token-customizer"></a>

## OAuth2TokenCustomizer

An `OAuth2TokenCustomizer` provides the ability to customize the attributes of an `OAuth2Token`, which are accessible in the provided [OAuth2TokenContext](#oauth2AuthorizationServer-oauth2-token-context).
It is used by an [OAuth2TokenGenerator](#oauth2AuthorizationServer-oauth2-token-generator) to let it customize the attributes of the `OAuth2Token` before it is generated.

An `OAuth2TokenCustomizer<OAuth2TokenClaimsContext>` declared with a generic type of `OAuth2TokenClaimsContext` (`implements OAuth2TokenContext`) provides the ability to customize the claims of an "opaque" `OAuth2AccessToken`.
`OAuth2TokenClaimsContext.getClaims()` provides access to the `OAuth2TokenClaimsSet.Builder`, allowing the ability to add, replace, and remove claims.

The following example shows how to implement an `OAuth2TokenCustomizer<OAuth2TokenClaimsContext>` and configure it with an `OAuth2AccessTokenGenerator`:

```java
@Bean
public OAuth2TokenGenerator<?> tokenGenerator() {
	JwtEncoder jwtEncoder = ...
	JwtGenerator jwtGenerator = new JwtGenerator(jwtEncoder);
	OAuth2AccessTokenGenerator accessTokenGenerator = new OAuth2AccessTokenGenerator();
	accessTokenGenerator.setAccessTokenCustomizer(accessTokenCustomizer());
	OAuth2RefreshTokenGenerator refreshTokenGenerator = new OAuth2RefreshTokenGenerator();
	return new DelegatingOAuth2TokenGenerator(
			jwtGenerator, accessTokenGenerator, refreshTokenGenerator);
}

@Bean
public OAuth2TokenCustomizer<OAuth2TokenClaimsContext> accessTokenCustomizer() {
	return context -> {
		OAuth2TokenClaimsSet.Builder claims = context.getClaims();
		// Customize claims

	};
}
```

> [!NOTE]
> If the `OAuth2TokenGenerator` is not provided as a `@Bean` or is not configured through the `OAuth2AuthorizationServerConfigurer`, an `OAuth2TokenCustomizer<OAuth2TokenClaimsContext>` `@Bean` will automatically be configured with an `OAuth2AccessTokenGenerator`.

An `OAuth2TokenCustomizer<JwtEncodingContext>` declared with a generic type of `JwtEncodingContext` (`implements OAuth2TokenContext`) provides the ability to customize the headers and claims of a `Jwt`.
`JwtEncodingContext.getJwsHeader()` provides access to the `JwsHeader.Builder`, allowing the ability to add, replace, and remove headers.
`JwtEncodingContext.getClaims()` provides access to the `JwtClaimsSet.Builder`, allowing the ability to add, replace, and remove claims.

The following example shows how to implement an `OAuth2TokenCustomizer<JwtEncodingContext>` and configure it with a `JwtGenerator`:

```java
@Bean
public OAuth2TokenGenerator<?> tokenGenerator() {
	JwtEncoder jwtEncoder = ...
	JwtGenerator jwtGenerator = new JwtGenerator(jwtEncoder);
	jwtGenerator.setJwtCustomizer(jwtCustomizer());
	OAuth2AccessTokenGenerator accessTokenGenerator = new OAuth2AccessTokenGenerator();
	OAuth2RefreshTokenGenerator refreshTokenGenerator = new OAuth2RefreshTokenGenerator();
	return new DelegatingOAuth2TokenGenerator(
			jwtGenerator, accessTokenGenerator, refreshTokenGenerator);
}

@Bean
public OAuth2TokenCustomizer<JwtEncodingContext> jwtCustomizer() {
	return context -> {
		JwsHeader.Builder headers = context.getJwsHeader();
		JwtClaimsSet.Builder claims = context.getClaims();
		if (context.getTokenType().equals(OAuth2TokenType.ACCESS_TOKEN)) {
			// Customize headers/claims for access_token

		} else if (context.getTokenType().getValue().equals(OidcParameterNames.ID_TOKEN)) {
			// Customize headers/claims for id_token

		}
	};
}
```

> [!NOTE]
> If the `OAuth2TokenGenerator` is not provided as a `@Bean` or is not configured through the `OAuth2AuthorizationServerConfigurer`, an `OAuth2TokenCustomizer<JwtEncodingContext>` `@Bean` will automatically be configured with a `JwtGenerator`.

<a id="oauth2AuthorizationServer-session-registry"></a>

## SessionRegistry

If OpenID Connect 1.0 is enabled, a `SessionRegistry` instance is used to track authenticated sessions.
The `SessionRegistry` is used by the default implementation of `SessionAuthenticationStrategy` associated to the [OAuth2 Authorization Endpoint](protocol-endpoints.md#oauth2AuthorizationServer-oauth2-authorization-endpoint) for registering new authenticated sessions.

> [!NOTE]
> If a `SessionRegistry` `@Bean` is not registered, the default implementation `SessionRegistryImpl` will be used.

> [!IMPORTANT]
> If a `SessionRegistry` `@Bean` is registered and is an instance of `SessionRegistryImpl`, a `HttpSessionEventPublisher` `@Bean` **SHOULD** also be registered as it’s responsible for notifying `SessionRegistryImpl` of session lifecycle events, for example, `SessionDestroyedEvent`, to provide the ability to remove the `SessionInformation` instance.

When a logout is requested by an End-User, the [OpenID Connect 1.0 Logout Endpoint](protocol-endpoints.md#oauth2AuthorizationServer-oidc-logout-endpoint) uses the `SessionRegistry` to lookup the `SessionInformation` associated to the authenticated End-User to perform the logout.

If Spring Security’s [Concurrent Session Control](../../authentication/session-management.md#ns-concurrent-sessions) feature is being used, it is **RECOMMENDED** to register a `SessionRegistry` `@Bean` to ensure it’s shared between Spring Security’s Concurrent Session Control and Spring Security Authorization Server’s Logout feature.

The following example shows how to register a `SessionRegistry` `@Bean` and `HttpSessionEventPublisher` `@Bean` (required by `SessionRegistryImpl`):

```java
@Bean
public SessionRegistry sessionRegistry() {
	return new SessionRegistryImpl();
}

@Bean
public HttpSessionEventPublisher httpSessionEventPublisher() {
	return new HttpSessionEventPublisher();
}
```
