---
title: "<a id=\"oauth2Client-additional-features\"></a>Authorized Client Features"
source: "ROOT:reactive/oauth2/client/authorized-clients.adoc"
---

<a id="oauth2-client-additional-features"></a>

# <a id="oauth2Client-additional-features"></a>Authorized Client Features

This section covers additional features provided by Spring Security for OAuth2 Client.

<a id="oauth2-client-registered-authorized-client"></a>

## <a id="oauth2Client-registered-authorized-client"></a>Resolving an Authorized Client

The `@RegisteredOAuth2AuthorizedClient` annotation provides the capability of resolving a method parameter to an argument value of type `OAuth2AuthorizedClient`.
This is a convenient alternative compared to accessing the `OAuth2AuthorizedClient` using the `ReactiveOAuth2AuthorizedClientManager` or `ReactiveOAuth2AuthorizedClientService`.

#### Java

```java
@Controller
public class OAuth2ClientController {

	@GetMapping("/")
	public Mono<String> index(@RegisteredOAuth2AuthorizedClient("okta") OAuth2AuthorizedClient authorizedClient) {
		return Mono.just(authorizedClient.getAccessToken())
				...
				.thenReturn("index");
	}
}
```

#### Kotlin

```kotlin
@Controller
class OAuth2ClientController {
    @GetMapping("/")
    fun index(@RegisteredOAuth2AuthorizedClient("okta") authorizedClient: OAuth2AuthorizedClient): Mono<String> {
        return Mono.just(authorizedClient.accessToken)
                ...
                .thenReturn("index")
    }
}
```

The `@RegisteredOAuth2AuthorizedClient` annotation is handled by `OAuth2AuthorizedClientArgumentResolver`, which directly uses a [ReactiveOAuth2AuthorizedClientManager](core.md#oauth2Client-authorized-manager-provider) and therefore inherits it’s capabilities.

<a id="oauth2-client-web-client"></a>

## <a id="oauth2Client-webclient-webflux"></a>WebClient integration for Reactive Environments

The OAuth 2.0 Client support integrates with `WebClient` using an `ExchangeFilterFunction`.

The `ServerOAuth2AuthorizedClientExchangeFilterFunction` provides a simple mechanism for requesting protected resources by using an `OAuth2AuthorizedClient` and including the associated `OAuth2AccessToken` as a Bearer Token.
It directly uses an [ReactiveOAuth2AuthorizedClientManager](core.md#oauth2Client-authorized-manager-provider) and therefore inherits the following capabilities:

- An `OAuth2AccessToken` will be requested if the client has not yet been authorized.

  - `authorization_code` - triggers the Authorization Request redirect to initiate the flow
  - `client_credentials` - the access token is obtained directly from the Token Endpoint
  - `password` - the access token is obtained directly from the Token Endpoint
- If the `OAuth2AccessToken` is expired, it will be refreshed (or renewed) if a `ReactiveOAuth2AuthorizedClientProvider` is available to perform the authorization

The following code shows an example of how to configure `WebClient` with OAuth 2.0 Client support:

#### Java

```java
@Bean
WebClient webClient(ReactiveOAuth2AuthorizedClientManager authorizedClientManager) {
	ServerOAuth2AuthorizedClientExchangeFilterFunction oauth2Client =
			new ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
	return WebClient.builder()
			.filter(oauth2Client)
			.build();
}
```

#### Kotlin

```kotlin
@Bean
fun webClient(authorizedClientManager: ReactiveOAuth2AuthorizedClientManager): WebClient {
    val oauth2Client = ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager)
    return WebClient.builder()
            .filter(oauth2Client)
            .build()
}
```

<a id="oauth2-client-web-client-authorized-client"></a>

### Providing the Authorized Client

The `ServerOAuth2AuthorizedClientExchangeFilterFunction` determines the client to use (for a request) by resolving the `OAuth2AuthorizedClient` from the `ClientRequest.attributes()` (request attributes).

The following code shows how to set an `OAuth2AuthorizedClient` as a request attribute:

#### Java

```java
@GetMapping("/")
public Mono<String> index(@RegisteredOAuth2AuthorizedClient("okta") OAuth2AuthorizedClient authorizedClient) {
	String resourceUri = ...

	return webClient
			.get()
			.uri(resourceUri)
			.attributes(oauth2AuthorizedClient(authorizedClient))   <1>
			.retrieve()
			.bodyToMono(String.class)
			...
			.thenReturn("index");
}
```

#### Kotlin

```kotlin
@GetMapping("/")
fun index(@RegisteredOAuth2AuthorizedClient("okta") authorizedClient: OAuth2AuthorizedClient): Mono<String> {
    val resourceUri: String = ...

    return webClient
            .get()
            .uri(resourceUri)
            .attributes(oauth2AuthorizedClient(authorizedClient)) <1>
            .retrieve()
            .bodyToMono<String>()
            ...
            .thenReturn("index")
}
```

1. `oauth2AuthorizedClient()` is a `static` method in `ServerOAuth2AuthorizedClientExchangeFilterFunction`.

The following code shows how to set the `ClientRegistration.getRegistrationId()` as a request attribute:

#### Java

```java
@GetMapping("/")
public Mono<String> index() {
	String resourceUri = ...

	return webClient
			.get()
			.uri(resourceUri)
			.attributes(clientRegistrationId("okta"))   <1>
			.retrieve()
			.bodyToMono(String.class)
			...
			.thenReturn("index");
}
```

#### Kotlin

```kotlin
@GetMapping("/")
fun index(): Mono<String> {
    val resourceUri: String = ...

    return webClient
            .get()
            .uri(resourceUri)
            .attributes(clientRegistrationId("okta"))  <1>
            .retrieve()
            .bodyToMono<String>()
            ...
            .thenReturn("index")
}
```

1. `clientRegistrationId()` is a `static` method in `ServerOAuth2AuthorizedClientExchangeFilterFunction`.

<a id="oauth2-client-web-client-default-authorized-client"></a>

### Defaulting the Authorized Client

If neither `OAuth2AuthorizedClient` or `ClientRegistration.getRegistrationId()` is provided as a request attribute, the `ServerOAuth2AuthorizedClientExchangeFilterFunction` can determine the *default* client to use depending on it’s configuration.

If `setDefaultOAuth2AuthorizedClient(true)` is configured and the user has authenticated using `ServerHttpSecurity.oauth2Login()`, the `OAuth2AccessToken` associated with the current `OAuth2AuthenticationToken` is used.

The following code shows the specific configuration:

#### Java

```java
@Bean
WebClient webClient(ReactiveOAuth2AuthorizedClientManager authorizedClientManager) {
	ServerOAuth2AuthorizedClientExchangeFilterFunction oauth2Client =
			new ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
	oauth2Client.setDefaultOAuth2AuthorizedClient(true);
	return WebClient.builder()
			.filter(oauth2Client)
			.build();
}
```

#### Kotlin

```kotlin
@Bean
fun webClient(authorizedClientManager: ReactiveOAuth2AuthorizedClientManager): WebClient {
    val oauth2Client = ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager)
    oauth2Client.setDefaultOAuth2AuthorizedClient(true)
    return WebClient.builder()
            .filter(oauth2Client)
            .build()
}
```

> [!WARNING]
> It is recommended to be cautious with this feature since all HTTP requests will receive the access token.

Alternatively, if `setDefaultClientRegistrationId("okta")` is configured with a valid `ClientRegistration`, the `OAuth2AccessToken` associated with the `OAuth2AuthorizedClient` is used.

The following code shows the specific configuration:

#### Java

```java
@Bean
WebClient webClient(ReactiveOAuth2AuthorizedClientManager authorizedClientManager) {
	ServerOAuth2AuthorizedClientExchangeFilterFunction oauth2Client =
			new ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
	oauth2Client.setDefaultClientRegistrationId("okta");
	return WebClient.builder()
			.filter(oauth2Client)
			.build();
}
```

#### Kotlin

```kotlin
@Bean
fun webClient(authorizedClientManager: ReactiveOAuth2AuthorizedClientManager): WebClient {
    val oauth2Client = ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager)
    oauth2Client.setDefaultClientRegistrationId("okta")
    return WebClient.builder()
            .filter(oauth2Client)
            .build()
}
```

> [!WARNING]
> It is recommended to be cautious with this feature since all HTTP requests will receive the access token.
