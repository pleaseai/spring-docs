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
            securityMatcher(*approvalsPaths)
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
            securityMatcher(*bankingPaths)
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

<a id="modular-httpsecuritydsl-configuration"></a>

## Modular HttpSecurityDsl Configuration

Many users prefer that their Spring Security configuration lives in a centralized place and will choose to configure it in a single `SecurityFilterChain` instance.
However, there are times that users may want to modularize the configuration.
This can be done using:

- [HttpSecurityDsl.() → Unit Beans](#httpsecuritydsl-bean)
- [Top Level Security Dsl Beans](#top-level-dsl-bean)

> [!NOTE]
> Since the Spring Security Kotlin Dsl (`HttpSecurityDsl`) uses `HttpSecurity`, all of the Java [Modular Bean Customization](#modular-bean-configuration) is applied before [Modular HttpSecurity Configuration](#modular-httpsecuritydsl-configuration).

<a id="httpsecuritydsl-bean"></a>

### HttpSecurityDsl.() → Unit Beans

If you would like to modularize your security configuration you can place logic in a `HttpSecurityDsl.() → Unit` Bean.
For example, the following configuration will ensure all `HttpSecurityDsl` instances are configured to:

```kotlin
@Bean
fun httpSecurityDslBean(): HttpSecurityDsl.() -> Unit {
    return {
        headers {
            contentSecurityPolicy {
                // <1>
                policyDirectives = "object-src 'none'"
            }
        }
        // <2>
        redirectToHttps { }
    }
}
```

1. Set the [Content Security Policy](../exploits/headers.md#servlet-headers-csp) to `object-src 'none'`
1. [Redirect any request to https](../exploits/http.md#servlet-http-redirect)

<a id="top-level-dsl-bean"></a>

### Top Level Security Dsl Beans

If you prefer to have further modularization of your security configuration, Spring Security will automatically apply any top level Security Dsl Beans.

A top level Security Dsl can be summarized as any class Dsl class that matches `public HttpSecurityDsl.*(<Dsl>)`.
This translates to any Security Dsl that is a single argument to a public method on `HttpSecurityDsl`.

A few examples can help to clarify.
If `ContentTypeOptionsDsl.() → Unit` is published as a Bean, it will not be be automatically applied because it is an argument to `HeadersDsl#contentTypeOptions(ContentTypeOptionsDsl.() → Unit)` and is not an argument to a method defined on `HttpSecurityDsl`.
However, if `HeadersDsl.() → Unit` is published as a Bean, it will be automatically applied because it is an argument to `HttpSecurityDsl.headers(HeadersDsl.() → Unit)`.

For example, the following configuration ensure all `HttpSecurityDsl` instances are configured to:

```kotlin
@Bean
fun headersSecurity(): HeadersDsl.() -> Unit {
    return {
        contentSecurityPolicy {
            // <1>
            policyDirectives = "object-src 'none'"
        }
    }
}
```

1. Set the [Content Security Policy](../exploits/headers.md#servlet-headers-csp) to `object-src 'none'`

<a id="dsl-bean-ordering"></a>

### Dsl Bean Ordering

First, all [Modular HttpSecurity Configuration](java.md#modular-httpsecurity-configuration) is applied since the Kotlin Dsl uses an `HttpSecurity` Bean.

Second, each [HttpSecurityDsl.() → Unit Beans](#httpsecuritydsl-bean) is applied using [ObjectProvider#orderedStream()](<https://docs.spring.io/spring-framework/docs/7.0.9/javadoc-api/org/springframework/beans/factory/ObjectProvider.html#orderedStream()>).
This means that if there are multiple `HttpSecurity.() → Unit` Beans, the [@Order](https://docs.spring.io/spring-framework/docs/7.0.9/javadoc-api/org/springframework/core/annotation/Order.html) annotation can be added to the Bean definitions to control the ordering.

Next, every [Top Level Security Dsl Beans](#top-level-dsl-bean) type is looked up and each is is applied using `ObjectProvider#orderedStream()`.
If there is are different types of top level security Beans (e.g. `HeadersDsl.() → Unit` and `HttpsRedirectDsl.() → Unit`), then the order that each Dsl type is invoked is undefined.
However, the order that each instance of of the same top level security Bean type is defined by `ObjectProvider#orderedStream()` and can be controlled using `@Order` on the Bean the definitions.

Finally, the `HttpSecurityDsl` Bean is injected as a Bean.
All `*Dsl.() → Unit` Beans are applied before the `HttpSecurityDsl` Bean is created.
This allows overriding the customizations provided by the `*Dsl.() → Unit` Beans.

You can find an example below that illustrates the ordering:

```kotlin
// All of the Java Modular Configuration is applied first <1>

@Bean // <5>
fun springSecurity(http: HttpSecurity): SecurityFilterChain {
    http {
        authorizeHttpRequests {
            authorize(anyRequest, authenticated)
        }
    }
    return http.build()
}

@Bean
@Order(Ordered.LOWEST_PRECEDENCE)  // <3>
fun userAuthorization(): HttpSecurityDsl.() -> Unit {
    return {
        authorizeHttpRequests {
            authorize("/users/**", hasRole("USER"))
        }
    }
}

@Bean
@Order(Ordered.HIGHEST_PRECEDENCE) // <2>
fun adminAuthorization(): HttpSecurityDsl.() -> Unit {
    return {
        authorizeHttpRequests {
            authorize("/admins/**", hasRole("ADMIN"))
        }
    }
}

// <4>

@Bean
fun contentSecurityPolicy(): HeadersDsl.() -> Unit {
    return {
        contentSecurityPolicy {
            policyDirectives = "object-src 'none'"
        }
    }
}

@Bean
fun contentTypeOptions(): HeadersDsl.() -> Unit {
    return {
        contentTypeOptions { }
    }
}

@Bean
fun httpsRedirect(): HttpsRedirectDsl.() -> Unit {
    return { }
}
```

1. All [Modular HttpSecurity Configuration](java.md#modular-httpsecurity-configuration) is applied since the Kotlin Dsl uses an `HttpSecurity` Bean.
1. All `HttpSecurity.() → Unit` instances are applied.
The `adminAuthorization` Bean has the highest `@Order` so it is applied first.
If there are no `@Order` annotations on the `HttpSecurity.() → Unit` Beans or the `@Order` annotations had the same value, then the order that the `HttpSecurity.() → Unit` instances are applied is undefined.
1. The `userAuthorization` is applied next due to being an instance of `HttpSecurity.() → Unit`
1. The order that the `*Dsl.() → Unit` types are undefined.
In this example, the order of `contentSecurityPolicy`, `contentTypeOptions`, and `httpsRedirect` are undefined.
If `@Order(Ordered.HIGHEST_PRECEDENCE)` was added to `contentTypeOptions`, then we would know that `contentTypeOptions` is before `contentSecurityPolicy` (they are the same type), but we do not know if `httpsRedirect` is before or after the `HeadersDsl.() → Unit` Beans.
1. After all of the `*Dsl.() → Unit` Beans are applied, the `HttpSecurityDsl` is passed in as a Bean.
