---
title: "Kotlin Configuration"
source: "ROOT:servlet/configuration/kotlin.adoc"
---

<a id="kotlin-config"></a>

# Kotlin Configuration

Spring Security Kotlin configuration has been available since Spring Security 5.3.
It lets users configure Spring Security by using a native Kotlin DSL.

> [!NOTE]
> Spring Security provides [a sample application](https://github.com/spring-projects/spring-security-samples/tree/main/servlet/spring-boot/kotlin/hello-security) to demonstrate the use of Spring Security Kotlin Configuration.

<a id="kotlin-config-httpsecurity"></a>

## HttpSecurity

How does Spring Security know that we want to require all users to be authenticated?
How does Spring Security know we want to support form-based authentication?
There is a configuration class (called `SecurityFilterChain`) that is being invoked behind the scenes.
It is configured with the following default implementation:

```kotlin
import org.springframework.security.config.annotation.web.invoke

@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        authorizeHttpRequests {
            authorize(anyRequest, authenticated)
        }
        formLogin { }
        httpBasic { }
    }
    return http.build()
}
```

> [!NOTE]
> Make sure to import the `invoke` function in your class, as the IDE will not always auto-import the method, causing compilation issues.

The default configuration (shown in the preceding listing):

- Ensures that any request to our application requires the user to be authenticated
- Lets users authenticate with form-based login
- Lets users authenticate with HTTP Basic authentication

Note that this configuration parallels the XML namespace configuration:

```xml
<http>
	<intercept-url pattern="/**" access="authenticated"/>
	<form-login />
	<http-basic />
</http>
```

<a id="_multiple_httpsecurity_instances"></a>

## Multiple HttpSecurity Instances

We can configure multiple `HttpSecurity` instances, just as we can have multiple `<http>` blocks.
The key is to register multiple `SecurityFilterChain` `@Bean`s.
The following example has a different configuration for URLs that start with `/api/`:

```kotlin
import org.springframework.security.config.annotation.web.invoke

@Configuration
@EnableWebSecurity
class MultiHttpSecurityConfig {
    @Bean                                                            <1>
    public fun userDetailsService(): UserDetailsService {
        val users: User.UserBuilder = User.withDefaultPasswordEncoder()
        val manager = InMemoryUserDetailsManager()
        manager.createUser(users.username("user").password("password").roles("USER").build())
        manager.createUser(users.username("admin").password("password").roles("USER","ADMIN").build())
        return manager
    }

    @Order(1)                                                        <2>
    @Bean
    open fun apiFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            securityMatcher("/api/**")                               <3>
            authorizeHttpRequests {
                authorize(anyRequest, hasRole("ADMIN"))
            }
            httpBasic { }
        }
        return http.build()
    }

    @Bean                                                            <4>
    open fun formLoginFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeHttpRequests {
                authorize(anyRequest, authenticated)
            }
            formLogin { }
        }
        return http.build()
    }
}
```

1. Configure Authentication as usual.
1. Create an instance of `SecurityFilterChain` that contains `@Order` to specify which `SecurityFilterChain` should be considered first.
1. The `http.securityMatcher` states that this `HttpSecurity` is applicable only to URLs that start with `/api/`
1. Create another instance of `SecurityFilterChain`.
If the URL does not start with `/api/`, this configuration is used.
This configuration is considered after `apiFilterChain`, since it has an `@Order` value after `1` (no `@Order` defaults to last).
