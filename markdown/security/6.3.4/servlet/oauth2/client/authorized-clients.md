---
title: "Authorized Client Features"
source: "ROOT:servlet/oauth2/client/authorized-clients.adoc"
---

<a id="oauth2Client-additional-features"></a>

# Authorized Client Features

This section covers additional features provided by Spring Security for the OAuth2 client.

<a id="oauth2Client-registered-authorized-client"></a>

## Resolving an Authorized Client

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

<a id="oauth2Client-webclient-servlet"></a>

## WebClient Integration for Servlet Environments

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

<a id="_providing_the_authorized_client"></a>

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

<a id="_defaulting_the_authorized_client"></a>

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
