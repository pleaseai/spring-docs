---
title: "Authentication Persistence and Session Management"
source: "ROOT:servlet/authentication/session-management.adoc"
---

<a id="session-mgmt"></a>

# Authentication Persistence and Session Management

Once you have got an application that is [authenticating requests](index.md), it is important to consider how that resulting authentication will be persisted and restored on future requests.

This is done automatically by default, so no additional code is necessary, though it is important to know what `requireExplicitSave` means in `HttpSecurity`.

If you like, [you can read more about what requireExplicitSave is doing](#how-it-works-requireexplicitsave) or [why it’s important](#requireexplicitsave). Otherwise, in most cases you are done with this section.

But before you leave, consider if any of these use cases fit your application:

- I want to [Understand Session Management’s components](#understanding-session-management-components)
- I want to [restrict the number of times](#ns-concurrent-sessions) a user can be logged in concurrently
- I want [to store the authentication directly](#store-authentication-manually) myself instead of Spring Security doing it for me
- I am storing the authentication manually and I want [to remove it](#properly-clearing-authentication)
- I am using [`SessionManagementFilter`](#the-sessionmanagementfilter) and I need [guidance on moving away from that](#moving-away-from-sessionmanagementfilter)
- I want to store the authentication [in something other than the session](#customizing-where-authentication-is-stored)
- I am using a [stateless authentication](#stateless-authentication), but [I’d still like to store it in the session](#storing-stateless-authentication-in-the-session)
- I am using `SessionCreationPolicy.NEVER` but [the application is still creating sessions](#never-policy-session-still-created).

<a id="understanding-session-management-components"></a>

## Understanding Session Management’s Components

The Session Management support is composed of a few components that work together to provide the functionality.
Those components are, [the `SecurityContextHolderFilter`](persistence.md#securitycontextholderfilter), [the `SecurityContextPersistenceFilter`](persistence.md#securitycontextpersistencefilter) and [the `SessionManagementFilter`](#the-sessionmanagementfilter).

> [!NOTE]
> In Spring Security 6, the `SecurityContextPersistenceFilter` and `SessionManagementFilter` are not set by default.
> In addition to that, any application should only have either `SecurityContextHolderFilter` or `SecurityContextPersistenceFilter` set, never both.

<a id="the-sessionmanagementfilter"></a>

### The `SessionManagementFilter`

The `SessionManagementFilter` checks the contents of the `SecurityContextRepository` against the current contents of the `SecurityContextHolder` to determine whether a user has been authenticated during the current request, typically by a non-interactive authentication mechanism, such as pre-authentication or remember-me  <sup>\[[1](#_footnotedef_1)\]</sup>.
If the repository contains a security context, the filter does nothing.
If it doesn’t, and the thread-local `SecurityContext` contains a (non-anonymous) `Authentication` object, the filter assumes they have been authenticated by a previous filter in the stack.
It will then invoke the configured `SessionAuthenticationStrategy`.

If the user is not currently authenticated, the filter will check whether an invalid session ID has been requested (because of a timeout, for example) and will invoke the configured `InvalidSessionStrategy`, if one is set.
The most common behaviour is just to redirect to a fixed URL and this is encapsulated in the standard implementation `SimpleRedirectInvalidSessionStrategy`.
The latter is also used when configuring an invalid session URL through the namespace, [as described earlier](#session-mgmt).

<a id="moving-away-from-sessionmanagementfilter"></a>

#### Moving Away From `SessionManagementFilter`

In Spring Security 5, the default configuration relies on `SessionManagementFilter` to detect if a user just authenticated and invoke the [SessionAuthenticationStrategy](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/web/authentication/session/SessionAuthenticationStrategy.html).
The problem with this is that it means that in a typical setup, the `HttpSession` must be read for every request.

In Spring Security 6, the default is that authentication mechanisms themselves must invoke the `SessionAuthenticationStrategy`.
This means that there is no need to detect when `Authentication` is done and thus the `HttpSession` does not need to be read for every request.

<a id="_things_to_consider_when_moving_away_from_sessionmanagementfilter"></a>

#### Things To Consider When Moving Away From `SessionManagementFilter`

In Spring Security 6, the `SessionManagementFilter` is not used by default, therefore, some methods from the `sessionManagement` DSL will not have any effect.

| Method | Replacement |
| --- | --- |
| `sessionAuthenticationErrorUrl` | Configure an [`AuthenticationFailureHandler`](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/web/authentication/AuthenticationFailureHandler.html) in your authentication mechanism |
| `sessionAuthenticationFailureHandler` | Configure an [`AuthenticationFailureHandler`](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/web/authentication/AuthenticationFailureHandler.html) in your authentication mechanism |
| `sessionAuthenticationStrategy` | Configure an `SessionAuthenticationStrategy` in your authentication mechanism as [discussed above](#moving-away-from-sessionmanagementfilter) |

If you try to use any of these methods, an exception will be thrown.

<a id="customizing-where-authentication-is-stored"></a>

## Customizing Where the Authentication Is Stored

By default, Spring Security stores the security context for you in the HTTP session. However, here are several reasons you may want to customize that:

- You may want to call individual setters on the `HttpSessionSecurityContextRepository` instance
- You may want to store the security context in a cache or database to enable horizontal scaling

First, you need to create an implementation of `SecurityContextRepository` or use an existing implementation like `HttpSessionSecurityContextRepository`, then you can set it in `HttpSecurity`.

<a id="customizing-the-securitycontextrepository"></a>

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    SecurityContextRepository repo = new MyCustomSecurityContextRepository();
    http
        // ...
        .securityContext((context) -> context
            .securityContextRepository(repo)
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    val repo = MyCustomSecurityContextRepository()
    http {
        // ...
        securityContext {
            securityContextRepository = repo
        }
    }
    return http.build()
}
```

#### XML

```xml
<http security-context-repository-ref="repo">
    <!-- ... -->
</http>
<bean name="repo" class="com.example.MyCustomSecurityContextRepository" />
```

> [!NOTE]
> The above configuration sets the `SecurityContextRepository` on the `SecurityContextHolderFilter` and **participating** authentication filters, like `UsernamePasswordAuthenticationFilter`.
> To also set it in stateless filters, please see [how to customize the `SecurityContextRepository` for Stateless Authentication](#storing-stateless-authentication-in-the-session).

If you are using a custom authentication mechanism, you might want to [store the `Authentication` by yourself](#store-authentication-manually).

<a id="store-authentication-manually"></a>

### Storing the `Authentication` manually

In some cases, for example, you might be authenticating a user manually instead of relying on Spring Security filters.
You can use a custom filters or a [Spring MVC controller](https://docs.spring.io/spring-framework/reference/7.0.2//web.html#mvc-controller) endpoint to do that.
If you want to save the authentication between requests, in the `HttpSession`, for example, you have to do so:

#### Java

```java
private SecurityContextRepository securityContextRepository =
        new HttpSessionSecurityContextRepository(); <1>

@PostMapping("/login")
public void login(@RequestBody LoginRequest loginRequest, HttpServletRequest request, HttpServletResponse response) { <2>
    UsernamePasswordAuthenticationToken token = UsernamePasswordAuthenticationToken.unauthenticated(
        loginRequest.getUsername(), loginRequest.getPassword()); <3>
    Authentication authentication = authenticationManager.authenticate(token); <4>
    SecurityContext context = securityContextHolderStrategy.createEmptyContext();
    context.setAuthentication(authentication); <5>
    securityContextHolderStrategy.setContext(context);
    securityContextRepository.saveContext(context, request, response); <6>
}

class LoginRequest {

    private String username;
    private String password;

    // getters and setters
}
```

1. Add the `SecurityContextRepository` to the controller
1. Inject the `HttpServletRequest` and `HttpServletResponse` to be able to save the `SecurityContext`
1. Create an unauthenticated `UsernamePasswordAuthenticationToken` using the provided credentials
1. Call `AuthenticationManager#authenticate` to authenticate the user
1. Create a `SecurityContext` and set the `Authentication` in it
1. Save the `SecurityContext` in the `SecurityContextRepository`

And that’s it.
If you are not sure what `securityContextHolderStrategy` is in the above example, you can read more about it in the [Using `SecurityContextStrategy` section](#use-securitycontextholderstrategy).

<a id="properly-clearing-authentication"></a>

### Properly Clearing an Authentication

If you are using Spring Security’s [Logout Support](logout.md) then it handles a lot of stuff for you including clearing and saving the context.
But, let’s say you need to manually log users out of your app. In that case, you’ll need to make sure you’re [clearing and saving the context properly](logout.md#creating-custom-logout-endpoint).

<a id="stateless-authentication"></a>

### Configuring Persistence for Stateless Authentication

Sometimes there is no need to create and maintain a `HttpSession` for example, to persist the authentication across requests.
Some authentication mechanisms like [HTTP Basic](passwords/basic.md) are stateless and, therefore, re-authenticates the user on every request.

If you do not wish to create sessions, you can use `SessionCreationPolicy.STATELESS`, like so:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        // ...
        .sessionManagement((session) -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        // ...
        sessionManagement {
            sessionCreationPolicy = SessionCreationPolicy.STATELESS
        }
    }
    return http.build()
}
```

#### XML

```xml
<http create-session="stateless">
    <!-- ... -->
</http>
```

The above configuration is [configuring the `SecurityContextRepository`](#customizing-where-authentication-is-stored) to use a `NullSecurityContextRepository` and is also [preventing the request from being saved in the session](../architecture.md#requestcache-prevent-saved-request).

<a id="never-policy-session-still-created"></a>

If you are using `SessionCreationPolicy.NEVER`, you might notice that the application is still creating a `HttpSession`.
In most cases, this happens because the [request is saved in the session](../architecture.md#savedrequests) for the authenticated resource to re-request after authentication is successful.
To avoid that, please refer to [how to prevent the request of being saved](../architecture.md#requestcache-prevent-saved-request) section.

<a id="storing-stateless-authentication-in-the-session"></a>

#### Storing Stateless Authentication in the Session

If, for some reason, you are using a stateless authentication mechanism, but you still want to store the authentication in the session you can use the `HttpSessionSecurityContextRepository` instead of the `NullSecurityContextRepository`.

For the [HTTP Basic](passwords/basic.md), you can add [a `ObjectPostProcessor`](../configuration/java.md#post-processing-configured-objects) that changes the `SecurityContextRepository` used by the `BasicAuthenticationFilter`:

#### Java

```java
@Bean
SecurityFilterChain web(HttpSecurity http) throws Exception {
    http
        // ...
        .httpBasic((basic) -> basic
            .addObjectPostProcessor(new ObjectPostProcessor<BasicAuthenticationFilter>() {
                @Override
                public <O extends BasicAuthenticationFilter> O postProcess(O filter) {
                    filter.setSecurityContextRepository(new HttpSessionSecurityContextRepository());
                    return filter;
                }
            })
        );

    return http.build();
}
```

The above also applies to others authentication mechanisms, like [Bearer Token Authentication](../oauth2/resource-server/index.md).

<a id="requireexplicitsave"></a>

## Understanding Require Explicit Save

In Spring Security 5, the default behavior is for the [`SecurityContext`](architecture.md#servlet-authentication-securitycontext) to automatically be saved to the [`SecurityContextRepository`](persistence.md#securitycontextrepository) using the [`SecurityContextPersistenceFilter`](#securitycontextpersistencefilter).
Saving must be done just prior to the `HttpServletResponse` being committed and just before `SecurityContextPersistenceFilter`.
Unfortunately, automatic persistence of the `SecurityContext` can surprise users when it is done prior to the request completing (i.e. just prior to committing the `HttpServletResponse`).
It also is complex to keep track of the state to determine if a save is necessary causing unnecessary writes to the `SecurityContextRepository` (i.e. `HttpSession`) at times.

For these reasons, the `SecurityContextPersistenceFilter` has been deprecated to be replaced with the `SecurityContextHolderFilter`.
In Spring Security 6, the default behavior is that [the `SecurityContextHolderFilter`](persistence.md#securitycontextholderfilter) will only read the `SecurityContext` from  `SecurityContextRepository` and populate it in the `SecurityContextHolder`.
Users now must explicitly save the `SecurityContext` with the `SecurityContextRepository` if they want the `SecurityContext` to persist between requests.
This removes ambiguity and improves performance by only requiring writing to the `SecurityContextRepository` (i.e. `HttpSession`) when it is necessary.

<a id="how-it-works-requireexplicitsave"></a>

### How it works

In summary, when `requireExplicitSave` is `true`, Spring Security sets up [the `SecurityContextHolderFilter`](persistence.md#securitycontextholderfilter) instead of [the `SecurityContextPersistenceFilter`](persistence.md#securitycontextpersistencefilter)

<a id="ns-concurrent-sessions"></a>

## Configuring Concurrent Session Control

If you wish to place constraints on a single user’s ability to log in to your application, Spring Security supports this out of the box with the following simple additions.
First, you need to add the following listener to your configuration to keep Spring Security updated about session lifecycle events:

#### Java

```java
@Bean
public HttpSessionEventPublisher httpSessionEventPublisher() {
    return new HttpSessionEventPublisher();
}
```

#### Kotlin

```kotlin
@Bean
open fun httpSessionEventPublisher(): HttpSessionEventPublisher {
    return HttpSessionEventPublisher()
}
```

#### web.xml

```xml
<listener>
<listener-class>
    org.springframework.security.web.session.HttpSessionEventPublisher
</listener-class>
</listener>
```

Then add the following lines to your security configuration:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        .sessionManagement((session) -> session
            .maximumSessions(1)
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        sessionManagement {
            sessionConcurrency {
                maximumSessions = 1
            }
        }
    }
    return http.build()
}
```

#### XML

```xml
<http>
...
<session-management>
    <concurrency-control max-sessions="1" />
</session-management>
</http>
```

This will prevent a user from logging in multiple times - a second login will cause the first to be invalidated.

You can also adjust this based on who the user is.
For example, administrators may be able to have more than one session:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
	AuthorizationManager<?> isAdmin = AuthorityAuthorizationManager.hasRole("ADMIN");
    http
        .sessionManagement((session) -> session
            .maximumSessions((authentication) -> isAdmin.authorize(() -> authentication, null).isGranted() ? -1 : 1)
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    val isAdmin: AuthorizationManager<*> = AuthorityAuthorizationManager.hasRole("ADMIN")
    http {
        sessionManagement {
            sessionConcurrency {
                maximumSessions {
                    authentication -> if (isAdmin.authorize({ authentication }, null)!!.isGranted) -1 else 1
                }
            }
        }
    }
    return http.build()
}
```

#### XML

```xml
<http>
...
<session-management>
    <concurrency-control max-sessions-ref="sessionLimit" />
</session-management>
</http>

<b:bean id="sessionLimit" class="my.SessionLimitImplementation"/>
```

Using Spring Boot, you can test the above configurations in the following way:

#### Java

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
public class MaximumSessionsTests {

    @Autowired
    private MockMvc mvc;

    @Test
    void loginOnSecondLoginThenFirstSessionTerminated() throws Exception {
        MvcResult mvcResult = this.mvc.perform(formLogin())
                .andExpect(authenticated())
                .andReturn();

        MockHttpSession firstLoginSession = (MockHttpSession) mvcResult.getRequest().getSession();

        this.mvc.perform(get("/").session(firstLoginSession))
                .andExpect(authenticated());

        this.mvc.perform(formLogin()).andExpect(authenticated());

        // first session is terminated by second login
        this.mvc.perform(get("/").session(firstLoginSession))
                .andExpect(unauthenticated());
    }

}
```

You can try it using the [Maximum Sessions sample](https://github.com/spring-projects/spring-security-samples/tree/main/servlet/spring-boot/java/session-management/maximum-sessions).

It is also common that you would prefer to prevent a second login, in which case you can use:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        .sessionManagement((session) -> session
            .maximumSessions(1)
            .maxSessionsPreventsLogin(true)
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        sessionManagement {
            sessionConcurrency {
                maximumSessions = 1
                maxSessionsPreventsLogin = true
            }
        }
    }
    return http.build()
}
```

#### XML

```xml
<http>
<session-management>
    <concurrency-control max-sessions="1" error-if-maximum-exceeded="true" />
</session-management>
</http>
```

The second login will then be rejected.
By "rejected", we mean that the user will be sent to the `authentication-failure-url` if form-based login is being used.
If the second authentication takes place through another non-interactive mechanism, such as "remember-me", an "unauthorized" (401) error will be sent to the client.
If instead you want to use an error page, you can add the attribute `session-authentication-error-url` to the `session-management` element.

Using Spring Boot, you can test the above configuration the following way:

#### Java

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
public class MaximumSessionsPreventLoginTests {

    @Autowired
    private MockMvc mvc;

    @Test
    void loginOnSecondLoginThenPreventLogin() throws Exception {
        MvcResult mvcResult = this.mvc.perform(formLogin())
                .andExpect(authenticated())
                .andReturn();

        MockHttpSession firstLoginSession = (MockHttpSession) mvcResult.getRequest().getSession();

        this.mvc.perform(get("/").session(firstLoginSession))
                .andExpect(authenticated());

        // second login is prevented
        this.mvc.perform(formLogin()).andExpect(unauthenticated());

        // first session is still valid
        this.mvc.perform(get("/").session(firstLoginSession))
                .andExpect(authenticated());
    }

}
```

If you are using a customized authentication filter for form-based login, then you have to configure concurrent session control support explicitly.
You can try it using the [Maximum Sessions Prevent Login sample](https://github.com/spring-projects/spring-security-samples/tree/main/servlet/spring-boot/java/session-management/maximum-sessions-prevent-login).

> [!NOTE]
> If you are using a custom implementation of `UserDetails`, ensure you override the **equals()** and **hashCode()** methods.
> The default `SessionRegistry` implementation in Spring Security relies on an in-memory Map that uses these methods to correctly identify and manage user sessions.
> Failing to override them may lead to issues where session tracking and user comparison behave unexpectedly.

<a id="_detecting_timeouts"></a>

## Detecting Timeouts

Sessions expire on their own, and there is nothing that needs to be done to ensure that a security context gets removed.
That said, Spring Security can detect when a session has expired and take specific actions that you indicate.
For example, you may want to redirect to a specific endpoint when a user makes a request with an already-expired session.
This is achieved through the `invalidSessionUrl` in `HttpSecurity`:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        .sessionManagement((session) -> session
            .invalidSessionUrl("/invalidSession")
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        sessionManagement {
            invalidSessionUrl = "/invalidSession"
        }
    }
    return http.build()
}
```

#### XML

```xml
<http>
...
<session-management invalid-session-url="/invalidSession" />
</http>
```

Note that if you use this mechanism to detect session timeouts, it may falsely report an error if the user logs out and then logs back in without closing the browser.
This is because the session cookie is not cleared when you invalidate the session and will be resubmitted even if the user has logged out.
If that is your case, you might want to [configure logout to clear the session cookie](#clearing-session-cookie-on-logout).

<a id="_customizing_the_invalid_session_strategy"></a>

### Customizing the Invalid Session Strategy

The `invalidSessionUrl` is a convenience method for setting the `InvalidSessionStrategy` using the [`SimpleRedirectInvalidSessionStrategy` implementation](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/web/session/SimpleRedirectInvalidSessionStrategy.html).
If you want to customize the behavior, you can implement the [`InvalidSessionStrategy`](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/web/session/InvalidSessionStrategy.html) interface and configure it using the `invalidSessionStrategy` method:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        .sessionManagement((session) -> session
            .invalidSessionStrategy(new MyCustomInvalidSessionStrategy())
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        sessionManagement {
            invalidSessionStrategy = MyCustomInvalidSessionStrategy()
        }
    }
    return http.build()
}
```

#### XML

```xml
<http>
...
<session-management invalid-session-strategy-ref="myCustomInvalidSessionStrategy" />
<bean name="myCustomInvalidSessionStrategy" class="com.example.MyCustomInvalidSessionStrategy" />
</http>
```

<a id="clearing-session-cookie-on-logout"></a>

## Clearing Session Cookies on Logout

You can explicitly delete the JSESSIONID cookie on logging out, for example by using the [`Clear-Site-Data` header](https://w3c.github.io/webappsec-clear-site-data/) in the logout handler:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        .logout((logout) -> logout
            .addLogoutHandler(new HeaderWriterLogoutHandler(new ClearSiteDataHeaderWriter(COOKIES)))
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        logout {
            addLogoutHandler(HeaderWriterLogoutHandler(ClearSiteDataHeaderWriter(COOKIES)))
        }
    }
    return http.build()
}
```

#### XML

```xml
<http>
<logout success-handler-ref="clearSiteDataHandler" />
<b:bean id="clearSiteDataHandler" class="org.springframework.security.web.authentication.logout.HeaderWriterLogoutHandler">
    <b:constructor-arg>
        <b:bean class="org.springframework.security.web.header.writers.ClearSiteDataHeaderWriter">
            <b:constructor-arg>
                <b:list>
                    <b:value>COOKIES</b:value>
                </b:list>
            </b:constructor-arg>
        </b:bean>
    </b:constructor-arg>
</b:bean>
</http>
```

This has the advantage of being container agnostic and will work with any container that supports the `Clear-Site-Data` header.

As an alternative, you can also use the following syntax in the logout handler:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        .logout((logout) -> logout
            .deleteCookies("JSESSIONID")
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        logout {
            deleteCookies("JSESSIONID")
        }
    }
    return http.build()
}
```

#### XML

```xml
<http>
  <logout delete-cookies="JSESSIONID" />
</http>
```

Unfortunately, this cannot be guaranteed to work with every servlet container, so you need to test it in your environment.

> [!NOTE]
> If you run your application behind a proxy, you may also be able to remove the session cookie by configuring the proxy server.
> For example, by using Apache HTTPD’s `mod_headers`, the following directive deletes the `JSESSIONID` cookie by expiring it in the response to a logout request (assuming the application is deployed under the `/tutorial` path):

```xml
<LocationMatch "/tutorial/logout">
Header always set Set-Cookie "JSESSIONID=;Path=/tutorial;Expires=Thu, 01 Jan 1970 00:00:00 GMT"
</LocationMatch>
```

More details on the [Clear Site Data](../exploits/headers.md#servlet-headers-clear-site-data) and [Logout sections](logout.md).

<a id="ns-session-fixation"></a>

## Understanding Session Fixation Attack Protection

[Session fixation](https://en.wikipedia.org/wiki/Session_fixation) attacks are a potential risk where it is possible for a malicious attacker to create a session by accessing a site, then persuade another user to log in with the same session (by sending them a link containing the session identifier as a parameter, for example).
Spring Security protects against this automatically by creating a new session or otherwise changing the session ID when a user logs in.

<a id="_configuring_session_fixation_protection"></a>

### Configuring Session Fixation Protection

You can control the strategy for Session Fixation Protection by choosing between three recommended options:

- `changeSessionId` - Do not create a new session.
Instead, use the session fixation protection provided by the Servlet container (`HttpServletRequest#changeSessionId()`).
This option is only available in Servlet 3.1 (Java EE 7) and newer containers.
Specifying it in older containers will result in an exception.
This is the default in Servlet 3.1 and newer containers.
- `newSession` - Create a new "clean" session, without copying the existing session data (Spring Security-related attributes will still be copied).
- `migrateSession` - Create a new session and copy all existing session attributes to the new session.
This is the default in Servlet 3.0 or older containers.

You can configure the session fixation protection by doing:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        .sessionManagement((session) -> session
            .sessionFixation((sessionFixation) -> sessionFixation
                .newSession()
            )
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        sessionManagement {
            sessionFixation {
                newSession()
            }
        }
    }
    return http.build()
}
```

#### XML

```xml
<http>
  <session-management session-fixation-protection="newSession" />
</http>
```

When session fixation protection occurs, it results in a `SessionFixationProtectionEvent` being published in the application context.
If you use `changeSessionId`, this protection will *also* result in any  `jakarta.servlet.http.HttpSessionIdListener`s being notified, so use caution if your code listens for both events.

You can also set the session fixation protection to `none` to disable it, but this is not recommended as it leaves your application vulnerable.

<a id="use-securitycontextholderstrategy"></a>

## Using `SecurityContextHolderStrategy`

Consider the following block of code:

#### Java

```java
UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
        loginRequest.getUsername(), loginRequest.getPassword());
Authentication authentication = this.authenticationManager.authenticate(token);
// ...
SecurityContext context = SecurityContextHolder.createEmptyContext(); <1>
context.setAuthentication(authentication); <2>
SecurityContextHolder.setContext(context); <3>
```

1. Creates an empty `SecurityContext` instance by accessing the `SecurityContextHolder` statically.
1. Sets the `Authentication` object in the `SecurityContext` instance.
1. Sets the `SecurityContext` instance in the `SecurityContextHolder` statically.

While the above code works fine, it can produce some undesired effects: when components access the `SecurityContext` statically through `SecurityContextHolder`, this can create race conditions when there are multiple application contexts that want to specify the `SecurityContextHolderStrategy`.
This is because in `SecurityContextHolder` there is one strategy per classloader instead of one per application context.

To address this, components can wire `SecurityContextHolderStrategy` from the application context.
By default, they will still look up the strategy from `SecurityContextHolder`.

These changes are largely internal, but they present the opportunity for applications to autowire the `SecurityContextHolderStrategy` instead of accessing the `SecurityContext` statically.
To do so, you should change the code to the following:

#### Java

```java
public class SomeClass {

    private final SecurityContextHolderStrategy securityContextHolderStrategy = SecurityContextHolder.getContextHolderStrategy();

    public void someMethod() {
        UsernamePasswordAuthenticationToken token = UsernamePasswordAuthenticationToken.unauthenticated(
                loginRequest.getUsername(), loginRequest.getPassword());
        Authentication authentication = this.authenticationManager.authenticate(token);
        // ...
        SecurityContext context = this.securityContextHolderStrategy.createEmptyContext(); <1>
        context.setAuthentication(authentication); <2>
        this.securityContextHolderStrategy.setContext(context); <3>
    }

}
```

1. Creates an empty `SecurityContext` instance using the configured `SecurityContextHolderStrategy`.
1. Sets the `Authentication` object in the `SecurityContext` instance.
1. Sets the `SecurityContext` instance in the `SecurityContextHolderStrategy`.

<a id="session-mgmt-force-session-creation"></a>

## Forcing Eager Session Creation

At times, it can be valuable to eagerly create sessions.
This can be done by using the [`ForceEagerSessionCreationFilter`](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/web/session/ForceEagerSessionCreationFilter.html) which can be configured using:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) {
    http
        .sessionManagement((session) -> session
            .sessionCreationPolicy(SessionCreationPolicy.ALWAYS)
        );
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        sessionManagement {
            sessionCreationPolicy = SessionCreationPolicy.ALWAYS
        }
    }
    return http.build()
}
```

#### XML

```xml
<http create-session="ALWAYS">

</http>
```

<a id="_what_to_read_next"></a>

## What to read next

- Clustered sessions with [Spring Session](https://docs.spring.io/spring-session/reference/index.html)
