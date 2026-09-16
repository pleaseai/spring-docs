---
title: "OAuth 2.0 Resource Server Opaque Token"
source: "ROOT:servlet/oauth2/resource-server/opaque-token.adoc"
---

# OAuth 2.0 Resource Server Opaque Token

<a id="oauth2resourceserver-opaque-minimaldependencies"></a>

## Minimal Dependencies for Introspection

As described in [Minimal Dependencies for JWT](jwt.md#oauth2resourceserver-jwt-minimaldependencies) most of Resource Server support is collected in `spring-security-oauth2-resource-server`.
However unless a custom [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-introspector) is provided, the Resource Server will fallback to `SpringOpaqueTokenIntrospector`.
This means that only `spring-security-oauth2-resource-server` is necessary in order to have a working minimal Resource Server that supports opaque Bearer Tokens.

<a id="oauth2resourceserver-opaque-minimalconfiguration"></a>

## Minimal Configuration for Introspection

Typically, an opaque token can be verified via an [OAuth 2.0 Introspection Endpoint](https://tools.ietf.org/html/rfc7662), hosted by the authorization server.
This can be handy when revocation is a requirement.

When using [Spring Boot](https://spring.io/projects/spring-boot), configuring an application as a resource server that uses introspection consists of two basic steps.
First, include the needed dependencies and second, indicate the introspection endpoint details.

<a id="oauth2resourceserver-opaque-introspectionuri"></a>

### Specifying the Authorization Server

To specify where the introspection endpoint is, simply do:

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

Resource Server will use these properties to further self-configure and subsequently validate incoming JWTs.

> [!NOTE]
> When using introspection, the authorization server’s word is the law.
> If the authorization server responses that the token is valid, then it is.

And that’s it!

<a id="_startup_expectations"></a>

### Startup Expectations

When this property and these dependencies are used, Resource Server will automatically configure itself to validate Opaque Bearer Tokens.

This startup process is quite a bit simpler than for JWTs since no endpoints need to be discovered and no additional validation rules get added.

<a id="_runtime_expectations"></a>

### Runtime Expectations

Once the application is started up, Resource Server will attempt to process any request containing an `Authorization: Bearer` header:

```http
GET / HTTP/1.1
Authorization: Bearer some-token-value # Resource Server will process this
```

So long as this scheme is indicated, Resource Server will attempt to process the request according to the Bearer Token specification.

Given an Opaque Token, Resource Server will

1. Query the provided introspection endpoint using the provided credentials and the token
1. Inspect the response for an `{ 'active' : true }` attribute
1. Map each scope to an authority with the prefix `SCOPE_`

The resulting `Authentication#getPrincipal`, by default, is a Spring Security [`OAuth2AuthenticatedPrincipal`](https://docs.spring.io/spring-security/site/docs/6.5.0/api/org/springframework/security/oauth2/core/OAuth2AuthenticatedPrincipal.html) object, and `Authentication#getName` maps to the token’s `sub` property, if one is present.

From here, you may want to jump to:

- [How Opaque Token Authentication Works](#oauth2resourceserver-opaque-architecture)
- [Looking Up Attributes Post-Authentication](#oauth2resourceserver-opaque-attributes)
- [Extracting Authorities Manually](#oauth2resourceserver-opaque-authorization-extraction)
- [Using Introspection with JWTs](#oauth2resourceserver-opaque-jwt-introspector)

<a id="oauth2resourceserver-opaque-architecture"></a>

## How Opaque Token Authentication Works

Next, let’s see the architectural components that Spring Security uses to support [opaque token](https://tools.ietf.org/html/rfc7662) Authentication in servlet-based applications, like the one we just saw.

[`OpaqueTokenAuthenticationProvider`](https://docs.spring.io/spring-security/site/docs/6.5.0/api/org/springframework/security/oauth2/server/resource/authentication/OpaqueTokenAuthenticationProvider.html) is an [`AuthenticationProvider`](../../authentication/architecture.md#servlet-authentication-authenticationprovider) implementation that leverages a [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-introspector) to authenticate an opaque token.

Let’s take a look at how `OpaqueTokenAuthenticationProvider` works within Spring Security.
The figure explains details of how the [`AuthenticationManager`](../../authentication/architecture.md#servlet-authentication-authenticationmanager) in figures from [Reading the Bearer Token](index.md#oauth2resourceserver-authentication-bearertokenauthenticationfilter) works.

#### `OpaqueTokenAuthenticationProvider` Usage

![opaquetokenauthenticationprovider](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.0/docs/modules/ROOT/assets/images/servlet/oauth2/opaquetokenauthenticationprovider.png)

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.0/docs/modules/ROOT/assets/images/icons/number_1.png) The authentication `Filter` from [Reading the Bearer Token](index.md#oauth2resourceserver-authentication-bearertokenauthenticationfilter) passes a `BearerTokenAuthenticationToken` to the `AuthenticationManager` which is implemented by [`ProviderManager`](../../authentication/architecture.md#servlet-authentication-providermanager).

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.0/docs/modules/ROOT/assets/images/icons/number_2.png) The `ProviderManager` is configured to use an [AuthenticationProvider](../../authentication/architecture.md#servlet-authentication-authenticationprovider) of type `OpaqueTokenAuthenticationProvider`.

<a id="oauth2resourceserver-opaque-architecture-introspector"></a>

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.0/docs/modules/ROOT/assets/images/icons/number_3.png) `OpaqueTokenAuthenticationProvider` introspects the opaque token and adds granted authorities using an [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-introspector).
When authentication is successful, the [`Authentication`](../../authentication/architecture.md#servlet-authentication-authentication) that is returned is of type `BearerTokenAuthentication` and has a principal that is the `OAuth2AuthenticatedPrincipal` returned by the configured [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-introspector).
Ultimately, the returned `BearerTokenAuthentication` will be set on the [`SecurityContextHolder`](../../authentication/architecture.md#servlet-authentication-securitycontextholder) by the authentication `Filter`.

<a id="oauth2resourceserver-opaque-attributes"></a>

## Looking Up Attributes Post-Authentication

Once a token is authenticated, an instance of `BearerTokenAuthentication` is set in the `SecurityContext`.

This means that it’s available in `@Controller` methods when using `@EnableWebMvc` in your configuration:

#### Java

```java
@GetMapping("/foo")
public String foo(BearerTokenAuthentication authentication) {
    return authentication.getTokenAttributes().get("sub") + " is the subject";
}
```

#### Kotlin

```kotlin
@GetMapping("/foo")
fun foo(authentication: BearerTokenAuthentication): String {
    return authentication.tokenAttributes["sub"].toString() + " is the subject"
}
```

Since `BearerTokenAuthentication` holds an `OAuth2AuthenticatedPrincipal`, that also means that it’s available to controller methods, too:

#### Java

```java
@GetMapping("/foo")
public String foo(@AuthenticationPrincipal OAuth2AuthenticatedPrincipal principal) {
    return principal.getAttribute("sub") + " is the subject";
}
```

#### Kotlin

```kotlin
@GetMapping("/foo")
fun foo(@AuthenticationPrincipal principal: OAuth2AuthenticatedPrincipal): String {
    return principal.getAttribute<Any>("sub").toString() + " is the subject"
}
```

<a id="_looking_up_attributes_via_spel"></a>

### Looking Up Attributes Via SpEL

Of course, this also means that attributes can be accessed via SpEL.

For example, if using `@EnableGlobalMethodSecurity` so that you can use `@PreAuthorize` annotations, you can do:

#### Java

```java
@PreAuthorize("principal?.attributes['sub'] == 'foo'")
public String forFoosEyesOnly() {
    return "foo";
}
```

#### Kotlin

```kotlin
@PreAuthorize("principal?.attributes['sub'] == 'foo'")
fun forFoosEyesOnly(): String {
    return "foo"
}
```

<a id="oauth2resourceserver-opaque-sansboot"></a>

## Overriding or Replacing Boot Auto Configuration

There are two `@Bean`s that Spring Boot generates on Resource Server’s behalf.

The first is a `SecurityFilterChain` that configures the app as a resource server.
When use Opaque Token, this `SecurityFilterChain` looks like:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(authorize -> authorize
            .anyRequest().authenticated()
        )
        .oauth2ResourceServer(oauth2 -> oauth2
            .opaqueToken(Customizer.withDefaults())
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        authorizeRequests {
            authorize(anyRequest, authenticated)
        }
        oauth2ResourceServer {
            opaqueToken { }
        }
    }
    return http.build()
}
```

If the application doesn’t expose a `SecurityFilterChain` bean, then Spring Boot will expose the above default one.

Replacing this is as simple as exposing the bean within the application:

#### Java

```java
import static org.springframework.security.oauth2.core.authorization.OAuth2AuthorizationManagers.hasScope;

@Configuration
@EnableWebSecurity
public class MyCustomSecurityConfiguration {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/messages/**").access(hasScope("message:read"))
                .anyRequest().authenticated()
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
import org.springframework.security.oauth2.core.authorization.OAuth2AuthorizationManagers.hasScope;

@Configuration
@EnableWebSecurity
class MyCustomSecurityConfiguration {
    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeRequests {
                authorize("/messages/**", hasScope("SCOPE_message:read"))
                authorize(anyRequest, authenticated)
            }
            oauth2ResourceServer {
                opaqueToken {
                    introspector = myIntrospector()
                }
            }
        }
        return http.build()
    }
}
```

The above requires the scope of `message:read` for any URL that starts with `/messages/`.

Methods on the `oauth2ResourceServer` DSL will also override or replace auto configuration.

<a id="oauth2resourceserver-opaque-introspector"></a>

For example, the second `@Bean` Spring Boot creates is an `OpaqueTokenIntrospector`, [which decodes `String` tokens into validated instances of `OAuth2AuthenticatedPrincipal`](#oauth2resourceserver-opaque-architecture-introspector):

#### Java

```java
@Bean
public OpaqueTokenIntrospector introspector() {
    return SpringOpaqueTokenIntrospector.withIntrospectionUri(introspectionUri)
            .clientId(clientId).clientSecret(clientSecret).build();
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): OpaqueTokenIntrospector {
    return SpringOpaqueTokenIntrospector.withIntrospectionUri(introspectionUri)
            .clientId(clientId).clientSecret(clientSecret).build()
}
```

If the application doesn’t expose an [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-architecture-introspector) bean, then Spring Boot will expose the above default one.

And its configuration can be overridden using `introspectionUri()` and `introspectionClientCredentials()` or replaced using `introspector()`.

If the application doesn’t expose an `OpaqueTokenAuthenticationConverter` bean, then spring-security will build `BearerTokenAuthentication`.

Or, if you’re not using Spring Boot at all, then all of these components - the filter chain, an [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-architecture-introspector) and an `OpaqueTokenAuthenticationConverter` can be specified in XML.

The filter chain is specified like so:

#### Xml

```xml
<http>
    <intercept-uri pattern="/**" access="authenticated"/>
    <oauth2-resource-server>
        <opaque-token introspector-ref="opaqueTokenIntrospector"
                authentication-converter-ref="opaqueTokenAuthenticationConverter"/>
    </oauth2-resource-server>
</http>
```

And the [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-architecture-introspector) like so:

#### Xml

```xml
<bean id="opaqueTokenIntrospector"
        class="org.springframework.security.oauth2.server.resource.introspection.SpringOpaqueTokenIntrospector">
    <constructor-arg value="${spring.security.oauth2.resourceserver.opaquetoken.introspection_uri}"/>
    <constructor-arg value="${spring.security.oauth2.resourceserver.opaquetoken.client_id}"/>
    <constructor-arg value="${spring.security.oauth2.resourceserver.opaquetoken.client_secret}"/>
</bean>
```

And the `OpaqueTokenAuthenticationConverter` like so:

#### Xml

```xml
<bean id="opaqueTokenAuthenticationConverter"
        class="com.example.CustomOpaqueTokenAuthenticationConverter"/>
```

<a id="oauth2resourceserver-opaque-introspectionuri-dsl"></a>

### Using `introspectionUri()`

An authorization server’s Introspection Uri can be configured [as a configuration property](#oauth2resourceserver-opaque-introspectionuri) or it can be supplied in the DSL:

#### Java

```java
@Configuration
@EnableWebSecurity
public class DirectlyConfiguredIntrospectionUri {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .anyRequest().authenticated()
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
@Configuration
@EnableWebSecurity
class DirectlyConfiguredIntrospectionUri {
    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeRequests {
                authorize(anyRequest, authenticated)
            }
            oauth2ResourceServer {
                opaqueToken {
                    introspectionUri = "https://idp.example.com/introspect"
                    introspectionClientCredentials("client", "secret")
                }
            }
        }
        return http.build()
    }
}
```

#### Xml

```xml
<bean id="opaqueTokenIntrospector"
        class="org.springframework.security.oauth2.server.resource.introspection.SpringOpaqueTokenIntrospector">
    <constructor-arg value="https://idp.example.com/introspect"/>
    <constructor-arg value="client"/>
    <constructor-arg value="secret"/>
</bean>
```

Using `introspectionUri()` takes precedence over any configuration property.

<a id="oauth2resourceserver-opaque-introspector-dsl"></a>

### Using `introspector()`

More powerful than `introspectionUri()` is `introspector()`, which will completely replace any Boot auto configuration of [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-architecture-introspector):

#### Java

```java
@Configuration
@EnableWebSecurity
public class DirectlyConfiguredIntrospector {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .anyRequest().authenticated()
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
@Configuration
@EnableWebSecurity
class DirectlyConfiguredIntrospector {
    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeRequests {
                authorize(anyRequest, authenticated)
            }
            oauth2ResourceServer {
                opaqueToken {
                    introspector = myCustomIntrospector()
                }
            }
        }
        return http.build()
    }
}
```

#### Xml

```xml
<http>
    <intercept-uri pattern="/**" access="authenticated"/>
    <oauth2-resource-server>
        <opaque-token introspector-ref="myCustomIntrospector"/>
    </oauth2-resource-server>
</http>
```

This is handy when deeper configuration, like [authority mapping](#oauth2resourceserver-opaque-authorization-extraction), [JWT revocation](#oauth2resourceserver-opaque-jwt-introspector), or [request timeouts](#oauth2resourceserver-opaque-timeouts), is necessary.

<a id="oauth2resourceserver-opaque-introspector-bean"></a>

### Exposing a `OpaqueTokenIntrospector` `@Bean`

Or, exposing a [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-architecture-introspector) `@Bean` has the same effect as `introspector()`:

```java
@Bean
public OpaqueTokenIntrospector introspector() {
    return return SpringOpaqueTokenIntrospector.withIntrospectionUri(introspectionUri)
            .clientId(clientId).clientSecret(clientSecret).build();
}
```

<a id="oauth2resourceserver-opaque-authorization"></a>

## Configuring Authorization

An OAuth 2.0 Introspection endpoint will typically return a `scope` attribute, indicating the scopes (or authorities) it’s been granted, for example:

`{ …​, "scope" : "messages contacts"}`

When this is the case, Resource Server will attempt to coerce these scopes into a list of granted authorities, prefixing each scope with the string "SCOPE\_".

This means that to protect an endpoint or method with a scope derived from an Opaque Token, the corresponding expressions should include this prefix:

#### Java

```java
import static org.springframework.security.oauth2.core.authorization.OAuth2AuthorizationManagers.hasScope;

@Configuration
@EnableWebSecurity
public class MappedAuthorities {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorizeRequests -> authorizeRequests
                .requestMatchers("/contacts/**").access(hasScope("contacts"))
                .requestMatchers("/messages/**").access(hasScope("messages"))
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 -> oauth2
                .opaqueToken(Customizer.withDefaults())
            );
        return http.build();
    }
}
```

#### Kotlin

```kotlin
import org.springframework.security.oauth2.core.authorization.OAuth2AuthorizationManagers.hasScope

@Configuration
@EnableWebSecurity
class MappedAuthorities {
    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
       http {
            authorizeRequests {
                authorize("/contacts/**", hasScope("contacts"))
                authorize("/messages/**", hasScope("messages"))
                authorize(anyRequest, authenticated)
            }
           oauth2ResourceServer {
               opaqueToken { }
           }
        }
        return http.build()
    }
}
```

#### Xml

```xml
<http>
    <intercept-uri pattern="/contacts/**" access="hasAuthority('SCOPE_contacts')"/>
    <intercept-uri pattern="/messages/**" access="hasAuthority('SCOPE_messages')"/>
    <oauth2-resource-server>
        <opaque-token introspector-ref="opaqueTokenIntrospector"/>
    </oauth2-resource-server>
</http>
```

Or similarly with method security:

#### Java

```java
@PreAuthorize("hasAuthority('SCOPE_messages')")
public List<Message> getMessages(...) {}
```

#### Kotlin

```kotlin
@PreAuthorize("hasAuthority('SCOPE_messages')")
fun getMessages(): List<Message?> {}
```

<a id="oauth2resourceserver-opaque-authorization-extraction"></a>

### Extracting Authorities Manually

By default, Opaque Token support will extract the scope claim from an introspection response and parse it into individual `GrantedAuthority` instances.

For example, if the introspection response were:

```json
{
    "active" : true,
    "scope" : "message:read message:write"
}
```

Then Resource Server would generate an `Authentication` with two authorities, one for `message:read` and the other for `message:write`.

This can, of course, be customized using a custom [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-architecture-introspector) that takes a look at the attribute set and converts in its own way:

#### Java

```java
public class CustomAuthoritiesOpaqueTokenIntrospector implements OpaqueTokenIntrospector {
    private OpaqueTokenIntrospector delegate = SpringOpaqueTokenIntrospector
            .withIntrospectionUri("https://idp.example.org/introspect")
            .clientId("client").clientSecret("secret").build();

    public OAuth2AuthenticatedPrincipal introspect(String token) {
        OAuth2AuthenticatedPrincipal principal = this.delegate.introspect(token);
        return new DefaultOAuth2AuthenticatedPrincipal(
                principal.getName(), principal.getAttributes(), extractAuthorities(principal));
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
class CustomAuthoritiesOpaqueTokenIntrospector : OpaqueTokenIntrospector {
    private val delegate: OpaqueTokenIntrospector = SpringOpaqueTokenIntrospector
            .withIntrospectionUri("https://idp.example.org/introspect")
            .clientId("client").clientSecret("secret").build()
    override fun introspect(token: String): OAuth2AuthenticatedPrincipal {
        val principal: OAuth2AuthenticatedPrincipal = delegate.introspect(token)
        return DefaultOAuth2AuthenticatedPrincipal(
                principal.name, principal.attributes, extractAuthorities(principal))
    }

    private fun extractAuthorities(principal: OAuth2AuthenticatedPrincipal): Collection<GrantedAuthority> {
        val scopes: List<String> = principal.getAttribute(OAuth2IntrospectionClaimNames.SCOPE)
        return scopes
                .map { SimpleGrantedAuthority(it) }
    }
}
```

Thereafter, this custom introspector can be configured simply by exposing it as a `@Bean`:

#### Java

```java
@Bean
public OpaqueTokenIntrospector introspector() {
    return new CustomAuthoritiesOpaqueTokenIntrospector();
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): OpaqueTokenIntrospector {
    return CustomAuthoritiesOpaqueTokenIntrospector()
}
```

<a id="oauth2resourceserver-opaque-timeouts"></a>

## Configuring Timeouts

By default, Resource Server uses connection and socket timeouts of 30 seconds each for coordinating with the authorization server.

This may be too short in some scenarios.
Further, it doesn’t take into account more sophisticated patterns like back-off and discovery.

To adjust the way in which Resource Server connects to the authorization server, `SpringOpaqueTokenIntrospector` accepts an instance of `RestOperations`:

#### Java

```java
@Bean
public OpaqueTokenIntrospector introspector(RestTemplateBuilder builder, OAuth2ResourceServerProperties properties) {
    RestOperations rest = builder
            .basicAuthentication(properties.getOpaquetoken().getClientId(), properties.getOpaquetoken().getClientSecret())
            .setConnectTimeout(Duration.ofSeconds(60))
            .setReadTimeout(Duration.ofSeconds(60))
            .build();

    return SpringOpaqueTokenIntrospector(introspectionUri, rest);
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(builder: RestTemplateBuilder, properties: OAuth2ResourceServerProperties): OpaqueTokenIntrospector? {
    val rest: RestOperations = builder
            .basicAuthentication(properties.opaquetoken.clientId, properties.opaquetoken.clientSecret)
            .setConnectTimeout(Duration.ofSeconds(60))
            .setReadTimeout(Duration.ofSeconds(60))
            .build()
    return SpringOpaqueTokenIntrospector(introspectionUri, rest)
}
```

<a id="oauth2resourceserver-opaque-jwt-introspector"></a>

## Using Introspection with JWTs

A common question is whether or not introspection is compatible with JWTs.
Spring Security’s Opaque Token support has been designed to not care about the format of the token — it will gladly pass any token to the introspection endpoint provided.

So, let’s say that you’ve got a requirement that requires you to check with the authorization server on each request, in case the JWT has been revoked.

Even though you are using the JWT format for the token, your validation method is introspection, meaning you’d want to do:

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

But, let’s say that, oddly enough, the introspection endpoint only returns whether or not the token is active.
Now what?

In this case, you can create a custom [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-architecture-introspector) that still hits the endpoint, but then updates the returned principal to have the JWTs claims as the attributes:

#### Java

```java
public class JwtOpaqueTokenIntrospector implements OpaqueTokenIntrospector {
    private OpaqueTokenIntrospector delegate = SpringOpaqueTokenIntrospector
            .withIntrospectionUri("https://idp.example.org/introspect")
            .clientId("client").clientSecret("secret").build();
    private JwtDecoder jwtDecoder = new NimbusJwtDecoder(new ParseOnlyJWTProcessor());

    public OAuth2AuthenticatedPrincipal introspect(String token) {
        OAuth2AuthenticatedPrincipal principal = this.delegate.introspect(token);
        try {
            Jwt jwt = this.jwtDecoder.decode(token);
            return new DefaultOAuth2AuthenticatedPrincipal(jwt.getClaims(), NO_AUTHORITIES);
        } catch (JwtException ex) {
            throw new OAuth2IntrospectionException(ex);
        }
    }

    private static class ParseOnlyJWTProcessor extends DefaultJWTProcessor<SecurityContext> {
    	JWTClaimsSet process(SignedJWT jwt, SecurityContext context)
                throws JOSEException {
            return jwt.getJWTClaimsSet();
        }
    }
}
```

#### Kotlin

```kotlin
class JwtOpaqueTokenIntrospector : OpaqueTokenIntrospector {
    private val delegate: OpaqueTokenIntrospector = SpringOpaqueTokenIntrospector
            .withIntrospectionUri("https://idp.example.org/introspect")
            .clientId("client").clientSecret("secret").build()
    private val jwtDecoder: JwtDecoder = NimbusJwtDecoder(ParseOnlyJWTProcessor())
    override fun introspect(token: String): OAuth2AuthenticatedPrincipal {
        val principal = delegate.introspect(token)
        return try {
            val jwt: Jwt = jwtDecoder.decode(token)
            DefaultOAuth2AuthenticatedPrincipal(jwt.claims, NO_AUTHORITIES)
        } catch (ex: JwtException) {
            throw OAuth2IntrospectionException(ex.message)
        }
    }

    private class ParseOnlyJWTProcessor : DefaultJWTProcessor<SecurityContext>() {
        override fun process(jwt: SignedJWT, context: SecurityContext): JWTClaimsSet {
            return jwt.jwtClaimsSet
        }
    }
}
```

Thereafter, this custom introspector can be configured simply by exposing it as a `@Bean`:

#### Java

```java
@Bean
public OpaqueTokenIntrospector introspector() {
    return new JwtOpaqueTokenIntrospector();
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): OpaqueTokenIntrospector {
    return JwtOpaqueTokenIntrospector()
}
```

<a id="oauth2resourceserver-opaque-userinfo"></a>

## Calling a `/userinfo` Endpoint

Generally speaking, a Resource Server doesn’t care about the underlying user, but instead about the authorities that have been granted.

That said, at times it can be valuable to tie the authorization statement back to a user.

If an application is also using `spring-security-oauth2-client`, having set up the appropriate `ClientRegistrationRepository`, then this is quite simple with a custom [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-architecture-introspector).
This implementation below does three things:

- Delegates to the introspection endpoint, to affirm the token’s validity
- Looks up the appropriate client registration associated with the `/userinfo` endpoint
- Invokes and returns the response from the `/userinfo` endpoint

#### Java

```java
public class UserInfoOpaqueTokenIntrospector implements OpaqueTokenIntrospector {
    private final OpaqueTokenIntrospector delegate = SpringOpaqueTokenIntrospector
            .withIntrospectionUri("https://idp.example.org/introspect")
            .clientId("client").clientSecret("secret").build();
    private final OAuth2UserService oauth2UserService = new DefaultOAuth2UserService();

    private final ClientRegistrationRepository repository;

    // ... constructor

    @Override
    public OAuth2AuthenticatedPrincipal introspect(String token) {
        OAuth2AuthenticatedPrincipal authorized = this.delegate.introspect(token);
        Instant issuedAt = authorized.getAttribute(ISSUED_AT);
        Instant expiresAt = authorized.getAttribute(EXPIRES_AT);
        ClientRegistration clientRegistration = this.repository.findByRegistrationId("registration-id");
        OAuth2AccessToken token = new OAuth2AccessToken(BEARER, token, issuedAt, expiresAt);
        OAuth2UserRequest oauth2UserRequest = new OAuth2UserRequest(clientRegistration, token);
        return this.oauth2UserService.loadUser(oauth2UserRequest);
    }
}
```

#### Kotlin

```kotlin
class UserInfoOpaqueTokenIntrospector : OpaqueTokenIntrospector {
    private val delegate: OpaqueTokenIntrospector = SpringOpaqueTokenIntrospector
            .withIntrospectionUri("https://idp.example.org/introspect")
            .clientId("client").clientSecret("secret").build()
    private val oauth2UserService = DefaultOAuth2UserService()
    private val repository: ClientRegistrationRepository? = null

    // ... constructor

    override fun introspect(token: String): OAuth2AuthenticatedPrincipal {
        val authorized = delegate.introspect(token)
        val issuedAt: Instant? = authorized.getAttribute(ISSUED_AT)
        val expiresAt: Instant? = authorized.getAttribute(EXPIRES_AT)
        val clientRegistration: ClientRegistration = repository!!.findByRegistrationId("registration-id")
        val accessToken = OAuth2AccessToken(BEARER, token, issuedAt, expiresAt)
        val oauth2UserRequest = OAuth2UserRequest(clientRegistration, accessToken)
        return oauth2UserService.loadUser(oauth2UserRequest)
    }
}
```

If you aren’t using `spring-security-oauth2-client`, it’s still quite simple.
You will simply need to invoke the `/userinfo` with your own instance of `WebClient`:

#### Java

```java
public class UserInfoOpaqueTokenIntrospector implements OpaqueTokenIntrospector {
    private final OpaqueTokenIntrospector delegate = SpringOpaqueTokenIntrospector
            .withIntrospectionUri("https://idp.example.org/introspect")
            .clientId("client").clientSecret("secret").build();
    private final WebClient rest = WebClient.create();

    @Override
    public OAuth2AuthenticatedPrincipal introspect(String token) {
        OAuth2AuthenticatedPrincipal authorized = this.delegate.introspect(token);
        return makeUserInfoRequest(authorized);
    }
}
```

#### Kotlin

```kotlin
class UserInfoOpaqueTokenIntrospector : OpaqueTokenIntrospector {
    private val delegate: OpaqueTokenIntrospector = SpringOpaqueTokenIntrospector
            .withIntrospectionUri("https://idp.example.org/introspect")
            .clientId("client").clientSecret("secret").build()
    private val rest: WebClient = WebClient.create()

    override fun introspect(token: String): OAuth2AuthenticatedPrincipal {
        val authorized = delegate.introspect(token)
        return makeUserInfoRequest(authorized)
    }
}
```

Either way, having created your [`OpaqueTokenIntrospector`](#oauth2resourceserver-opaque-architecture-introspector), you should publish it as a `@Bean` to override the defaults:

#### Java

```java
@Bean
OpaqueTokenIntrospector introspector() {
    return new UserInfoOpaqueTokenIntrospector(...);
}
```

#### Kotlin

```kotlin
@Bean
fun introspector(): OpaqueTokenIntrospector {
    return UserInfoOpaqueTokenIntrospector(...)
}
```
