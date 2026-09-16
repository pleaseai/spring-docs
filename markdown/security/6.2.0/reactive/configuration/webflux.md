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
			.authorizeExchange(exchanges -> exchanges
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
> Make sure that you import the `invoke` function in your Kotlin class, sometimes the IDE will not auto-import it causing compilation issues.

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
            .authorizeExchange((exchanges) -> exchanges
                .anyExchange().authenticated()
            )
            .oauth2ResourceServer(OAuth2ResourceServerSpec::jwt);                           <3>
        return http.build();
    }

    @Bean
    SecurityWebFilterChain webHttpSecurity(ServerHttpSecurity http) {                       <4>
        http
            .authorizeExchange((exchanges) -> exchanges
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
