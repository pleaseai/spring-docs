---
title: "Core Interfaces / Classes"
source: "ROOT:reactive/oauth2/client/core.adoc"
---

<a id="oauth2Client-core-interface-class"></a>

# Core Interfaces / Classes

<a id="oauth2Client-client-registration"></a>

## ClientRegistration

`ClientRegistration` is a representation of a client registered with an OAuth 2.0 or OpenID Connect 1.0 Provider.

A client registration holds information, such as client id, client secret, authorization grant type, redirect URI, scope(s), authorization URI, token URI, and other details.

`ClientRegistration` and its properties are defined as follows:

```java
public final class ClientRegistration {
	private String registrationId;	<1>
	private String clientId;	<2>
	private String clientSecret;	<3>
	private ClientAuthenticationMethod clientAuthenticationMethod;	<4>
	private AuthorizationGrantType authorizationGrantType;	<5>
	private String redirectUri;	<6>
	private Set<String> scopes;	<7>
	private ProviderDetails providerDetails;
	private String clientName;	<8>

	public class ProviderDetails {
		private String authorizationUri;	<9>
		private String tokenUri;	<10>
		private UserInfoEndpoint userInfoEndpoint;
		private String jwkSetUri;	<11>
		private String issuerUri;	<12>
		private Map<String, Object> configurationMetadata;  <13>

		public class UserInfoEndpoint {
			private String uri;	<14>
			private AuthenticationMethod authenticationMethod;  <15>
			private String userNameAttributeName;	<16>

		}
	}

	public static final class ClientSettings {
		private boolean requireProofKey; // <17>
	}
}
```

1. `registrationId`: The ID that uniquely identifies the `ClientRegistration`.
1. `clientId`: The client identifier.
1. `clientSecret`: The client secret.
1. `clientAuthenticationMethod`: The method used to authenticate the Client with the Provider.
The supported values are **client\_secret\_basic**, **client\_secret\_post**, **private\_key\_jwt**, **client\_secret\_jwt** and **none** [(public clients)](https://tools.ietf.org/html/rfc6749#section-2.1).
1. `authorizationGrantType`: The OAuth 2.0 Authorization Framework defines four [Authorization Grant](https://tools.ietf.org/html/rfc6749#section-1.3) types.
The supported values are `authorization_code`, `client_credentials`, `password`, as well as, extension grant type `urn:ietf:params:oauth:grant-type:jwt-bearer`.
1. `redirectUri`: The client’s registered redirect URI that the *Authorization Server* redirects the end-user’s user-agent
to after the end-user has authenticated and authorized access to the client.
1. `scopes`: The scope(s) requested by the client during the Authorization Request flow, such as openid, email, or profile.
1. `clientName`: A descriptive name used for the client.
The name may be used in certain scenarios, such as when displaying the name of the client in the auto-generated login page.
1. `authorizationUri`: The Authorization Endpoint URI for the Authorization Server.
1. `tokenUri`: The Token Endpoint URI for the Authorization Server.
1. `jwkSetUri`: The URI used to retrieve the [JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517) Set from the Authorization Server,
which contains the cryptographic key(s) used to verify the [JSON Web Signature (JWS)](https://tools.ietf.org/html/rfc7515) of the ID Token and optionally the UserInfo Response.
1. `issuerUri`: Returns the issuer identifier uri for the OpenID Connect 1.0 provider or the OAuth 2.0 Authorization Server.
1. `configurationMetadata`: The [OpenID Provider Configuration Information](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig).
This information will only be available if the Spring Boot property `spring.security.oauth2.client.provider.[providerId].issuerUri` is configured.
1. `(userInfoEndpoint)uri`: The UserInfo Endpoint URI used to access the claims/attributes of the authenticated end-user.
1. `(userInfoEndpoint)authenticationMethod`: The authentication method used when sending the access token to the UserInfo Endpoint.
The supported values are **header**, **form** and **query**.
1. `userNameAttributeName`: The name of the attribute returned in the UserInfo Response that references the Name or Identifier of the end-user.
1. <a id="oauth2Client-client-registration-requireProofKey"></a>`requireProofKey`: If `true` or if `authorizationGrantType` is `none`, then PKCE will be enabled by default.

A `ClientRegistration` can be initially configured using discovery of an OpenID Connect Provider’s [Configuration endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig) or an Authorization Server’s [Metadata endpoint](https://tools.ietf.org/html/rfc8414#section-3).

`ClientRegistrations` provides convenience methods for configuring a `ClientRegistration` in this way, as can be seen in the following example:

#### Java

```java
ClientRegistration clientRegistration =
	ClientRegistrations.fromIssuerLocation("https://idp.example.com/issuer").build();
```

#### Kotlin

```kotlin
val clientRegistration = ClientRegistrations.fromIssuerLocation("https://idp.example.com/issuer").build()
```

The above code will query in series `idp.example.com/issuer/.well-known/openid-configuration`, and then `idp.example.com/.well-known/openid-configuration/issuer`, and finally `idp.example.com/.well-known/oauth-authorization-server/issuer`, stopping at the first to return a 200 response.

As an alternative, you can use `ClientRegistrations.fromOidcIssuerLocation()` to only query the OpenID Connect Provider’s Configuration endpoint.

<a id="oauth2Client-client-registration-repo"></a>

## ReactiveClientRegistrationRepository

The `ReactiveClientRegistrationRepository` serves as a repository for OAuth 2.0 / OpenID Connect 1.0 `ClientRegistration`(s).

> [!NOTE]
> Client registration information is ultimately stored and owned by the associated Authorization Server.
> This repository provides the ability to retrieve a sub-set of the primary client registration information, which is stored with the Authorization Server.

Spring Boot auto-configuration binds each of the properties under `spring.security.oauth2.client.registration.[registrationId]` to an instance of `ClientRegistration` and then composes each of the `ClientRegistration` instance(s) within a `ReactiveClientRegistrationRepository`.

> [!NOTE]
> The default implementation of `ReactiveClientRegistrationRepository` is `InMemoryReactiveClientRegistrationRepository`.

The auto-configuration also registers the `ReactiveClientRegistrationRepository` as a `@Bean` in the `ApplicationContext` so that it is available for dependency-injection, if needed by the application.

The following listing shows an example:

#### Java

```java
@Controller
public class OAuth2ClientController {

	@Autowired
	private ReactiveClientRegistrationRepository clientRegistrationRepository;

	@GetMapping("/")
	public Mono<String> index() {
		return this.clientRegistrationRepository.findByRegistrationId("okta")
				...
				.thenReturn("index");
	}
}
```

#### Kotlin

```kotlin
@Controller
class OAuth2ClientController {

    @Autowired
    private lateinit var clientRegistrationRepository: ReactiveClientRegistrationRepository

    @GetMapping("/")
    fun index(): Mono<String> {
        return this.clientRegistrationRepository.findByRegistrationId("okta")
            ...
            .thenReturn("index")
    }
}
```

<a id="oauth2Client-authorized-client"></a>

## OAuth2AuthorizedClient

`OAuth2AuthorizedClient` is a representation of an Authorized Client.
A client is considered to be authorized when the end-user (Resource Owner) has granted authorization to the client to access its protected resources.

`OAuth2AuthorizedClient` serves the purpose of associating an `OAuth2AccessToken` (and optional `OAuth2RefreshToken`) to a `ClientRegistration` (client) and resource owner, who is the `Principal` end-user that granted the authorization.

<a id="oauth2Client-authorized-repo-service"></a>

## ServerOAuth2AuthorizedClientRepository / ReactiveOAuth2AuthorizedClientService

`ServerOAuth2AuthorizedClientRepository` is responsible for persisting `OAuth2AuthorizedClient`(s) between web requests.
Whereas, the primary role of `ReactiveOAuth2AuthorizedClientService` is to manage `OAuth2AuthorizedClient`(s) at the application-level.

From a developer perspective, the `ServerOAuth2AuthorizedClientRepository` or `ReactiveOAuth2AuthorizedClientService` provides the capability to lookup an `OAuth2AccessToken` associated with a client so that it may be used to initiate a protected resource request.

The following listing shows an example:

#### Java

```java
@Controller
public class OAuth2ClientController {

	@Autowired
	private ReactiveOAuth2AuthorizedClientService authorizedClientService;

	@GetMapping("/")
	public Mono<String> index(Authentication authentication) {
		return this.authorizedClientService.loadAuthorizedClient("okta", authentication.getName())
				.map(OAuth2AuthorizedClient::getAccessToken)
				...
				.thenReturn("index");
	}
}
```

#### Kotlin

```kotlin
@Controller
class OAuth2ClientController {

    @Autowired
    private lateinit var authorizedClientService: ReactiveOAuth2AuthorizedClientService

    @GetMapping("/")
    fun index(authentication: Authentication): Mono<String> {
        return this.authorizedClientService.loadAuthorizedClient<OAuth2AuthorizedClient>("okta", authentication.name)
            .map { it.accessToken }
            ...
            .thenReturn("index")
    }
}
```

> [!NOTE]
> Spring Boot auto-configuration registers an `ServerOAuth2AuthorizedClientRepository` and/or `ReactiveOAuth2AuthorizedClientService` `@Bean` in the `ApplicationContext`.
> However, the application may choose to override and register a custom `ServerOAuth2AuthorizedClientRepository` or `ReactiveOAuth2AuthorizedClientService` `@Bean`.

The default implementation of `ReactiveOAuth2AuthorizedClientService` is `InMemoryReactiveOAuth2AuthorizedClientService`, which stores `OAuth2AuthorizedClient`(s) in-memory.

Alternatively, the R2DBC implementation `R2dbcReactiveOAuth2AuthorizedClientService` may be configured for persisting `OAuth2AuthorizedClient`(s) in a database.

> [!NOTE]
> `R2dbcReactiveOAuth2AuthorizedClientService` depends on the table definition described in [ OAuth 2.0 Client Schema](../../../servlet/appendix/database-schema.md#dbschema-oauth2-client).

<a id="oauth2Client-authorized-manager-provider"></a>

## ReactiveOAuth2AuthorizedClientManager / ReactiveOAuth2AuthorizedClientProvider

The `ReactiveOAuth2AuthorizedClientManager` is responsible for the overall management of `OAuth2AuthorizedClient`(s).

The primary responsibilities include:

- Authorizing (or re-authorizing) an OAuth 2.0 Client, using a `ReactiveOAuth2AuthorizedClientProvider`.
- Delegating the persistence of an `OAuth2AuthorizedClient`, typically using a `ReactiveOAuth2AuthorizedClientService` or `ServerOAuth2AuthorizedClientRepository`.
- Delegating to a `ReactiveOAuth2AuthorizationSuccessHandler` when an OAuth 2.0 Client has been successfully authorized (or re-authorized).
- Delegating to a `ReactiveOAuth2AuthorizationFailureHandler` when an OAuth 2.0 Client fails to authorize (or re-authorize).

A `ReactiveOAuth2AuthorizedClientProvider` implements a strategy for authorizing (or re-authorizing) an OAuth 2.0 Client.
Implementations will typically implement an authorization grant type, eg. `authorization_code`, `client_credentials`, etc.

The default implementation of `ReactiveOAuth2AuthorizedClientManager` is `DefaultReactiveOAuth2AuthorizedClientManager`, which is associated with a `ReactiveOAuth2AuthorizedClientProvider` that may support multiple authorization grant types using a delegation-based composite.
The `ReactiveOAuth2AuthorizedClientProviderBuilder` may be used to configure and build the delegation-based composite.

The following code shows an example of how to configure and build a `ReactiveOAuth2AuthorizedClientProvider` composite that provides support for the `authorization_code`, `refresh_token`, `client_credentials` and `password` authorization grant types:

#### Java

```java
@Bean
public ReactiveOAuth2AuthorizedClientManager authorizedClientManager(
		ReactiveClientRegistrationRepository clientRegistrationRepository,
		ServerOAuth2AuthorizedClientRepository authorizedClientRepository) {

	ReactiveOAuth2AuthorizedClientProvider authorizedClientProvider =
			ReactiveOAuth2AuthorizedClientProviderBuilder.builder()
					.authorizationCode()
					.refreshToken()
					.clientCredentials()
					.password()
					.build();

	DefaultReactiveOAuth2AuthorizedClientManager authorizedClientManager =
			new DefaultReactiveOAuth2AuthorizedClientManager(
					clientRegistrationRepository, authorizedClientRepository);
	authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);

	return authorizedClientManager;
}
```

#### Kotlin

```kotlin
@Bean
fun authorizedClientManager(
        clientRegistrationRepository: ReactiveClientRegistrationRepository,
        authorizedClientRepository: ServerOAuth2AuthorizedClientRepository): ReactiveOAuth2AuthorizedClientManager {
    val authorizedClientProvider: ReactiveOAuth2AuthorizedClientProvider = ReactiveOAuth2AuthorizedClientProviderBuilder.builder()
            .authorizationCode()
            .refreshToken()
            .clientCredentials()
            .password()
            .build()
    val authorizedClientManager = DefaultReactiveOAuth2AuthorizedClientManager(
            clientRegistrationRepository, authorizedClientRepository)
    authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider)
    return authorizedClientManager
}
```

When an authorization attempt succeeds, the `DefaultReactiveOAuth2AuthorizedClientManager` will delegate to the `ReactiveOAuth2AuthorizationSuccessHandler`, which (by default) will save the `OAuth2AuthorizedClient` via the `ServerOAuth2AuthorizedClientRepository`.
In the case of a re-authorization failure, eg. a refresh token is no longer valid, the previously saved `OAuth2AuthorizedClient` will be removed from the `ServerOAuth2AuthorizedClientRepository` via the `RemoveAuthorizedClientReactiveOAuth2AuthorizationFailureHandler`.
The default behaviour may be customized via `setAuthorizationSuccessHandler(ReactiveOAuth2AuthorizationSuccessHandler)` and `setAuthorizationFailureHandler(ReactiveOAuth2AuthorizationFailureHandler)`.

The `DefaultReactiveOAuth2AuthorizedClientManager` is also associated with a `contextAttributesMapper` of type `Function<OAuth2AuthorizeRequest, Mono<Map<String, Object>>>`, which is responsible for mapping attribute(s) from the `OAuth2AuthorizeRequest` to a `Map` of attributes to be associated to the `OAuth2AuthorizationContext`.
This can be useful when you need to supply a `ReactiveOAuth2AuthorizedClientProvider` with required (supported) attribute(s), eg. the `PasswordReactiveOAuth2AuthorizedClientProvider` requires the resource owner’s `username` and `password` to be available in `OAuth2AuthorizationContext.getAttributes()`.

The following code shows an example of the `contextAttributesMapper`:

#### Java

```java
@Bean
public ReactiveOAuth2AuthorizedClientManager authorizedClientManager(
		ReactiveClientRegistrationRepository clientRegistrationRepository,
		ServerOAuth2AuthorizedClientRepository authorizedClientRepository) {

	ReactiveOAuth2AuthorizedClientProvider authorizedClientProvider =
			ReactiveOAuth2AuthorizedClientProviderBuilder.builder()
					.password()
					.refreshToken()
					.build();

	DefaultReactiveOAuth2AuthorizedClientManager authorizedClientManager =
			new DefaultReactiveOAuth2AuthorizedClientManager(
					clientRegistrationRepository, authorizedClientRepository);
	authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);

	// Assuming the `username` and `password` are supplied as `ServerHttpRequest` parameters,
	// map the `ServerHttpRequest` parameters to `OAuth2AuthorizationContext.getAttributes()`
	authorizedClientManager.setContextAttributesMapper(contextAttributesMapper());

	return authorizedClientManager;
}

private Function<OAuth2AuthorizeRequest, Mono<Map<String, Object>>> contextAttributesMapper() {
	return authorizeRequest -> {
		Map<String, Object> contextAttributes = Collections.emptyMap();
		ServerWebExchange exchange = authorizeRequest.getAttribute(ServerWebExchange.class.getName());
		ServerHttpRequest request = exchange.getRequest();
		String username = request.getQueryParams().getFirst(OAuth2ParameterNames.USERNAME);
		String password = request.getQueryParams().getFirst(OAuth2ParameterNames.PASSWORD);
		if (StringUtils.hasText(username) && StringUtils.hasText(password)) {
			contextAttributes = new HashMap<>();

			// `PasswordReactiveOAuth2AuthorizedClientProvider` requires both attributes
			contextAttributes.put(OAuth2AuthorizationContext.USERNAME_ATTRIBUTE_NAME, username);
			contextAttributes.put(OAuth2AuthorizationContext.PASSWORD_ATTRIBUTE_NAME, password);
		}
		return Mono.just(contextAttributes);
	};
}
```

#### Kotlin

```kotlin
@Bean
fun authorizedClientManager(
        clientRegistrationRepository: ReactiveClientRegistrationRepository,
        authorizedClientRepository: ServerOAuth2AuthorizedClientRepository): ReactiveOAuth2AuthorizedClientManager {
    val authorizedClientProvider: ReactiveOAuth2AuthorizedClientProvider = ReactiveOAuth2AuthorizedClientProviderBuilder.builder()
            .password()
            .refreshToken()
            .build()
    val authorizedClientManager = DefaultReactiveOAuth2AuthorizedClientManager(
            clientRegistrationRepository, authorizedClientRepository)
    authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider)

    // Assuming the `username` and `password` are supplied as `ServerHttpRequest` parameters,
    // map the `ServerHttpRequest` parameters to `OAuth2AuthorizationContext.getAttributes()`
    authorizedClientManager.setContextAttributesMapper(contextAttributesMapper())
    return authorizedClientManager
}

private fun contextAttributesMapper(): Function<OAuth2AuthorizeRequest, Mono<MutableMap<String, Any>>> {
    return Function { authorizeRequest ->
        var contextAttributes: MutableMap<String, Any> = mutableMapOf()
        val exchange: ServerWebExchange = authorizeRequest.getAttribute(ServerWebExchange::class.java.name)!!
        val request: ServerHttpRequest = exchange.request
        val username: String? = request.queryParams.getFirst(OAuth2ParameterNames.USERNAME)
        val password: String? = request.queryParams.getFirst(OAuth2ParameterNames.PASSWORD)
        if (StringUtils.hasText(username) && StringUtils.hasText(password)) {
            contextAttributes = hashMapOf()

            // `PasswordReactiveOAuth2AuthorizedClientProvider` requires both attributes
            contextAttributes[OAuth2AuthorizationContext.USERNAME_ATTRIBUTE_NAME] = username!!
            contextAttributes[OAuth2AuthorizationContext.PASSWORD_ATTRIBUTE_NAME] = password!!
        }
        Mono.just(contextAttributes)
    }
}
```

The `DefaultReactiveOAuth2AuthorizedClientManager` is designed to be used ***within*** the context of a `ServerWebExchange`.
When operating ***outside*** of a `ServerWebExchange` context, use `AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager` instead.

A *service application* is a common use case for when to use an `AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager`.
Service applications often run in the background, without any user interaction, and typically run under a system-level account instead of a user account.
An OAuth 2.0 Client configured with the `client_credentials` grant type can be considered a type of service application.

The following code shows an example of how to configure an `AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager` that provides support for the `client_credentials` grant type:

#### Java

```java
@Bean
public ReactiveOAuth2AuthorizedClientManager authorizedClientManager(
		ReactiveClientRegistrationRepository clientRegistrationRepository,
		ReactiveOAuth2AuthorizedClientService authorizedClientService) {

	ReactiveOAuth2AuthorizedClientProvider authorizedClientProvider =
			ReactiveOAuth2AuthorizedClientProviderBuilder.builder()
					.clientCredentials()
					.build();

	AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager authorizedClientManager =
			new AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager(
					clientRegistrationRepository, authorizedClientService);
	authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);

	return authorizedClientManager;
}
```

#### Kotlin

```kotlin
@Bean
fun authorizedClientManager(
        clientRegistrationRepository: ReactiveClientRegistrationRepository,
        authorizedClientService: ReactiveOAuth2AuthorizedClientService): ReactiveOAuth2AuthorizedClientManager {
    val authorizedClientProvider: ReactiveOAuth2AuthorizedClientProvider = ReactiveOAuth2AuthorizedClientProviderBuilder.builder()
            .clientCredentials()
            .build()
    val authorizedClientManager = AuthorizedClientServiceReactiveOAuth2AuthorizedClientManager(
            clientRegistrationRepository, authorizedClientService)
    authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider)
    return authorizedClientManager
}
```
