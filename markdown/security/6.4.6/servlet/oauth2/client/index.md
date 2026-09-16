---
title: "<a id=\"oauth2client\"></a>OAuth 2.0 Client"
source: "ROOT:servlet/oauth2/client/index.adoc"
---

<a id="oauth2-client"></a>

# <a id="oauth2client"></a>OAuth 2.0 Client

The OAuth 2.0 Client features provide support for the Client role as defined in the [OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749#section-1.1).

At a high-level, the core features available are:

- [Authorization Code](authorization-grants.md#oauth2-client-authorization-code)
- [Refresh Token](authorization-grants.md#oauth2-client-refresh-token)
- [Client Credentials](authorization-grants.md#oauth2-client-client-credentials)
- [Resource Owner Password Credentials](authorization-grants.md#oauth2-client-password)
- [JWT Bearer](authorization-grants.md#oauth2-client-jwt-bearer)
- [Token Exchange](authorization-grants.md#oauth2-client-token-exchange)

- [JWT Bearer](client-authentication.md#oauth2-client-authentication-jwt-bearer)

- [`RestClient` integration](authorized-clients.md#oauth2-client-rest-client)
- [`WebClient` integration for Servlet Environments](authorized-clients.md#oauth2-client-web-client)

The `HttpSecurity.oauth2Client()` DSL provides a number of configuration options for customizing the core components used by OAuth 2.0 Client.
In addition, `HttpSecurity.oauth2Client().authorizationCodeGrant()` enables the customization of the Authorization Code grant.

The following code shows the complete configuration options provided by the `HttpSecurity.oauth2Client()` DSL:

#### Java

```java
@Configuration
@EnableWebSecurity
public class OAuth2ClientSecurityConfig {

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
			.oauth2Client(oauth2 -> oauth2
				.clientRegistrationRepository(this.clientRegistrationRepository())
				.authorizedClientRepository(this.authorizedClientRepository())
				.authorizedClientService(this.authorizedClientService())
				.authorizationCodeGrant(codeGrant -> codeGrant
					.authorizationRequestRepository(this.authorizationRequestRepository())
					.authorizationRequestResolver(this.authorizationRequestResolver())
					.accessTokenResponseClient(this.accessTokenResponseClient())
				)
			);
		return http.build();
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
class OAuth2ClientSecurityConfig {

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            oauth2Client {
                clientRegistrationRepository = clientRegistrationRepository()
                authorizedClientRepository = authorizedClientRepository()
                authorizedClientService = authorizedClientService()
                authorizationCodeGrant {
                    authorizationRequestRepository = authorizationRequestRepository()
                    authorizationRequestResolver = authorizationRequestResolver()
                    accessTokenResponseClient = accessTokenResponseClient()
                }
            }
        }
        return http.build()
    }
}
```

In addition to the `HttpSecurity.oauth2Client()` DSL, XML configuration is also supported.

The following code shows the complete configuration options available in the [ security namespace](../../appendix/namespace/http.md#nsa-oauth2-client):

#### OAuth2 Client XML Configuration Options

```xml
<http>
	<oauth2-client client-registration-repository-ref="clientRegistrationRepository"
				   authorized-client-repository-ref="authorizedClientRepository"
				   authorized-client-service-ref="authorizedClientService">
		<authorization-code-grant
				authorization-request-repository-ref="authorizationRequestRepository"
				authorization-request-resolver-ref="authorizationRequestResolver"
				access-token-response-client-ref="accessTokenResponseClient"/>
	</oauth2-client>
</http>
```

The `OAuth2AuthorizedClientManager` is responsible for managing the authorization (or re-authorization) of an OAuth 2.0 Client, in collaboration with one or more `OAuth2AuthorizedClientProvider`(s).

The following code shows an example of how to register an `OAuth2AuthorizedClientManager` `@Bean` and associate it with an `OAuth2AuthorizedClientProvider` composite that provides support for the `authorization_code`, `refresh_token`, `client_credentials`, and `password` authorization grant types:

#### Java

```java
@Bean
public OAuth2AuthorizedClientManager authorizedClientManager(
		ClientRegistrationRepository clientRegistrationRepository,
		OAuth2AuthorizedClientRepository authorizedClientRepository) {

	OAuth2AuthorizedClientProvider authorizedClientProvider =
			OAuth2AuthorizedClientProviderBuilder.builder()
					.authorizationCode()
					.refreshToken()
					.clientCredentials()
					.password()
					.build();

	DefaultOAuth2AuthorizedClientManager authorizedClientManager =
			new DefaultOAuth2AuthorizedClientManager(
					clientRegistrationRepository, authorizedClientRepository);
	authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);

	return authorizedClientManager;
}
```

#### Kotlin

```kotlin
@Bean
fun authorizedClientManager(
        clientRegistrationRepository: ClientRegistrationRepository,
        authorizedClientRepository: OAuth2AuthorizedClientRepository): OAuth2AuthorizedClientManager {
    val authorizedClientProvider: OAuth2AuthorizedClientProvider = OAuth2AuthorizedClientProviderBuilder.builder()
            .authorizationCode()
            .refreshToken()
            .clientCredentials()
            .password()
            .build()
    val authorizedClientManager = DefaultOAuth2AuthorizedClientManager(
            clientRegistrationRepository, authorizedClientRepository)
    authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider)
    return authorizedClientManager
}
```
