---
title: "Spring Security"
source: "reference:web/spring-security.adoc"
---

<a id="web.security"></a>

# Spring Security

If [Spring Security](https://spring.io/projects/spring-security) is on the classpath, then web applications are secured by default.
Spring Boot relies on Spring Security’s content-negotiation strategy to determine whether to use `httpBasic` or `formLogin`.
To add method-level security to a web application, you can also add [`@EnableMethodSecurity`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/config/annotation/method/configuration/EnableMethodSecurity.html) with your desired settings.
Additional information can be found in the [Spring Security Reference Guide](https://docs.spring.io/spring-security/reference/6.3/servlet/authorization/method-security.html).

The default [`UserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/UserDetailsService.html) has a single user.
The user name is `user`, and the password is random and is printed at WARN level when the application starts, as shown in the following example:

```
Using generated security password: 78fa095d-3f4c-48b1-ad50-e24c31d5cf35

This generated password is for development use only. Your security configuration must be updated before running your application in production.
```

> [!NOTE]
> If you fine-tune your logging configuration, ensure that the `org.springframework.boot.autoconfigure.security` category is set to log `WARN`-level messages.
> Otherwise, the default password is not printed.

You can change the username and password by providing a `spring.security.user.name` and `spring.security.user.password`.

The basic features you get by default in a web application are:

- A [`UserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/UserDetailsService.html) (or [`ReactiveUserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/ReactiveUserDetailsService.html) in case of a WebFlux application) bean with in-memory store and a single user with a generated password (see [`SecurityProperties.User`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/SecurityProperties.User.html) for the properties of the user).
- Form-based login or HTTP Basic security (depending on the `Accept` header in the request) for the entire application (including actuator endpoints if actuator is on the classpath).
- A [`DefaultAuthenticationEventPublisher`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/authentication/DefaultAuthenticationEventPublisher.html) for publishing authentication events.

You can provide a different [`AuthenticationEventPublisher`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/authentication/AuthenticationEventPublisher.html) by adding a bean for it.

<a id="web.security.spring-mvc"></a>

## MVC Security

The default security configuration is implemented in [`SecurityAutoConfiguration`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/servlet/SecurityAutoConfiguration.html) and [`UserDetailsServiceAutoConfiguration`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/servlet/UserDetailsServiceAutoConfiguration.html).
[`SecurityAutoConfiguration`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/servlet/SecurityAutoConfiguration.html) imports `SpringBootWebSecurityConfiguration` for web security and [`UserDetailsServiceAutoConfiguration`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/servlet/UserDetailsServiceAutoConfiguration.html) for authentication.

To completely switch off the default web application security configuration, including Actuator security, or to combine multiple Spring Security components such as OAuth2 Client and Resource Server, add a bean of type [`SecurityFilterChain`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/SecurityFilterChain.html) (doing so does not disable the [`UserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/UserDetailsService.html) configuration).
To also switch off the [`UserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/UserDetailsService.html) configuration, add a bean of type [`UserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/UserDetailsService.html), [`AuthenticationProvider`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/authentication/AuthenticationProvider.html), or [`AuthenticationManager`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/authentication/AuthenticationManager.html).

The auto-configuration of a [`UserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/UserDetailsService.html) will also back off when any of the following Spring Security modules is on the classpath:

- `spring-security-oauth2-client`
- `spring-security-oauth2-resource-server`
- `spring-security-saml2-service-provider`

To use [`UserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/UserDetailsService.html) in addition to one or more of these dependencies, define your own [`InMemoryUserDetailsManager`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/provisioning/InMemoryUserDetailsManager.html) bean.

Access rules can be overridden by adding a custom [`SecurityFilterChain`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/SecurityFilterChain.html) bean.
Spring Boot provides convenience methods that can be used to override access rules for actuator endpoints and static resources.
[`EndpointRequest`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/actuate/autoconfigure/security/servlet/EndpointRequest.html) can be used to create a [`RequestMatcher`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/util/matcher/RequestMatcher.html) that is based on the `management.endpoints.web.base-path` property.
[`PathRequest`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/servlet/PathRequest.html) can be used to create a [`RequestMatcher`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/util/matcher/RequestMatcher.html) for resources in commonly used locations.

<a id="web.security.spring-webflux"></a>

## WebFlux Security

Similar to Spring MVC applications, you can secure your WebFlux applications by adding the `spring-boot-starter-security` dependency.
The default security configuration is implemented in [`ReactiveSecurityAutoConfiguration`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/reactive/ReactiveSecurityAutoConfiguration.html) and [`ReactiveUserDetailsServiceAutoConfiguration`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/reactive/ReactiveUserDetailsServiceAutoConfiguration.html).
[`ReactiveSecurityAutoConfiguration`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/reactive/ReactiveSecurityAutoConfiguration.html) imports `WebFluxSecurityConfiguration` for web security and [`UserDetailsServiceAutoConfiguration`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/reactive/UserDetailsServiceAutoConfiguration.html) for authentication.
In addition to reactive web applications, the latter is also auto-configured when RSocket is in use.

To completely switch off the default web application security configuration, including Actuator security, add a bean of type [`WebFilterChainProxy`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/server/WebFilterChainProxy.html) (doing so does not disable the [`ReactiveUserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/ReactiveUserDetailsService.html) configuration).
To also switch off the [`ReactiveUserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/ReactiveUserDetailsService.html) configuration, add a bean of type [`ReactiveUserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/ReactiveUserDetailsService.html) or [`ReactiveAuthenticationManager`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/authentication/ReactiveAuthenticationManager.html).

The auto-configuration will also back off when any of the following Spring Security modules is on the classpath:

- `spring-security-oauth2-client`
- `spring-security-oauth2-resource-server`

To use [`ReactiveUserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/ReactiveUserDetailsService.html) in addition to one or more of these dependencies, define your own [`MapReactiveUserDetailsService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/core/userdetails/MapReactiveUserDetailsService.html) bean.

Access rules and the use of multiple Spring Security components such as OAuth 2 Client and Resource Server can be configured by adding a custom [`SecurityWebFilterChain`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/server/SecurityWebFilterChain.html) bean.
Spring Boot provides convenience methods that can be used to override access rules for actuator endpoints and static resources.
[`EndpointRequest`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/actuate/autoconfigure/security/reactive/EndpointRequest.html) can be used to create a [`ServerWebExchangeMatcher`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/server/util/matcher/ServerWebExchangeMatcher.html) that is based on the `management.endpoints.web.base-path` property.

[`PathRequest`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/reactive/PathRequest.html) can be used to create a [`ServerWebExchangeMatcher`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/server/util/matcher/ServerWebExchangeMatcher.html) for resources in commonly used locations.

For example, you can customize your security configuration by adding something like:

#### Java

```java
import org.springframework.boot.autoconfigure.security.reactive.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration(proxyBeanMethods = false)
public class MyWebFluxSecurityConfiguration {

	@Bean
	public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
		http.authorizeExchange((exchange) -> {
			exchange.matchers(PathRequest.toStaticResources().atCommonLocations()).permitAll();
			exchange.pathMatchers("/foo", "/bar").authenticated();
		});
		http.formLogin(withDefaults());
		return http.build();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.autoconfigure.security.reactive.PathRequest
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.Customizer.withDefaults
import org.springframework.security.config.web.server.ServerHttpSecurity
import org.springframework.security.web.server.SecurityWebFilterChain

@Configuration(proxyBeanMethods = false)
class MyWebFluxSecurityConfiguration {

	@Bean
	fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
		http.authorizeExchange { spec ->
			spec.matchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
			spec.pathMatchers("/foo", "/bar").authenticated()
		}
		http.formLogin(withDefaults())
		return http.build()
	}

}
```

<a id="web.security.oauth2"></a>

## OAuth2

[OAuth2](https://oauth.net/2/) is a widely used authorization framework that is supported by Spring.

<a id="web.security.oauth2.client"></a>

### Client

If you have `spring-security-oauth2-client` on your classpath, you can take advantage of some auto-configuration to set up OAuth2/Open ID Connect clients.
This configuration makes use of the properties under [`OAuth2ClientProperties`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/oauth2/client/OAuth2ClientProperties.html).
The same properties are applicable to both servlet and reactive applications.

You can register multiple OAuth2 clients and providers under the `spring.security.oauth2.client` prefix, as shown in the following example:

#### Properties

```properties
spring.security.oauth2.client.registration.my-login-client.client-id=abcd
spring.security.oauth2.client.registration.my-login-client.client-secret=password
spring.security.oauth2.client.registration.my-login-client.client-name=Client for OpenID Connect
spring.security.oauth2.client.registration.my-login-client.provider=my-oauth-provider
spring.security.oauth2.client.registration.my-login-client.scope=openid,profile,email,phone,address
spring.security.oauth2.client.registration.my-login-client.redirect-uri={baseUrl}/login/oauth2/code/{registrationId}
spring.security.oauth2.client.registration.my-login-client.client-authentication-method=client_secret_basic
spring.security.oauth2.client.registration.my-login-client.authorization-grant-type=authorization_code
spring.security.oauth2.client.registration.my-client-1.client-id=abcd
spring.security.oauth2.client.registration.my-client-1.client-secret=password
spring.security.oauth2.client.registration.my-client-1.client-name=Client for user scope
spring.security.oauth2.client.registration.my-client-1.provider=my-oauth-provider
spring.security.oauth2.client.registration.my-client-1.scope=user
spring.security.oauth2.client.registration.my-client-1.redirect-uri={baseUrl}/authorized/user
spring.security.oauth2.client.registration.my-client-1.client-authentication-method=client_secret_basic
spring.security.oauth2.client.registration.my-client-1.authorization-grant-type=authorization_code
spring.security.oauth2.client.registration.my-client-2.client-id=abcd
spring.security.oauth2.client.registration.my-client-2.client-secret=password
spring.security.oauth2.client.registration.my-client-2.client-name=Client for email scope
spring.security.oauth2.client.registration.my-client-2.provider=my-oauth-provider
spring.security.oauth2.client.registration.my-client-2.scope=email
spring.security.oauth2.client.registration.my-client-2.redirect-uri={baseUrl}/authorized/email
spring.security.oauth2.client.registration.my-client-2.client-authentication-method=client_secret_basic
spring.security.oauth2.client.registration.my-client-2.authorization-grant-type=authorization_code
spring.security.oauth2.client.provider.my-oauth-provider.authorization-uri=https://my-auth-server.com/oauth2/authorize
spring.security.oauth2.client.provider.my-oauth-provider.token-uri=https://my-auth-server.com/oauth2/token
spring.security.oauth2.client.provider.my-oauth-provider.user-info-uri=https://my-auth-server.com/userinfo
spring.security.oauth2.client.provider.my-oauth-provider.user-info-authentication-method=header
spring.security.oauth2.client.provider.my-oauth-provider.jwk-set-uri=https://my-auth-server.com/oauth2/jwks
spring.security.oauth2.client.provider.my-oauth-provider.user-name-attribute=name
```

#### YAML

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          my-login-client:
            client-id: "abcd"
            client-secret: "password"
            client-name: "Client for OpenID Connect"
            provider: "my-oauth-provider"
            scope: "openid,profile,email,phone,address"
            redirect-uri: "{baseUrl}/login/oauth2/code/{registrationId}"
            client-authentication-method: "client_secret_basic"
            authorization-grant-type: "authorization_code"

          my-client-1:
            client-id: "abcd"
            client-secret: "password"
            client-name: "Client for user scope"
            provider: "my-oauth-provider"
            scope: "user"
            redirect-uri: "{baseUrl}/authorized/user"
            client-authentication-method: "client_secret_basic"
            authorization-grant-type: "authorization_code"

          my-client-2:
            client-id: "abcd"
            client-secret: "password"
            client-name: "Client for email scope"
            provider: "my-oauth-provider"
            scope: "email"
            redirect-uri: "{baseUrl}/authorized/email"
            client-authentication-method: "client_secret_basic"
            authorization-grant-type: "authorization_code"

        provider:
          my-oauth-provider:
            authorization-uri: "https://my-auth-server.com/oauth2/authorize"
            token-uri: "https://my-auth-server.com/oauth2/token"
            user-info-uri: "https://my-auth-server.com/userinfo"
            user-info-authentication-method: "header"
            jwk-set-uri: "https://my-auth-server.com/oauth2/jwks"
            user-name-attribute: "name"
```

For OpenID Connect providers that support [OpenID Connect discovery](https://openid.net/specs/openid-connect-discovery-1_0.html), the configuration can be further simplified.
The provider needs to be configured with an `issuer-uri` which is the URI that it asserts as its Issuer Identifier.
For example, if the `issuer-uri` provided is "https://example.com", then an "OpenID Provider Configuration Request" will be made to "https://example.com/.well-known/openid-configuration".
The result is expected to be an "OpenID Provider Configuration Response".
The following example shows how an OpenID Connect Provider can be configured with the `issuer-uri`:

#### Properties

```properties
spring.security.oauth2.client.provider.oidc-provider.issuer-uri=https://dev-123456.oktapreview.com/oauth2/default/
```

#### YAML

```yaml
spring:
  security:
    oauth2:
      client:
        provider:
          oidc-provider:
            issuer-uri: "https://dev-123456.oktapreview.com/oauth2/default/"
```

By default, Spring Security’s [`OAuth2LoginAuthenticationFilter`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/oauth2/client/web/OAuth2LoginAuthenticationFilter.html) only processes URLs matching `/login/oauth2/code/*`.
If you want to customize the `redirect-uri` to use a different pattern, you need to provide configuration to process that custom pattern.
For example, for servlet applications, you can add your own [`SecurityFilterChain`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/SecurityFilterChain.html) that resembles the following:

#### Java

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
public class MyOAuthClientConfiguration {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.authorizeHttpRequests((requests) -> requests
				.anyRequest().authenticated()
			)
			.oauth2Login((login) -> login
				.redirectionEndpoint((endpoint) -> endpoint
					.baseUri("/login/oauth2/callback/*")
				)
			);
		return http.build();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.annotation.web.invoke
import org.springframework.security.web.SecurityFilterChain

@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
open class MyOAuthClientConfiguration {

	@Bean
	open fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
		http {
			authorizeHttpRequests {
				authorize(anyRequest, authenticated)
			}
			oauth2Login {
				redirectionEndpoint {
					baseUri = "/login/oauth2/callback/*"
				}
			}
		}
		return http.build()
	}

}
```

> [!TIP]
> Spring Boot auto-configures an [`InMemoryOAuth2AuthorizedClientService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/oauth2/client/InMemoryOAuth2AuthorizedClientService.html) which is used by Spring Security for the management of client registrations.
> The [`InMemoryOAuth2AuthorizedClientService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/oauth2/client/InMemoryOAuth2AuthorizedClientService.html) has limited capabilities and we recommend using it only for development environments.
> For production environments, consider using a [`JdbcOAuth2AuthorizedClientService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/oauth2/client/JdbcOAuth2AuthorizedClientService.html) or creating your own implementation of [`OAuth2AuthorizedClientService`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/oauth2/client/OAuth2AuthorizedClientService.html).

<a id="web.security.oauth2.client.common-providers"></a>

#### OAuth2 Client Registration for Common Providers

For common OAuth2 and OpenID providers, including Google, Github, Facebook, and Okta, we provide a set of provider defaults (`google`, `github`, `facebook`, and `okta`, respectively).

If you do not need to customize these providers, you can set the `provider` attribute to the one for which you need to infer defaults.
Also, if the key for the client registration matches a default supported provider, Spring Boot infers that as well.

In other words, the two configurations in the following example use the Google provider:

#### Properties

```properties
spring.security.oauth2.client.registration.my-client.client-id=abcd
spring.security.oauth2.client.registration.my-client.client-secret=password
spring.security.oauth2.client.registration.my-client.provider=google
spring.security.oauth2.client.registration.google.client-id=abcd
spring.security.oauth2.client.registration.google.client-secret=password
```

#### YAML

```yaml
spring:
  security:
    oauth2:
      client:
        registration:
          my-client:
            client-id: "abcd"
            client-secret: "password"
            provider: "google"
          google:
            client-id: "abcd"
            client-secret: "password"
```

<a id="web.security.oauth2.server"></a>

### Resource Server

If you have `spring-security-oauth2-resource-server` on your classpath, Spring Boot can set up an OAuth2 Resource Server.
For JWT configuration, a JWK Set URI or OIDC Issuer URI needs to be specified, as shown in the following examples:

#### Properties

```properties
spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://example.com/oauth2/default/v1/keys
```

#### YAML

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          jwk-set-uri: "https://example.com/oauth2/default/v1/keys"
```

#### Properties

```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=https://dev-123456.oktapreview.com/oauth2/default/
```

#### YAML

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          issuer-uri: "https://dev-123456.oktapreview.com/oauth2/default/"
```

> [!NOTE]
> If the authorization server does not support a JWK Set URI, you can configure the resource server with the Public Key used for verifying the signature of the JWT.
> This can be done using the `spring.security.oauth2.resourceserver.jwt.public-key-location` property, where the value needs to point to a file containing the public key in the PEM-encoded x509 format.

The `spring.security.oauth2.resourceserver.jwt.audiences` property can be used to specify the expected values of the aud claim in JWTs.
For example, to require JWTs to contain an aud claim with the value `my-audience`:

#### Properties

```properties
spring.security.oauth2.resourceserver.jwt.audiences[0]=my-audience
```

#### YAML

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        jwt:
          audiences:
            - "my-audience"
```

The same properties are applicable for both servlet and reactive applications.
Alternatively, you can define your own [`JwtDecoder`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/oauth2/jwt/JwtDecoder.html) bean for servlet applications or a [`ReactiveJwtDecoder`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/oauth2/jwt/ReactiveJwtDecoder.html) for reactive applications.

In cases where opaque tokens are used instead of JWTs, you can configure the following properties to validate tokens through introspection:

#### Properties

```properties
spring.security.oauth2.resourceserver.opaquetoken.introspection-uri=https://example.com/check-token
spring.security.oauth2.resourceserver.opaquetoken.client-id=my-client-id
spring.security.oauth2.resourceserver.opaquetoken.client-secret=my-client-secret
```

#### YAML

```yaml
spring:
  security:
    oauth2:
      resourceserver:
        opaquetoken:
          introspection-uri: "https://example.com/check-token"
          client-id: "my-client-id"
          client-secret: "my-client-secret"
```

Again, the same properties are applicable for both servlet and reactive applications.
Alternatively, you can define your own [`OpaqueTokenIntrospector`](https://docs.spring.io/spring-authorization-server/docs/1.3.x/api/org/springframework/security/oauth2/server/resource/introspection/OpaqueTokenIntrospector.html) bean for servlet applications or a [`ReactiveOpaqueTokenIntrospector`](https://docs.spring.io/spring-authorization-server/docs/1.3.x/api/org/springframework/security/oauth2/server/resource/introspection/ReactiveOpaqueTokenIntrospector.html) for reactive applications.

<a id="web.security.oauth2.authorization-server"></a>

### Authorization Server

If you have `spring-security-oauth2-authorization-server` on your classpath, you can take advantage of some auto-configuration to set up a Servlet-based OAuth2 Authorization Server.

You can register multiple OAuth2 clients under the `spring.security.oauth2.authorizationserver.client` prefix, as shown in the following example:

#### Properties

```properties
spring.security.oauth2.authorizationserver.client.my-client-1.registration.client-id=abcd
spring.security.oauth2.authorizationserver.client.my-client-1.registration.client-secret={noop}secret1
spring.security.oauth2.authorizationserver.client.my-client-1.registration.client-authentication-methods[0]=client_secret_basic
spring.security.oauth2.authorizationserver.client.my-client-1.registration.authorization-grant-types[0]=authorization_code
spring.security.oauth2.authorizationserver.client.my-client-1.registration.authorization-grant-types[1]=refresh_token
spring.security.oauth2.authorizationserver.client.my-client-1.registration.redirect-uris[0]=https://my-client-1.com/login/oauth2/code/abcd
spring.security.oauth2.authorizationserver.client.my-client-1.registration.redirect-uris[1]=https://my-client-1.com/authorized
spring.security.oauth2.authorizationserver.client.my-client-1.registration.scopes[0]=openid
spring.security.oauth2.authorizationserver.client.my-client-1.registration.scopes[1]=profile
spring.security.oauth2.authorizationserver.client.my-client-1.registration.scopes[2]=email
spring.security.oauth2.authorizationserver.client.my-client-1.registration.scopes[3]=phone
spring.security.oauth2.authorizationserver.client.my-client-1.registration.scopes[4]=address
spring.security.oauth2.authorizationserver.client.my-client-1.require-authorization-consent=true
spring.security.oauth2.authorizationserver.client.my-client-1.token.authorization-code-time-to-live=5m
spring.security.oauth2.authorizationserver.client.my-client-1.token.access-token-time-to-live=10m
spring.security.oauth2.authorizationserver.client.my-client-1.token.access-token-format=reference
spring.security.oauth2.authorizationserver.client.my-client-1.token.reuse-refresh-tokens=false
spring.security.oauth2.authorizationserver.client.my-client-1.token.refresh-token-time-to-live=30m
spring.security.oauth2.authorizationserver.client.my-client-2.registration.client-id=efgh
spring.security.oauth2.authorizationserver.client.my-client-2.registration.client-secret={noop}secret2
spring.security.oauth2.authorizationserver.client.my-client-2.registration.client-authentication-methods[0]=client_secret_jwt
spring.security.oauth2.authorizationserver.client.my-client-2.registration.authorization-grant-types[0]=client_credentials
spring.security.oauth2.authorizationserver.client.my-client-2.registration.scopes[0]=user.read
spring.security.oauth2.authorizationserver.client.my-client-2.registration.scopes[1]=user.write
spring.security.oauth2.authorizationserver.client.my-client-2.jwk-set-uri=https://my-client-2.com/jwks
spring.security.oauth2.authorizationserver.client.my-client-2.token-endpoint-authentication-signing-algorithm=RS256
```

#### YAML

```yaml
spring:
  security:
    oauth2:
      authorizationserver:
        client:
          my-client-1:
            registration:
              client-id: "abcd"
              client-secret: "{noop}secret1"
              client-authentication-methods:
                - "client_secret_basic"
              authorization-grant-types:
                - "authorization_code"
                - "refresh_token"
              redirect-uris:
                - "https://my-client-1.com/login/oauth2/code/abcd"
                - "https://my-client-1.com/authorized"
              scopes:
                - "openid"
                - "profile"
                - "email"
                - "phone"
                - "address"
            require-authorization-consent: true
            token:
              authorization-code-time-to-live: 5m
              access-token-time-to-live: 10m
              access-token-format: "reference"
              reuse-refresh-tokens: false
              refresh-token-time-to-live: 30m
          my-client-2:
            registration:
              client-id: "efgh"
              client-secret: "{noop}secret2"
              client-authentication-methods:
                - "client_secret_jwt"
              authorization-grant-types:
                - "client_credentials"
              scopes:
                - "user.read"
                - "user.write"
            jwk-set-uri: "https://my-client-2.com/jwks"
            token-endpoint-authentication-signing-algorithm: "RS256"
```

> [!NOTE]
> The `client-secret` property must be in a format that can be matched by the configured [`PasswordEncoder`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/crypto/password/PasswordEncoder.html).
> The default instance of [`PasswordEncoder`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/crypto/password/PasswordEncoder.html) is created via `PasswordEncoderFactories.createDelegatingPasswordEncoder()`.

The auto-configuration Spring Boot provides for Spring Authorization Server is designed for getting started quickly.
Most applications will require customization and will want to define several beans to override auto-configuration.

The following components can be defined as beans to override auto-configuration specific to Spring Authorization Server:

- [`RegisteredClientRepository`](https://docs.spring.io/spring-authorization-server/docs/1.3.x/api/org/springframework/security/oauth2/server/authorization/client/RegisteredClientRepository.html)
- [`AuthorizationServerSettings`](https://docs.spring.io/spring-authorization-server/docs/1.3.x/api/org/springframework/security/oauth2/server/authorization/settings/AuthorizationServerSettings.html)
- [`SecurityFilterChain`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/SecurityFilterChain.html)
- `com.nimbusds.jose.jwk.source.JWKSource<com.nimbusds.jose.proc.SecurityContext>`
- [`JwtDecoder`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/oauth2/jwt/JwtDecoder.html)

> [!TIP]
> Spring Boot auto-configures an [`InMemoryRegisteredClientRepository`](https://docs.spring.io/spring-authorization-server/docs/1.3.x/api/org/springframework/security/oauth2/server/authorization/client/InMemoryRegisteredClientRepository.html) which is used by Spring Authorization Server for the management of registered clients.
> The [`InMemoryRegisteredClientRepository`](https://docs.spring.io/spring-authorization-server/docs/1.3.x/api/org/springframework/security/oauth2/server/authorization/client/InMemoryRegisteredClientRepository.html) has limited capabilities and we recommend using it only for development environments.
> For production environments, consider using a [`JdbcRegisteredClientRepository`](https://docs.spring.io/spring-authorization-server/docs/1.3.x/api/org/springframework/security/oauth2/server/authorization/client/JdbcRegisteredClientRepository.html) or creating your own implementation of [`RegisteredClientRepository`](https://docs.spring.io/spring-authorization-server/docs/1.3.x/api/org/springframework/security/oauth2/server/authorization/client/RegisteredClientRepository.html).

Additional information can be found in the [Getting Started](https://docs.spring.io/spring-authorization-server/reference/1.3/getting-started.html) chapter of the [Spring Authorization Server Reference Guide](https://docs.spring.io/spring-authorization-server/reference/1.3).

<a id="web.security.saml2"></a>

## SAML 2.0

<a id="web.security.saml2.relying-party"></a>

### Relying Party

If you have `spring-security-saml2-service-provider` on your classpath, you can take advantage of some auto-configuration to set up a SAML 2.0 Relying Party.
This configuration makes use of the properties under [`Saml2RelyingPartyProperties`](https://docs.spring.io/spring-boot/3.3.11/api/java/org/springframework/boot/autoconfigure/security/saml2/Saml2RelyingPartyProperties.html).

A relying party registration represents a paired configuration between an Identity Provider, IDP, and a Service Provider, SP.
You can register multiple relying parties under the `spring.security.saml2.relyingparty` prefix, as shown in the following example:

#### Properties

```properties
spring.security.saml2.relyingparty.registration.my-relying-party1.signing.credentials[0].private-key-location=path-to-private-key
spring.security.saml2.relyingparty.registration.my-relying-party1.signing.credentials[0].certificate-location=path-to-certificate
spring.security.saml2.relyingparty.registration.my-relying-party1.decryption.credentials[0].private-key-location=path-to-private-key
spring.security.saml2.relyingparty.registration.my-relying-party1.decryption.credentials[0].certificate-location=path-to-certificate
spring.security.saml2.relyingparty.registration.my-relying-party1.singlelogout.url=https://myapp/logout/saml2/slo
spring.security.saml2.relyingparty.registration.my-relying-party1.singlelogout.response-url=https://remoteidp2.slo.url
spring.security.saml2.relyingparty.registration.my-relying-party1.singlelogout.binding=POST
spring.security.saml2.relyingparty.registration.my-relying-party1.assertingparty.verification.credentials[0].certificate-location=path-to-verification-cert
spring.security.saml2.relyingparty.registration.my-relying-party1.assertingparty.entity-id=remote-idp-entity-id1
spring.security.saml2.relyingparty.registration.my-relying-party1.assertingparty.sso-url=https://remoteidp1.sso.url
spring.security.saml2.relyingparty.registration.my-relying-party2.signing.credentials[0].private-key-location=path-to-private-key
spring.security.saml2.relyingparty.registration.my-relying-party2.signing.credentials[0].certificate-location=path-to-certificate
spring.security.saml2.relyingparty.registration.my-relying-party2.decryption.credentials[0].private-key-location=path-to-private-key
spring.security.saml2.relyingparty.registration.my-relying-party2.decryption.credentials[0].certificate-location=path-to-certificate
spring.security.saml2.relyingparty.registration.my-relying-party2.assertingparty.verification.credentials[0].certificate-location=path-to-other-verification-cert
spring.security.saml2.relyingparty.registration.my-relying-party2.assertingparty.entity-id=remote-idp-entity-id2
spring.security.saml2.relyingparty.registration.my-relying-party2.assertingparty.sso-url=https://remoteidp2.sso.url
spring.security.saml2.relyingparty.registration.my-relying-party2.assertingparty.singlelogout.url=https://remoteidp2.slo.url
spring.security.saml2.relyingparty.registration.my-relying-party2.assertingparty.singlelogout.response-url=https://myapp/logout/saml2/slo
spring.security.saml2.relyingparty.registration.my-relying-party2.assertingparty.singlelogout.binding=POST
```

#### YAML

```yaml
spring:
  security:
    saml2:
      relyingparty:
        registration:
          my-relying-party1:
            signing:
              credentials:
              - private-key-location: "path-to-private-key"
                certificate-location: "path-to-certificate"
            decryption:
              credentials:
              - private-key-location: "path-to-private-key"
                certificate-location: "path-to-certificate"
            singlelogout:
               url: "https://myapp/logout/saml2/slo"
               response-url: "https://remoteidp2.slo.url"
               binding: "POST"
            assertingparty:
              verification:
                credentials:
                - certificate-location: "path-to-verification-cert"
              entity-id: "remote-idp-entity-id1"
              sso-url: "https://remoteidp1.sso.url"

          my-relying-party2:
            signing:
              credentials:
              - private-key-location: "path-to-private-key"
                certificate-location: "path-to-certificate"
            decryption:
              credentials:
              - private-key-location: "path-to-private-key"
                certificate-location: "path-to-certificate"
            assertingparty:
              verification:
                credentials:
                - certificate-location: "path-to-other-verification-cert"
              entity-id: "remote-idp-entity-id2"
              sso-url: "https://remoteidp2.sso.url"
              singlelogout:
                url: "https://remoteidp2.slo.url"
                response-url: "https://myapp/logout/saml2/slo"
                binding: "POST"
```

For SAML2 logout, by default, Spring Security’s [`Saml2LogoutRequestFilter`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/saml2/provider/service/web/authentication/logout/Saml2LogoutRequestFilter.html) and [`Saml2LogoutResponseFilter`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/saml2/provider/service/web/authentication/logout/Saml2LogoutResponseFilter.html) only process URLs matching `/logout/saml2/slo`.
If you want to customize the `url` to which AP-initiated logout requests get sent to or the `response-url` to which an AP sends logout responses to, to use a different pattern, you need to provide configuration to process that custom pattern.
For example, for servlet applications, you can add your own [`SecurityFilterChain`](https://docs.spring.io/spring-security/site/docs/6.3.x/api/org/springframework/security/web/SecurityFilterChain.html) that resembles the following:

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration(proxyBeanMethods = false)
public class MySamlRelyingPartyConfiguration {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http.authorizeHttpRequests((requests) -> requests.anyRequest().authenticated());
		http.saml2Login(withDefaults());
		http.saml2Logout((saml2) -> saml2.logoutRequest((request) -> request.logoutUrl("/SLOService.saml2"))
			.logoutResponse((response) -> response.logoutUrl("/SLOService.saml2")));
		return http.build();
	}

}
```
