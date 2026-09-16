---
title: "Protocol Endpoints"
source: "ROOT:servlet/oauth2/authorization-server/protocol-endpoints.adoc"
---

<a id="oauth2AuthorizationServer-protocol-endpoints"></a>

# Protocol Endpoints

<a id="oauth2AuthorizationServer-oauth2-authorization-endpoint"></a>

## OAuth2 Authorization Endpoint

`OAuth2AuthorizationEndpointConfigurer` provides the ability to customize the [OAuth2 Authorization endpoint](https://datatracker.ietf.org/doc/html/rfc6749#section-3.1).
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for [OAuth2 authorization requests](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1).

`OAuth2AuthorizationEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.authorizationEndpoint(authorizationEndpoint ->
					authorizationEndpoint
        				.authorizationRequestConverter(authorizationRequestConverter)   <1>
                        .authorizationRequestConverters(authorizationRequestConvertersConsumer) <2>
                        .authenticationProvider(authenticationProvider) <3>
                        .authenticationProviders(authenticationProvidersConsumer)   <4>
                        .authorizationResponseHandler(authorizationResponseHandler) <5>
                        .errorResponseHandler(errorResponseHandler) <6>
                        .consentPage("/oauth2/v1/authorize")    <7>
				)
		);

	return http.build();
}
```

1. `authorizationRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract an [OAuth2 authorization request](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1) (or consent) from `HttpServletRequest` to an instance of `OAuth2AuthorizationCodeRequestAuthenticationToken` or `OAuth2AuthorizationConsentAuthenticationToken`.
1. `authorizationRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OAuth2AuthorizationCodeRequestAuthenticationToken` or `OAuth2AuthorizationConsentAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `authorizationResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an “authenticated” `OAuth2AuthorizationCodeRequestAuthenticationToken` and returning the [OAuth2AuthorizationResponse](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2).
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthorizationCodeRequestAuthenticationException` and returning the [OAuth2Error response](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1).
1. `consentPage()`: The `URI` of the custom consent page to redirect resource owners to if consent is required during the authorization request flow.

`OAuth2AuthorizationEndpointConfigurer` configures the `OAuth2AuthorizationEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OAuth2AuthorizationEndpointFilter` is the `Filter` that processes OAuth2 authorization requests (and consents).

`OAuth2AuthorizationEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — A `DelegatingAuthenticationConverter` composed of `OAuth2AuthorizationCodeRequestAuthenticationConverter` and `OAuth2AuthorizationConsentAuthenticationConverter`.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OAuth2AuthorizationCodeRequestAuthenticationProvider` and `OAuth2AuthorizationConsentAuthenticationProvider`.
- `AuthenticationSuccessHandler` — An internal implementation that handles an “authenticated” `OAuth2AuthorizationCodeRequestAuthenticationToken` and returns the `OAuth2AuthorizationResponse`.
- `AuthenticationFailureHandler` — An internal implementation that uses the `OAuth2Error` associated with the `OAuth2AuthorizationCodeRequestAuthenticationException` and returns the `OAuth2Error` response.

<a id="oauth2AuthorizationServer-oauth2-authorization-endpoint-customizing-authorization-request-validation"></a>

### Customizing Authorization Request Validation

`OAuth2AuthorizationCodeRequestAuthenticationValidator` is the default validator used for validating specific OAuth2 authorization request parameters used in the Authorization Code Grant.
The default implementation validates the `redirect_uri` and `scope` parameters.
If validation fails, an `OAuth2AuthorizationCodeRequestAuthenticationException` is thrown.

`OAuth2AuthorizationCodeRequestAuthenticationProvider` provides the ability to override the default authorization request validation by supplying a custom authentication validator of type `Consumer<OAuth2AuthorizationCodeRequestAuthenticationContext>` to `setAuthenticationValidator()`.

> [!TIP]
> `OAuth2AuthorizationCodeRequestAuthenticationContext` holds the `OAuth2AuthorizationCodeRequestAuthenticationToken`, which contains the OAuth2 authorization request parameters.

> [!IMPORTANT]
> If validation fails, the authentication validator **MUST** throw `OAuth2AuthorizationCodeRequestAuthenticationException`.

A common use case during the development life cycle phase is to allow for `localhost` in the `redirect_uri` parameter.

The following example shows how to configure `OAuth2AuthorizationCodeRequestAuthenticationProvider` with a custom authentication validator that allows for `localhost` in the `redirect_uri` parameter:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.authorizationEndpoint(authorizationEndpoint ->
					authorizationEndpoint
                        .authenticationProviders(configureAuthenticationValidator())
				)
		);

	return http.build();
}

private Consumer<List<AuthenticationProvider>> configureAuthenticationValidator() {
	return (authenticationProviders) ->
		authenticationProviders.forEach((authenticationProvider) -> {
			if (authenticationProvider instanceof OAuth2AuthorizationCodeRequestAuthenticationProvider) {
				Consumer<OAuth2AuthorizationCodeRequestAuthenticationContext> authenticationValidator =
					// Override default redirect_uri validator
					new CustomRedirectUriValidator()
						// Reuse default scope validator
						.andThen(OAuth2AuthorizationCodeRequestAuthenticationValidator.DEFAULT_SCOPE_VALIDATOR);

				((OAuth2AuthorizationCodeRequestAuthenticationProvider) authenticationProvider)
					.setAuthenticationValidator(authenticationValidator);
			}
		});
}

static class CustomRedirectUriValidator implements Consumer<OAuth2AuthorizationCodeRequestAuthenticationContext> {

	@Override
	public void accept(OAuth2AuthorizationCodeRequestAuthenticationContext authenticationContext) {
		OAuth2AuthorizationCodeRequestAuthenticationToken authorizationCodeRequestAuthentication =
			authenticationContext.getAuthentication();
		RegisteredClient registeredClient = authenticationContext.getRegisteredClient();
		String requestedRedirectUri = authorizationCodeRequestAuthentication.getRedirectUri();

		// Use exact string matching when comparing client redirect URIs against pre-registered URIs
		if (!registeredClient.getRedirectUris().contains(requestedRedirectUri)) {
			OAuth2Error error = new OAuth2Error(OAuth2ErrorCodes.INVALID_REQUEST);
			throw new OAuth2AuthorizationCodeRequestAuthenticationException(error, null);
		}
	}
}
```

<a id="oauth2AuthorizationServer-oauth2-pushed-authorization-request-endpoint"></a>

## OAuth2 Pushed Authorization Request Endpoint

`OAuth2PushedAuthorizationRequestEndpointConfigurer` provides the ability to customize the [OAuth2 Pushed Authorization Request endpoint](https://datatracker.ietf.org/doc/html/rfc9126#section-2).
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for [OAuth2 Pushed Authorization requests](https://datatracker.ietf.org/doc/html/rfc9126#section-2.1).

`OAuth2PushedAuthorizationRequestEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.pushedAuthorizationRequestEndpoint(pushedAuthorizationRequestEndpoint ->
					pushedAuthorizationRequestEndpoint
        				.pushedAuthorizationRequestConverter(pushedAuthorizationRequestConverter)   <1>
                        .pushedAuthorizationRequestConverters(pushedAuthorizationRequestConvertersConsumer) <2>
                        .authenticationProvider(authenticationProvider) <3>
                        .authenticationProviders(authenticationProvidersConsumer)   <4>
                        .pushedAuthorizationResponseHandler(pushedAuthorizationResponseHandler) <5>
                        .errorResponseHandler(errorResponseHandler) <6>
				)
		);

	return http.build();
}
```

1. `pushedAuthorizationRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract an [OAuth2 pushed authorization request](https://datatracker.ietf.org/doc/html/rfc9126#section-2.1) from `HttpServletRequest` to an instance of `OAuth2PushedAuthorizationRequestAuthenticationToken`.
1. `pushedAuthorizationRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OAuth2PushedAuthorizationRequestAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `pushedAuthorizationResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an “authenticated” `OAuth2PushedAuthorizationRequestAuthenticationToken` and returning the [OAuth2 pushed authorization response](https://datatracker.ietf.org/doc/html/rfc9126#section-2.2).
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthenticationException` and returning the [OAuth2Error response](https://datatracker.ietf.org/doc/html/rfc9126#section-2.3).

`OAuth2PushedAuthorizationRequestEndpointConfigurer` configures the `OAuth2PushedAuthorizationRequestEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OAuth2PushedAuthorizationRequestEndpointFilter` is the `Filter` that processes OAuth2 pushed authorization requests.

`OAuth2PushedAuthorizationRequestEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — A `DelegatingAuthenticationConverter` composed of `OAuth2AuthorizationCodeRequestAuthenticationConverter`.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OAuth2PushedAuthorizationRequestAuthenticationProvider`.
- `AuthenticationSuccessHandler` — An internal implementation that handles an “authenticated” `OAuth2PushedAuthorizationRequestAuthenticationToken` and returns the OAuth2 pushed authorization response.
- `AuthenticationFailureHandler` — An `OAuth2ErrorAuthenticationFailureHandler`.

<a id="oauth2AuthorizationServer-oauth2-pushed-authorization-request-endpoint-customizing-pushed-authorization-request-validation"></a>

### Customizing Pushed Authorization Request Validation

`OAuth2AuthorizationCodeRequestAuthenticationValidator` is the default validator used for validating specific OAuth2 pushed authorization request parameters used in the Authorization Code Grant.
The default implementation validates the `redirect_uri` and `scope` parameters.
If validation fails, an `OAuth2AuthorizationCodeRequestAuthenticationException` is thrown.

`OAuth2PushedAuthorizationRequestAuthenticationProvider` provides the ability to override the default pushed authorization request validation by supplying a custom authentication validator of type `Consumer<OAuth2AuthorizationCodeRequestAuthenticationContext>` to `setAuthenticationValidator()`.

> [!TIP]
> `OAuth2AuthorizationCodeRequestAuthenticationContext` holds the `OAuth2AuthorizationCodeRequestAuthenticationToken`, which contains the OAuth2 pushed authorization request parameters.

> [!IMPORTANT]
> If validation fails, the authentication validator **MUST** throw `OAuth2AuthorizationCodeRequestAuthenticationException`.

A common use case during the development life cycle phase is to allow for `localhost` in the `redirect_uri` parameter.

The following example shows how to configure `OAuth2PushedAuthorizationRequestAuthenticationProvider` with a custom authentication validator that allows for `localhost` in the `redirect_uri` parameter:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.pushedAuthorizationRequestEndpoint(pushedAuthorizationRequestEndpoint ->
					pushedAuthorizationRequestEndpoint
                        .authenticationProviders(configureAuthenticationValidator())
				)
		);

	return http.build();
}

private Consumer<List<AuthenticationProvider>> configureAuthenticationValidator() {
	return (authenticationProviders) ->
		authenticationProviders.forEach((authenticationProvider) -> {
			if (authenticationProvider instanceof OAuth2PushedAuthorizationRequestAuthenticationProvider) {
				Consumer<OAuth2AuthorizationCodeRequestAuthenticationContext> authenticationValidator =
					// Override default redirect_uri validator
					new CustomRedirectUriValidator()
						// Reuse default scope validator
						.andThen(OAuth2AuthorizationCodeRequestAuthenticationValidator.DEFAULT_SCOPE_VALIDATOR);

				((OAuth2PushedAuthorizationRequestAuthenticationProvider) authenticationProvider)
					.setAuthenticationValidator(authenticationValidator);
			}
		});
}

static class CustomRedirectUriValidator implements Consumer<OAuth2AuthorizationCodeRequestAuthenticationContext> {

	@Override
	public void accept(OAuth2AuthorizationCodeRequestAuthenticationContext authenticationContext) {
		OAuth2AuthorizationCodeRequestAuthenticationToken authorizationCodeRequestAuthentication =
			authenticationContext.getAuthentication();
		RegisteredClient registeredClient = authenticationContext.getRegisteredClient();
		String requestedRedirectUri = authorizationCodeRequestAuthentication.getRedirectUri();

		// Use exact string matching when comparing client redirect URIs against pre-registered URIs
		if (!registeredClient.getRedirectUris().contains(requestedRedirectUri)) {
			OAuth2Error error = new OAuth2Error(OAuth2ErrorCodes.INVALID_REQUEST);
			throw new OAuth2AuthorizationCodeRequestAuthenticationException(error, null);
		}
	}
}
```

<a id="oauth2AuthorizationServer-oauth2-device-authorization-endpoint"></a>

## OAuth2 Device Authorization Endpoint

`OAuth2DeviceAuthorizationEndpointConfigurer` provides the ability to customize the [OAuth2 Device Authorization endpoint](https://datatracker.ietf.org/doc/html/rfc8628#section-3.1).
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for OAuth2 device authorization requests.

`OAuth2DeviceAuthorizationEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.deviceAuthorizationEndpoint(deviceAuthorizationEndpoint ->
                    deviceAuthorizationEndpoint
                        .deviceAuthorizationRequestConverter(deviceAuthorizationRequestConverter)   <1>
                        .deviceAuthorizationRequestConverters(deviceAuthorizationRequestConvertersConsumer) <2>
                        .authenticationProvider(authenticationProvider) <3>
                        .authenticationProviders(authenticationProvidersConsumer)   <4>
                        .deviceAuthorizationResponseHandler(deviceAuthorizationResponseHandler) <5>
                        .errorResponseHandler(errorResponseHandler) <6>
                        .verificationUri("/oauth2/v1/device_verification")  <7>
				)
		);

	return http.build();
}
```

1. `deviceAuthorizationRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract an [OAuth2 device authorization request](https://datatracker.ietf.org/doc/html/rfc8628#section-3.1) from `HttpServletRequest` to an instance of `OAuth2DeviceAuthorizationRequestAuthenticationToken`.
1. `deviceAuthorizationRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OAuth2DeviceAuthorizationRequestAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `deviceAuthorizationResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an “authenticated” `OAuth2DeviceAuthorizationRequestAuthenticationToken` and returning the [OAuth2DeviceAuthorizationResponse](https://datatracker.ietf.org/doc/html/rfc8628#section-3.2).
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthenticationException` and returning the [OAuth2Error response](https://datatracker.ietf.org/doc/html/rfc6749#section-5.2).
1. `verificationUri()`: The `URI` of the custom end-user verification page to direct resource owners to on a secondary device.

> [!NOTE]
> The OAuth2 Device Authorization endpoint is disabled by default.

`OAuth2DeviceAuthorizationEndpointConfigurer` configures the `OAuth2DeviceAuthorizationEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OAuth2DeviceAuthorizationEndpointFilter` is the `Filter` that processes OAuth2 device authorization requests.

`OAuth2DeviceAuthorizationEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — An `OAuth2DeviceAuthorizationRequestAuthenticationConverter`.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OAuth2DeviceAuthorizationRequestAuthenticationProvider`.
- `AuthenticationSuccessHandler` — An internal implementation that handles an “authenticated” `OAuth2DeviceAuthorizationRequestAuthenticationToken` and returns the `OAuth2DeviceAuthorizationResponse`.
- `AuthenticationFailureHandler` — An `OAuth2ErrorAuthenticationFailureHandler`.

<a id="oauth2AuthorizationServer-oauth2-device-verification-endpoint"></a>

## OAuth2 Device Verification Endpoint

`OAuth2DeviceVerificationEndpointConfigurer` provides the ability to customize the [OAuth2 Device Verification endpoint](https://datatracker.ietf.org/doc/html/rfc8628#section-3.3) (or "User Interaction").
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for OAuth2 device verification requests.

`OAuth2DeviceVerificationEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.deviceVerificationEndpoint(deviceVerificationEndpoint ->
                    deviceVerificationEndpoint
                        .deviceVerificationRequestConverter(deviceVerificationRequestConverter) <1>
                        .deviceVerificationRequestConverters(deviceVerificationRequestConvertersConsumer)   <2>
                        .authenticationProvider(authenticationProvider) <3>
                        .authenticationProviders(authenticationProvidersConsumer)   <4>
                        .deviceVerificationResponseHandler(deviceVerificationResponseHandler)   <5>
                        .errorResponseHandler(errorResponseHandler) <6>
                        .consentPage("/oauth2/v1/consent")  <7>
				)
		);

	return http.build();
}
```

1. `deviceVerificationRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract an [OAuth2 device verification request](https://datatracker.ietf.org/doc/html/rfc8628#section-3.3) (or consent) from `HttpServletRequest` to an instance of `OAuth2DeviceVerificationAuthenticationToken` or `OAuth2DeviceAuthorizationConsentAuthenticationToken`.
1. `deviceVerificationRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OAuth2DeviceVerificationAuthenticationToken` or `OAuth2DeviceAuthorizationConsentAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `deviceVerificationResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an “authenticated” `OAuth2DeviceVerificationAuthenticationToken` and directing the resource owner to return to their device.
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthenticationException` and returning the error response.
1. `consentPage()`: The `URI` of the custom consent page to redirect resource owners to if consent is required during the device verification request flow.

> [!NOTE]
> The OAuth2 Device Verification endpoint is disabled by default.

`OAuth2DeviceVerificationEndpointConfigurer` configures the `OAuth2DeviceVerificationEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OAuth2DeviceVerificationEndpointFilter` is the `Filter` that processes OAuth2 device verification requests (and consents).

`OAuth2DeviceVerificationEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — A `DelegatingAuthenticationConverter` composed of `OAuth2DeviceVerificationAuthenticationConverter` and `OAuth2DeviceAuthorizationConsentAuthenticationConverter`.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OAuth2DeviceVerificationAuthenticationProvider` and `OAuth2DeviceAuthorizationConsentAuthenticationProvider`.
- `AuthenticationSuccessHandler` — A `SimpleUrlAuthenticationSuccessHandler` that handles an “authenticated” `OAuth2DeviceVerificationAuthenticationToken` and redirects the user to a success page (`/?success`).
- `AuthenticationFailureHandler` — An internal implementation that uses the `OAuth2Error` associated with the `OAuth2AuthenticationException` and returns the `OAuth2Error` response.

<a id="oauth2AuthorizationServer-oauth2-token-endpoint"></a>

## OAuth2 Token Endpoint

`OAuth2TokenEndpointConfigurer` provides the ability to customize the [OAuth2 Token endpoint](https://datatracker.ietf.org/doc/html/rfc6749#section-3.2).
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for [OAuth2 access token requests](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3).

`OAuth2TokenEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.tokenEndpoint(tokenEndpoint ->
                    tokenEndpoint
                        .accessTokenRequestConverter(accessTokenRequestConverter)   <1>
                        .accessTokenRequestConverters(accessTokenRequestConvertersConsumer) <2>
                        .authenticationProvider(authenticationProvider) <3>
                        .authenticationProviders(authenticationProvidersConsumer)   <4>
                        .accessTokenResponseHandler(accessTokenResponseHandler) <5>
                        .errorResponseHandler(errorResponseHandler) <6>
				)
		);

	return http.build();
}
```

1. `accessTokenRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract an [OAuth2 access token request](https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3) from `HttpServletRequest` to an instance of `OAuth2AuthorizationGrantAuthenticationToken`.
1. `accessTokenRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OAuth2AuthorizationGrantAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `accessTokenResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an `OAuth2AccessTokenAuthenticationToken` and returning the [`OAuth2AccessTokenResponse`](https://datatracker.ietf.org/doc/html/rfc6749#section-5.1).
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthenticationException` and returning the [OAuth2Error response](https://datatracker.ietf.org/doc/html/rfc6749#section-5.2).

`OAuth2TokenEndpointConfigurer` configures the `OAuth2TokenEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OAuth2TokenEndpointFilter` is the `Filter` that processes OAuth2 access token requests.

The supported [authorization grant types](https://datatracker.ietf.org/doc/html/rfc6749#section-1.3) are `authorization_code`, `refresh_token`, `client_credentials`, `urn:ietf:params:oauth:grant-type:device_code`, and `urn:ietf:params:oauth:grant-type:token-exchange`.

`OAuth2TokenEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — A `DelegatingAuthenticationConverter` composed of `OAuth2AuthorizationCodeAuthenticationConverter`, `OAuth2RefreshTokenAuthenticationConverter`, `OAuth2ClientCredentialsAuthenticationConverter`, `OAuth2DeviceCodeAuthenticationConverter`, and `OAuth2TokenExchangeAuthenticationConverter`.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OAuth2AuthorizationCodeAuthenticationProvider`, `OAuth2RefreshTokenAuthenticationProvider`, `OAuth2ClientCredentialsAuthenticationProvider`, `OAuth2DeviceCodeAuthenticationProvider`, and `OAuth2TokenExchangeAuthenticationProvider`.
- `AuthenticationSuccessHandler` — An `OAuth2AccessTokenResponseAuthenticationSuccessHandler`.
- `AuthenticationFailureHandler` — An `OAuth2ErrorAuthenticationFailureHandler`.

<a id="oauth2AuthorizationServer-oauth2-token-endpoint-customizing-client-credentials-grant-request-validation"></a>

### Customizing Client Credentials Grant Request Validation

`OAuth2ClientCredentialsAuthenticationValidator` is the default validator used for validating specific OAuth2 Client Credentials Grant request parameters.
The default implementation validates the `scope` parameter.
If validation fails, an `OAuth2AuthenticationException` is thrown.

`OAuth2ClientCredentialsAuthenticationProvider` provides the ability to override the default request validation by supplying a custom authentication validator of type `Consumer<OAuth2ClientCredentialsAuthenticationContext>` to `setAuthenticationValidator()`.

> [!TIP]
> `OAuth2ClientCredentialsAuthenticationContext` holds the `OAuth2ClientCredentialsAuthenticationToken`, which contains the OAuth2 Client Credentials Grant request parameters.

> [!IMPORTANT]
> If validation fails, the authentication validator **MUST** throw `OAuth2AuthenticationException`.

The following example shows how to configure `OAuth2ClientCredentialsAuthenticationProvider` with a custom authentication validator that overrides the default `scope` validation:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.tokenEndpoint(tokenEndpoint ->
                    tokenEndpoint
                        .authenticationProviders(configureAuthenticationValidator())
				)
		);

	return http.build();
}

private Consumer<List<AuthenticationProvider>> configureAuthenticationValidator() {
	return (authenticationProviders) ->
		authenticationProviders.forEach((authenticationProvider) -> {
			if (authenticationProvider instanceof OAuth2ClientCredentialsAuthenticationProvider) {
				Consumer<OAuth2ClientCredentialsAuthenticationContext> authenticationValidator =
					new CustomScopeValidator();

				// Override default scope validation
				((OAuth2ClientCredentialsAuthenticationProvider) authenticationProvider)
					.setAuthenticationValidator(authenticationValidator);
			}
		});
}

static class CustomScopeValidator implements Consumer<OAuth2ClientCredentialsAuthenticationContext> {

	@Override
	public void accept(OAuth2ClientCredentialsAuthenticationContext authenticationContext) {
		OAuth2ClientCredentialsAuthenticationToken clientCredentialsAuthentication =
			authenticationContext.getAuthentication();

		Set<String> requestedScopes = clientCredentialsAuthentication.getScopes();
		RegisteredClient registeredClient = authenticationContext.getRegisteredClient();
		Set<String> allowedScopes = registeredClient.getScopes();

        // TODO Implement scope validation

	}
}
```

<a id="oauth2AuthorizationServer-oauth2-token-endpoint-dpop-bound-access-tokens"></a>

### DPoP-bound Access Tokens

[RFC 9449 OAuth 2.0 Demonstrating Proof of Possession (DPoP)](https://datatracker.ietf.org/doc/html/rfc9449) is an application-level mechanism for sender-constraining an access token.

The primary goal of DPoP is to prevent unauthorized or illegitimate clients from using leaked or stolen access tokens, by binding an access token to a public key upon issuance by the authorization server and requiring that the client proves possession of the corresponding private key when using the access token at the resource server.

Access tokens that are sender-constrained via DPoP stand in contrast to the typical bearer token, which can be used by any client in possession of the access token.

DPoP introduces the concept of a [DPoP Proof](https://datatracker.ietf.org/doc/html/rfc9449#name-dpop-proof-jwts), which is a JWT created by the client and sent as a header in an HTTP request.
A client uses a DPoP proof to prove the possession of a private key corresponding to a certain public key.

When the client initiates an access token request, it attaches a DPoP proof to the request in an HTTP header.
The authorization server binds (sender-constrains) the access token to the public key associated in the DPoP proof.

When the client initiates a protected resource request, it again attaches a DPoP proof to the request in an HTTP header.

The resource server obtains information about the public key bound to the access token, either directly in the access token (JWT) or via the [OAuth2 Token Introspection endpoint](#oauth2AuthorizationServer-oauth2-token-introspection-endpoint).
The resource server then verifies that the public key bound to the access token matches the public key in the DPoP proof.
It also verifies that the access token hash in the DPoP proof matches the access token in the request.

<a id="oauth2AuthorizationServer-oauth2-token-endpoint-dpop-access-token-request"></a>

#### DPoP Access Token Request

To request an access token that is bound to a public key using DPoP, the client MUST provide a valid DPoP proof in the `DPoP` header when making an access token request to the OAuth2 Token endpoint.
This is applicable for all access token requests regardless of authorization grant type (e.g. `authorization_code`, `refresh_token`, `client_credentials`, etc).

The following HTTP request shows an `authorization_code` access token request with a DPoP proof in the `DPoP` header:

```shell
POST /oauth2/token HTTP/1.1
Host: server.example.com
Content-Type: application/x-www-form-urlencoded
DPoP: eyJraWQiOiJyc2EtandrLWtpZCIsInR5cCI6ImRwb3Arand0IiwiYWxnIjoiUlMyNTYiLCJqd2siOnsia3R5IjoiUlNBIiwiZSI6IkFRQUIiLCJraWQiOiJyc2EtandrLWtpZCIsIm4iOiIzRmxxSnI1VFJza0lRSWdkRTNEZDdEOWxib1dkY1RVVDhhLWZKUjdNQXZRbTdYWE5vWWttM3Y3TVFMMU5ZdER2TDJsOENBbmMwV2RTVElOVTZJUnZjNUtxbzJRNGNzTlg5U0hPbUVmem9ST2pRcWFoRWN2ZTFqQlhsdW9DWGRZdVlweDRfMXRmUmdHNmlpNFVoeGg2aUk4cU5NSlFYLWZMZnFoYmZZZnhCUVZSUHl3QmtBYklQNHgxRUFzYkM2RlNObWtoQ3hpTU5xRWd4YUlwWThDMmtKZEpfWklWLVdXNG5vRGR6cEtxSGN3bUI4RnNydW1sVllfRE5WdlVTRElpcGlxOVBiUDRIOTlUWE4xbzc0Nm9SYU5hMDdycTFob0NnTVNTeS04NVNhZ0NveGxteUUtRC1vZjlTc01ZOE9sOXQwcmR6cG9iQnVoeUpfbzVkZnZqS3cifX0.eyJodG0iOiJQT1NUIiwiaHR1IjoiaHR0cHM6Ly9zZXJ2ZXIuZXhhbXBsZS5jb20vb2F1dGgyL3Rva2VuIiwiaWF0IjoxNzQ2ODA2MzA1LCJqdGkiOiI0YjIzNDBkMi1hOTFmLTQwYTUtYmFhOS1kZDRlNWRlYWM4NjcifQ.wq8gJ_G6vpiEinfaY3WhereqCCLoeJOG8tnWBBAzRWx9F1KU5yAAWq-ZVCk_k07-h6DIqz2wgv6y9dVbNpRYwNwDUeik9qLRsC60M8YW7EFVyI3n_NpujLwzZeub_nDYMVnyn4ii0NaZrYHtoGXOlswQfS_-ET-jpC0XWm5nBZsCdUEXjOYtwaACC6Js-pyNwKmSLp5SKIk11jZUR5xIIopaQy521y9qJHhGRwzj8DQGsP7wMZ98UFL0E--1c-hh4rTy8PMeWCqRHdwjj_ry_eTe0DJFcxxYQdeL7-0_0CIO4Ayx5WHEpcUOIzBRoN32RsNpDZc-5slDNj9ku004DA

grant_type=authorization_code\
&client_id=s6BhdRkqt\
&code=SplxlOBeZQQYbYS6WxSbIA\
&redirect_uri=https%3A%2F%2Fclient%2Eexample%2Ecom%2Fcb\
&code_verifier=bEaL42izcC-o-xBk0K2vuJ6U-y1p9r_wW2dFWIWgjz-
```

The following shows a representation of the DPoP Proof JWT header and claims:

```json
{
  "typ": "dpop+jwt",
  "alg": "RS256",
  "jwk": {
    "kty": "RSA",
    "e": "AQAB",
    "n": "3FlqJr5TRskIQIgdE3Dd7D9lboWdcTUT8a-fJR7MAvQm7XXNoYkm3v7MQL1NYtDvL2l8CAnc0WdSTINU6IRvc5Kqo2Q4csNX9SHOmEfzoROjQqahEcve1jBXluoCXdYuYpx4_1tfRgG6ii4Uhxh6iI8qNMJQX-fLfqhbfYfxBQVRPywBkAbIP4x1EAsbC6FSNmkhCxiMNqEgxaIpY8C2kJdJ_ZIV-WW4noDdzpKqHcwmB8FsrumlVY_DNVvUSDIipiq9PbP4H99TXN1o746oRaNa07rq1hoCgMSSy-85SagCoxlmyE-D-of9SsMY8Ol9t0rdzpobBuhyJ_o5dfvjKw"
  }
}
```

```json
{
  "htm": "POST",
  "htu": "https://server.example.com/oauth2/token",
  "iat": 1746806305,
  "jti": "4b2340d2-a91f-40a5-baa9-dd4e5deac867"
}
```

The following code shows an example of how to generate the DPoP Proof JWT:

```java
RSAKey rsaKey = ...
JWKSource<SecurityContext> jwkSource = (jwkSelector, securityContext) -> jwkSelector
		.select(new JWKSet(rsaKey));
NimbusJwtEncoder jwtEncoder = new NimbusJwtEncoder(jwkSource);

JwsHeader jwsHeader = JwsHeader.with(SignatureAlgorithm.RS256)
		.type("dpop+jwt")
		.jwk(rsaKey.toPublicJWK().toJSONObject())
		.build();
JwtClaimsSet claims = JwtClaimsSet.builder()
		.issuedAt(Instant.now())
		.claim("htm", "POST")
		.claim("htu", "https://server.example.com/oauth2/token")
		.id(UUID.randomUUID().toString())
		.build();

Jwt dPoPProof = jwtEncoder.encode(JwtEncoderParameters.from(jwsHeader, claims));
```

After the authorization server successfully validates the DPoP proof, the public key from the DPoP proof will be bound (sender-constrained) to the issued access token.

The following access token response shows the `token_type` parameter as `DPoP` to signal to the client that the access token was bound to its DPoP proof public key:

```shell
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
 "access_token": "Kz~8mXK1EalYznwH-LC-1fBAo.4Ljp~zsPE_NeO.gxU",
 "token_type": "DPoP",
 "expires_in": 2677
}
```

<a id="oauth2AuthorizationServer-oauth2-token-endpoint-dpop-public-key-confirmation"></a>

#### Public Key Confirmation

Resource servers MUST be able to identify whether an access token is DPoP-bound and verify the binding to the public key of the DPoP proof.
The binding is accomplished by associating the public key with the access token in a way that can be accessed by the resource server, such as embedding the public key hash in the access token directly (JWT) or through token introspection.

When an access token is represented as a JWT, the public key hash is contained in the `jkt` claim under the confirmation method (`cnf`) claim.

The following example shows the claims of a JWT access token containing a `cnf` claim with a `jkt` claim, which is the JWK SHA-256 Thumbprint of the DPoP proof public key:

```json
{
  "sub":"user@example.com",
  "iss":"https://server.example.com",
  "nbf":1562262611,
  "exp":1562266216,
  "cnf":
  {
    "jkt":"CQMknzRoZ5YUi7vS58jck1q8TmZT8wiIiXrCN1Ny4VU"
  }
}
```

<a id="oauth2AuthorizationServer-oauth2-token-introspection-endpoint"></a>

## OAuth2 Token Introspection Endpoint

`OAuth2TokenIntrospectionEndpointConfigurer` provides the ability to customize the [OAuth2 Token Introspection endpoint](https://datatracker.ietf.org/doc/html/rfc7662#section-2).
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for [OAuth2 introspection requests](https://datatracker.ietf.org/doc/html/rfc7662#section-2.1).

`OAuth2TokenIntrospectionEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.tokenIntrospectionEndpoint(tokenIntrospectionEndpoint ->
                    tokenIntrospectionEndpoint
                        .introspectionRequestConverter(introspectionRequestConverter)   <1>
                        .introspectionRequestConverters(introspectionRequestConvertersConsumer) <2>
                        .authenticationProvider(authenticationProvider) <3>
                        .authenticationProviders(authenticationProvidersConsumer)   <4>
                        .introspectionResponseHandler(introspectionResponseHandler) <5>
                        .errorResponseHandler(errorResponseHandler) <6>
				)
		);

	return http.build();
}
```

1. `introspectionRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract an [OAuth2 introspection request](https://datatracker.ietf.org/doc/html/rfc7662#section-2.1) from `HttpServletRequest` to an instance of `OAuth2TokenIntrospectionAuthenticationToken`.
1. `introspectionRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OAuth2TokenIntrospectionAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `introspectionResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an “authenticated” `OAuth2TokenIntrospectionAuthenticationToken` and returning the [OAuth2TokenIntrospection response](https://datatracker.ietf.org/doc/html/rfc7662#section-2.2).
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthenticationException` and returning the [OAuth2Error response](https://datatracker.ietf.org/doc/html/rfc7662#section-2.3).

`OAuth2TokenIntrospectionEndpointConfigurer` configures the `OAuth2TokenIntrospectionEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OAuth2TokenIntrospectionEndpointFilter` is the `Filter` that processes OAuth2 introspection requests.

`OAuth2TokenIntrospectionEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — An `OAuth2TokenIntrospectionAuthenticationConverter`.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OAuth2TokenIntrospectionAuthenticationProvider`.
- `AuthenticationSuccessHandler` — An internal implementation that handles an “authenticated” `OAuth2TokenIntrospectionAuthenticationToken` and returns the `OAuth2TokenIntrospection` response.
- `AuthenticationFailureHandler` — An `OAuth2ErrorAuthenticationFailureHandler`.

<a id="oauth2AuthorizationServer-oauth2-token-revocation-endpoint"></a>

## OAuth2 Token Revocation Endpoint

`OAuth2TokenRevocationEndpointConfigurer` provides the ability to customize the [OAuth2 Token Revocation endpoint](https://datatracker.ietf.org/doc/html/rfc7009#section-2).
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for [OAuth2 revocation requests](https://datatracker.ietf.org/doc/html/rfc7009#section-2.1).

`OAuth2TokenRevocationEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.tokenRevocationEndpoint(tokenRevocationEndpoint ->
                    tokenRevocationEndpoint
                        .revocationRequestConverter(revocationRequestConverter) <1>
                        .revocationRequestConverters(revocationRequestConvertersConsumer)   <2>
                        .authenticationProvider(authenticationProvider) <3>
                        .authenticationProviders(authenticationProvidersConsumer)   <4>
                        .revocationResponseHandler(revocationResponseHandler)   <5>
                        .errorResponseHandler(errorResponseHandler) <6>
				)
		);

	return http.build();
}
```

1. `revocationRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract an [OAuth2 revocation request](https://datatracker.ietf.org/doc/html/rfc7009#section-2.1) from `HttpServletRequest` to an instance of `OAuth2TokenRevocationAuthenticationToken`.
1. `revocationRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OAuth2TokenRevocationAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `revocationResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an “authenticated” `OAuth2TokenRevocationAuthenticationToken` and returning the [OAuth2 revocation response](https://datatracker.ietf.org/doc/html/rfc7009#section-2.2).
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthenticationException` and returning the [OAuth2Error response](https://datatracker.ietf.org/doc/html/rfc7009#section-2.2.1).

`OAuth2TokenRevocationEndpointConfigurer` configures the `OAuth2TokenRevocationEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OAuth2TokenRevocationEndpointFilter` is the `Filter` that processes OAuth2 revocation requests.

`OAuth2TokenRevocationEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — An `OAuth2TokenRevocationAuthenticationConverter`.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OAuth2TokenRevocationAuthenticationProvider`.
- `AuthenticationSuccessHandler` — An internal implementation that handles an “authenticated” `OAuth2TokenRevocationAuthenticationToken` and returns the OAuth2 revocation response.
- `AuthenticationFailureHandler` — An `OAuth2ErrorAuthenticationFailureHandler`.

<a id="oauth2AuthorizationServer-oauth2-client-registration-endpoint"></a>

## OAuth2 Client Registration Endpoint

`OAuth2ClientRegistrationEndpointConfigurer` provides the ability to customize the [OAuth2 Client Registration endpoint](https://datatracker.ietf.org/doc/html/rfc7591#section-3).
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for [Client Registration requests](https://datatracker.ietf.org/doc/html/rfc7591#section-3.1).

`OAuth2ClientRegistrationEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.clientRegistrationEndpoint(clientRegistrationEndpoint ->
                    clientRegistrationEndpoint
                        .clientRegistrationRequestConverter(clientRegistrationRequestConverter) <1>
                        .clientRegistrationRequestConverters(clientRegistrationRequestConvertersConsumer)   <2>
                        .authenticationProvider(authenticationProvider) <3>
                        .authenticationProviders(authenticationProvidersConsumer)   <4>
                        .clientRegistrationResponseHandler(clientRegistrationResponseHandler)   <5>
                        .errorResponseHandler(errorResponseHandler) <6>
				)
		);

	return http.build();
}
```

1. `clientRegistrationRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract a [Client Registration request](https://datatracker.ietf.org/doc/html/rfc7591#section-3.1) from `HttpServletRequest` to an instance of `OAuth2ClientRegistrationAuthenticationToken`.
1. `clientRegistrationRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OAuth2ClientRegistrationAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `clientRegistrationResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an “authenticated” `OAuth2ClientRegistrationAuthenticationToken` and returning the [Client Registration response](https://datatracker.ietf.org/doc/html/rfc7591#section-3.2.1).
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthenticationException` and returning the [Client Registration Error response](https://datatracker.ietf.org/doc/html/rfc7591#section-3.2.2).

> [!NOTE]
> The OAuth2 Client Registration endpoint is disabled by default.

`OAuth2ClientRegistrationEndpointConfigurer` configures the `OAuth2ClientRegistrationEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OAuth2ClientRegistrationEndpointFilter` is the `Filter` that processes [Client Registration requests](https://datatracker.ietf.org/doc/html/rfc7591#section-3.1) and returns the [OAuth2ClientRegistration response](https://datatracker.ietf.org/doc/html/rfc7591#section-3.2.1).

`OAuth2ClientRegistrationEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — An `OAuth2ClientRegistrationAuthenticationConverter`.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OAuth2ClientRegistrationAuthenticationProvider`.
- `AuthenticationSuccessHandler` — An internal implementation that handles an “authenticated” `OAuth2ClientRegistrationAuthenticationToken` and returns the `OAuth2ClientRegistration` response.
- `AuthenticationFailureHandler` — An internal implementation that uses the `OAuth2Error` associated with the `OAuth2AuthenticationException` and returns the `OAuth2Error` response.

The OAuth2 Client Registration endpoint is an [OAuth2 protected resource](https://datatracker.ietf.org/doc/html/rfc7591#section-3), which **REQUIRES** an access token to be sent as a bearer token in the Client Registration request.

> [!NOTE]
> OAuth2 resource server support is autoconfigured, however, a `JwtDecoder` `@Bean` is **REQUIRED** for the OAuth2 Client Registration endpoint.

> [!IMPORTANT]
> The access token in a Client Registration request **REQUIRES** the OAuth2 scope `client.create`.

> [!TIP]
> To allow open client registration (no access token in request), configure `OAuth2ClientRegistrationAuthenticationProvider.setOpenRegistrationAllowed(true)`.

<a id="oauth2AuthorizationServer-oauth2-authorization-server-metadata-endpoint"></a>

## OAuth2 Authorization Server Metadata Endpoint

`OAuth2AuthorizationServerMetadataEndpointConfigurer` provides the ability to customize the [OAuth2 Authorization Server Metadata endpoint](https://datatracker.ietf.org/doc/html/rfc8414#section-3).
It defines an extension point that lets you customize the [OAuth2 Authorization Server Metadata response](https://datatracker.ietf.org/doc/html/rfc8414#section-3.2).

`OAuth2AuthorizationServerMetadataEndpointConfigurer` provides the following configuration option:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
				.authorizationServerMetadataEndpoint(authorizationServerMetadataEndpoint ->
                    authorizationServerMetadataEndpoint
                        .authorizationServerMetadataCustomizer(authorizationServerMetadataCustomizer)   <1>
				)
		);

	return http.build();
}
```

1. `authorizationServerMetadataCustomizer()`: The `Consumer` providing access to the `OAuth2AuthorizationServerMetadata.Builder` allowing the ability to customize the claims of the Authorization Server’s configuration.

`OAuth2AuthorizationServerMetadataEndpointConfigurer` configures the `OAuth2AuthorizationServerMetadataEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OAuth2AuthorizationServerMetadataEndpointFilter` is the `Filter` that returns the [OAuth2AuthorizationServerMetadata response](https://datatracker.ietf.org/doc/html/rfc8414#section-3.2).

<a id="oauth2AuthorizationServer-jwk-set-endpoint"></a>

## JWK Set Endpoint

`OAuth2AuthorizationServerConfigurer` provides support for the [JWK Set endpoint](https://datatracker.ietf.org/doc/html/rfc7517).

`OAuth2AuthorizationServerConfigurer` configures the `NimbusJwkSetEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`NimbusJwkSetEndpointFilter` is the `Filter` that returns the [JWK Set](https://datatracker.ietf.org/doc/html/rfc7517#section-5).

> [!NOTE]
> The JWK Set endpoint is configured **only** if a `JWKSource<SecurityContext>` `@Bean` is registered.

<a id="oauth2AuthorizationServer-oidc-provider-configuration-endpoint"></a>

## OpenID Connect 1.0 Provider Configuration Endpoint

`OidcProviderConfigurationEndpointConfigurer` provides the ability to customize the [OpenID Connect 1.0 Provider Configuration endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig).
It defines an extension point that lets you customize the [OpenID Provider Configuration response](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationResponse).

`OidcProviderConfigurationEndpointConfigurer` provides the following configuration option:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
                .oidc(oidc ->
                    oidc
                        .providerConfigurationEndpoint(providerConfigurationEndpoint ->
                            providerConfigurationEndpoint
                                .providerConfigurationCustomizer(providerConfigurationCustomizer)   <1>
                        )
                )
		);

	return http.build();
}
```

1. `providerConfigurationCustomizer()`: The `Consumer` providing access to the `OidcProviderConfiguration.Builder` allowing the ability to customize the claims of the OpenID Provider’s configuration.

`OidcProviderConfigurationEndpointConfigurer` configures the `OidcProviderConfigurationEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OidcProviderConfigurationEndpointFilter` is the `Filter` that returns the [OidcProviderConfiguration response](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfigurationResponse).

<a id="oauth2AuthorizationServer-oidc-logout-endpoint"></a>

## OpenID Connect 1.0 Logout Endpoint

`OidcLogoutEndpointConfigurer` provides the ability to customize the [OpenID Connect 1.0 Logout endpoint](https://openid.net/specs/openid-connect-rpinitiated-1_0.html#RPLogout).
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for RP-Initiated Logout requests.

`OidcLogoutEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
                .oidc(oidc ->
                    oidc
                        .logoutEndpoint(logoutEndpoint ->
                            logoutEndpoint
                                .logoutRequestConverter(logoutRequestConverter) <1>
                                .logoutRequestConverters(logoutRequestConvertersConsumer)   <2>
                                .authenticationProvider(authenticationProvider) <3>
                                .authenticationProviders(authenticationProvidersConsumer)   <4>
                                .logoutResponseHandler(logoutResponseHandler)   <5>
                                .errorResponseHandler(errorResponseHandler) <6>
                        )
                )
		);

	return http.build();
}
```

1. `logoutRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract a [Logout request](https://openid.net/specs/openid-connect-rpinitiated-1_0.html#RPLogout) from `HttpServletRequest` to an instance of `OidcLogoutAuthenticationToken`.
1. `logoutRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OidcLogoutAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `logoutResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an “authenticated” `OidcLogoutAuthenticationToken` and performing the logout.
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthenticationException` and returning the error response.

`OidcLogoutEndpointConfigurer` configures the `OidcLogoutEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OidcLogoutEndpointFilter` is the `Filter` that processes [RP-Initiated Logout requests](https://openid.net/specs/openid-connect-rpinitiated-1_0.html#RPLogout) and performs the logout of the End-User.

`OidcLogoutEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — An `OidcLogoutAuthenticationConverter`.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OidcLogoutAuthenticationProvider`.
- `AuthenticationSuccessHandler` — An `OidcLogoutAuthenticationSuccessHandler`.
- `AuthenticationFailureHandler` — An internal implementation that uses the `OAuth2Error` associated with the `OAuth2AuthenticationException` and returns the `OAuth2Error` response.

> [!NOTE]
> `OidcLogoutAuthenticationProvider` uses a [`SessionRegistry`](core-model-components.md#oauth2AuthorizationServer-session-registry) to look up the `SessionInformation` instance associated to the End-User requesting to be logged out.

> [!TIP]
> `OidcClientInitiatedLogoutSuccessHandler` is the corresponding configuration in Spring Security’s OAuth2 Client support for configuring [OpenID Connect 1.0 RP-Initiated Logout](../login/advanced.md#oauth2login-advanced-oidc-logout).

<a id="oauth2AuthorizationServer-oidc-logout-endpoint-customizing-logout-request-validation"></a>

### Customizing Logout Request Validation

`OidcLogoutAuthenticationValidator` is the default validator used for validating specific OpenID Connect RP-Initiated Logout Request parameters.
The default implementation validates the `post_logout_redirect_uri` parameter.
If validation fails, an `OAuth2AuthenticationException` is thrown.

`OidcLogoutAuthenticationProvider` provides the ability to override the default logout request validation by supplying a custom authentication validator of type `Consumer<OidcLogoutAuthenticationContext>` to `setAuthenticationValidator()`.

> [!TIP]
> `OidcLogoutAuthenticationContext` holds the `OidcLogoutAuthenticationToken`, which contains the logout request parameters.

> [!IMPORTANT]
> If validation fails, the authentication validator **MUST** throw `OAuth2AuthenticationException`.

The following example shows how to configure `OidcLogoutAuthenticationProvider` with a custom authentication validator:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
                .oidc(oidc ->
                    oidc
                        .logoutEndpoint(logoutEndpoint ->
                            logoutEndpoint
                                .authenticationProviders(configureAuthenticationValidator())
                        )
                )
		);

	return http.build();
}

private Consumer<List<AuthenticationProvider>> configureAuthenticationValidator() {
	return (authenticationProviders) ->
			authenticationProviders.forEach((authenticationProvider) -> {
				if (authenticationProvider instanceof OidcLogoutAuthenticationProvider oidcLogoutAuthenticationProvider) {
					Consumer<OidcLogoutAuthenticationContext> authenticationValidator = new CustomPostLogoutRedirectUriValidator();
					oidcLogoutAuthenticationProvider.setAuthenticationValidator(authenticationValidator);
				}
			});
}

static class CustomPostLogoutRedirectUriValidator implements Consumer<OidcLogoutAuthenticationContext> {

	@Override
	public void accept(OidcLogoutAuthenticationContext authenticationContext) {
		OidcLogoutAuthenticationToken oidcLogoutAuthentication =
				authenticationContext.getAuthentication();
		RegisteredClient registeredClient = authenticationContext.getRegisteredClient();

		// TODO

	}
}
```

<a id="oauth2AuthorizationServer-oidc-user-info-endpoint"></a>

## OpenID Connect 1.0 UserInfo Endpoint

`OidcUserInfoEndpointConfigurer` provides the ability to customize the [OpenID Connect 1.0 UserInfo endpoint](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo).
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for [UserInfo requests](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoRequest).

`OidcUserInfoEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
                .oidc(oidc ->
                    oidc
                        .userInfoEndpoint(userInfoEndpoint ->
                            userInfoEndpoint
                                .userInfoRequestConverter(userInfoRequestConverter) <1>
                                .userInfoRequestConverters(userInfoRequestConvertersConsumer)   <2>
                                .authenticationProvider(authenticationProvider) <3>
                                .authenticationProviders(authenticationProvidersConsumer)   <4>
                                .userInfoResponseHandler(userInfoResponseHandler)   <5>
                                .errorResponseHandler(errorResponseHandler) <6>
                                .userInfoMapper(userInfoMapper) <7>
                        )
                )
		);

	return http.build();
}
```

1. `userInfoRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract an [UserInfo request](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoRequest) from `HttpServletRequest` to an instance of `OidcUserInfoAuthenticationToken`.
1. `userInfoRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OidcUserInfoAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `userInfoResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an “authenticated” `OidcUserInfoAuthenticationToken` and returning the [UserInfo response](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse).
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthenticationException` and returning the [UserInfo Error response](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoError).
1. `userInfoMapper()`: The `Function` used to extract claims from `OidcUserInfoAuthenticationContext` to an instance of `OidcUserInfo`.

`OidcUserInfoEndpointConfigurer` configures the `OidcUserInfoEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OidcUserInfoEndpointFilter` is the `Filter` that processes [UserInfo requests](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoRequest) and returns the [OidcUserInfo response](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoResponse).

`OidcUserInfoEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — An internal implementation that obtains the `Authentication` from the `SecurityContext` and creates an `OidcUserInfoAuthenticationToken` with the principal.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OidcUserInfoAuthenticationProvider`, which is associated with an internal implementation of `userInfoMapper` that extracts [standard claims](https://openid.net/specs/openid-connect-core-1_0.html#StandardClaims) from the [ID Token](https://openid.net/specs/openid-connect-core-1_0.html#IDToken) based on the [scopes requested](https://openid.net/specs/openid-connect-core-1_0.html#ScopeClaims) during authorization.
- `AuthenticationSuccessHandler` — An internal implementation that handles an “authenticated” `OidcUserInfoAuthenticationToken` and returns the `OidcUserInfo` response.
- `AuthenticationFailureHandler` — An internal implementation that uses the `OAuth2Error` associated with the `OAuth2AuthenticationException` and returns the `OAuth2Error` response.

> [!TIP]
> You can customize the ID Token by providing an [`OAuth2TokenCustomizer<JwtEncodingContext>`](core-model-components.md#oauth2AuthorizationServer-oauth2-token-customizer) `@Bean`.

The OpenID Connect 1.0 UserInfo endpoint is an OAuth2 protected resource, which **REQUIRES** an access token to be sent as a bearer token in the [UserInfo request](https://openid.net/specs/openid-connect-core-1_0.html#UserInfoRequest).

> [!NOTE]
> OAuth2 resource server support is autoconfigured, however, a `JwtDecoder` `@Bean` is **REQUIRED** for the OpenID Connect 1.0 UserInfo endpoint.

<a id="oauth2AuthorizationServer-oidc-client-registration-endpoint"></a>

## OpenID Connect 1.0 Client Registration Endpoint

`OidcClientRegistrationEndpointConfigurer` provides the ability to customize the [OpenID Connect 1.0 Client Registration endpoint](https://openid.net/specs/openid-connect-registration-1_0.html#ClientRegistration).
It defines extension points that let you customize the pre-processing, main processing, and post-processing logic for [Client Registration requests](https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationRequest) or [Client Read requests](https://openid.net/specs/openid-connect-registration-1_0.html#ReadRequest).

`OidcClientRegistrationEndpointConfigurer` provides the following configuration options:

```java
@Bean
public SecurityFilterChain authorizationServerSecurityFilterChain(HttpSecurity http) throws Exception {
	http
		.oauth2AuthorizationServer((authorizationServer) ->
			authorizationServer
                .oidc(oidc ->
                    oidc
                        .clientRegistrationEndpoint(clientRegistrationEndpoint ->
                            clientRegistrationEndpoint
                                .clientRegistrationRequestConverter(clientRegistrationRequestConverter) <1>
                                .clientRegistrationRequestConverters(clientRegistrationRequestConvertersConsumers)  <2>
                                .authenticationProvider(authenticationProvider) <3>
                                .authenticationProviders(authenticationProvidersConsumer)   <4>
                                .clientRegistrationResponseHandler(clientRegistrationResponseHandler)   <5>
                                .errorResponseHandler(errorResponseHandler) <6>
                        )
                )
		);

	return http.build();
}
```

1. `clientRegistrationRequestConverter()`: Adds an `AuthenticationConverter` (*pre-processor*) used when attempting to extract a [Client Registration request](https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationRequest) or [Client Read request](https://openid.net/specs/openid-connect-registration-1_0.html#ReadRequest) from `HttpServletRequest` to an instance of `OidcClientRegistrationAuthenticationToken`.
1. `clientRegistrationRequestConverters()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationConverter`'s allowing the ability to add, remove, or customize a specific `AuthenticationConverter`.
1. `authenticationProvider()`: Adds an `AuthenticationProvider` (*main processor*) used for authenticating the `OidcClientRegistrationAuthenticationToken`.
1. `authenticationProviders()`: Sets the `Consumer` providing access to the `List` of default and (optionally) added `AuthenticationProvider`'s allowing the ability to add, remove, or customize a specific `AuthenticationProvider`.
1. `clientRegistrationResponseHandler()`: The `AuthenticationSuccessHandler` (*post-processor*) used for handling an “authenticated” `OidcClientRegistrationAuthenticationToken` and returning the [Client Registration response](https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse) or [Client Read response](https://openid.net/specs/openid-connect-registration-1_0.html#ReadResponse).
1. `errorResponseHandler()`: The `AuthenticationFailureHandler` (*post-processor*) used for handling an `OAuth2AuthenticationException` and returning the [Client Registration Error response](https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationError) or [Client Read Error response](https://openid.net/specs/openid-connect-registration-1_0.html#ReadError).

> [!NOTE]
> The OpenID Connect 1.0 Client Registration endpoint is disabled by default.

`OidcClientRegistrationEndpointConfigurer` configures the `OidcClientRegistrationEndpointFilter` and registers it with the OAuth2 authorization server `SecurityFilterChain` `@Bean`.
`OidcClientRegistrationEndpointFilter` is the `Filter` that processes [Client Registration requests](https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationRequest) and returns the [OidcClientRegistration response](https://openid.net/specs/openid-connect-registration-1_0.html#RegistrationResponse).

> [!TIP]
> `OidcClientRegistrationEndpointFilter` also processes [Client Read requests](https://openid.net/specs/openid-connect-registration-1_0.html#ReadRequest) and returns the [OidcClientRegistration response](https://openid.net/specs/openid-connect-registration-1_0.html#ReadResponse).

`OidcClientRegistrationEndpointFilter` is configured with the following defaults:

- `AuthenticationConverter` — An `OidcClientRegistrationAuthenticationConverter`.
- `AuthenticationManager` — An `AuthenticationManager` composed of `OidcClientRegistrationAuthenticationProvider` and `OidcClientConfigurationAuthenticationProvider`.
- `AuthenticationSuccessHandler` — An internal implementation that handles an “authenticated” `OidcClientRegistrationAuthenticationToken` and returns the `OidcClientRegistration` response.
- `AuthenticationFailureHandler` — An internal implementation that uses the `OAuth2Error` associated with the `OAuth2AuthenticationException` and returns the `OAuth2Error` response.

The OpenID Connect 1.0 Client Registration endpoint is an [OAuth2 protected resource](https://openid.net/specs/openid-connect-registration-1_0.html#ClientRegistration), which **REQUIRES** an access token to be sent as a bearer token in the Client Registration (or Client Read) request.

> [!NOTE]
> OAuth2 resource server support is autoconfigured, however, a `JwtDecoder` `@Bean` is **REQUIRED** for the OpenID Connect 1.0 Client Registration endpoint.

> [!IMPORTANT]
> The access token in a Client Registration request **REQUIRES** the OAuth2 scope `client.create`.

> [!IMPORTANT]
> The access token in a Client Read request **REQUIRES** the OAuth2 scope `client.read`.
