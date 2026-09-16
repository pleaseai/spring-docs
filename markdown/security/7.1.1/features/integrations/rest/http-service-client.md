---
title: "HTTP Service Clients Integration"
source: "ROOT:features/integrations/rest/http-service-client.adoc"
---

# HTTP Service Clients Integration

Spring Security’s OAuth Support can integrate with `RestClient` and `WebClient` [HTTP Service Clients](https://docs.spring.io/spring-framework/reference/7.0.9/integration/rest-clients.html#rest-http-service-client).

<a id="configuration"></a>

## Configuration

After [RestClient](#configuration-restclient) or [WebClient](#configuration-webclient) specific configuration, usage of [features/integrations/rest/http-service-client.adoc](http-service-client.md) only requires adding a [`@ClientRegistrationId`](#client-registration-id) to methods that require OAuth or their declaring HTTP interface.

Since the presence of [`@ClientRegistrationId`](#client-registration-id) determines if and how the OAuth token will be resolved, it is safe to add Spring Security’s OAuth support any configuration.

<a id="configuration-restclient"></a>

### RestClient Configuration

Spring Security’s OAuth Support can integrate with [HTTP Service Clients](https://docs.spring.io/spring-framework/reference/7.0.9/integration/rest-clients.html#rest-http-service-client) backed by `RestClient`.
The first step is to [create an `OAuthAuthorizedClientManager` Bean](../../../servlet/oauth2/client/core.md#oauth2Client-authorized-manager-provider).

Next you must configure `HttpServiceProxyFactory` and `RestClient` to be aware of [@ClientRegistrationId](#client-registration-id)
To simplify this configuration, use [`OAuth2RestClientHttpServiceGroupConfigurer`](https://docs.spring.io/spring-security/site/docs/7.1.1/api/org/springframework/security/oauth2/client/web/client/support/OAuth2RestClientHttpServiceGroupConfigurer.html).

#### Java

```java
@Bean
OAuth2RestClientHttpServiceGroupConfigurer securityConfigurer(
		OAuth2AuthorizedClientManager manager) {
	return OAuth2RestClientHttpServiceGroupConfigurer.from(manager);
}
```

#### Kotlin

```kotlin
@Bean
fun securityConfigurer(manager: OAuth2AuthorizedClientManager): OAuth2RestClientHttpServiceGroupConfigurer {
    return OAuth2RestClientHttpServiceGroupConfigurer.from(manager)
}
```

The configuration:

- Adds [`ClientRegistrationIdProcessor`](#client-registration-id-processor) to [`HttpServiceProxyFactory`](https://docs.spring.io/spring-framework/reference/7.0.9/integration/rest-clients.html#rest-http-service-client)
- Adds [`OAuth2ClientHttpRequestInterceptor`](../../../servlet/oauth2/client/authorized-clients.md#oauth2-client-rest-client) to the `RestClient`

<a id="configuration-webclient"></a>

### WebClient Configuration

Spring Security’s OAuth Support can integrate with [HTTP Service Clients](https://docs.spring.io/spring-framework/reference/7.0.9/integration/rest-clients.html#rest-http-service-client) backed by `WebClient`.
The first step is to [create an `ReactiveOAuthAuthorizedClientManager` Bean](../../../reactive/oauth2/client/core.md#oauth2Client-authorized-manager-provider).

Next you must configure `HttpServiceProxyFactory` and `WebRestClient` to be aware of [@ClientRegistrationId](#client-registration-id)
To simplify this configuration, use [`OAuth2WebClientHttpServiceGroupConfigurer`](https://docs.spring.io/spring-security/site/docs/7.1.1/api/org/springframework/security/oauth2/client/web/reactive/function/client/support/OAuth2WebClientHttpServiceGroupConfigurer.html).

#### Java

```java
@Bean
OAuth2WebClientHttpServiceGroupConfigurer securityConfigurer(
		ReactiveOAuth2AuthorizedClientManager manager) {
	return OAuth2WebClientHttpServiceGroupConfigurer.from(manager);
}
```

#### Kotlin

```kotlin
@Bean
fun securityConfigurer(
    manager: ReactiveOAuth2AuthorizedClientManager?
): OAuth2WebClientHttpServiceGroupConfigurer {
    return OAuth2WebClientHttpServiceGroupConfigurer.from(requireNotNull(manager))
}

```

The configuration:

- Adds [`ClientRegistrationIdProcessor`](#client-registration-id-processor) to [`HttpServiceProxyFactory`](https://docs.spring.io/spring-framework/reference/7.0.9//integration/rest-clients.html#rest-http-service-client)
- Adds [`ServerOAuth2AuthorizedClientExchangeFilterFunction`](../../../reactive/oauth2/client/authorized-clients.md#oauth2-client-web-client) to the `WebClient`

<a id="client-registration-id"></a>

## @ClientRegistrationId

You can add the [`ClientRegistrationId`](https://docs.spring.io/spring-security/site/docs/7.1.1/api/org/springframework/security/oauth2/client/annotation/ClientRegistrationId.html) on the HTTP Service to specify which [`ClientRegistration`](https://docs.spring.io/spring-security/site/docs/7.1.1/api/org/springframework/security/oauth2/client/registration/ClientRegistration.html) to use.

#### Java

```java
	@GetExchange("/user")
	@ClientRegistrationId("github")
	User getAuthenticatedUser();
```

#### Kotlin

```kotlin
    @GetExchange("/user")
    @ClientRegistrationId("github")
    fun getAuthenticatedUser() : User
```

The [`@ClientRegistrationId`](#client-registration-id) will be processed by [`ClientRegistrationIdProcessor`](#client-registration-id-processor)

<a id="type"></a>

### Type Level Declarations

`@ClientRegistrationId` can also be added at the type level to avoid repeating the declaration on every method.

#### Java

```java
@HttpExchange
@ClientRegistrationId("github")
public interface UserService {

	@GetExchange("/user")
	User getAuthenticatedUser();

	@GetExchange("/users/{username}/hovercard")
	Hovercard getHovercard(@PathVariable String username);

}
```

#### Kotlin

```kotlin
@HttpExchange
@ClientRegistrationId("github")
interface UserService {
    @GetExchange("/user")
    fun getAuthenticatedUser(): User

    @GetExchange("/users/{username}/hovercard")
    fun getHovercard(@PathVariable username: String): Hovercard
}
```

<a id="client-registration-id-processor"></a>

## `ClientRegistrationIdProcessor`

The [configured](#configuration) [`ClientRegistrationIdProcessor`](https://docs.spring.io/spring-security/site/docs/7.1.1/api/org/springframework/security/oauth2/client/web/client/ClientRegistrationIdProcessor.html) will:

- Automatically invoke [`ClientAttributes.clientRegistrationId(String)`](<https://docs.spring.io/spring-security/site/docs/7.1.1/api/org/springframework/security/oauth2/client/web/ClientAttributes.html#clientRegistrationId(java.lang.String)>) for each [`@ClientRegistrationId`](#client-registration-id).
- This adds the [`ClientRegistration.getId()`](<https://docs.spring.io/spring-security/site/docs/7.1.1/api/org/springframework/security/oauth2/client/registration/ClientRegistration.html#getId()>) to the attributes

The `id` is then processed by:

- `OAuth2ClientHttpRequestInterceptor` for [RestClient Integration](../../../servlet/oauth2/client/authorized-clients.md#oauth2-client-rest-client)
- [`ServletOAuth2AuthorizedClientExchangeFilterFunction`](../../../servlet/oauth2/client/authorized-clients.md#oauth2-client-web-client) (servlets) or [`ServerOAuth2AuthorizedClientExchangeFilterFunction`](../../../servlet/oauth2/client/authorized-clients.md#oauth2-client-web-client) (reactive environments) for `WebClient`.
