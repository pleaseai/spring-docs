---
title: "OAuth 2.0 Resource Server Opaque Token"
source: "ROOT:reactive/oauth2/resource-server/opaque-token.adoc"
---

# OAuth 2.0 Resource Server Opaque Token

<a id="webflux-oauth2resourceserver-opaque-minimaldependencies"></a>

## Minimal Dependencies for Introspection

As described in [Minimal Dependencies for JWT](../../../servlet/oauth2/resource-server/jwt.md#oauth2resourceserver-jwt-minimaldependencies), most Resource Server support is collected in `spring-security-oauth2-resource-server`.
However, unless you provide a custom [`ReactiveOpaqueTokenIntrospector`](#webflux-oauth2resourceserver-opaque-introspector-bean), the Resource Server falls back to `ReactiveOpaqueTokenIntrospector`.
This means that both `spring-security-oauth2-resource-server` and `oauth2-oidc-sdk` are necessary to have a working minimal Resource Server that supports opaque Bearer Tokens.
See `spring-security-oauth2-resource-server` in order to determine the correct version for `oauth2-oidc-sdk`.

<a id="webflux-oauth2resourceserver-opaque-minimalconfiguration"></a>

## Minimal Configuration for Introspection

Typically, you can verify an opaque token with an [OAuth 2.0 Introspection Endpoint](https://tools.ietf.org/html/rfc7662), hosted by the authorization server.
This can be handy when revocation is a requirement.

When using [Spring Boot](https://spring.io/projects/spring-boot), configuring an application as a resource server that uses introspection consists of two steps:

1. Include the needed dependencies.
1. Indicate the introspection endpoint details.

<a id="webflux-oauth2resourceserver-opaque-introspectionuri"></a>

### Specifying the Authorization Server

You can specify where the introspection endpoint is:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        opaquetoken:
          introspection-uri: https://idp.example.com/introspect
          client-id: client
          client-secret: secret
```

Where `idp.example.com/introspect` is the introspection endpoint hosted by your authorization server and `client-id` and `client-secret` are the credentials needed to hit that endpoint.

Resource Server uses these properties to further self-configure and subsequently validate incoming JWTs.

> [!NOTE]
> If the authorization server responses that the token is valid, then it is.

<a id="_startup_expectations"></a>

### Startup Expectations

When this property and these dependencies are used, Resource Server automatically configures itself to validate Opaque Bearer Tokens.

This startup process is quite a bit simpler than for JWTs, since no endpoints need to be discovered and no additional validation rules get added.

<a id="_runtime_expectations"></a>

### Runtime Expectations

Once the application has started, Resource Server tries to process any request containing an `Authorization: Bearer` header:

```http
GET / HTTP/1.1
Authorization: Bearer some-token-value # Resource Server will process this
```

So long as this scheme is indicated, Resource Server tries to process the request according to the Bearer Token specification.

Given an Opaque Token, Resource Server:

1. Queries the provided introspection endpoint by using the provided credentials and the token.
1. Inspects the response for an `{ 'active' : true }` attribute.
1. Maps each scope to an authority with a prefix of `SCOPE_`.

By default, the resulting `Authentication#getPrincipal` is a Spring Security [`OAuth2AuthenticatedPrincipal`](https://docs.spring.io/spring-security/site/docs/6.4.8/api/org/springframework/security/oauth2/core/OAuth2AuthenticatedPrincipal.html) object, and `Authentication#getName` maps to the token’s `sub` property, if one is present.

From here, you may want to jump to:

- [Looking Up Attributes After Authentication](#webflux-oauth2resourceserver-opaque-attributes)
- [Extracting Authorities Manually](#webflux-oauth2resourceserver-opaque-authorization-extraction)
- [Using Introspection with JWTs](#webflux-oauth2resourceserver-opaque-jwt-introspector)

<a id="webflux-oauth2resourceserver-opaque-attributes"></a>

## Looking Up Attributes After Authentication

Once a token is authenticated, an instance of `BearerTokenAuthentication` is set in the `SecurityContext`.

This means that it is available in `@Controller` methods when you use `@EnableWebFlux` in your configuration:

#### Java

```java
@GetMapping("/foo")
public Mono<String> foo(BearerTokenAuthentication authentication) {
    return Mono.just(authentication.getTokenAttributes().get("sub") + " is the subject");
}
```

#### Kotlin

```kotlin
@GetMapping("/foo")
fun foo(authentication: BearerTokenAuthentication): Mono<String> {
    return Mono.just(authentication.tokenAttributes["sub"].toString() + " is the subject")
}
```

Since `BearerTokenAuthentication` holds an `OAuth2AuthenticatedPrincipal`, that also means that it’s available to controller methods, too:

#### Java

```java
@GetMapping("/foo")
public Mono<String> foo(@AuthenticationPrincipal OAuth2AuthenticatedPrincipal principal) {
    return Mono.just(principal.getAttribute("sub") + " is the subject");
}
```

#### Kotlin

```kotlin
@GetMapping("/foo")
fun foo(@AuthenticationPrincipal principal: OAuth2AuthenticatedPrincipal): Mono<String> {
    return Mono.just(principal.getAttribute<Any>("sub").toString() + " is the subject")
}
```

<a id="_looking_up_attributes_with_spel"></a>

### Looking Up Attributes with SpEL

You can access attributes with the Spring Expression Language (SpEL).

For example, if you use `@EnableReactiveMethodSecurity` so that you can use `@PreAuthorize` annotations, you can do:

#### Java

```java
@PreAuthorize("principal?.attributes['sub'] = 'foo'")
public Mono<String> forFoosEyesOnly() {
    return Mono.just("foo");
}
```

#### Kotlin

```kotlin
@PreAuthorize("principal.attributes['sub'] = 'foo'")
fun forFoosEyesOnly(): Mono<String> {
    return Mono.just("foo")
}
```

<a id="webflux-oauth2resourceserver-opaque-sansboot"></a>

## Overriding or Replacing Boot Auto Configuration

Spring Boot generates two `@Bean` instances for Resource Server.

The first is a `SecurityWebFilterChain` that configures the application as a resource server.
When you use an Opaque Token, this `SecurityWebFilterChain` looks like:

#### Java

```java
@Bean
SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
	http
		.authorizeExchange(exchanges -> exchanges
			.anyExchange().authenticated()
		)
		.oauth2ResourceServer(ServerHttpSecurity.OAuth2ResourceServerSpec::opaqueToken)
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
    return http {
        authorizeExchange {
            authorize(anyExchange, authenticated)
        }
        oauth2ResourceServer {
            opaqueToken { }
        }
    }
}
```

If the application does not expose a `SecurityWebFilterChain` bean, Spring Boot exposes the default bean (shown in the preceding listing).

You can replace it by exposing the bean within the application:

#### Java

```java
import static org.springframework.security.oauth2.core.authorization.OAuth2ReactiveAuthorizationManagers.hasScope;

@Configuration
@EnableWebFluxSecurity
public class MyCustomSecurityConfiguration {
    @Bean
    SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .authorizeExchange(exchanges -> exchanges
                .pathMatchers("/messages/**").access(hasScope("message:read"))
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .opaqueToken(opaqueToken -> opaqueToken
                    .introspector(myIntrospector())
                )
            );
        return http.build();
    }
}
```

#### Kotlin

```kotlin
import org.springframework.security.oauth2.core.authorization.OAuth2ReactiveAuthorizationManagers.hasScope

@Bean
fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
    return http {
        authorizeExchange {
            authorize("/messages/**", hasScope("message:read"))
            authorize(anyExchange, authenticated)
        }
        oauth2ResourceServer {
            opaqueToken {
                introspector = myIntrospector()
            }
        }
    }
}
```

The preceding example requires the scope of `message:read` for any URL that starts with `/messages/`.

Methods on the `oauth2ResourceServer` DSL also override or replace auto configuration.

For example, the second `@Bean` Spring Boot creates is a `ReactiveOpaqueTokenIntrospector`, which decodes `String` tokens into validated instances of `OAuth2AuthenticatedPrincipal`:

#### Java

```java
@Bean
public ReactiveOpaqueTokenIntrospector introspector() {
    return new NimbusReactiveOpaqueTokenIntrospector(introspectionUri, clientId, clientSecret);
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): ReactiveOpaqueTokenIntrospector {
    return NimbusReactiveOpaqueTokenIntrospector(introspectionUri, clientId, clientSecret)
}
```

If the application does not expose a `ReactiveOpaqueTokenIntrospector` bean, Spring Boot exposes the default one (shown in the preceding listing).

You can override its configuration by using `introspectionUri()` and `introspectionClientCredentials()` or replace it by using `introspector()`.

<a id="webflux-oauth2resourceserver-opaque-introspectionuri-dsl"></a>

### Using `introspectionUri()`

You can configure an authorization server’s Introspection URI [as a configuration property](#webflux-oauth2resourceserver-opaque-introspectionuri), or you can supply in the DSL:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class DirectlyConfiguredIntrospectionUri {
    @Bean
    SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .authorizeExchange(exchanges -> exchanges
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .opaqueToken(opaqueToken -> opaqueToken
                    .introspectionUri("https://idp.example.com/introspect")
                    .introspectionClientCredentials("client", "secret")
                )
            );
        return http.build();
    }
}
```

#### Kotlin

```kotlin
@Bean
fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
    return http {
        authorizeExchange {
            authorize(anyExchange, authenticated)
        }
        oauth2ResourceServer {
            opaqueToken {
                introspectionUri = "https://idp.example.com/introspect"
                introspectionClientCredentials("client", "secret")
            }
        }
    }
}
```

Using `introspectionUri()` takes precedence over any configuration property.

<a id="webflux-oauth2resourceserver-opaque-introspector-dsl"></a>

### Using `introspector()`

`introspector()` is more powerful than `introspectionUri()`. It completely replaces any Boot auto-configuration of `ReactiveOpaqueTokenIntrospector`:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class DirectlyConfiguredIntrospector {
    @Bean
    SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .authorizeExchange(exchanges -> exchanges
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .opaqueToken(opaqueToken -> opaqueToken
                    .introspector(myCustomIntrospector())
                )
            );
        return http.build();
    }
}
```

#### Kotlin

```kotlin
@Bean
fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
    return http {
        authorizeExchange {
            authorize(anyExchange, authenticated)
        }
        oauth2ResourceServer {
            opaqueToken {
                introspector = myCustomIntrospector()
            }
        }
    }
}
```

This is handy when deeper configuration, such as [authority mapping](#webflux-oauth2resourceserver-opaque-authorization-extraction)or [JWT revocation](#webflux-oauth2resourceserver-opaque-jwt-introspector), is necessary.

<a id="webflux-oauth2resourceserver-opaque-introspector-bean"></a>

### Exposing a `ReactiveOpaqueTokenIntrospector` `@Bean`

Or, exposing a `ReactiveOpaqueTokenIntrospector` `@Bean` has the same effect as `introspector()`:

#### Java

```java
@Bean
public ReactiveOpaqueTokenIntrospector introspector() {
    return new NimbusReactiveOpaqueTokenIntrospector(introspectionUri, clientId, clientSecret);
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): ReactiveOpaqueTokenIntrospector {
    return NimbusReactiveOpaqueTokenIntrospector(introspectionUri, clientId, clientSecret)
}
```

<a id="webflux-oauth2resourceserver-opaque-authorization"></a>

## Configuring Authorization

An OAuth 2.0 Introspection endpoint typically returns a `scope` attribute, indicating the scopes (or authorities) it has been granted — for example:

```json
{ ..., "scope" : "messages contacts"}
```

When this is the case, Resource Server tries to coerce these scopes into a list of granted authorities, prefixing each scope with a string: `SCOPE_`.

This means that, to protect an endpoint or method with a scope derived from an Opaque Token, the corresponding expressions should include this prefix:

#### Java

```java
import static org.springframework.security.oauth2.core.authorization.OAuth2ReactiveAuthorizationManagers.hasScope;

@Configuration
@EnableWebFluxSecurity
public class MappedAuthorities {
    @Bean
    SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        http
            .authorizeExchange(exchange -> exchange
                .pathMatchers("/contacts/**").access(hasScope("contacts"))
                .pathMatchers("/messages/**").access(hasScope("messages"))
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(ServerHttpSecurity.OAuth2ResourceServerSpec::opaqueToken);
        return http.build();
    }
}
```

#### Kotlin

```kotlin
import org.springframework.security.oauth2.core.authorization.OAuth2ReactiveAuthorizationManagers.hasScope

@Bean
fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
    return http {
        authorizeExchange {
            authorize("/contacts/**", hasScope("contacts"))
            authorize("/messages/**", hasScope("messages"))
            authorize(anyExchange, authenticated)
        }
        oauth2ResourceServer {
            opaqueToken { }
        }
    }
}
```

You can do something similar with method security:

#### Java

```java
@PreAuthorize("hasAuthority('SCOPE_messages')")
public Flux<Message> getMessages(...) {}
```

#### Kotlin

```kotlin
@PreAuthorize("hasAuthority('SCOPE_messages')")
fun getMessages(): Flux<Message> { }
```

<a id="webflux-oauth2resourceserver-opaque-authorization-extraction"></a>

### Extracting Authorities Manually

By default, Opaque Token support extracts the scope claim from an introspection response and parses it into individual `GrantedAuthority` instances.

Consider the following example:

```json
{
    "active" : true,
    "scope" : "message:read message:write"
}
```

If the introspection response were as the preceding example shows, Resource Server would generate an `Authentication` with two authorities, one for `message:read` and the other for `message:write`.

You can customize behavior by using a custom `ReactiveOpaqueTokenIntrospector` that looks at the attribute set and converts in its own way:

#### Java

```java
public class CustomAuthoritiesOpaqueTokenIntrospector implements ReactiveOpaqueTokenIntrospector {
    private ReactiveOpaqueTokenIntrospector delegate =
            new NimbusReactiveOpaqueTokenIntrospector("https://idp.example.org/introspect", "client", "secret");

    public Mono<OAuth2AuthenticatedPrincipal> introspect(String token) {
        return this.delegate.introspect(token)
                .map(principal -> new DefaultOAuth2AuthenticatedPrincipal(
                        principal.getName(), principal.getAttributes(), extractAuthorities(principal)));
    }

    private Collection<GrantedAuthority> extractAuthorities(OAuth2AuthenticatedPrincipal principal) {
        List<String> scopes = principal.getAttribute(OAuth2IntrospectionClaimNames.SCOPE);
        return scopes.stream()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }
}
```

#### Kotlin

```kotlin
class CustomAuthoritiesOpaqueTokenIntrospector : ReactiveOpaqueTokenIntrospector {
    private val delegate: ReactiveOpaqueTokenIntrospector = NimbusReactiveOpaqueTokenIntrospector("https://idp.example.org/introspect", "client", "secret")
    override fun introspect(token: String): Mono<OAuth2AuthenticatedPrincipal> {
        return delegate.introspect(token)
                .map { principal: OAuth2AuthenticatedPrincipal ->
                    DefaultOAuth2AuthenticatedPrincipal(
                            principal.name, principal.attributes, extractAuthorities(principal))
                }
    }

    private fun extractAuthorities(principal: OAuth2AuthenticatedPrincipal): Collection<GrantedAuthority> {
        val scopes = principal.getAttribute<List<String>>(OAuth2IntrospectionClaimNames.SCOPE)
        return scopes
                .map { SimpleGrantedAuthority(it) }
    }
}
```

Thereafter, you can configure this custom introspector by exposing it as a `@Bean`:

#### Java

```java
@Bean
public ReactiveOpaqueTokenIntrospector introspector() {
    return new CustomAuthoritiesOpaqueTokenIntrospector();
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): ReactiveOpaqueTokenIntrospector {
    return CustomAuthoritiesOpaqueTokenIntrospector()
}
```

<a id="webflux-oauth2resourceserver-opaque-jwt-introspector"></a>

## Using Introspection with JWTs

A common question is whether or not introspection is compatible with JWTs.
Spring Security’s Opaque Token support has been designed to not care about the format of the token. It gladly passes any token to the provided introspection endpoint.

So, suppose you need to check with the authorization server on each request, in case the JWT has been revoked.

Even though you are using the JWT format for the token, your validation method is introspection, meaning you would want to do:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        opaquetoken:
          introspection-uri: https://idp.example.org/introspection
          client-id: client
          client-secret: secret
```

In this case, the resulting `Authentication` would be `BearerTokenAuthentication`.
Any attributes in the corresponding `OAuth2AuthenticatedPrincipal` would be whatever was returned by the introspection endpoint.

However, suppose that, for whatever reason, the introspection endpoint returns only whether or not the token is active.
Now what?

In this case, you can create a custom `ReactiveOpaqueTokenIntrospector` that still hits the endpoint but then updates the returned principal to have the JWTs claims as the attributes:

#### Java

```java
public class JwtOpaqueTokenIntrospector implements ReactiveOpaqueTokenIntrospector {
	private ReactiveOpaqueTokenIntrospector delegate =
			new NimbusReactiveOpaqueTokenIntrospector("https://idp.example.org/introspect", "client", "secret");
	private ReactiveJwtDecoder jwtDecoder = new NimbusReactiveJwtDecoder(new ParseOnlyJWTProcessor());

	public Mono<OAuth2AuthenticatedPrincipal> introspect(String token) {
		return this.delegate.introspect(token)
				.flatMap(principal -> this.jwtDecoder.decode(token))
				.map(jwt -> new DefaultOAuth2AuthenticatedPrincipal(jwt.getClaims(), NO_AUTHORITIES));
	}

	private static class ParseOnlyJWTProcessor implements Converter<JWT, Mono<JWTClaimsSet>> {
		public Mono<JWTClaimsSet> convert(JWT jwt) {
			try {
				return Mono.just(jwt.getJWTClaimsSet());
			} catch (Exception ex) {
				return Mono.error(ex);
			}
		}
	}
}
```

#### Kotlin

```kotlin
class JwtOpaqueTokenIntrospector : ReactiveOpaqueTokenIntrospector {
    private val delegate: ReactiveOpaqueTokenIntrospector = NimbusReactiveOpaqueTokenIntrospector("https://idp.example.org/introspect", "client", "secret")
    private val jwtDecoder: ReactiveJwtDecoder = NimbusReactiveJwtDecoder(ParseOnlyJWTProcessor())
    override fun introspect(token: String): Mono<OAuth2AuthenticatedPrincipal> {
        return delegate.introspect(token)
                .flatMap { jwtDecoder.decode(token) }
                .map { jwt: Jwt -> DefaultOAuth2AuthenticatedPrincipal(jwt.claims, NO_AUTHORITIES) }
    }

    private class ParseOnlyJWTProcessor : Converter<JWT, Mono<JWTClaimsSet>> {
        override fun convert(jwt: JWT): Mono<JWTClaimsSet> {
            return try {
                Mono.just(jwt.jwtClaimsSet)
            } catch (e: Exception) {
                Mono.error(e)
            }
        }
    }
}
```

Thereafter, you can configure this custom introspector by exposing it as a `@Bean`:

#### Java

```java
@Bean
public ReactiveOpaqueTokenIntrospector introspector() {
    return new JwtOpaqueTokenIntropsector();
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): ReactiveOpaqueTokenIntrospector {
    return JwtOpaqueTokenIntrospector()
}
```

<a id="webflux-oauth2resourceserver-opaque-userinfo"></a>

## Calling a `/userinfo` Endpoint

Generally speaking, a Resource Server does not care about the underlying user but, instead, cares about the authorities that have been granted.

That said, at times it can be valuable to tie the authorization statement back to a user.

If an application also uses `spring-security-oauth2-client`, having set up the appropriate `ClientRegistrationRepository`,  you can do so with a custom `OpaqueTokenIntrospector`.
The implementation in the next listing does three things:

- Delegates to the introspection endpoint, to affirm the token’s validity.
- Looks up the appropriate client registration associated with the `/userinfo` endpoint.
- Invokes and returns the response from the `/userinfo` endpoint.

#### Java

```java
public class UserInfoOpaqueTokenIntrospector implements ReactiveOpaqueTokenIntrospector {
	private final ReactiveOpaqueTokenIntrospector delegate =
			new NimbusReactiveOpaqueTokenIntrospector("https://idp.example.org/introspect", "client", "secret");
	private final ReactiveOAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2UserService =
			new DefaultReactiveOAuth2UserService();

	private final ReactiveClientRegistrationRepository repository;

	// ... constructor

	@Override
	public Mono<OAuth2AuthenticatedPrincipal> introspect(String token) {
		return Mono.zip(this.delegate.introspect(token), this.repository.findByRegistrationId("registration-id"))
				.map(t -> {
					OAuth2AuthenticatedPrincipal authorized = t.getT1();
					ClientRegistration clientRegistration = t.getT2();
					Instant issuedAt = authorized.getAttribute(ISSUED_AT);
					Instant expiresAt = authorized.getAttribute(OAuth2IntrospectionClaimNames.EXPIRES_AT);
					OAuth2AccessToken accessToken = new OAuth2AccessToken(BEARER, token, issuedAt, expiresAt);
					return new OAuth2UserRequest(clientRegistration, accessToken);
				})
				.flatMap(this.oauth2UserService::loadUser);
	}
}
```

#### Kotlin

```kotlin
class UserInfoOpaqueTokenIntrospector : ReactiveOpaqueTokenIntrospector {
    private val delegate: ReactiveOpaqueTokenIntrospector = NimbusReactiveOpaqueTokenIntrospector("https://idp.example.org/introspect", "client", "secret")
    private val oauth2UserService: ReactiveOAuth2UserService<OAuth2UserRequest, OAuth2User> = DefaultReactiveOAuth2UserService()
    private val repository: ReactiveClientRegistrationRepository? = null

    // ... constructor
    override fun introspect(token: String?): Mono<OAuth2AuthenticatedPrincipal> {
        return Mono.zip<OAuth2AuthenticatedPrincipal, ClientRegistration>(delegate.introspect(token), repository!!.findByRegistrationId("registration-id"))
                .map<OAuth2UserRequest> { t: Tuple2<OAuth2AuthenticatedPrincipal, ClientRegistration> ->
                    val authorized = t.t1
                    val clientRegistration = t.t2
                    val issuedAt: Instant? = authorized.getAttribute(ISSUED_AT)
                    val expiresAt: Instant? = authorized.getAttribute(OAuth2IntrospectionClaimNames.EXPIRES_AT)
                    val accessToken = OAuth2AccessToken(BEARER, token, issuedAt, expiresAt)
                    OAuth2UserRequest(clientRegistration, accessToken)
                }
                .flatMap { userRequest: OAuth2UserRequest -> oauth2UserService.loadUser(userRequest) }
    }
}
```

If you aren’t using `spring-security-oauth2-client`, it’s still quite simple.
You will simply need to invoke the `/userinfo` with your own instance of `WebClient`:

#### Java

```java
public class UserInfoOpaqueTokenIntrospector implements ReactiveOpaqueTokenIntrospector {
    private final ReactiveOpaqueTokenIntrospector delegate =
            new NimbusReactiveOpaqueTokenIntrospector("https://idp.example.org/introspect", "client", "secret");
    private final WebClient rest = WebClient.create();

    @Override
    public Mono<OAuth2AuthenticatedPrincipal> introspect(String token) {
        return this.delegate.introspect(token)
		        .map(this::makeUserInfoRequest);
    }
}
```

#### Kotlin

```kotlin
class UserInfoOpaqueTokenIntrospector : ReactiveOpaqueTokenIntrospector {
    private val delegate: ReactiveOpaqueTokenIntrospector = NimbusReactiveOpaqueTokenIntrospector("https://idp.example.org/introspect", "client", "secret")
    private val rest: WebClient = WebClient.create()

    override fun introspect(token: String): Mono<OAuth2AuthenticatedPrincipal> {
        return delegate.introspect(token)
                .map(this::makeUserInfoRequest)
    }
}
```

Either way, having created your `ReactiveOpaqueTokenIntrospector`, you should publish it as a `@Bean` to override the defaults:

#### Java

```java
@Bean
ReactiveOpaqueTokenIntrospector introspector() {
    return new UserInfoOpaqueTokenIntrospector();
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): ReactiveOpaqueTokenIntrospector {
    return UserInfoOpaqueTokenIntrospector()
}
```
