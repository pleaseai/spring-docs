---
title: "WebFlux Security"
source: "ROOT:reactive/configuration/webflux.adoc"
---

<a id="jc-webflux"></a>

# WebFlux Security

Spring Security’s WebFlux support relies on a `WebFilter` and works the same for Spring WebFlux and Spring WebFlux.Fn.
A few sample applications demonstrate the code:

- Hello WebFlux [hellowebflux](https://github.com/spring-projects/spring-security-samples/tree/main/reactive/webflux/java/hello-security)
- Hello WebFlux.Fn [hellowebfluxfn](https://github.com/spring-projects/spring-security-samples/tree/main/reactive/webflux-fn/hello-security)
- Hello WebFlux Method [hellowebflux-method](https://github.com/spring-projects/spring-security-samples/tree/main/reactive/webflux/java/method)

<a id="_minimal_webflux_security_configuration"></a>

## Minimal WebFlux Security Configuration

The following listing shows a minimal WebFlux Security configuration:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class HelloWebfluxSecurityConfig {

	@Bean
	public MapReactiveUserDetailsService userDetailsService() {
		UserDetails user = User.withDefaultPasswordEncoder()
			.username("user")
			.password("user")
			.roles("USER")
			.build();
		return new MapReactiveUserDetailsService(user);
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebFluxSecurity
class HelloWebfluxSecurityConfig {

    @Bean
    fun userDetailsService(): ReactiveUserDetailsService {
        val userDetails = User.withDefaultPasswordEncoder()
                .username("user")
                .password("user")
                .roles("USER")
                .build()
        return MapReactiveUserDetailsService(userDetails)
    }
}
```

This configuration provides form and HTTP basic authentication, sets up authorization to require an authenticated user for accessing any page, sets up a default login page and a default logout page, sets up security related HTTP headers, adds CSRF protection, and more.

<a id="_explicit_webflux_security_configuration"></a>

## Explicit WebFlux Security Configuration

The following page shows an explicit version of the minimal WebFlux Security configuration:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
public class HelloWebfluxSecurityConfig {

	@Bean
	public MapReactiveUserDetailsService userDetailsService() {
		UserDetails user = User.withDefaultPasswordEncoder()
			.username("user")
			.password("user")
			.roles("USER")
			.build();
		return new MapReactiveUserDetailsService(user);
	}

	@Bean
	public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
		http
			.authorizeExchange((authorize) -> authorize
			    .anyExchange().authenticated()
			)
			.httpBasic(withDefaults())
			.formLogin(withDefaults());
		return http.build();
	}
}
```

#### Kotlin

```kotlin
import org.springframework.security.config.web.server.invoke

@Configuration
@EnableWebFluxSecurity
class HelloWebfluxSecurityConfig {

    @Bean
    fun userDetailsService(): ReactiveUserDetailsService {
        val userDetails = User.withDefaultPasswordEncoder()
                .username("user")
                .password("user")
                .roles("USER")
                .build()
        return MapReactiveUserDetailsService(userDetails)
    }

    @Bean
    fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
        return http {
            authorizeExchange {
                authorize(anyExchange, authenticated)
            }
            formLogin { }
            httpBasic { }
        }
    }
}
```

> [!NOTE]
> Make sure to import the `org.springframework.security.config.web.server.invoke` function to enable the Kotlin DSL in your class, as the IDE will not always auto-import the method, causing compilation issues.

This configuration explicitly sets up all the same things as our minimal configuration.
From here, you can more easily make changes to the defaults.

You can find more examples of explicit configuration in unit tests, by searching for [`EnableWebFluxSecurity` in the `config/src/test/` directory](https://github.com/spring-projects/spring-security/search?q=path%3Aconfig%2Fsrc%2Ftest%2F+EnableWebFluxSecurity).

<a id="jc-webflux-multiple-filter-chains"></a>

### Multiple Chains Support

You can configure multiple `SecurityWebFilterChain` instances to separate configuration by `RequestMatcher` instances.

For example, you can isolate configuration for URLs that start with `/api`:

#### Java

```java
@Configuration
@EnableWebFluxSecurity
static class MultiSecurityHttpConfig {

    @Order(Ordered.HIGHEST_PRECEDENCE)                                                      <1>
    @Bean
    SecurityWebFilterChain apiHttpSecurity(ServerHttpSecurity http) {
        http
            .securityMatcher(new PathPatternParserServerWebExchangeMatcher("/api/**"))      <2>
            .authorizeExchange((authorize) -> authorize
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(OAuth2ResourceServerSpec::jwt);                           <3>
        return http.build();
    }

    @Bean
    SecurityWebFilterChain webHttpSecurity(ServerHttpSecurity http) {                       <4>
        http
            .authorizeExchange((authorize) -> authorize
                .anyExchange().authenticated()
            )
            .httpBasic(withDefaults());                                                     <5>
        return http.build();
    }

    @Bean
    ReactiveUserDetailsService userDetailsService() {
        return new MapReactiveUserDetailsService(
                PasswordEncodedUser.user(), PasswordEncodedUser.admin());
    }

}
```

#### Kotlin

```kotlin
import org.springframework.security.config.web.server.invoke

@Configuration
@EnableWebFluxSecurity
open class MultiSecurityHttpConfig {
    @Order(Ordered.HIGHEST_PRECEDENCE)                                                      <1>
    @Bean
    open fun apiHttpSecurity(http: ServerHttpSecurity): SecurityWebFilterChain {
        return http {
            securityMatcher(PathPatternParserServerWebExchangeMatcher("/api/**"))           <2>
            authorizeExchange {
                authorize(anyExchange, authenticated)
            }
            oauth2ResourceServer {
                jwt { }                                                                     <3>
            }
        }
    }

    @Bean
    open fun webHttpSecurity(http: ServerHttpSecurity): SecurityWebFilterChain {            <4>
        return http {
            authorizeExchange {
                authorize(anyExchange, authenticated)
            }
            httpBasic { }                                                                   <5>
        }
    }

    @Bean
    open fun userDetailsService(): ReactiveUserDetailsService {
        return MapReactiveUserDetailsService(
            PasswordEncodedUser.user(), PasswordEncodedUser.admin()
        )
    }
}
```

1. Configure a `SecurityWebFilterChain` with an `@Order` to specify which `SecurityWebFilterChain` Spring Security should consider first
1. Use `PathPatternParserServerWebExchangeMatcher` to state that this `SecurityWebFilterChain` will only apply to URL paths that start with `/api/`
1. Specify the authentication mechanisms that will be used for `/api/**` endpoints
1. Create another instance of `SecurityWebFilterChain` with lower precedence to match all other URLs
1. Specify the authentication mechanisms that will be used for the rest of the application

Spring Security selects one `SecurityWebFilterChain` `@Bean` for each request.
It matches the requests in order by the `securityMatcher` definition.

In this case, that means that, if the URL path starts with `/api`, Spring Security uses `apiHttpSecurity`.
If the URL does not start with `/api`, Spring Security defaults to `webHttpSecurity`, which has an implied `securityMatcher` that matches any request.

<a id="modular-serverhttpsecurity-configuration"></a>

## Modular ServerHttpSecurity Configuration

Many users prefer that their Spring Security configuration lives in a centralized place and will choose to configure it within the `SecurityWebFilterChain` Bean declaration.
However, there are times that users may want to modularize the configuration.
This can be done using:

- [Customizer<ServerHttpSecurity> Beans](#serverhttpsecurity-customizer-bean)
- [Top Level ServerHttpSecurity Customizer Beans](#top-level-customizer-bean)

<a id="serverhttpsecurity-customizer-bean"></a>

### Customizer<ServerHttpSecurity> Beans

If you would like to modularize your security configuration you can place logic in a `Customizer<ServerHttpSecurity>` Bean.
For example, the following configuration will ensure all `ServerHttpSecurity` instances are configured to:

#### Java

```java
@Bean
Customizer<ServerHttpSecurity> httpSecurityCustomizer() {
	return (http) -> http
		.headers((headers) -> headers
			.contentSecurityPolicy((csp) -> csp
				// <1>
				.policyDirectives("object-src 'none'")
			)
		)
		// <2>
		.redirectToHttps(Customizer.withDefaults());
}
```

#### Kotlin

```kotlin
@Bean
fun httpSecurityCustomizer(): Customizer<ServerHttpSecurity> {
    return Customizer { http -> http
        .headers { headers -> headers
            .contentSecurityPolicy { csp -> csp
                // <1>
                .policyDirectives("object-src 'none'")
            }
        }
        // <2>
        .redirectToHttps(Customizer.withDefaults())
    }
}
```

1. Set the [Content Security Policy](../../servlet/exploits/headers.md#servlet-headers-csp) to `object-src 'none'`
1. [Redirect any request to https](../../servlet/exploits/http.md#servlet-http-redirect)

<a id="top-level-customizer-bean"></a>

### Top Level ServerHttpSecurity Customizer Beans

If you prefer to have further modularization of your security configuration, Spring Security will automatically apply any top level `HttpSecurity` `Customizer` Beans.

A top level `HttpSecurity` `Customizer` type can be summarized as any `Customizer<T>` that matches `public HttpSecurity.*(Customizer<T>)`.
This translates to any `Customizer<T>` that is a single argument to a public method on [`HttpSecurity`](https://docs.spring.io/spring-security/site/docs/7.0.3/api/org/springframework/security/config/annotation/web/builders/HttpSecurity.html).

A few examples can help to clarify.
If `Customizer<ContentTypeOptionsConfig>` is published as a Bean, it will not be be automatically applied because it is an argument to [`HeadersConfigurer.contentTypeOptions(Customizer)`](<https://docs.spring.io/spring-security/site/docs/7.0.3/api/org/springframework/security/config/annotation/web/configurers/HeadersConfigurer.html#contentTypeOptions(org.springframework.security.config.Customizer)>) which is not a method defined on `HttpSecurity`.
However, if `Customizer<HeadersConfigurer<HttpSecurity>>` is published as a Bean, it will be automatically applied because it is an argument to [`HttpSecurity.headers(Customizer)`](<https://docs.spring.io/spring-security/site/docs/7.0.3/api/org/springframework/security/config/annotation/web/builders/HttpSecurity.html#headers(org.springframework.security.config.Customizer)>).

For example, the following configuration will ensure that the [Content Security Policy](../../servlet/exploits/headers.md#servlet-headers-csp) is set to `object-src 'none'`:

#### Java

```java
@Bean
Customizer<ServerHttpSecurity.HeaderSpec> headersSecurity() {
	return (headers) -> headers
		.contentSecurityPolicy((csp) -> csp
			// <1>
			.policyDirectives("object-src 'none'")
		);
}
```

#### Kotlin

```kotlin
@Bean
fun headersSecurity(): Customizer<ServerHttpSecurity.HeaderSpec> {
    return Customizer { headers -> headers
        .contentSecurityPolicy { csp -> csp
            // <1>
            .policyDirectives("object-src 'none'")
        }
    }
}
```

<a id="customizer-bean-ordering"></a>

### Customizer Bean Ordering

First each [Customizer<HttpSecurity> Bean](#httpsecurity-customizer-bean) is applied using [ObjectProvider#orderedStream()](<https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/ObjectProvider.html#orderedStream()>).
This means that if there are multiple `Customizer<HttpSecurity>` Beans, the [@Order](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/core/annotation/Order.html) annotation can be added to the Bean definitions to control the ordering.

Next every [Top Level HttpSecurity Customizer Beans](#top-level-customizer-bean) type is looked up and each is is applied using `ObjectProvider#orderedStream()`.
If there is are two `Customizer<HeadersConfigurer<HttpSecurity>>` beans and two `Customizer<HttpsRedirectConfigurer<HttpSecurity>>` instances, the order that each `Customizer` type is invoked is undefined.
However, the order that each instance of `Customizer<HttpsRedirectConfigurer<HttpSecurity>>` is defined by `ObjectProvider#orderedStream()` and can be controlled using `@Order` on the Bean the definitions.

Finally, the `HttpSecurity` Bean is injected as a Bean.
All `Customizer` instances are applied before the `HttpSecurity` Bean is created.
This allows overriding the customizations provided by the `Customizer` Beans.

You can find an example below that illustrates the ordering:

#### Java

```java
@Bean // <4>
SecurityWebFilterChain springSecurity(ServerHttpSecurity http) {
	http
		.authorizeExchange((exchange) -> exchange
			.anyExchange().authenticated()
		);
	return http.build();
}

@Bean
@Order(Ordered.LOWEST_PRECEDENCE) // <2>
Customizer<ServerHttpSecurity> userAuthorization() {
	return (http) -> http
		.authorizeExchange((exchange) -> exchange
			.pathMatchers("/users/**").hasRole("USER")
		);
}

@Bean
@Order(Ordered.HIGHEST_PRECEDENCE) // <1>
Customizer<ServerHttpSecurity> adminAuthorization() {
	return (http) -> http
		.authorizeExchange((exchange) -> exchange
			.pathMatchers("/admins/**").hasRole("ADMIN")
		);
}

// <3>

@Bean
Customizer<ServerHttpSecurity.HeaderSpec> contentSecurityPolicy() {
	return (headers) -> headers
		.contentSecurityPolicy((csp) -> csp
			.policyDirectives("object-src 'none'")
		);
}

@Bean
Customizer<ServerHttpSecurity.HeaderSpec> contentTypeOptions() {
	return (headers) -> headers
		.contentTypeOptions(Customizer.withDefaults());
}

@Bean
Customizer<ServerHttpSecurity.HttpsRedirectSpec> httpsRedirect() {
	return Customizer.withDefaults();
}
```

#### Kotlin

```kotlin
@Bean // <4>
fun springSecurity(http: ServerHttpSecurity): SecurityWebFilterChain {
    http
        .authorizeExchange({ exchanges -> exchanges
            .anyExchange().authenticated()
        })
    return http.build()
}

@Bean
@Order(Ordered.LOWEST_PRECEDENCE)  // <2>
fun userAuthorization(): Customizer<ServerHttpSecurity> {
    return Customizer { http -> http
        .authorizeExchange { exchanges -> exchanges
            .pathMatchers("/users/**").hasRole("USER")
        }
    }
}

@Bean
@Order(Ordered.HIGHEST_PRECEDENCE) // <1>
fun adminAuthorization(): Customizer<ServerHttpSecurity> {
    return ThrowingCustomizer { http -> http
        .authorizeExchange { exchanges -> exchanges
            .pathMatchers("/admins/**").hasRole("ADMIN")
        }
    }
}

// <3>

@Bean
fun contentSecurityPolicy(): Customizer<ServerHttpSecurity.HeaderSpec> {
    return Customizer { headers -> headers
        .contentSecurityPolicy { csp -> csp
            .policyDirectives("object-src 'none'")
        }
    }
}

@Bean
fun contentTypeOptions(): Customizer<ServerHttpSecurity.HeaderSpec> {
    return Customizer { headers -> headers
        .contentTypeOptions(Customizer.withDefaults())
    }
}

@Bean
fun httpsRedirect(): Customizer<ServerHttpSecurity.HttpsRedirectSpec> {
    return Customizer.withDefaults()
}
```

1. First all `Customizer<HttpSecurity>` instances are applied.
The `adminAuthorization` Bean has the highest `@Order` so it is applied first.
If there are no `@Order` annotations on the `Customizer<HttpSecurity>` Beans or the `@Order` annotations had the same value, then the order that the `Customizer<HttpSecurity>` instances are applied is undefined.
1. The `userAuthorization` is applied next due to being an instance of `Customizer<HttpSecurity>`
1. The order that the `Customizer` types are undefined.
In this example, the order of `contentSecurityPolicy`, `contentTypeOptions`, and `httpsRedirect` are undefined.
If `@Order(Ordered.HIGHEST_PRECEDENCE)` was added to `contentTypeOptions`, then we would know that `contentTypeOptions` is before `contentSecurityPolicy` (they are the same type), but we do not know if `httpsRedirect` is before or after the `Customizer<HeadersConfigurer<HttpSecurity>>` Beans.
1. After all of the `Customizer` Beans are applied, the `HttpSecurity` is passed in as a Bean.
