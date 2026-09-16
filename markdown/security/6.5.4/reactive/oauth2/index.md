---
title: "OAuth2 WebFlux"
source: "ROOT:reactive/oauth2/index.adoc"
---

<a id="webflux-oauth2"></a>

# OAuth2 WebFlux

Spring Security provides comprehensive OAuth 2.0 support.
This section discusses how to integrate OAuth 2.0 into your reactive application.

<a id="oauth2-overview"></a>

## Overview

Spring Security’s OAuth 2.0 support consists of two primary feature sets:

- [OAuth2 Resource Server](#oauth2-resource-server)
- [OAuth2 Client](#oauth2-client)

> [!NOTE]
> [OAuth2 Login](#oauth2-client-log-users-in) is a very powerful OAuth2 Client feature that deserves its own section in the reference documentation.
> However, it does not exist as a standalone feature and requires OAuth2 Client in order to function.

These feature sets cover the *resource server* and *client* roles defined in the [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749#section-1.1), while the *authorization server* role is covered by [Spring Authorization Server](https://docs.spring.io/spring-authorization-server/reference/index.html), which is a separate project built on [Spring Security](../../index.md).

The *resource server* and *client* roles in OAuth2 are typically represented by one or more server-side applications.
Additionally, the *authorization server* role can be represented by one or more third parties (as is the case when centralizing identity management and/or authentication within an organization) **-or-** it can be represented by an application (as is the case with Spring Authorization Server).

For example, a typical OAuth2-based microservices architecture might consist of a single user-facing client application, several backend resource servers providing REST APIs and a third party authorization server for managing users and authentication concerns.
It is also common to have a single application representing only one of these roles with the need to integrate with one or more third parties that are providing the other roles.

Spring Security handles these scenarios and more.
The following sections cover the roles provided by Spring Security and contain examples for common scenarios.

<a id="oauth2-resource-server"></a>

## OAuth2 Resource Server

> [!NOTE]
> This section contains a summary of OAuth2 Resource Server features with examples.
> See [OAuth 2.0 Resource Server](resource-server/index.md) for complete reference documentation.

To get started, add the `spring-security-oauth2-resource-server` dependency to your project.
When using Spring Boot, add the following starter:

#### Gradle

```gradle
implementation 'org.springframework.boot:spring-boot-starter-oauth2-resource-server'
```

#### Maven

```maven
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-oauth2-resource-server</artifactId>
</dependency>
```

> [!TIP]
> See [getting-spring-security.adoc](../../getting-spring-security.md) for additional options when not using Spring Boot.

Consider the following use cases for OAuth2 Resource Server:

- I want to [protect access to the API using OAuth2](#oauth2-resource-server-access-token) (authorization server provides JWT or opaque access token)
- I want to [protect access to the API using a JWT](#oauth2-resource-server-custom-jwt) (custom token)

<a id="oauth2-resource-server-access-token"></a>

### Protect Access with an OAuth2 Access Token

It is very common to protect access to an API using OAuth2 access tokens.
In most cases, Spring Security requires only minimal configuration to secure an application with OAuth2.

There are two types of `Bearer` tokens supported by Spring Security which each use a different component for validation:

- [JWT support](#oauth2-resource-server-access-token-jwt) uses a `ReactiveJwtDecoder` bean to validate signatures and decode tokens
- [Opaque token support](#oauth2-resource-server-access-token-opaque) uses a `ReactiveOpaqueTokenIntrospector` bean to introspect tokens

<a id="oauth2-resource-server-access-token-jwt"></a>

#### JWT Support

The following example configures a `ReactiveJwtDecoder` bean using Spring Boot configuration properties:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://my-auth-server.com
```

When using Spring Boot, this is all that is required.
The default arrangement provided by Spring Boot is equivalent to the following:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

	@Bean
	public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
		http
			.authorizeExchange((authorize) -> authorize
				.anyExchange().authenticated()
			)
			.oauth2ResourceServer((oauth2) -> oauth2
				.jwt(Customizer.withDefaults())
			);
		return http.build();
	}

	@Bean
	public ReactiveJwtDecoder jwtDecoder() {
		return ReactiveJwtDecoders.fromIssuerLocation("https://my-auth-server.com");
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.config.web.server.invoke

@Configuration
@EnableWebFluxSecurity
class SecurityConfig {

	@Bean
	fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
		return http {
			authorizeExchange {
				authorize(anyExchange, authenticated)
			}
			oauth2ResourceServer {
				jwt { }
			}
		}
	}

	@Bean
	fun jwtDecoder(): ReactiveJwtDecoder {
		return ReactiveJwtDecoders.fromIssuerLocation("https://my-auth-server.com")
	}

}
```

<a id="oauth2-resource-server-access-token-opaque"></a>

#### Opaque Token Support

The following example configures an `ReactiveOpaqueTokenIntrospector` bean using Spring Boot configuration properties:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        opaquetoken:
          introspection-uri: https://my-auth-server.com/oauth2/introspect
          client-id: my-client-id
          client-secret: my-client-secret
```

When using Spring Boot, this is all that is required.
The default arrangement provided by Spring Boot is equivalent to the following:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

	@Bean
	public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
		http
			.authorizeExchange((authorize) -> authorize
				.anyExchange().authenticated()
			)
			.oauth2ResourceServer((oauth2) -> oauth2
				.opaqueToken(Customizer.withDefaults())
			);
		return http.build();
	}

	@Bean
	public ReactiveOpaqueTokenIntrospector opaqueTokenIntrospector() {
		return new SpringReactiveOpaqueTokenIntrospector(
			"https://my-auth-server.com/oauth2/introspect", "my-client-id", "my-client-secret");
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.config.web.server.invoke

@Configuration
@EnableWebFluxSecurity
class SecurityConfig {

	@Bean
	fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
		return http {
			authorizeExchange {
				authorize(anyExchange, authenticated)
			}
			oauth2ResourceServer {
				opaqueToken { }
			}
		}
	}

	@Bean
	fun opaqueTokenIntrospector(): ReactiveOpaqueTokenIntrospector {
		return SpringReactiveOpaqueTokenIntrospector(
			"https://my-auth-server.com/oauth2/introspect", "my-client-id", "my-client-secret"
		)
	}

}
```

<a id="oauth2-resource-server-custom-jwt"></a>

### Protect Access with a custom JWT

It is a fairly common goal to protect access to an API using JWTs, particularly when the frontend is developed as a single-page application.
The OAuth2 Resource Server support in Spring Security can be used for any type of `Bearer` token, including a custom JWT.

All that is required to protect an API using JWTs is a `ReactiveJwtDecoder` bean, which is used to validate signatures and decode tokens.
Spring Security will automatically use the provided bean to configure protection within the `SecurityWebFilterChain`.

The following example configures a `ReactiveJwtDecoder` bean using Spring Boot configuration properties:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          public-key-location: classpath:my-public-key.pub
```

> [!NOTE]
> You can provide the public key as a classpath resource (called `my-public-key.pub` in this example).

When using Spring Boot, this is all that is required.
The default arrangement provided by Spring Boot is equivalent to the following:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

	@Bean
	public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
		http
			.authorizeExchange((authorize) -> authorize
				.anyExchange().authenticated()
			)
			.oauth2ResourceServer((oauth2) -> oauth2
				.jwt(Customizer.withDefaults())
			);
		return http.build();
	}

	@Bean
	public ReactiveJwtDecoder jwtDecoder() {
		return NimbusReactiveJwtDecoder.withPublicKey(publicKey()).build();
	}

	private RSAPublicKey publicKey() {
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.config.web.server.invoke

@Configuration
@EnableWebFluxSecurity
class SecurityConfig {

	@Bean
	fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
		return http {
			authorizeExchange {
				authorize(anyExchange, authenticated)
			}
			oauth2ResourceServer {
				jwt { }
			}
		}
	}

	@Bean
	fun jwtDecoder(): ReactiveJwtDecoder {
		return NimbusReactiveJwtDecoder.withPublicKey(publicKey()).build()
	}

	private fun publicKey(): RSAPublicKey {
		// ...
	}

}
```

> [!NOTE]
> Spring Security does not provide an endpoint for minting tokens.
> However, Spring Security does provide the `JwtEncoder` interface along with one implementation, which is `NimbusJwtEncoder`.

<a id="oauth2-client"></a>

## OAuth2 Client

> [!NOTE]
> This section contains a summary of OAuth2 Client features with examples.
> See [OAuth 2.0 Client](client/index.md) and [OAuth 2.0 Login](login/index.md) for complete reference documentation.

To get started, add the `spring-security-oauth2-client` dependency to your project.
When using Spring Boot, add the following starter:

#### Gradle

```gradle
implementation 'org.springframework.boot:spring-boot-starter-oauth2-client'
```

#### Maven

```maven
<dependency>
	<groupId>org.springframework.boot</groupId>
	<artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
```

> [!TIP]
> See [getting-spring-security.adoc](../../getting-spring-security.md) for additional options when not using Spring Boot.

Consider the following use cases for OAuth2 Client:

- I want to [log users in using OAuth 2.0 or OpenID Connect 1.0](#oauth2-client-log-users-in)
- I want to [obtain an access token for users](#oauth2-client-access-protected-resources) in order to access a third-party API
- I want to [do both](#oauth2-client-access-protected-resources-current-user) (log users in *and* access a third-party API)
- I want to [enable an extension grant type](#oauth2-client-enable-extension-grant-type)
- I want to [customize an existing grant type](#oauth2-client-customize-existing-grant-type)
- I want to [customize token request parameters](#oauth2-client-customize-request-parameters)
- I want to [customize the `WebClient` used by OAuth2 Client components](#oauth2-client-customize-web-client)

<a id="oauth2-client-log-users-in"></a>

### Log Users In with OAuth2

It is very common to require users to log in via OAuth2.
[OpenID Connect 1.0](https://openid.net/specs/openid-connect-core-1_0.html) provides a special token called the `id_token` which is designed to provide an OAuth2 Client with the ability to perform user identity verification and log users in.
In certain cases, OAuth2 can be used directly to log users in (as is the case with popular social login providers that do not implement OpenID Connect such as GitHub and Facebook).

The following example configures the application to act as an OAuth2 Client capable of logging users in with OAuth2 or OpenID Connect:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

	@Bean
	public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
		http
			// ...
			.oauth2Login(Customizer.withDefaults());
		return http.build();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.config.web.server.invoke

@Configuration
@EnableWebFluxSecurity
class SecurityConfig {

	@Bean
	fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
		return http {
			// ...
			oauth2Login { }
		}
	}

}
```

In addition to the above configuration, the application requires at least one `ClientRegistration` to be configured through the use of a `ReactiveClientRegistrationRepository` bean.
The following example configures an `InMemoryReactiveClientRegistrationRepository` bean using Spring Boot configuration properties:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          my-oidc-client:
            provider: my-oidc-provider
            client-id: my-client-id
            client-secret: my-client-secret
            authorization-grant-type: authorization_code
            scope: openid,profile
        provider:
          my-oidc-provider:
            issuer-uri: https://my-oidc-provider.com
```

With the above configuration, the application now supports two additional endpoints:

1. The login endpoint (e.g. `/oauth2/authorization/my-oidc-client`) is used to initiate login and perform a redirect to the third party authorization server.
1. The redirection endpoint (e.g. `/login/oauth2/code/my-oidc-client`) is used by the authorization server to redirect back to the client application, and will contain a `code` parameter used to obtain an `id_token` and/or `access_token` via the access token request.

> [!NOTE]
> The presence of the `openid` scope in the above configuration indicates that OpenID Connect 1.0 should be used.
> This instructs Spring Security to use OIDC-specific components (such as `OidcReactiveOAuth2UserService`) during request processing.
> Without this scope, Spring Security will use OAuth2-specific components (such as `DefaultReactiveOAuth2UserService`) instead.

<a id="oauth2-client-access-protected-resources"></a>

### Access Protected Resources

Making requests to a third party API that is protected by OAuth2 is a core use case of OAuth2 Client.
This is accomplished by authorizing a client (represented by the `OAuth2AuthorizedClient` class in Spring Security) and accessing protected resources by placing a `Bearer` token in the `Authorization` header of an outbound request.

The following example configures the application to act as an OAuth2 Client capable of requesting protected resources from a third party API:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

	@Bean
	public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
		http
			// ...
			.oauth2Client(Customizer.withDefaults());
		return http.build();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.config.web.server.invoke

@Configuration
@EnableWebFluxSecurity
class SecurityConfig {

	@Bean
	fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
		return http {
			// ...
			oauth2Client { }
		}
	}

}
```

> [!NOTE]
> The above example does not provide a way to log users in.
> You can use any other login mechanism (such as `formLogin()`).
> See the [next section](#oauth2-client-access-protected-resources-current-user) for an example combining `oauth2Client()` with `oauth2Login()`.

In addition to the above configuration, the application requires at least one `ClientRegistration` to be configured through the use of a `ReactiveClientRegistrationRepository` bean.
The following example configures an `InMemoryReactiveClientRegistrationRepository` bean using Spring Boot configuration properties:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          my-oauth2-client:
            provider: my-auth-server
            client-id: my-client-id
            client-secret: my-client-secret
            authorization-grant-type: authorization_code
            scope: message.read,message.write
        provider:
          my-auth-server:
            issuer-uri: https://my-auth-server.com
```

In addition to configuring Spring Security to support OAuth2 Client features, you will also need to decide how you will be accessing protected resources and configure your application accordingly.
Spring Security provides implementations of `ReactiveOAuth2AuthorizedClientManager` for obtaining access tokens that can be used to access protected resources.

> [!TIP]
> Spring Security registers a default `ReactiveOAuth2AuthorizedClientManager` bean for you when one does not exist.

The easiest way to use a `ReactiveOAuth2AuthorizedClientManager` is via an `ExchangeFilterFunction` that intercepts requests through a `WebClient`.

The following example uses the default `ReactiveOAuth2AuthorizedClientManager` to configure a `WebClient` capable of accessing protected resources by placing `Bearer` tokens in the `Authorization` header of each request:

#### Java

```java
@Configuration
public class WebClientConfig {

	@Bean
	public WebClient webClient(ReactiveOAuth2AuthorizedClientManager authorizedClientManager) {
		ServerOAuth2AuthorizedClientExchangeFilterFunction filter =
				new ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
		return WebClient.builder()
				.filter(filter)
				.build();
	}

}
```

#### Kotlin

```kotlin
@Configuration
class WebClientConfig {

	@Bean
	fun webClient(authorizedClientManager: ReactiveOAuth2AuthorizedClientManager): WebClient {
		val filter = ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager)
		return WebClient.builder()
			.filter(filter)
			.build()
	}

}
```

This configured `WebClient` can be used as in the following example:

<a id="oauth2-client-accessing-protected-resources-example"></a>

#### Java

```java
import static org.springframework.security.oauth2.client.web.reactive.function.client.ServerOAuth2AuthorizedClientExchangeFilterFunction.clientRegistrationId;

@RestController
public class MessagesController {

	private final WebClient webClient;

	public MessagesController(WebClient webClient) {
		this.webClient = webClient;
	}

	@GetMapping("/messages")
	public Mono<ResponseEntity<List<Message>>> messages() {
		return this.webClient.get()
				.uri("http://localhost:8090/messages")
				.attributes(clientRegistrationId("my-oauth2-client"))
				.retrieve()
				.toEntityList(Message.class);
	}

	public record Message(String message) {
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.oauth2.client.web.reactive.function.client.ServerOAuth2AuthorizedClientExchangeFilterFunction.clientRegistrationId

@RestController
class MessagesController(private val webClient: WebClient) {

	@GetMapping("/messages")
	fun messages(): Mono<ResponseEntity<List<Message>>> {
		return webClient.get()
			.uri("http://localhost:8090/messages")
			.attributes(clientRegistrationId("my-oauth2-client"))
			.retrieve()
			.toEntityList<Message>()
	}

	data class Message(val message: String)

}
```

<a id="oauth2-client-access-protected-resources-current-user"></a>

### Access Protected Resources for the Current User

When a user is logged in via OAuth2 or OpenID Connect, the authorization server may provide an access token that can be used directly to access protected resources.
This is convenient because it only requires a single `ClientRegistration` to be configured for both use cases simultaneously.

> [!NOTE]
> This section combines [Log Users In with OAuth2](#oauth2-client-log-users-in) and [Access Protected Resources](#oauth2-client-access-protected-resources) into a single configuration.
> Other advanced scenarios exist, such as configuring one `ClientRegistration` for login and another for accessing protected resources.
> All such scenarios would use the same basic configuration.

The following example configures the application to act as an OAuth2 Client capable of logging the user in *and* requesting protected resources from a third party API:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

	@Bean
	public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
		http
			// ...
			.oauth2Login(Customizer.withDefaults())
			.oauth2Client(Customizer.withDefaults());
		return http.build();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.config.web.server.invoke

@Configuration
@EnableWebFluxSecurity
class SecurityConfig {

	@Bean
	fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
		return http {
			// ...
			oauth2Login { }
			oauth2Client { }
		}
	}

}
```

In addition to the above configuration, the application requires at least one `ClientRegistration` to be configured through the use of a `ReactiveClientRegistrationRepository` bean.
The following example configures an `InMemoryReactiveClientRegistrationRepository` bean using Spring Boot configuration properties:

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          my-combined-client:
            provider: my-auth-server
            client-id: my-client-id
            client-secret: my-client-secret
            authorization-grant-type: authorization_code
            scope: openid,profile,message.read,message.write
        provider:
          my-auth-server:
            issuer-uri: https://my-auth-server.com
```

> [!NOTE]
> The main difference between the previous examples ([Log Users In with OAuth2](#oauth2-client-log-users-in),  [Access Protected Resources](#oauth2-client-access-protected-resources)) and this one is what is configured via the `scope` property, which combines the standard scopes `openid` and `profile` with the custom scopes `message.read` and `message.write`.

In addition to configuring Spring Security to support OAuth2 Client features, you will also need to decide how you will be accessing protected resources and configure your application accordingly.
Spring Security provides implementations of `ReactiveOAuth2AuthorizedClientManager` for obtaining access tokens that can be used to access protected resources.

> [!TIP]
> Spring Security registers a default `ReactiveOAuth2AuthorizedClientManager` bean for you when one does not exist.

The easiest way to use a `ReactiveOAuth2AuthorizedClientManager` is via an `ExchangeFilterFunction` that intercepts requests through a `WebClient`.

The following example uses the default `ReactiveOAuth2AuthorizedClientManager` to configure a `WebClient` capable of accessing protected resources by placing `Bearer` tokens in the `Authorization` header of each request:

#### Java

```java
@Configuration
public class WebClientConfig {

	@Bean
	public WebClient webClient(ReactiveOAuth2AuthorizedClientManager authorizedClientManager) {
		ServerOAuth2AuthorizedClientExchangeFilterFunction filter =
				new ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager);
		return WebClient.builder()
				.filter(filter)
				.build();
	}

}
```

#### Kotlin

```kotlin
@Configuration
class WebClientConfig {

	@Bean
	fun webClient(authorizedClientManager: ReactiveOAuth2AuthorizedClientManager): WebClient {
		val filter = ServerOAuth2AuthorizedClientExchangeFilterFunction(authorizedClientManager)
		return WebClient.builder()
			.filter(filter)
			.build()
	}

}
```

This configured `WebClient` can be used as in the following example:

<a id="oauth2-client-accessing-protected-resources-current-user-example"></a>

#### Java

```java
@RestController
public class MessagesController {

	private final WebClient webClient;

	public MessagesController(WebClient webClient) {
		this.webClient = webClient;
	}

	@GetMapping("/messages")
	public Mono<ResponseEntity<List<Message>>> messages() {
		return this.webClient.get()
				.uri("http://localhost:8090/messages")
				.retrieve()
				.toEntityList(Message.class);
	}

	public record Message(String message) {
	}

}
```

#### Kotlin

```kotlin
@RestController
class MessagesController(private val webClient: WebClient) {

	@GetMapping("/messages")
	fun messages(): Mono<ResponseEntity<List<Message>>> {
		return webClient.get()
			.uri("http://localhost:8090/messages")
			.retrieve()
			.toEntityList<Message>()
	}

	data class Message(val message: String)

}
```

> [!NOTE]
> Unlike the [previous example](#oauth2-client-accessing-protected-resources-example), notice that we do not need to tell Spring Security about the `clientRegistrationId` we’d like to use.
> This is because it can be derived from the currently logged in user.

<a id="oauth2-client-enable-extension-grant-type"></a>

### Enable an Extension Grant Type

A common use case involves enabling and/or configuring an extension grant type.
For example, Spring Security provides support for the `jwt-bearer` and `token-exchange` grant types, but does not enable them by default because they are not part of the core OAuth 2.0 specification.

With Spring Security 6.3 and later, we can simply publish a bean for one or more `ReactiveOAuth2AuthorizedClientProvider` and they will be picked up automatically.
The following example simply enables the `jwt-bearer` grant type:

#### Java

```java
@Configuration
public class SecurityConfig {

	@Bean
	public ReactiveOAuth2AuthorizedClientProvider jwtBearer() {
		return new JwtBearerReactiveOAuth2AuthorizedClientProvider();
	}

}
```

#### Kotlin

```kotlin
@Configuration
class SecurityConfig {

	@Bean
	fun jwtBearer(): ReactiveOAuth2AuthorizedClientProvider {
		return JwtBearerReactiveOAuth2AuthorizedClientProvider()
	}

}
```

A default `ReactiveOAuth2AuthorizedClientManager` will be published automatically by Spring Security when one is not already provided.

> [!TIP]
> Any custom `OAuth2AuthorizedClientProvider` bean will also be picked up and applied to the provided `ReactiveOAuth2AuthorizedClientManager` after the default grant types.

In order to achieve the above configuration prior to Spring Security 6.3, we had to publish this bean ourselves and ensure we re-enabled default grant types as well.
To understand what is being configured behind the scenes, here’s what the configuration might have looked like:

#### Java

```java
@Configuration
public class SecurityConfig {

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
				.provider(new JwtBearerReactiveOAuth2AuthorizedClientProvider())
				.build();

		DefaultReactiveOAuth2AuthorizedClientManager authorizedClientManager =
			new DefaultReactiveOAuth2AuthorizedClientManager(
				clientRegistrationRepository, authorizedClientRepository);
		authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);

		return authorizedClientManager;
	}

}
```

#### Kotlin

```kotlin
@Configuration
class SecurityConfig {

	@Bean
	fun authorizedClientManager(
		clientRegistrationRepository: ReactiveClientRegistrationRepository,
		authorizedClientRepository: ServerOAuth2AuthorizedClientRepository
	): ReactiveOAuth2AuthorizedClientManager {
		val authorizedClientProvider = ReactiveOAuth2AuthorizedClientProviderBuilder.builder()
			.authorizationCode()
			.refreshToken()
			.clientCredentials()
			.password()
			.provider(JwtBearerReactiveOAuth2AuthorizedClientProvider())
			.build()

		val authorizedClientManager = DefaultReactiveOAuth2AuthorizedClientManager(
			clientRegistrationRepository, authorizedClientRepository
		)
		authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider)

		return authorizedClientManager
	}

}
```

<a id="oauth2-client-customize-existing-grant-type"></a>

### Customize an Existing Grant Type

The ability to [enable extension grant types](#oauth2-client-enable-extension-grant-type) by publishing a bean also provides the opportunity for customizing an existing grant type without the need to re-define the defaults.
For example, if we want to customize the clock skew of the `ReactiveOAuth2AuthorizedClientProvider` for the `client_credentials` grant, we can simply publish a bean like so:

#### Java

```java
@Configuration
public class SecurityConfig {

	@Bean
	public ReactiveOAuth2AuthorizedClientProvider clientCredentials() {
		ClientCredentialsReactiveOAuth2AuthorizedClientProvider authorizedClientProvider =
				new ClientCredentialsReactiveOAuth2AuthorizedClientProvider();
		authorizedClientProvider.setClockSkew(Duration.ofMinutes(5));

		return authorizedClientProvider;
	}

}
```

#### Kotlin

```kotlin
@Configuration
class SecurityConfig {

	@Bean
	fun clientCredentials(): ReactiveOAuth2AuthorizedClientProvider {
		val authorizedClientProvider = ClientCredentialsReactiveOAuth2AuthorizedClientProvider()
		authorizedClientProvider.setClockSkew(Duration.ofMinutes(5))
		return authorizedClientProvider
	}

}
```

<a id="oauth2-client-customize-request-parameters"></a>

### Customize Token Request Parameters

The need to customize request parameters when obtaining an access token is fairly common.
For example, let’s say we want to add a custom `audience` parameter to the token request because the provider requires this parameter for the `authorization_code` grant.

We can simply publish a bean of type `ReactiveOAuth2AccessTokenResponseClient` with the generic type `OAuth2AuthorizationCodeGrantRequest` and it will be used by Spring Security to configure OAuth2 Client components.

The following example customizes token request parameters for the `authorization_code` grant:

#### Java

```java
@Configuration
public class SecurityConfig {

	@Bean
	public ReactiveOAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> authorizationCodeAccessTokenResponseClient() {
		WebClientReactiveAuthorizationCodeTokenResponseClient accessTokenResponseClient =
			new WebClientReactiveAuthorizationCodeTokenResponseClient();
		accessTokenResponseClient.addParametersConverter(parametersConverter());

		return accessTokenResponseClient;
	}

	private static Converter<OAuth2AuthorizationCodeGrantRequest, MultiValueMap<String, String>> parametersConverter() {
		return (grantRequest) -> {
			MultiValueMap<String, String> parameters = new LinkedMultiValueMap<>();
			parameters.set("audience", "xyz_value");

			return parameters;
		};
	}

}
```

#### Kotlin

```kotlin
@Configuration
class SecurityConfig {

	@Bean
	fun authorizationCodeAccessTokenResponseClient(): ReactiveOAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> {
		val accessTokenResponseClient = WebClientReactiveAuthorizationCodeTokenResponseClient()
		accessTokenResponseClient.addParametersConverter(parametersConverter())

		return accessTokenResponseClient
	}

	private fun parametersConverter(): Converter<OAuth2AuthorizationCodeGrantRequest, MultiValueMap<String, String>> {
		return Converter<OAuth2AuthorizationCodeGrantRequest, MultiValueMap<String, String>> { grantRequest ->
			LinkedMultiValueMap<String, String>().also { parameters ->
				parameters["audience"] = "xyz_value"
			}
		}
	}

}
```

> [!TIP]
> Notice that we don’t need to customize the `SecurityWebFilterChain` bean in this case, and can stick with the defaults.
> If using Spring Boot with no additional customizations, we can actually omit the `SecurityWebFilterChain` bean entirely.

As you can see, providing the `ReactiveOAuth2AccessTokenResponseClient` as a bean is quite convenient.
When using the Spring Security DSL directly, we need to ensure that this customization is applied for both OAuth2 Login (if we are using this feature) and OAuth2 Client components.
To understand what is being configured behind the scenes, here’s what the configuration would look like with the DSL:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

	@Bean
	public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
		WebClientReactiveAuthorizationCodeTokenResponseClient accessTokenResponseClient =
			new WebClientReactiveAuthorizationCodeTokenResponseClient();
		accessTokenResponseClient.addParametersConverter(parametersConverter());

		http
			.authorizeExchange((authorize) -> authorize
				.anyExchange().authenticated()
			)
			.oauth2Login((oauth2Login) -> oauth2Login
				.authenticationManager(new DelegatingReactiveAuthenticationManager(
					new OidcAuthorizationCodeReactiveAuthenticationManager(
						accessTokenResponseClient, new OidcReactiveOAuth2UserService()
					),
					new OAuth2LoginReactiveAuthenticationManager(
						accessTokenResponseClient, new DefaultReactiveOAuth2UserService()
					)
				))
			)
			.oauth2Client((oauth2Client) -> oauth2Client
				.authenticationManager(new OAuth2AuthorizationCodeReactiveAuthenticationManager(
					accessTokenResponseClient
				))
			);

		return http.build();
	}

	private static Converter<OAuth2AuthorizationCodeGrantRequest, MultiValueMap<String, String>> parametersConverter() {
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.config.web.server.invoke

@Configuration
@EnableWebFluxSecurity
class SecurityConfig {

	@Bean
	fun securityWebFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
		val accessTokenResponseClient = WebClientReactiveAuthorizationCodeTokenResponseClient()
		accessTokenResponseClient.addParametersConverter(parametersConverter())

		return http {
			authorizeExchange {
				authorize(anyExchange, authenticated)
			}
			oauth2Login {
				authenticationManager = DelegatingReactiveAuthenticationManager(
					OidcAuthorizationCodeReactiveAuthenticationManager(
						accessTokenResponseClient, OidcReactiveOAuth2UserService()
					),
					OAuth2LoginReactiveAuthenticationManager(
						accessTokenResponseClient, DefaultReactiveOAuth2UserService()
					)
				)
			}
			oauth2Client {
				authenticationManager = OAuth2AuthorizationCodeReactiveAuthenticationManager(
					accessTokenResponseClient
				)
			}
		}
	}

	private fun parametersConverter(): Converter<OAuth2AuthorizationCodeGrantRequest, MultiValueMap<String, String>> {
		// ...
	}

}
```

For other grant types we can publish additional `ReactiveOAuth2AccessTokenResponseClient` beans to override the defaults.
For example, to customize token requests for the `client_credentials` grant we can publish the following bean:

#### Java

```java
@Configuration
public class SecurityConfig {

	@Bean
	public ReactiveOAuth2AccessTokenResponseClient<OAuth2ClientCredentialsGrantRequest> clientCredentialsAccessTokenResponseClient() {
		WebClientReactiveClientCredentialsTokenResponseClient accessTokenResponseClient =
				new WebClientReactiveClientCredentialsTokenResponseClient();
		accessTokenResponseClient.addParametersConverter(parametersConverter());

		return accessTokenResponseClient;
	}

	private static Converter<OAuth2ClientCredentialsGrantRequest, MultiValueMap<String, String>> parametersConverter() {
		// ...
	}

}
```

#### Kotlin

```kotlin
@Configuration
class SecurityConfig {

	@Bean
	fun clientCredentialsAccessTokenResponseClient(): ReactiveOAuth2AccessTokenResponseClient<OAuth2ClientCredentialsGrantRequest> {
		val accessTokenResponseClient = WebClientReactiveClientCredentialsTokenResponseClient()
		accessTokenResponseClient.addParametersConverter(parametersConverter())

		return accessTokenResponseClient
	}

	private fun parametersConverter(): Converter<OAuth2ClientCredentialsGrantRequest, MultiValueMap<String, String>> {
		// ...
	}

}
```

Spring Security automatically resolves the following generic types of `ReactiveOAuth2AccessTokenResponseClient` beans:

- `OAuth2AuthorizationCodeGrantRequest` (see `WebClientReactiveAuthorizationCodeTokenResponseClient`)
- `OAuth2RefreshTokenGrantRequest` (see `WebClientReactiveRefreshTokenTokenResponseClient`)
- `OAuth2ClientCredentialsGrantRequest` (see `WebClientReactiveClientCredentialsTokenResponseClient`)
- `OAuth2PasswordGrantRequest` (see `WebClientReactivePasswordTokenResponseClient`)
- `JwtBearerGrantRequest` (see `WebClientReactiveJwtBearerTokenResponseClient`)
- `TokenExchangeGrantRequest` (see `WebClientReactiveTokenExchangeTokenResponseClient`)

> [!TIP]
> Publishing a bean of type `ReactiveOAuth2AccessTokenResponseClient<JwtBearerGrantRequest>` will automatically enable the `jwt-bearer` grant type without the need to [configure it separately](#oauth2-client-enable-extension-grant-type).

> [!TIP]
> Publishing a bean of type `ReactiveOAuth2AccessTokenResponseClient<TokenExchangeGrantRequest>` will automatically enable the `token-exchange` grant type without the need to [configure it separately](#oauth2-client-enable-extension-grant-type).

<a id="oauth2-client-customize-web-client"></a>

### Customize the `WebClient` used by OAuth2 Client Components

Another common use case is the need to customize the `WebClient` used when obtaining an access token.
We might need to do this to customize the underlying HTTP client library (via a custom `ClientHttpConnector`) to configure SSL settings or to apply proxy settings for a corporate network.

With Spring Security 6.3 and later, we can simply publish beans of type `ReactiveOAuth2AccessTokenResponseClient` and Spring Security will configure and publish a `ReactiveOAuth2AuthorizedClientManager` bean for us.

The following example customizes the `WebClient` for all of the supported grant types:

#### Java

```java
@Configuration
public class SecurityConfig {

	@Bean
	public ReactiveOAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> authorizationCodeAccessTokenResponseClient() {
		WebClientReactiveAuthorizationCodeTokenResponseClient accessTokenResponseClient =
			new WebClientReactiveAuthorizationCodeTokenResponseClient();
		accessTokenResponseClient.setWebClient(webClient());

		return accessTokenResponseClient;
	}

	@Bean
	public ReactiveOAuth2AccessTokenResponseClient<OAuth2RefreshTokenGrantRequest> refreshTokenAccessTokenResponseClient() {
		WebClientReactiveRefreshTokenTokenResponseClient accessTokenResponseClient =
			new WebClientReactiveRefreshTokenTokenResponseClient();
		accessTokenResponseClient.setWebClient(webClient());

		return accessTokenResponseClient;
	}

	@Bean
	public ReactiveOAuth2AccessTokenResponseClient<OAuth2ClientCredentialsGrantRequest> clientCredentialsAccessTokenResponseClient() {
		WebClientReactiveClientCredentialsTokenResponseClient accessTokenResponseClient =
			new WebClientReactiveClientCredentialsTokenResponseClient();
		accessTokenResponseClient.setWebClient(webClient());

		return accessTokenResponseClient;
	}

	@Bean
	public ReactiveOAuth2AccessTokenResponseClient<OAuth2PasswordGrantRequest> passwordAccessTokenResponseClient() {
		WebClientReactivePasswordTokenResponseClient accessTokenResponseClient =
			new WebClientReactivePasswordTokenResponseClient();
		accessTokenResponseClient.setWebClient(webClient());

		return accessTokenResponseClient;
	}

	@Bean
	public ReactiveOAuth2AccessTokenResponseClient<JwtBearerGrantRequest> jwtBearerAccessTokenResponseClient() {
		WebClientReactiveJwtBearerTokenResponseClient accessTokenResponseClient =
			new WebClientReactiveJwtBearerTokenResponseClient();
		accessTokenResponseClient.setWebClient(webClient());

		return accessTokenResponseClient;
	}

	@Bean
	public ReactiveOAuth2AccessTokenResponseClient<TokenExchangeGrantRequest> tokenExchangeAccessTokenResponseClient() {
		WebClientReactiveTokenExchangeTokenResponseClient accessTokenResponseClient =
			new WebClientReactiveTokenExchangeTokenResponseClient();
		accessTokenResponseClient.setWebClient(webClient());

		return accessTokenResponseClient;
	}

	@Bean
	public WebClient webClient() {
		// ...
	}

}
```

#### Kotlin

```kotlin
@Configuration
class SecurityConfig {

	@Bean
	fun authorizationCodeAccessTokenResponseClient(): ReactiveOAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> {
		val accessTokenResponseClient = WebClientReactiveAuthorizationCodeTokenResponseClient()
		accessTokenResponseClient.setWebClient(webClient())

		return accessTokenResponseClient
	}

	@Bean
	fun refreshTokenAccessTokenResponseClient(): ReactiveOAuth2AccessTokenResponseClient<OAuth2RefreshTokenGrantRequest> {
		val accessTokenResponseClient = WebClientReactiveRefreshTokenTokenResponseClient()
		accessTokenResponseClient.setWebClient(webClient())

		return accessTokenResponseClient
	}

	@Bean
	fun clientCredentialsAccessTokenResponseClient(): ReactiveOAuth2AccessTokenResponseClient<OAuth2ClientCredentialsGrantRequest> {
		val accessTokenResponseClient = WebClientReactiveClientCredentialsTokenResponseClient()
		accessTokenResponseClient.setWebClient(webClient())

		return accessTokenResponseClient
	}

	@Bean
	fun passwordAccessTokenResponseClient(): ReactiveOAuth2AccessTokenResponseClient<OAuth2PasswordGrantRequest> {
		val accessTokenResponseClient = WebClientReactivePasswordTokenResponseClient()
		accessTokenResponseClient.setWebClient(webClient())

		return accessTokenResponseClient
	}

	@Bean
	fun jwtBearerAccessTokenResponseClient(): ReactiveOAuth2AccessTokenResponseClient<JwtBearerGrantRequest> {
		val accessTokenResponseClient = WebClientReactiveJwtBearerTokenResponseClient()
		accessTokenResponseClient.setWebClient(webClient())

		return accessTokenResponseClient
	}

	@Bean
	fun tokenExchangeAccessTokenResponseClient(): ReactiveOAuth2AccessTokenResponseClient<TokenExchangeGrantRequest> {
		val accessTokenResponseClient = WebClientReactiveTokenExchangeTokenResponseClient()
		accessTokenResponseClient.setWebClient(webClient())

		return accessTokenResponseClient
	}

	@Bean
	fun webClient(): WebClient {
		// ...
	}

}
```

A default `ReactiveOAuth2AuthorizedClientManager` will be published automatically by Spring Security when one is not already provided.

> [!TIP]
> Notice that we don’t need to customize the `SecurityWebFilterChain` bean in this case, and can stick with the defaults.
> If using Spring Boot with no additional customizations, we can actually omit the `SecurityWebFilterChain` bean entirely.

Prior to Spring Security 6.3, we had to ensure this customization was applied to OAuth2 Client components ourselves.
While we could publish a bean of type `ReactiveOAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest>` for the `authorization_code` grant, we had to publish a bean of type `ReactiveOAuth2AuthorizedClientManager` for other grant types.
To understand what is being configured behind the scenes, here’s what the configuration might have looked like:

#### Java

```java
@Configuration
public class SecurityConfig {

	@Bean
	public ReactiveOAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> authorizationCodeAccessTokenResponseClient() {
		WebClientReactiveAuthorizationCodeTokenResponseClient accessTokenResponseClient =
			new WebClientReactiveAuthorizationCodeTokenResponseClient();
		accessTokenResponseClient.setWebClient(webClient());

		return accessTokenResponseClient;
	}

	@Bean
	public ReactiveOAuth2AuthorizedClientManager authorizedClientManager(
			ReactiveClientRegistrationRepository clientRegistrationRepository,
			ServerOAuth2AuthorizedClientRepository authorizedClientRepository) {

		WebClientReactiveRefreshTokenTokenResponseClient refreshTokenAccessTokenResponseClient =
			new WebClientReactiveRefreshTokenTokenResponseClient();
		refreshTokenAccessTokenResponseClient.setWebClient(webClient());

		WebClientReactiveClientCredentialsTokenResponseClient clientCredentialsAccessTokenResponseClient =
			new WebClientReactiveClientCredentialsTokenResponseClient();
		clientCredentialsAccessTokenResponseClient.setWebClient(webClient());

		WebClientReactivePasswordTokenResponseClient passwordAccessTokenResponseClient =
			new WebClientReactivePasswordTokenResponseClient();
		passwordAccessTokenResponseClient.setWebClient(webClient());

		WebClientReactiveJwtBearerTokenResponseClient jwtBearerAccessTokenResponseClient =
			new WebClientReactiveJwtBearerTokenResponseClient();
		jwtBearerAccessTokenResponseClient.setWebClient(webClient());

		JwtBearerReactiveOAuth2AuthorizedClientProvider jwtBearerAuthorizedClientProvider =
			new JwtBearerReactiveOAuth2AuthorizedClientProvider();
		jwtBearerAuthorizedClientProvider.setAccessTokenResponseClient(jwtBearerAccessTokenResponseClient);

		WebClientReactiveTokenExchangeTokenResponseClient tokenExchangeAccessTokenResponseClient =
			new WebClientReactiveTokenExchangeTokenResponseClient();
		tokenExchangeAccessTokenResponseClient.setWebClient(webClient());

		TokenExchangeReactiveOAuth2AuthorizedClientProvider tokenExchangeAuthorizedClientProvider =
			new TokenExchangeReactiveOAuth2AuthorizedClientProvider();
		tokenExchangeAuthorizedClientProvider.setAccessTokenResponseClient(tokenExchangeAccessTokenResponseClient);

		ReactiveOAuth2AuthorizedClientProvider authorizedClientProvider =
			ReactiveOAuth2AuthorizedClientProviderBuilder.builder()
				.authorizationCode()
				.refreshToken((refreshToken) -> refreshToken
					.accessTokenResponseClient(refreshTokenAccessTokenResponseClient)
				)
				.clientCredentials((clientCredentials) -> clientCredentials
					.accessTokenResponseClient(clientCredentialsAccessTokenResponseClient)
				)
				.password((password) -> password
					.accessTokenResponseClient(passwordAccessTokenResponseClient)
				)
				.provider(jwtBearerAuthorizedClientProvider)
				.provider(tokenExchangeAuthorizedClientProvider)
				.build();

		DefaultReactiveOAuth2AuthorizedClientManager authorizedClientManager =
			new DefaultReactiveOAuth2AuthorizedClientManager(
				clientRegistrationRepository, authorizedClientRepository);
		authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);

		return authorizedClientManager;
	}

	@Bean
	public WebClient webClient() {
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.config.web.server.invoke

@Configuration
class SecurityConfig {

	@Bean
	fun authorizationCodeAccessTokenResponseClient(): ReactiveOAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> {
		val accessTokenResponseClient = WebClientReactiveAuthorizationCodeTokenResponseClient()
		accessTokenResponseClient.setWebClient(webClient())

		return accessTokenResponseClient
	}

	@Bean
	fun authorizedClientManager(
		clientRegistrationRepository: ReactiveClientRegistrationRepository?,
		authorizedClientRepository: ServerOAuth2AuthorizedClientRepository?
	): ReactiveOAuth2AuthorizedClientManager {
		val refreshTokenAccessTokenResponseClient = WebClientReactiveRefreshTokenTokenResponseClient()
		refreshTokenAccessTokenResponseClient.setWebClient(webClient())

		val clientCredentialsAccessTokenResponseClient = WebClientReactiveClientCredentialsTokenResponseClient()
		clientCredentialsAccessTokenResponseClient.setWebClient(webClient())

		val passwordAccessTokenResponseClient = WebClientReactivePasswordTokenResponseClient()
		passwordAccessTokenResponseClient.setWebClient(webClient())

		val jwtBearerAccessTokenResponseClient = WebClientReactiveJwtBearerTokenResponseClient()
		jwtBearerAccessTokenResponseClient.setWebClient(webClient())

		val jwtBearerAuthorizedClientProvider = JwtBearerReactiveOAuth2AuthorizedClientProvider()
		jwtBearerAuthorizedClientProvider.setAccessTokenResponseClient(jwtBearerAccessTokenResponseClient)

		val tokenExchangeAccessTokenResponseClient = WebClientReactiveTokenExchangeTokenResponseClient()
		tokenExchangeAccessTokenResponseClient.setWebClient(webClient())

		val tokenExchangeAuthorizedClientProvider = TokenExchangeReactiveOAuth2AuthorizedClientProvider()
		tokenExchangeAuthorizedClientProvider.setAccessTokenResponseClient(tokenExchangeAccessTokenResponseClient)

		val authorizedClientProvider = OAuth2AuthorizedClientProviderBuilder.builder()
			.authorizationCode()
			.refreshToken { refreshToken ->
				refreshToken.accessTokenResponseClient(refreshTokenAccessTokenResponseClient)
			}
			.clientCredentials { clientCredentials ->
				clientCredentials.accessTokenResponseClient(clientCredentialsAccessTokenResponseClient)
			}
			.password { password ->
				password.accessTokenResponseClient(passwordAccessTokenResponseClient)
			}
			.provider(jwtBearerAuthorizedClientProvider)
			.provider(tokenExchangeAuthorizedClientProvider)
			.build()

		val authorizedClientManager = DefaultReactiveOAuth2AuthorizedClientManager(
			clientRegistrationRepository, authorizedClientRepository
		)
		authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider)

		return authorizedClientManager
	}

	@Bean
	fun webClient(): WebClient {
		// ...
	}

}
```

<a id="further-reading"></a>

## Further Reading

The preceding sections introduced Spring Security’s support for OAuth2 with examples for common scenarios.
You can read more about OAuth2 Client and Resource Server in the following sections of the reference documentation:

- [reactive/oauth2/login/index.adoc](login/index.md)
- [reactive/oauth2/client/index.adoc](client/index.md)
- [reactive/oauth2/resource-server/index.adoc](resource-server/index.md)
