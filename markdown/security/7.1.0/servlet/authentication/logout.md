---
title: "Handling Logouts"
source: "ROOT:servlet/authentication/logout.adoc"
---

<a id="jc-logout"></a>

# Handling Logouts

In an application where end users can [login](index.md), they should also be able to logout.

By default, Spring Security stands up a `/logout` endpoint, so no additional code is necessary.

The rest of this section covers a number of use cases for you to consider:

- I want to [understand logout’s architecture](#logout-java-configuration)
- I want to [customize the logout or logout success URI](#customizing-logout-uris)
- I want to know when I need to [explicitly permit the `/logout` endpoint](#permit-logout-endpoints)
- I want to [clear cookies, storage, and/or cache](#clear-all-site-data) when the user logs out
- I am using OAuth 2.0 and I want to [coordinate logout with an Authorization Server](../oauth2/login/advanced.md#oauth2login-advanced-oidc-logout)
- I am using SAML 2.0 and I want to [coordinate logout with an Identity Provider](../saml2/logout.md)
- I am using CAS and I want to [coordinate logout with an Identity Provider](cas.md#cas-singlelogout)

<a id="logout-java-configuration"></a>

## Understanding Logout’s Architecture

When you include [the `spring-boot-starter-security` dependency](https://docs.spring.io/spring-boot/4.1.0/reference/using/build-systems.html#using.build-systems.starters) or use the `@EnableWebSecurity` annotation, Spring Security will add its logout support and by default respond both to `GET /logout` and `POST /logout`.

If you request `GET /logout`, then Spring Security displays a logout confirmation page.
Aside from providing a valuable double-checking mechanism for the user, it also provides a simple way to provide [the needed CSRF token](../exploits/csrf.md) to `POST /logout`.

Please note that if [CSRF protection](../exploits/csrf.md) is disabled in configuration, no logout confirmation page is shown to the user and the logout is performed directly.

> [!TIP]
> In your application it is not necessary to use `GET /logout` to perform a logout.
> So long as [the needed CSRF token](../exploits/csrf.md) is present in the request, your application can simply `POST /logout` to induce a logout.

If you request `POST /logout`, then it will perform the following default operations using a series of [`LogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/LogoutHandler.html) instances:

- Invalidate the HTTP session ([`SecurityContextLogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/SecurityContextLogoutHandler.html))
- Clear the [`SecurityContextHolderStrategy`](session-management.md#use-securitycontextholderstrategy) ([`SecurityContextLogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/SecurityContextLogoutHandler.html))
- Clear the [`SecurityContextRepository`](persistence.md#securitycontextrepository) ([`SecurityContextLogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/SecurityContextLogoutHandler.html))
- Clean up any [RememberMe authentication](rememberme.md) (`TokenRememberMeServices` / `PersistentTokenRememberMeServices`)
- Clear out any saved [CSRF token](../exploits/csrf.md) ([`CsrfLogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/csrf/CsrfLogoutHandler.html))
- [Fire](events.md) a `LogoutSuccessEvent` ([`LogoutSuccessEventPublishingLogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/LogoutSuccessEventPublishingLogoutHandler.html))

Once completed, then it will exercise its default [`LogoutSuccessHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/LogoutSuccessHandler.html) which redirects to `/login?logout`.

<a id="customizing-logout-uris"></a>

## Customizing Logout URIs

Since the `LogoutFilter` appears before [the `AuthorizationFilter`](../authorization/authorize-http-requests.md) in [the filter chain](../architecture.md#servlet-filterchain-figure), it is not necessary by default to explicitly permit the `/logout` endpoint.
Thus, only [custom logout endpoints](#permit-logout-endpoints) that you create yourself generally require a `permitAll` configuration to be reachable.

For example, if you want to simply change the URI that Spring Security is matching, you can do so in the `logout` DSL in following way:

#### Java

```java
http
    .logout((logout) -> logout.logoutUrl("/my/logout/uri"))
```

#### Kotlin

```kotlin
http {
    logout {
        logoutUrl = "/my/logout/uri"
    }
}
```

#### Xml

```xml
<logout logout-url="/my/logout/uri"/>
```

and no authorization changes are necessary since it simply adjusts the `LogoutFilter`.

> [!NOTE]
> The URI passed to `logoutUrl` (and to `logoutSuccessUrl`) is matched and redirected to literally.
> If you want either URI to live under your application servlet’s base path, include that prefix explicitly — for example, `logoutUrl("/api/logout")`.

<a id="permit-logout-endpoints"></a>

However, if you stand up your own logout success endpoint (or in a rare case, [your own logout endpoint](#creating-custom-logout-endpoint)), say using [Spring MVC](https://docs.spring.io/spring-framework/reference/7.0.8/web.html#spring-web), you will need to permit it in Spring Security.
This is because Spring MVC processes your request after Spring Security does.

You can do this using `authorizeHttpRequests` or `<intercept-url>` like so:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        .requestMatchers("/my/success/endpoint").permitAll()
        // ...
    )
    .logout((logout) -> logout.logoutSuccessUrl("/my/success/endpoint"))
```

#### Kotlin

```kotlin
http {
    authorizeHttpRequests {
        authorize("/my/success/endpoint", permitAll)
    }
    logout {
        logoutSuccessUrl = "/my/success/endpoint"
    }
}
```

#### Xml

```xml
<http>
    <filter-url pattern="/my/success/endpoint" access="permitAll"/>
    <logout logout-success-url="/my/success/endpoint"/>
</http>
```

In this example, you tell the `LogoutFilter` to redirect to `/my/success/endpoint` when it is done.
And, you explicitly permit the `/my/success/endpoint` endpoint in [the `AuthorizationFilter`](../authorization/authorize-http-requests.md).

Specifying it twice can be cumbersome, though.
If you are using Java configuration, you can instead set the `permitAll` property in the logout DSL like so:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        // ...
    )
    .logout((logout) -> logout
        .logoutSuccessUrl("/my/success/endpoint")
        .permitAll()
    )
```

#### Kotlin

```kotlin
http
    authorizeHttpRequests {
        // ...
    }
    logout {
        logoutSuccessUrl = "/my/success/endpoint"
        permitAll = true
    }
```

which will add all logout URIs to the permit list for you.

<a id="add-logout-handler"></a>

## Adding Clean-up Actions

If you are using Java configuration, you can add clean up actions of your own by calling the `addLogoutHandler` method in the `logout` DSL, like so:

#### Java

```java
CookieClearingLogoutHandler cookies = new CookieClearingLogoutHandler("our-custom-cookie");
http
    .logout((logout) -> logout.addLogoutHandler(cookies))
```

#### Kotlin

```kotlin
http {
    logout {
        addLogoutHandler(CookieClearingLogoutHandler("our-custom-cookie"))
    }
}
```

> [!NOTE]
> Because [`LogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/LogoutHandler.html) instances are for the purposes of cleanup, they should not throw exceptions.

> [!TIP]
> Since [`LogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/LogoutHandler.html) is a functional interface, you can provide a custom one as a lambda.

Some logout handler configurations are common enough that they are exposed directly in the `logout` DSL and `<logout>` element.
One example is configuring session invalidation and another is which additional cookies should be deleted.

For example, you can configure the [`CookieClearingLogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/CookieClearingLogoutHandler.html) as seen above.

<a id="delete-cookies"></a>

Or you can instead set the appropriate configuration value like so:

#### Java

```java
http
    .logout((logout) -> logout.deleteCookies("our-custom-cookie"))
```

#### Kotlin

```kotlin
http {
    logout {
        deleteCookies("our-custom-cookie")
    }
}
```

#### Xml

```kotlin
<http>
    <logout delete-cookies="our-custom-cookie"/>
</http>
```

> [!NOTE]
> Specifying that the `JSESSIONID` cookie is not necessary since [`SecurityContextLogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/SecurityContextLogoutHandler.html) removes it by virtue of invalidating the session.

<a id="clear-all-site-data"></a>

### Using Clear-Site-Data to Log Out the User

The `Clear-Site-Data` HTTP header is one that browsers support as an instruction to clear cookies, storage, and cache that belong to the owning website.
This is a handy and secure way to ensure that everything, including the session cookie, is cleaned up on logout.

You can add configure Spring Security to write the `Clear-Site-Data` header on logout like so:

#### Java

```java
HeaderWriterLogoutHandler clearSiteData = new HeaderWriterLogoutHandler(new ClearSiteDataHeaderWriter(Directive.ALL));
http
    .logout((logout) -> logout.addLogoutHandler(clearSiteData))
```

#### Kotlin

```kotlin
val clearSiteData = HeaderWriterLogoutHandler(ClearSiteDataHeaderWriter(Directive.ALL))
http {
    logout {
        addLogoutHandler(clearSiteData)
    }
}
```

You give the `ClearSiteDataHeaderWriter` constructor the list of things that you want to be cleared out.

The above configuration clears out all site data, but you can also configure it to remove just cookies like so:

#### Java

```java
HeaderWriterLogoutHandler clearSiteData = new HeaderWriterLogoutHandler(new ClearSiteDataHeaderWriter(Directive.COOKIES));
http
    .logout((logout) -> logout.addLogoutHandler(clearSiteData))
```

#### Kotlin

```kotlin
val clearSiteData = HeaderWriterLogoutHandler(ClearSiteDataHeaderWriter(Directive.COOKIES))
http {
    logout {
        addLogoutHandler(clearSiteData)
    }
}
```

<a id="customizing-logout-success"></a>

## Customizing Logout Success

While using `logoutSuccessUrl` will suffice for most cases, you may need to do something different from redirecting to a URL once logout is complete.
[`LogoutSuccessHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/LogoutSuccessHandler.html) is the Spring Security component for customizing logout success actions.

For example, instead of redirecting, you may want to only return a status code.
In this case, you can provide a success handler instance, like so:

#### Java

```java
http
    .logout((logout) -> logout.logoutSuccessHandler(new HttpStatusReturningLogoutSuccessHandler()))
```

#### Kotlin

```kotlin
http {
    logout {
        logoutSuccessHandler = HttpStatusReturningLogoutSuccessHandler()
    }
}
```

#### Xml

```xml
<bean name="mySuccessHandlerBean" class="org.springframework.security.web.authentication.logout.HttpStatusReturningLogoutSuccessHandler"/>
<http>
    <logout success-handler-ref="mySuccessHandlerBean"/>
</http>
```

> [!TIP]
> Since [`LogoutSuccessHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/LogoutSuccessHandler.html) is a functional interface, you can provide a custom one as a lambda.

<a id="creating-custom-logout-endpoint"></a>

## Creating a Custom Logout Endpoint

It is strongly recommended that you use the provided `logout` DSL to configure logout.
One reason is that its easy to forget to call the needed Spring Security components to ensure a proper and complete logout.

In fact, it is often simpler to [register a custom `LogoutHandler`](#add-logout-handler) than create a [Spring MVC](https://docs.spring.io/spring-framework/reference/7.0.8/web.html#spring-web) endpoint for performing logout.

That said, if you find yourself in a circumstance where a custom logout endpoint is needed, like the following one:

#### Java

```java
@PostMapping("/my/logout")
public String performLogout() {
    // .. perform logout
    return "redirect:/home";
}
```

#### Kotlin

```kotlin
@PostMapping("/my/logout")
fun performLogout(): String {
    // .. perform logout
    return "redirect:/home"
}
```

then you will need to have that endpoint invoke Spring Security’s [`SecurityContextLogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/SecurityContextLogoutHandler.html) to ensure a secure and complete logout.
Something like the following is needed at a minimum:

#### Java

```java
SecurityContextLogoutHandler logoutHandler = new SecurityContextLogoutHandler();

@PostMapping("/my/logout")
public String performLogout(Authentication authentication, HttpServletRequest request, HttpServletResponse response) {
    // .. perform logout
    this.logoutHandler.logout(request, response, authentication);
    return "redirect:/home";
}
```

#### Kotlin

```kotlin
val logoutHandler = SecurityContextLogoutHandler()

@PostMapping("/my/logout")
fun performLogout(val authentication: Authentication, val request: HttpServletRequest, val response: HttpServletResponse): String {
    // .. perform logout
    this.logoutHandler.logout(request, response, authentication)
    return "redirect:/home"
}
```

Such will clear out the [`SecurityContextHolderStrategy`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/core/context/SecurityContextHolderStrategy.html) and [`SecurityContextRepository`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/context/SecurityContextRepository.html) as needed.

Also, you’ll need to [explicitly permit the endpoint](#permit-logout-endpoints).

> [!WARNING]
> Failing to call [`SecurityContextLogoutHandler`](https://docs.spring.io/spring-security/site/docs/7.1.0/api/org/springframework/security/web/authentication/logout/SecurityContextLogoutHandler.html) means that [the `SecurityContext`](architecture.md#servlet-authentication-securitycontext) could still be available on subsequent requests, meaning that the user is not actually logged out.

<a id="testing-logout"></a>

## Testing Logout

Once you have logout configured you can test it using [Spring Security’s MockMvc support](../test/mockmvc/logout.md).

<a id="jc-logout-references"></a>

## Further Logout-Related References

- [Testing Logout](../test/mockmvc/logout.md#test-logout)
- [HttpServletRequest.logout()](../integrations/servlet-api.md#servletapi-logout)
- [Remember-Me Interfaces and Implementations](rememberme.md#remember-me-impls)
- [Logging Out](../exploits/csrf.md#csrf-considerations-logout) in section CSRF Caveats
- Section [Single Logout](cas.md#cas-singlelogout) (CAS protocol)
- Documentation for the [logout element](../appendix/namespace/http.md#nsa-logout) in the Spring Security XML Namespace section
