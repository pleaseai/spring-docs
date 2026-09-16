---
title: "OAuth 2.0 Client"
source: "ROOT:reactive/oauth2/client/index.adoc"
---

<a id="webflux-oauth2-client"></a>

# OAuth 2.0 Client

The OAuth 2.0 Client features provide support for the Client role as defined in the [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749#section-1.1).

At a high-level, the core features available are:

- [Authorization Code](https://tools.ietf.org/html/rfc6749#section-1.3.1)
- [Refresh Token](https://tools.ietf.org/html/rfc6749#section-6)
- [Client Credentials](https://tools.ietf.org/html/rfc6749#section-1.3.4)
- [Resource Owner Password Credentials](https://tools.ietf.org/html/rfc6749#section-1.3.3)
- [JWT Bearer](https://datatracker.ietf.org/doc/html/rfc7523#section-2.1)
- [Token Exchange](https://datatracker.ietf.org/doc/html/rfc8693#section-2.1)

- [JWT Bearer](https://datatracker.ietf.org/doc/html/rfc7523#section-2.2)

- [`WebClient` integration for Reactive Environments](authorized-clients.md#oauth2Client-webclient-webflux) (for requesting protected resources)

The `ServerHttpSecurity.oauth2Client()` DSL provides a number of configuration options for customizing the core components used by OAuth 2.0 Client.

The following code shows the complete configuration options provided by the `ServerHttpSecurity.oauth2Client()` DSL:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class OAuth2ClientSecurityConfig {

	@Bean
	public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
		http
			.oauth2Client(oauth2 -> oauth2
				.clientRegistrationRepository(this.clientRegistrationRepository())
				.authorizedClientRepository(this.authorizedClientRepository())
				.authorizationRequestRepository(this.authorizationRequestRepository())
				.authorizationRequestResolver(this.authorizationRequestResolver())
				.authenticationConverter(this.authenticationConverter())
				.authenticationManager(this.authenticationManager())
			);

		return http.build();
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebFluxSecurity
class OAuth2ClientSecurityConfig {

    @Bean
    fun securityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
        http {
            oauth2Client {
                clientRegistrationRepository = clientRegistrationRepository()
                authorizedClientRepository = authorizedClientRepository()
                authorizationRequestRepository = authorizedRequestRepository()
                authorizationRequestResolver = authorizationRequestResolver()
                authenticationConverter = authenticationConverter()
                authenticationManager = authenticationManager()
            }
        }

        return http.build()
    }
}
```

The `ReactiveOAuth2AuthorizedClientManager` is responsible for managing the authorization (or re-authorization) of an OAuth 2.0 Client, in collaboration with one or more `ReactiveOAuth2AuthorizedClientProvider`(s).

The following code shows an example of how to register a `ReactiveOAuth2AuthorizedClientManager` `@Bean` and associate it with a `ReactiveOAuth2AuthorizedClientProvider` composite that provides support for the `authorization_code`, `refresh_token`, `client_credentials` and `password` authorization grant types:

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
