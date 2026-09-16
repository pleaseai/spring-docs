---
title: "OAuth 2.0 Resource Server JWT"
source: "ROOT:reactive/oauth2/resource-server/jwt.adoc"
---

# OAuth 2.0 Resource Server JWT

<a id="webflux-oauth2resourceserver-jwt-minimaldependencies"></a>

## Minimal Dependencies for JWT

Most Resource Server support is collected into `spring-security-oauth2-resource-server`.
However, the support for decoding and verifying JWTs is in `spring-security-oauth2-jose`, meaning that both are necessary to have a working resource server that supports JWT-encoded Bearer Tokens.

<a id="webflux-oauth2resourceserver-jwt-minimalconfiguration"></a>

## Minimal Configuration for JWTs

When using [Spring Boot](https://spring.io/projects/spring-boot), configuring an application as a resource server consists of two basic steps.
First, include the needed dependencies. Second, indicate the location of the authorization server.

<a id="_specifying_the_authorization_server"></a>

### Specifying the Authorization Server

In a Spring Boot application, you need to specify which authorization server to use:

```yml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://idp.example.com/issuer
```

Where `idp.example.com/issuer` is the value contained in the `iss` claim for JWT tokens that the authorization server issues.
This resource server uses this property to further self-configure, discover the authorization server’s public keys, and subsequently validate incoming JWTs.

> [!NOTE]
> To use the `issuer-uri` property, it must also be true that one of `idp.example.com/issuer/.well-known/openid-configuration`, `idp.example.com/.well-known/openid-configuration/issuer`, or `idp.example.com/.well-known/oauth-authorization-server/issuer` is a supported endpoint for the authorization server.
> This endpoint is referred to as a [Provider Configuration](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig) endpoint or a [Authorization Server Metadata](https://tools.ietf.org/html/rfc8414#section-3) endpoint.

<a id="_startup_expectations"></a>

### Startup Expectations

When this property and these dependencies are used, Resource Server automatically configures itself to validate JWT-encoded Bearer Tokens.

It achieves this through a deterministic startup process:

1. Hit the Provider Configuration or Authorization Server Metadata endpoint, processing the response for the `jwks_url` property.
1. Configure the validation strategy to query `jwks_url` for valid public keys.
1. Configure the validation strategy to validate each JWT’s `iss` claim against `idp.example.com`.

A consequence of this process is that the authorization server must be receiving requests in order for Resource Server to successfully start up.

> [!NOTE]
> If the authorization server is down when Resource Server queries it (given appropriate timeouts), then startup fails.

<a id="_runtime_expectations"></a>

### Runtime Expectations

Once the application is started up, Resource Server tries to process any request that contains an `Authorization: Bearer` header:

```html
GET / HTTP/1.1
Authorization: Bearer some-token-value # Resource Server will process this
```

So long as this scheme is indicated, Resource Server tries to process the request according to the Bearer Token specification.

Given a well-formed JWT, Resource Server:

1. Validates its signature against a public key obtained from the `jwks_url` endpoint during startup and matched against the JWTs header.
1. Validates the JWTs `exp` and `nbf` timestamps and the JWTs `iss` claim.
1. Maps each scope to an authority with the prefix `SCOPE_`.

> [!NOTE]
> As the authorization server makes available new keys, Spring Security automatically rotates the keys used to validate the JWT tokens.

By default, the resulting `Authentication#getPrincipal` is a Spring Security `Jwt` object, and `Authentication#getName` maps to the JWT’s `sub` property, if one is present.

From here, consider jumping to:

- [How to Configure without Tying Resource Server startup to an authorization server’s availability](#webflux-oauth2resourceserver-jwt-jwkseturi)
- [How to Configure without Spring Boot](#webflux-oauth2resourceserver-jwt-sansboot)

<a id="webflux-oauth2resourceserver-jwt-jwkseturi"></a>

### Specifying the Authorization Server JWK Set Uri Directly

If the authorization server does not support any configuration endpoints, or if Resource Server must be able to start up independently from the authorization server, you can supply `jwk-set-uri` as well:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: https://idp.example.com
          jwk-set-uri: https://idp.example.com/.well-known/jwks.json
```

> [!NOTE]
> The JWK Set uri is not standardized, but you can typically find it in the authorization server’s documentation.

Consequently, Resource Server does not ping the authorization server at startup.
We still specify the `issuer-uri` so that Resource Server still validates the `iss` claim on incoming JWTs.

> [!NOTE]
> You can supply this property directly on the [DSL](#webflux-oauth2resourceserver-jwt-jwkseturi-dsl).

<a id="webflux-oauth2resourceserver-jwt-sansboot"></a>

### Overriding or Replacing Boot Auto Configuration

Spring Boot generates two `@Bean` objects on Resource Server’s behalf.

The first bean is a `SecurityWebFilterChain` that configures the application as a resource server. When including `spring-security-oauth2-jose`, this `SecurityWebFilterChain` looks like:

#### Java

```java
@Bean
SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
	http
		.authorizeExchange(exchanges -> exchanges
			.anyExchange().authenticated()
		)
		.oauth2ResourceServer(OAuth2ResourceServerSpec::jwt)
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
            jwt { }
        }
    }
}
```

If the application does not expose a `SecurityWebFilterChain` bean, Spring Boot exposes the default one (shown in the preceding listing).

To replace it, expose the `@Bean` within the application:

#### Java

```java
import static org.springframework.security.oauth2.core.authorization.OAuth2ReactiveAuthorizationManagers.hasScope;

@Bean
SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
	http
		.authorizeExchange(exchanges -> exchanges
			.pathMatchers("/message/**").access(hasScope("message:read"))
			.anyExchange().authenticated()
		)
		.oauth2ResourceServer(oauth2 -> oauth2
			.jwt(withDefaults())
		);
	return http.build();
}
```

#### Kotlin

```kotlin
import org.springframework.security.oauth2.core.authorization.OAuth2ReactiveAuthorizationManagers.hasScope

@Bean
fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
    return http {
        authorizeExchange {
            authorize("/message/**", hasScope("message:read"))
            authorize(anyExchange, authenticated)
        }
        oauth2ResourceServer {
            jwt { }
        }
    }
}
```

The preceding configuration requires the scope of `message:read` for any URL that starts with `/messages/`.

Methods on the `oauth2ResourceServer` DSL also override or replace auto configuration.

For example, the second `@Bean` Spring Boot creates is a `ReactiveJwtDecoder`, which decodes `String` tokens into validated instances of `Jwt`:

#### Java

```java
@Bean
public ReactiveJwtDecoder jwtDecoder() {
    return ReactiveJwtDecoders.fromIssuerLocation(issuerUri);
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    return ReactiveJwtDecoders.fromIssuerLocation(issuerUri)
}
```

> [!NOTE]
> Calling `ReactiveJwtDecoders#fromIssuerLocation` invokes the Provider Configuration or Authorization Server Metadata endpoint to derive the JWK Set URI.
> If the application does not expose a `ReactiveJwtDecoder` bean, Spring Boot exposes the above default one.

Its configuration can be overridden by using `jwkSetUri()` or replaced by using `decoder()`.

<a id="webflux-oauth2resourceserver-jwt-jwkseturi-dsl"></a>

#### Using `jwkSetUri()`

You can configure an authorization server’s JWK Set URI [as a configuration property](#webflux-oauth2resourceserver-jwt-jwkseturi) or supply it in the DSL:

#### Java

```java
@Bean
SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
	http
		.authorizeExchange(exchanges -> exchanges
			.anyExchange().authenticated()
		)
		.oauth2ResourceServer(oauth2 -> oauth2
			.jwt(jwt -> jwt
				.jwkSetUri("https://idp.example.com/.well-known/jwks.json")
			)
		);
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
            jwt {
                jwkSetUri = "https://idp.example.com/.well-known/jwks.json"
            }
        }
    }
}
```

Using `jwkSetUri()` takes precedence over any configuration property.

<a id="webflux-oauth2resourceserver-jwt-decoder-dsl"></a>

#### Using `decoder()`

`decoder()` is more powerful than `jwkSetUri()`, because it completely replaces any Spring Boot auto-configuration of `JwtDecoder`:

#### Java

```java
@Bean
SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
	http
		.authorizeExchange(exchanges -> exchanges
			.anyExchange().authenticated()
		)
		.oauth2ResourceServer(oauth2 -> oauth2
			.jwt(jwt -> jwt
				.decoder(myCustomDecoder())
			)
		);
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
            jwt {
                jwtDecoder = myCustomDecoder()
            }
        }
    }
}
```

This is handy when you need deeper configuration, such as [validation](#webflux-oauth2resourceserver-jwt-validation).

<a id="webflux-oauth2resourceserver-decoder-bean"></a>

#### Exposing a `ReactiveJwtDecoder` `@Bean`

Alternately, exposing a `ReactiveJwtDecoder` `@Bean` has the same effect as `decoder()`:
You can construct one with a `jwkSetUri` like so:

#### Java

```java
@Bean
public ReactiveJwtDecoder jwtDecoder() {
    return NimbusReactiveJwtDecoder.withJwkSetUri(jwkSetUri).build();
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    return NimbusReactiveJwtDecoder.withJwkSetUri(jwkSetUri).build()
}
```

or you can use the issuer and have `NimbusReactiveJwtDecoder` look up the `jwkSetUri` when `build()` is invoked, like the following:

#### Java

```java
@Bean
public ReactiveJwtDecoder jwtDecoder() {
    return NimbusReactiveJwtDecoder.withIssuerLocation(issuer).build();
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    return NimbusReactiveJwtDecoder.withIssuerLocation(issuer).build()
}
```

Or, if the defaults work for you, you can also use `JwtDecoders`, which does the above in addition to configuring the decoder’s validator:

#### Java

```java
@Bean
public ReactiveJwtDecoder jwtDecoder() {
    return ReactiveJwtDecoders.fromIssuerLocation(issuer);
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    return ReactiveJwtDecoders.fromIssuerLocation(issuer)
}
```

<a id="webflux-oauth2resourceserver-jwt-decoder-algorithm"></a>

## Configuring Trusted Algorithms

By default, `NimbusReactiveJwtDecoder`, and hence Resource Server, trust and verify only tokens that use `RS256`.

You can customize this behavior with [Spring Boot](#webflux-oauth2resourceserver-jwt-boot-algorithm) or by using [the NimbusJwtDecoder builder](#webflux-oauth2resourceserver-jwt-decoder-builder).

<a id="webflux-oauth2resourceserver-jwt-boot-algorithm"></a>

### Customizing Trusted Algorithms with Spring Boot

The simplest way to set the algorithm is as a property:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jws-algorithm: RS512
          jwk-set-uri: https://idp.example.org/.well-known/jwks.json
```

<a id="webflux-oauth2resourceserver-jwt-decoder-builder"></a>

### Customizing Trusted Algorithms by Using a Builder

For greater power, though, we can use a builder that ships with `NimbusReactiveJwtDecoder`:

#### Java

```java
@Bean
ReactiveJwtDecoder jwtDecoder() {
    return NimbusReactiveJwtDecoder.withIssuerLocation(this.issuer)
            .jwsAlgorithm(RS512).build();
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    return NimbusReactiveJwtDecoder.withIssuerLocation(this.issuer)
            .jwsAlgorithm(RS512).build()
}
```

Calling `jwsAlgorithm` more than once configures `NimbusReactiveJwtDecoder` to trust more than one algorithm:

#### Java

```java
@Bean
ReactiveJwtDecoder jwtDecoder() {
    return NimbusReactiveJwtDecoder.withIssuerLocation(this.issuer)
            .jwsAlgorithm(RS512).jwsAlgorithm(ES512).build();
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    return NimbusReactiveJwtDecoder.withIssuerLocation(this.issuer)
            .jwsAlgorithm(RS512).jwsAlgorithm(ES512).build()
}
```

Alternately, you can call `jwsAlgorithms`:

#### Java

```java
@Bean
ReactiveJwtDecoder jwtDecoder() {
    return NimbusReactiveJwtDecoder.withIssuerLocation(this.jwkSetUri)
            .jwsAlgorithms(algorithms -> {
                    algorithms.add(RS512);
                    algorithms.add(ES512);
            }).build();
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    return NimbusReactiveJwtDecoder.withIssuerLocation(this.jwkSetUri)
            .jwsAlgorithms {
                it.add(RS512)
                it.add(ES512)
            }
            .build()
}
```

<a id="webflux-oauth2resourceserver-jwt-decoder-public-key"></a>

### Trusting a Single Asymmetric Key

Simpler than backing a Resource Server with a JWK Set endpoint is to hard-code an RSA public key.
The public key can be provided with [Spring Boot](#webflux-oauth2resourceserver-jwt-decoder-public-key-boot) or by [Using a Builder](#webflux-oauth2resourceserver-jwt-decoder-public-key-builder).

<a id="webflux-oauth2resourceserver-jwt-decoder-public-key-boot"></a>

#### Via Spring Boot

You can specify a key with Spring Boot:

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          public-key-location: classpath:my-key.pub
```

Alternately, to allow for a more sophisticated lookup, you can post-process the `RsaKeyConversionServicePostProcessor`:

#### Java

```java
@Bean
BeanFactoryPostProcessor conversionServiceCustomizer() {
    return beanFactory ->
        beanFactory.getBean(RsaKeyConversionServicePostProcessor.class)
                .setResourceLoader(new CustomResourceLoader());
}
```

#### Kotlin

```kotlin
@Bean
fun conversionServiceCustomizer(): BeanFactoryPostProcessor {
    return BeanFactoryPostProcessor { beanFactory: ConfigurableListableBeanFactory ->
        beanFactory.getBean<RsaKeyConversionServicePostProcessor>()
                .setResourceLoader(CustomResourceLoader())
    }
}
```

Specify your key’s location:

```yaml
key.location: hfds://my-key.pub
```

Then autowire the value:

#### Java

```java
@Value("${key.location}")
RSAPublicKey key;
```

#### Kotlin

```kotlin
@Value("\${key.location}")
val key: RSAPublicKey? = null
```

<a id="webflux-oauth2resourceserver-jwt-decoder-public-key-builder"></a>

#### Using a Builder

To wire an `RSAPublicKey` directly, use the appropriate `NimbusReactiveJwtDecoder` builder:

#### Java

```java
@Bean
public ReactiveJwtDecoder jwtDecoder() {
    return NimbusReactiveJwtDecoder.withPublicKey(this.key).build();
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    return NimbusReactiveJwtDecoder.withPublicKey(key).build()
}
```

<a id="webflux-oauth2resourceserver-jwt-decoder-secret-key"></a>

### Trusting a Single Symmetric Key

You can also use a single symmetric key.
You can load in your `SecretKey` and use the appropriate `NimbusReactiveJwtDecoder` builder:

#### Java

```java
@Bean
public ReactiveJwtDecoder jwtDecoder() {
    return NimbusReactiveJwtDecoder.withSecretKey(this.key).build();
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    return NimbusReactiveJwtDecoder.withSecretKey(this.key).build()
}
```

<a id="webflux-oauth2resourceserver-jwt-authorization"></a>

### Configuring Authorization

A JWT that is issued from an OAuth 2.0 Authorization Server typically has either a `scope` or an `scp` attribute, indicating the scopes (or authorities) it has been granted — for example:

```json
{ ..., "scope" : "messages contacts"}
```

When this is the case, Resource Server tries to coerce these scopes into a list of granted authorities, prefixing each scope with the string, `SCOPE_`.

This means that, to protect an endpoint or method with a scope derived from a JWT, the corresponding expressions should include this prefix:

#### Java

```java
import static org.springframework.security.oauth2.core.authorization.OAuth2ReactiveAuthorizationManagers.hasScope;

@Bean
SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
	http
		.authorizeExchange(exchanges -> exchanges
			.mvcMatchers("/contacts/**").access(hasScope("contacts"))
			.mvcMatchers("/messages/**").access(hasScope("messages"))
			.anyExchange().authenticated()
		)
		.oauth2ResourceServer(OAuth2ResourceServerSpec::jwt);
    return http.build();
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
            jwt { }
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

<a id="webflux-oauth2resourceserver-jwt-authorization-extraction"></a>

#### Extracting Authorities Manually

However, there are a number of circumstances where this default is insufficient.
For example, some authorization servers do not use the `scope` attribute. Instead, they have their own custom attribute.
At other times, the resource server may need to adapt the attribute or a composition of attributes into internalized authorities.

To this end, the DSL exposes `jwtAuthenticationConverter()`:

#### Java

```java
@Bean
SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
	http
		.authorizeExchange(exchanges -> exchanges
			.anyExchange().authenticated()
		)
		.oauth2ResourceServer(oauth2 -> oauth2
			.jwt(jwt -> jwt
				.jwtAuthenticationConverter(grantedAuthoritiesExtractor())
			)
		);
	return http.build();
}

Converter<Jwt, Mono<AbstractAuthenticationToken>> grantedAuthoritiesExtractor() {
    JwtAuthenticationConverter jwtAuthenticationConverter =
            new JwtAuthenticationConverter();
    jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter
            (new GrantedAuthoritiesExtractor());
    return new ReactiveJwtAuthenticationConverterAdapter(jwtAuthenticationConverter);
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
            jwt {
                jwtAuthenticationConverter = grantedAuthoritiesExtractor()
            }
        }
    }
}

fun grantedAuthoritiesExtractor(): Converter<Jwt, Mono<AbstractAuthenticationToken>> {
    val jwtAuthenticationConverter = JwtAuthenticationConverter()
    jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(GrantedAuthoritiesExtractor())
    return ReactiveJwtAuthenticationConverterAdapter(jwtAuthenticationConverter)
}
```

`jwtAuthenticationConverter()` is responsible for converting a `Jwt` into an `Authentication`.
As part of its configuration, we can supply a subsidiary converter to go from `Jwt` to a `Collection` of granted authorities.

That final converter might be something like the following `GrantedAuthoritiesExtractor`:

#### Java

```java
static class GrantedAuthoritiesExtractor
        implements Converter<Jwt, Collection<GrantedAuthority>> {

    public Collection<GrantedAuthority> convert(Jwt jwt) {
        Collection<?> authorities = (Collection<?>)
                jwt.getClaims().getOrDefault("mycustomclaim", Collections.emptyList());

        return authorities.stream()
                .map(Object::toString)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }
}
```

#### Kotlin

```kotlin
internal class GrantedAuthoritiesExtractor : Converter<Jwt, Collection<GrantedAuthority>> {
    override fun convert(jwt: Jwt): Collection<GrantedAuthority> {
        val authorities: List<Any> = jwt.claims
                .getOrDefault("mycustomclaim", emptyList<Any>()) as List<Any>
        return authorities
                .map { it.toString() }
                .map { SimpleGrantedAuthority(it) }
    }
}
```

For more flexibility, the DSL supports entirely replacing the converter with any class that implements `Converter<Jwt, Mono<AbstractAuthenticationToken>>`:

#### Java

```java
static class CustomAuthenticationConverter implements Converter<Jwt, Mono<AbstractAuthenticationToken>> {
    public AbstractAuthenticationToken convert(Jwt jwt) {
        return Mono.just(jwt).map(this::doConversion);
    }
}
```

#### Kotlin

```kotlin
internal class CustomAuthenticationConverter : Converter<Jwt, Mono<AbstractAuthenticationToken>> {
    override fun convert(jwt: Jwt): Mono<AbstractAuthenticationToken> {
        return Mono.just(jwt).map(this::doConversion)
    }
}
```

<a id="webflux-oauth2resourceserver-jwt-validation"></a>

### Configuring Validation

Using [minimal Spring Boot configuration](#webflux-oauth2resourceserver-jwt-minimalconfiguration), indicating the authorization server’s issuer URI, Resource Server defaults to verifying the `iss` claim as well as the `exp` and `nbf` timestamp claims.

In circumstances where you need to customize validation needs, Resource Server ships with two standard validators and also accepts custom `OAuth2TokenValidator` instances.

<a id="webflux-oauth2resourceserver-jwt-validation-clockskew"></a>

#### Customizing Timestamp Validation

JWT instances typically have a window of validity, with the start of the window indicated in the `nbf` claim and the end indicated in the `exp` claim.

However, every server can experience clock drift, which can cause tokens to appear to be expired to one server but not to another.
This can cause some implementation heartburn, as the number of collaborating servers increases in a distributed system.

Resource Server uses `JwtTimestampValidator` to verify a token’s validity window, and you can configure it with a `clockSkew` to alleviate the clock drift problem:

#### Java

```java
@Bean
ReactiveJwtDecoder jwtDecoder() {
     NimbusReactiveJwtDecoder jwtDecoder = (NimbusReactiveJwtDecoder)
             ReactiveJwtDecoders.fromIssuerLocation(issuerUri);

     OAuth2TokenValidator<Jwt> withClockSkew = new DelegatingOAuth2TokenValidator<>(
            new JwtTimestampValidator(Duration.ofSeconds(60)),
            new IssuerValidator(issuerUri));

     jwtDecoder.setJwtValidator(withClockSkew);

     return jwtDecoder;
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    val jwtDecoder = ReactiveJwtDecoders.fromIssuerLocation(issuerUri) as NimbusReactiveJwtDecoder
    val withClockSkew: OAuth2TokenValidator<Jwt> = DelegatingOAuth2TokenValidator(
            JwtTimestampValidator(Duration.ofSeconds(60)),
            JwtIssuerValidator(issuerUri))
    jwtDecoder.setJwtValidator(withClockSkew)
    return jwtDecoder
}
```

> [!NOTE]
> By default, Resource Server configures a clock skew of 60 seconds.

<a id="webflux-oauth2resourceserver-validation-custom"></a>

#### Configuring a Custom Validator

You can Add a check for the `aud` claim with the `OAuth2TokenValidator` API:

#### Java

```java
public class AudienceValidator implements OAuth2TokenValidator<Jwt> {
    OAuth2Error error = new OAuth2Error("invalid_token", "The required audience is missing", null);

    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        if (jwt.getAudience().contains("messaging")) {
            return OAuth2TokenValidatorResult.success();
        } else {
            return OAuth2TokenValidatorResult.failure(error);
        }
    }
}
```

#### Kotlin

```kotlin
class AudienceValidator : OAuth2TokenValidator<Jwt> {
    var error: OAuth2Error = OAuth2Error("invalid_token", "The required audience is missing", null)
    override fun validate(jwt: Jwt): OAuth2TokenValidatorResult {
        return if (jwt.audience.contains("messaging")) {
            OAuth2TokenValidatorResult.success()
        } else {
            OAuth2TokenValidatorResult.failure(error)
        }
    }
}
```

Then, to add into a resource server, you can specifying the `ReactiveJwtDecoder` instance:

#### Java

```java
@Bean
ReactiveJwtDecoder jwtDecoder() {
    NimbusReactiveJwtDecoder jwtDecoder = (NimbusReactiveJwtDecoder)
            ReactiveJwtDecoders.fromIssuerLocation(issuerUri);

    OAuth2TokenValidator<Jwt> audienceValidator = new AudienceValidator();
    OAuth2TokenValidator<Jwt> withIssuer = JwtValidators.createDefaultWithIssuer(issuerUri);
    OAuth2TokenValidator<Jwt> withAudience = new DelegatingOAuth2TokenValidator<>(withIssuer, audienceValidator);

    jwtDecoder.setJwtValidator(withAudience);

    return jwtDecoder;
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): ReactiveJwtDecoder {
    val jwtDecoder = ReactiveJwtDecoders.fromIssuerLocation(issuerUri) as NimbusReactiveJwtDecoder
    val audienceValidator: OAuth2TokenValidator<Jwt> = AudienceValidator()
    val withIssuer: OAuth2TokenValidator<Jwt> = JwtValidators.createDefaultWithIssuer(issuerUri)
    val withAudience: OAuth2TokenValidator<Jwt> = DelegatingOAuth2TokenValidator(withIssuer, audienceValidator)
    jwtDecoder.setJwtValidator(withAudience)
    return jwtDecoder
}
```
