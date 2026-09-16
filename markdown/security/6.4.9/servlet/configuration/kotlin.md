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
> Make sure to import the `org.springframework.security.config.annotation.web.invoke` function to enable the Kotlin DSL in your class, as the IDE will not always auto-import the method, causing compilation issues.

The default configuration (shown in the preceding example):

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

### Multiple HttpSecurity Instances

To effectively manage security in an application where certain areas need different protection, we can employ multiple filter chains alongside the `securityMatcher` DSL method.
This approach allows us to define distinct security configurations tailored to specific parts of the application, enhancing overall application security and control.

We can configure multiple `HttpSecurity` instances just as we can have multiple `<http>` blocks in XML.
The key is to register multiple `SecurityFilterChain` `@Bean`s.
The following example has a different configuration for URLs that begin with `/api/`:

<a id="multiple-httpsecurity-instances-kotlin"></a>

```kotlin
import org.springframework.security.config.annotation.web.invoke

@Configuration
@EnableWebSecurity
class MultiHttpSecurityConfig {
    @Bean                                                            <1>
    open fun userDetailsService(): UserDetailsService {
        val users = User.withDefaultPasswordEncoder()
        val manager = InMemoryUserDetailsManager()
        manager.createUser(users.username("user").password("password").roles("USER").build())
        manager.createUser(users.username("admin").password("password").roles("USER","ADMIN").build())
        return manager
    }

    @Bean
    @Order(1)                                                        <2>
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
1. The `http.securityMatcher()` states that this `HttpSecurity` is applicable only to URLs that begin with `/api/`.
1. Create another instance of `SecurityFilterChain`.
If the URL does not begin with `/api/`, this configuration is used.
This configuration is considered after `apiFilterChain`, since it has an `@Order` value after `1` (no `@Order` defaults to last).

<a id="_choosing_securitymatcher_or_requestmatchers"></a>

### Choosing `securityMatcher` or `requestMatchers`

A common question is:

> What is the difference between the `http.securityMatcher()` method and `requestMatchers()` used for request authorization (i.e. inside of `http.authorizeHttpRequests()`)?

To answer this question, it helps to understand that each `HttpSecurity` instance used to build a `SecurityFilterChain` contains a `RequestMatcher` to match incoming requests.
If a request does not match a `SecurityFilterChain` with higher priority (e.g. `@Order(1)`), the request can be tried against a filter chain with lower priority (e.g. no `@Order`).

> [!NOTE]
> The matching logic for multiple filter chains is performed by the [`FilterChainProxy`](../architecture.md#servlet-filterchainproxy).

The default `RequestMatcher` matches **any request** to ensure Spring Security protects **all requests by default**.

> [!NOTE]
> Specifying a `securityMatcher` overrides this default.

> [!WARNING]
> If no filter chain matches a particular request, the request is **not protected** by Spring Security.

The following example demonstrates a single filter chain that only protects requests that begin with `/secured/`:

<a id="choosing-security-matcher-request-matchers-kotlin"></a>

```kotlin
import org.springframework.security.config.annotation.web.invoke

@Configuration
@EnableWebSecurity
class PartialSecurityConfig {
	@Bean
	open fun userDetailsService(): UserDetailsService {
		// ...
	}

	@Bean
	open fun securedFilterChain(http: HttpSecurity): SecurityFilterChain {
		http {
			securityMatcher("/secured/**")                             <1>
			authorizeHttpRequests {
				authorize("/secured/user", hasRole("USER"))            <2>
				authorize("/secured/admin", hasRole("ADMIN"))          <3>
				authorize(anyRequest, authenticated)                   <4>
			}
			httpBasic { }
			formLogin { }
		}
		return http.build()
	}
}
```

1. Requests that begin with `/secured/` will be protected but any other requests are not protected.
1. Requests to `/secured/user` require the `ROLE_USER` authority.
1. Requests to `/secured/admin` require the `ROLE_ADMIN` authority.
1. Any other requests (such as `/secured/other`) simply require an authenticated user.

> [!TIP]
> It is *recommended* to provide a `SecurityFilterChain` that does not specify any `securityMatcher` to ensure the entire application is protected, as demonstrated in the [earlier example](#multiple-httpsecurity-instances-kotlin).

Notice that the `requestMatchers` method only applies to individual authorization rules.
Each request listed there must also match the overall `securityMatcher` for this particular `HttpSecurity` instance used to create the `SecurityFilterChain`.
Using `anyRequest()` in this example matches all other requests within this particular `SecurityFilterChain` (which must begin with `/secured/`).

> [!NOTE]
> See [Authorize HttpServletRequests](../authorization/authorize-http-requests.md) for more information on `requestMatchers`.

<a id="_securityfilterchain_endpoints"></a>

### `SecurityFilterChain` Endpoints

Several filters in the `SecurityFilterChain` directly provide endpoints, such as the `UsernamePasswordAuthenticationFilter` which is set up by `http.formLogin()` and provides the `POST /login` endpoint.
In the [above example](#choosing-security-matcher-request-matchers-kotlin), the `/login` endpoint is not matched by `http.securityMatcher("/secured/**")` and therefore that application would not have any `GET /login` or `POST /login` endpoint.
Such requests would return `404 Not Found`.
This is often surprising to users.

Specifying `http.securityMatcher()` affects what requests are matched by that `SecurityFilterChain`.
However, it does not automatically affect endpoints provided by the filter chain.
In such cases, you may need to customize the URL of any endpoints you would like the filter chain to provide.

The following example demonstrates a configuration that secures requests that begin with `/secured/` and denies all other requests, while also customizing endpoints provided by the `SecurityFilterChain`:

<a id="security-filter-chain-endpoints-kotlin"></a>

```kotlin
import org.springframework.security.config.annotation.web.invoke

@Configuration
@EnableWebSecurity
class SecuredSecurityConfig {
	@Bean
	open fun userDetailsService(): UserDetailsService {
		// ...
	}

	@Bean
	@Order(1)
	open fun securedFilterChain(http: HttpSecurity): SecurityFilterChain {
		http {
			securityMatcher("/secured/**")                             <1>
			authorizeHttpRequests {
				authorize(anyRequest, authenticated)                   <2>
			}
			formLogin {                                                <3>
                loginPage = "/secured/login"
                loginProcessingUrl = "/secured/login"
                permitAll = true
			}
			logout {                                                   <4>
                logoutUrl = "/secured/logout"
                logoutSuccessUrl = "/secured/login?logout"
                permitAll = true
			}
		}
		return http.build()
	}

	@Bean
    open fun defaultFilterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeHttpRequests {
                authorize(anyRequest, denyAll)                         <5>
            }
        }
        return http.build()
    }
}
```

1. Requests that begin with `/secured/` will be protected by this filter chain.
1. Requests that begin with `/secured/` require an authenticated user.
1. Customize form login to prefix URLs with `/secured/`.
1. Customize logout to prefix URLs with `/secured/`.
1. All other requests will be denied.

> [!NOTE]
> This example customizes the login and logout pages, which disables Spring Security’s generated pages.
> You must [provide your own](../authentication/passwords/form.md#servlet-authentication-form-custom) custom endpoints for `GET /secured/login` and `GET /secured/logout`.
> Note that Spring Security still provides `POST /secured/login` and `POST /secured/logout` endpoints for you.

<a id="_real_world_example"></a>

### Real World Example

The following example demonstrates a slightly more real-world configuration putting all of these elements together:

<a id="real-world-example-kotlin"></a>

```kotlin
import org.springframework.security.config.annotation.web.invoke

@Configuration
@EnableWebSecurity
class BankingSecurityConfig {
    @Bean                                                              <1>
    open fun userDetailsService(): UserDetailsService {
        val users = User.withDefaultPasswordEncoder()
        val manager = InMemoryUserDetailsManager()
        manager.createUser(users.username("user1").password("password").roles("USER", "VIEW_BALANCE").build())
        manager.createUser(users.username("user2").password("password").roles("USER").build())
        manager.createUser(users.username("admin").password("password").roles("ADMIN").build())
        return manager
    }

    @Bean
    @Order(1)                                                          <2>
    open fun approvalsSecurityFilterChain(http: HttpSecurity): SecurityFilterChain {
        val approvalsPaths = arrayOf("/accounts/approvals/**", "/loans/approvals/**", "/credit-cards/approvals/**")
        http {
            securityMatcher(approvalsPaths)
            authorizeHttpRequests {
				authorize(anyRequest, hasRole("ADMIN"))
            }
            httpBasic { }
        }
        return http.build()
    }

    @Bean
    @Order(2)                                                          <3>
	open fun bankingSecurityFilterChain(http: HttpSecurity): SecurityFilterChain {
        val bankingPaths = arrayOf("/accounts/**", "/loans/**", "/credit-cards/**", "/balances/**")
		val viewBalancePaths = arrayOf("/balances/**")
        http {
            securityMatcher(bankingPaths)
            authorizeHttpRequests {
                authorize(viewBalancePaths, hasRole("VIEW_BALANCE"))
				authorize(anyRequest, hasRole("USER"))
            }
        }
        return http.build()
    }

    @Bean                                                              <4>
	open fun defaultSecurityFilterChain(http: HttpSecurity): SecurityFilterChain {
        val allowedPaths = arrayOf("/", "/user-login", "/user-logout", "/notices", "/contact", "/register")
        http {
            authorizeHttpRequests {
                authorize(allowedPaths, permitAll)
				authorize(anyRequest, authenticated)
            }
			formLogin {
                loginPage = "/user-login"
                loginProcessingUrl = "/user-login"
			}
			logout {
                logoutUrl = "/user-logout"
                logoutSuccessUrl = "/?logout"
			}
        }
        return http.build()
    }
}
```

1. Begin by configuring authentication settings.
1. Define a `SecurityFilterChain` instance with `@Order(1)`, which means that this filter chain will have the highest priority.
   This filter chain applies only to requests that begin with `/accounts/approvals/`, `/loans/approvals/` or `/credit-cards/approvals/`.
Requests to this filter chain require the `ROLE_ADMIN` authority and allow HTTP Basic Authentication.
1. Next, create another `SecurityFilterChain` instance with `@Order(2)` which will be considered second.
   This filter chain applies only to requests that begin with `/accounts/`, `/loans/`, `/credit-cards/`, or `/balances/`.
Notice that because this filter chain is second, any requests that include `/approvals/` will match the previous filter chain and will **not** be matched by this filter chain.
Requests to this filter chain require the `ROLE_USER` authority.
This filter chain does not define any authentication because the next (default) filter chain contains that configuration.
1. Lastly, create an additional `SecurityFilterChain` instance without an `@Order` annotation.
This configuration will handle requests not covered by the other filter chains and will be processed last (no `@Order` defaults to last).
Requests that match `/`, `/user-login`, `/user-logout`, `/notices`, `/contact` and `/register` allow access without authentication.
Any other requests require the user to be authenticated to access any URL not explicitly allowed or protected by other filter chains.
