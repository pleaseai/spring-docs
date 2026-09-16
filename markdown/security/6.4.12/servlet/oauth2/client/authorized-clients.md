---
title: "<a id=\"oauth2Client-additional-features\"></a>Authorized Client Features"
source: "ROOT:servlet/oauth2/client/authorized-clients.adoc"
---

<a id="oauth2-client-additional-features"></a>

# <a id="oauth2Client-additional-features"></a>Authorized Client Features

This section covers additional features provided by Spring Security for OAuth2 client.

<a id="oauth2-client-registered-authorized-client"></a>

## <a id="oauth2Client-registered-authorized-client"></a>Resolving an Authorized Client

The `@RegisteredOAuth2AuthorizedClient` annotation provides the ability to resolve a method parameter to an argument value of type `OAuth2AuthorizedClient`.
This is a convenient alternative compared to accessing the `OAuth2AuthorizedClient` by using the `OAuth2AuthorizedClientManager` or `OAuth2AuthorizedClientService`.
The following example shows how to use `@RegisteredOAuth2AuthorizedClient`:

#### Java

```java
@Controller
public class OAuth2ClientController {

	@GetMapping("/")
	public String index(@RegisteredOAuth2AuthorizedClient("okta") OAuth2AuthorizedClient authorizedClient) {
		OAuth2AccessToken accessToken = authorizedClient.getAccessToken();

		...

		return "index";
	}
}
```

#### Kotlin

```kotlin
@Controller
class OAuth2ClientController {
    @GetMapping("/")
    fun index(@RegisteredOAuth2AuthorizedClient("okta") authorizedClient: OAuth2AuthorizedClient): String {
        val accessToken = authorizedClient.accessToken

        ...

        return "index"
    }
}
```

The `@RegisteredOAuth2AuthorizedClient` annotation is handled by `OAuth2AuthorizedClientArgumentResolver`, which directly uses an [`OAuth2AuthorizedClientManager`](core.md#oauth2Client-authorized-manager-provider) and, therefore, inherits its capabilities.

<a id="oauth2-client-rest-client"></a>

## RestClient Integration

Support for `RestClient` is provided by `OAuth2ClientHttpRequestInterceptor`.
This interceptor provides the ability to make protected resources requests by placing a `Bearer` token in the `Authorization` header of an outbound request.
The interceptor directly uses an `OAuth2AuthorizedClientManager` and therefore inherits the following capabilities:

- Performs an OAuth 2.0 Access Token request to obtain `OAuth2AccessToken` if the client has not yet been authorized

  - `authorization_code`: Triggers the Authorization Request redirect to initiate the flow
  - `client_credentials`: The access token is obtained directly from the Token Endpoint
  - `password`: The access token is obtained directly from the Token Endpoint
  - Additional grant types are supported by [enabling extension grant types](../index.md#oauth2-client-enable-extension-grant-type)
- If an existing `OAuth2AccessToken` is expired, it is refreshed (or renewed)

The following example uses the default `OAuth2AuthorizedClientManager` to configure a `RestClient` capable of accessing protected resources by placing `Bearer` tokens in the `Authorization` header of each request:

#### Java

```java
@Configuration
public class RestClientConfig {

	@Bean
	public RestClient restClient(OAuth2AuthorizedClientManager authorizedClientManager) {
		OAuth2ClientHttpRequestInterceptor requestInterceptor =
				new OAuth2ClientHttpRequestInterceptor(authorizedClientManager);

		return RestClient.builder()
				.requestInterceptor(requestInterceptor)
				.build();
	}

}
```

#### Kotlin

```kotlin
@Configuration
class RestClientConfig {

	@Bean
	fun restClient(authorizedClientManager: OAuth2AuthorizedClientManager): RestClient {
		val requestInterceptor = OAuth2ClientHttpRequestInterceptor(authorizedClientManager)

		return RestClient.builder()
			.requestInterceptor(requestInterceptor)
			.build()
	}

}
```

<a id="oauth2-client-rest-client-registration-id"></a>

### Providing the `clientRegistrationId`

`OAuth2ClientHttpRequestInterceptor` uses a `ClientRegistrationIdResolver` to determine which client is used to obtain an access token.
By default, `RequestAttributeClientRegistrationIdResolver` is used to resolve the `clientRegistrationId` from `HttpRequest#attributes()`.

The following example demonstrates providing a `clientRegistrationId` via attributes:

#### Java

```java
import static org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId;

@Controller
public class ResourceController {

	private final RestClient restClient;

	public ResourceController(RestClient restClient) {
		this.restClient = restClient;
	}

	@GetMapping("/")
	public String index() {
		String resourceUri = "...";

		String body = this.restClient.get()
				.uri(resourceUri)
				.attributes(clientRegistrationId("okta"))   // <1>
				.retrieve()
				.body(String.class);

		// ...

		return "index";
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId
import org.springframework.web.client.body

@Controller
class ResourceController(private restClient: RestClient) {

	@GetMapping("/")
	fun index(): String {
		val resourceUri = "..."

		val body: String = restClient.get()
				.uri(resourceUri)
				.attributes(clientRegistrationId("okta"))   // <1>
				.retrieve()
				.body<String>()

		// ...

		return "index"
	}

}
```

1. `clientRegistrationId()` is a `static` method in `RequestAttributeClientRegistrationIdResolver`.

Alternatively, a custom `ClientRegistrationIdResolver` can be provided.
The following example configures a custom implementation that resolves the `clientRegistrationId` from the current user.

#### Java

```java
@Configuration
public class RestClientConfig {

	@Bean
	public RestClient restClient(OAuth2AuthorizedClientManager authorizedClientManager) {
		OAuth2ClientHttpRequestInterceptor requestInterceptor =
				new OAuth2ClientHttpRequestInterceptor(authorizedClientManager);
		requestInterceptor.setClientRegistrationIdResolver(clientRegistrationIdResolver());

		return RestClient.builder()
				.requestInterceptor(requestInterceptor)
				.build();
	}

	private static ClientRegistrationIdResolver clientRegistrationIdResolver() {
		return (request) -> {
			Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
			return (authentication instanceof OAuth2AuthenticationToken principal)
					? principal.getAuthorizedClientRegistrationId() : null;
		};
	}

}
```

#### Kotlin

```kotlin
@Configuration
class RestClientConfig {

	@Bean
	fun restClient(authorizedClientManager: OAuth2AuthorizedClientManager): RestClient {
		val requestInterceptor = OAuth2ClientHttpRequestInterceptor(authorizedClientManager)
		requestInterceptor.setClientRegistrationIdResolver(clientRegistrationIdResolver())

		return RestClient.builder()
			.requestInterceptor(requestInterceptor)
			.build()
	}

	fun clientRegistrationIdResolver(): ClientRegistrationIdResolver {
		return ClientRegistrationIdResolver { request ->
			val authentication = SecurityContextHolder.getContext().getAuthentication()
			return if (authentication instanceof OAuth2AuthenticationToken) {
				authentication.getAuthorizedClientRegistrationId()
			} else {
                null
			}
		}
	}

}
```

<a id="oauth2-client-rest-client-principal"></a>

### Providing the `principal`

`OAuth2ClientHttpRequestInterceptor` uses a `PrincipalResolver` to determine which principal name is associated with the access token, which allows an application to choose how to scope the `OAuth2AuthorizedClient` that is stored.
By default, `SecurityContextHolderPrincipalResolver` is used to resolve the current `principal` from the `SecurityContextHolder`.

Alternatively, the `principal` can be resolved from `HttpRequest#attributes()` by configuring `RequestAttributePrincipalResolver`, as the following example shows:

#### Java

```java
@Configuration
public class RestClientConfig {

	@Bean
	public RestClient restClient(OAuth2AuthorizedClientManager authorizedClientManager) {
		OAuth2ClientHttpRequestInterceptor requestInterceptor =
				new OAuth2ClientHttpRequestInterceptor(authorizedClientManager);
		requestInterceptor.setPrincipalResolver(new RequestAttributePrincipalResolver());

		return RestClient.builder()
				.requestInterceptor(requestInterceptor)
				.build();
	}

}
```

#### Kotlin

```kotlin
@Configuration
class RestClientConfig {

	@Bean
	fun restClient(authorizedClientManager: OAuth2AuthorizedClientManager): RestClient {
		val requestInterceptor = OAuth2ClientHttpRequestInterceptor(authorizedClientManager)
		requestInterceptor.setPrincipalResolver(RequestAttributePrincipalResolver())

		return RestClient.builder()
			.requestInterceptor(requestInterceptor)
			.build()
	}

}
```

The following example demonstrates providing a `principal` name via attributes that scopes the `OAuth2AuthorizedClient` to the application instead of the current user:

#### Java

```java
import static org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId;
import static org.springframework.security.oauth2.client.web.client.RequestAttributePrincipalResolver.principal;

@Controller
public class ResourceController {

	private final RestClient restClient;

	public ResourceController(RestClient restClient) {
		this.restClient = restClient;
	}

	@GetMapping("/")
	public String index() {
		String resourceUri = "...";

		String body = this.restClient.get()
				.uri(resourceUri)
				.attributes(clientRegistrationId("okta"))
				.attributes(principal("my-application"))   // <1>
				.retrieve()
				.body(String.class);

		// ...

		return "index";
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.oauth2.client.web.client.RequestAttributeClientRegistrationIdResolver.clientRegistrationId
import org.springframework.security.oauth2.client.web.client.RequestAttributePrincipalResolver.principal
import org.springframework.web.client.body

@Controller
class ResourceController(private restClient: RestClient) {

    @GetMapping("/")
	fun index(): String {
		val resourceUri = "..."

		val body: String = restClient.get()
				.uri(resourceUri)
				.attributes(clientRegistrationId("okta"))
				.attributes(principal("my-application"))   // <1>
				.retrieve()
				.body<String>()

		// ...

		return "index"
	}

}
```

1. `principal()` is a `static` method in `RequestAttributePrincipalResolver`.

<a id="oauth2-client-rest-client-authorization-failure-handler"></a>

### Handling Failure

If an access token is invalid for any reason (e.g. expired token), it can be beneficial to handle the failure by removing the access token so that it cannot be used again.
You can set up the interceptor to do this automatically by providing an `OAuth2AuthorizationFailureHandler` to remove the access token.

The following example uses an `OAuth2AuthorizedClientRepository` to set up an `OAuth2AuthorizationFailureHandler` that removes an invalid `OAuth2AuthorizedClient` **within** the context of an `HttpServletRequest`:

#### Java

```java
@Configuration
public class RestClientConfig {

	@Bean
	public RestClient restClient(OAuth2AuthorizedClientManager authorizedClientManager,
			OAuth2AuthorizedClientRepository authorizedClientRepository) {

		OAuth2ClientHttpRequestInterceptor requestInterceptor =
				new OAuth2ClientHttpRequestInterceptor(authorizedClientManager);

		OAuth2AuthorizationFailureHandler authorizationFailureHandler =
			OAuth2ClientHttpRequestInterceptor.authorizationFailureHandler(authorizedClientRepository);
		requestInterceptor.setAuthorizationFailureHandler(authorizationFailureHandler);

		return RestClient.builder()
				.requestInterceptor(requestInterceptor)
				.build();
	}

}
```

#### Kotlin

```kotlin
@Configuration
class RestClientConfig {

	@Bean
	fun restClient(authorizedClientManager: OAuth2AuthorizedClientManager,
			authorizedClientRepository: OAuth2AuthorizedClientRepository): RestClient {

		val requestInterceptor = OAuth2ClientHttpRequestInterceptor(authorizedClientManager)

		val authorizationFailureHandler = OAuth2ClientHttpRequestInterceptor
			.authorizationFailureHandler(authorizedClientRepository)
		requestInterceptor.setAuthorizationFailureHandler(authorizationFailureHandler)

		return RestClient.builder()
			.requestInterceptor(requestInterceptor)
			.build()
	}

}
```

Alternatively, an `OAuth2AuthorizedClientService` can be used to remove an invalid `OAuth2AuthorizedClient` **outside** the context of an `HttpServletRequest`, as the following example shows:

#### Java

```java
@Configuration
public class RestClientConfig {

	@Bean
	public RestClient restClient(OAuth2AuthorizedClientManager authorizedClientManager,
			OAuth2AuthorizedClientService authorizedClientService) {

		OAuth2ClientHttpRequestInterceptor requestInterceptor =
				new OAuth2ClientHttpRequestInterceptor(authorizedClientManager);

		OAuth2AuthorizationFailureHandler authorizationFailureHandler =
			OAuth2ClientHttpRequestInterceptor.authorizationFailureHandler(authorizedClientService);
		requestInterceptor.setAuthorizationFailureHandler(authorizationFailureHandler);

		return RestClient.builder()
				.requestInterceptor(requestInterceptor)
				.build();
	}

}
```

#### Kotlin

```kotlin
@Configuration
class RestClientConfig {

	@Bean
	fun restClient(authorizedClientManager: OAuth2AuthorizedClientManager,
			authorizedClientService: OAuth2AuthorizedClientService): RestClient {

		val requestInterceptor = OAuth2ClientHttpRequestInterceptor(authorizedClientManager)

		val authorizationFailureHandler = OAuth2ClientHttpRequestInterceptor
			.authorizationFailureHandler(authorizedClientService)
		requestInterceptor.setAuthorizationFailureHandler(authorizationFailureHandler)

		return RestClient.builder()
			.requestInterceptor(requestInterceptor)
			.build()
	}

}
```

<a id="oauth2-client-web-client"></a>

## <a id="oauth2Client-webclient-servlet"></a>WebClient Integration for Servlet Environments

The OAuth 2.0 Client support integrates with `WebClient` by using an `ExchangeFilterFunction`.

The `ServletOAuth2AuthorizedClientExchangeFilterFunction` provides a mechanism for requesting protected resources by using an `OAuth2AuthorizedClient` and including the associated `OAuth2AccessToken` as a Bearer Token.
It directly uses an [`OAuth2AuthorizedClientManager`](core.md#oauth2Client-authorized-manager-provider) and, therefore, inherits the following capabilities:

- An `OAuth2AccessToken` is requested if the client has not yet been authorized.

  - `authorization_code`: Triggers the Authorization Request redirect to initiate the flow.
  - `client_credentials`: The access token is obtained directly from the Token Endpoint.
  - `password`: The access token is obtained directly from the Token Endpoint.
- If the `OAuth2AccessToken` is expired, it is refreshed (or renewed) if an `OAuth2AuthorizedClientProvider` is available to perform the authorization

The following code shows an example of how to configure `WebClient` with OAuth 2.0 Client support:

#### Java

```java
@Bean
WebClient webClient(OAuth2AuthorizedClientManager authorizedClientManager) {
	ServletOAuth2AuthorizedClientExchangeFilterFunction oauth2Client =
			new ServletOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
	return WebClient.builder()
			.apply(oauth2Client.oauth2Configuration())
			.build();
}
```

#### Kotlin

```kotlin
@Bean
fun webClient(authorizedClientManager: OAuth2AuthorizedClientManager?): WebClient {
    val oauth2Client = ServletOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager)
    return WebClient.builder()
            .apply(oauth2Client.oauth2Configuration())
            .build()
}
```

<a id="oauth2-client-web-client-authorized-client"></a>

### Providing the Authorized Client

The `ServletOAuth2AuthorizedClientExchangeFilterFunction` determines the client to use (for a request) by resolving the `OAuth2AuthorizedClient` from the `ClientRequest.attributes()` (request attributes).

The following code shows how to set an `OAuth2AuthorizedClient` as a request attribute:

#### Java

```java
@GetMapping("/")
public String index(@RegisteredOAuth2AuthorizedClient("okta") OAuth2AuthorizedClient authorizedClient) {
	String resourceUri = ...

	String body = webClient
			.get()
			.uri(resourceUri)
			.attributes(oauth2AuthorizedClient(authorizedClient))   <1>
			.retrieve()
			.bodyToMono(String.class)
			.block();

	...

	return "index";
}
```

#### Kotlin

```kotlin
@GetMapping("/")
fun index(@RegisteredOAuth2AuthorizedClient("okta") authorizedClient: OAuth2AuthorizedClient): String {
    val resourceUri: String = ...
    val body: String = webClient
            .get()
            .uri(resourceUri)
            .attributes(oauth2AuthorizedClient(authorizedClient)) <1>
            .retrieve()
            .bodyToMono()
            .block()

    ...

    return "index"
}
```

1. `oauth2AuthorizedClient()` is a `static` method in `ServletOAuth2AuthorizedClientExchangeFilterFunction`.

The following code shows how to set the `ClientRegistration.getRegistrationId()` as a request attribute:

#### Java

```java
@GetMapping("/")
public String index() {
	String resourceUri = ...

	String body = webClient
			.get()
			.uri(resourceUri)
			.attributes(clientRegistrationId("okta"))   <1>
			.retrieve()
			.bodyToMono(String.class)
			.block();

	...

	return "index";
}
```

#### Kotlin

```kotlin
@GetMapping("/")
fun index(): String {
    val resourceUri: String = ...

    val body: String = webClient
            .get()
            .uri(resourceUri)
            .attributes(clientRegistrationId("okta"))  <1>
            .retrieve()
            .bodyToMono()
            .block()

    ...

    return "index"
}
```

1. `clientRegistrationId()` is a `static` method in `ServletOAuth2AuthorizedClientExchangeFilterFunction`.

The following code shows how to set an `Authentication` as a request attribute:

#### Java

```java
@GetMapping("/")
public String index() {
	String resourceUri = ...

	Authentication anonymousAuthentication = new AnonymousAuthenticationToken(
			"anonymous", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS"));
	String body = webClient
			.get()
			.uri(resourceUri)
			.attributes(authentication(anonymousAuthentication))   <1>
			.retrieve()
			.bodyToMono(String.class)
			.block();

	...

	return "index";
}
```

#### Kotlin

```kotlin
@GetMapping("/")
fun index(): String {
    val resourceUri: String = ...

    val anonymousAuthentication: Authentication = AnonymousAuthenticationToken(
            "anonymous", "anonymousUser", AuthorityUtils.createAuthorityList("ROLE_ANONYMOUS"))
    val body: String = webClient
            .get()
            .uri(resourceUri)
            .attributes(authentication(anonymousAuthentication))  <1>
            .retrieve()
            .bodyToMono()
            .block()

    ...

    return "index"
}
```

1. `authentication()` is a `static` method in `ServletOAuth2AuthorizedClientExchangeFilterFunction`.

> [!WARNING]
> It is recommended to be cautious with this feature since all HTTP requests will receive an access token bound to the provided principal.

<a id="oauth2-client-web-client-default-authorized-client"></a>

### Defaulting the Authorized Client

If neither `OAuth2AuthorizedClient` or `ClientRegistration.getRegistrationId()` is provided as a request attribute, the `ServletOAuth2AuthorizedClientExchangeFilterFunction` can determine the *default* client to use, depending on its configuration.

If `setDefaultOAuth2AuthorizedClient(true)` is configured and the user has authenticated by using `HttpSecurity.oauth2Login()`, the `OAuth2AccessToken` associated with the current `OAuth2AuthenticationToken` is used.

The following code shows the specific configuration:

#### Java

```java
@Bean
WebClient webClient(OAuth2AuthorizedClientManager authorizedClientManager) {
	ServletOAuth2AuthorizedClientExchangeFilterFunction oauth2Client =
			new ServletOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
	oauth2Client.setDefaultOAuth2AuthorizedClient(true);
	return WebClient.builder()
			.apply(oauth2Client.oauth2Configuration())
			.build();
}
```

#### Kotlin

```kotlin
@Bean
fun webClient(authorizedClientManager: OAuth2AuthorizedClientManager?): WebClient {
    val oauth2Client = ServletOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager)
    oauth2Client.setDefaultOAuth2AuthorizedClient(true)
    return WebClient.builder()
            .apply(oauth2Client.oauth2Configuration())
            .build()
}
```

> [!WARNING]
> Be cautious with this feature, since all HTTP requests receive the access token.

Alternatively, if `setDefaultClientRegistrationId("okta")` is configured with a valid `ClientRegistration`, the `OAuth2AccessToken` associated with the `OAuth2AuthorizedClient` is used.

The following code shows the specific configuration:

#### Java

```java
@Bean
WebClient webClient(OAuth2AuthorizedClientManager authorizedClientManager) {
	ServletOAuth2AuthorizedClientExchangeFilterFunction oauth2Client =
			new ServletOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
	oauth2Client.setDefaultClientRegistrationId("okta");
	return WebClient.builder()
			.apply(oauth2Client.oauth2Configuration())
			.build();
}
```

#### Kotlin

```kotlin
@Bean
fun webClient(authorizedClientManager: OAuth2AuthorizedClientManager?): WebClient {
    val oauth2Client = ServletOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager)
    oauth2Client.setDefaultClientRegistrationId("okta")
    return WebClient.builder()
            .apply(oauth2Client.oauth2Configuration())
            .build()
}
```

> [!WARNING]
> Be cautious with this feature, since all HTTP requests receive the access token.
