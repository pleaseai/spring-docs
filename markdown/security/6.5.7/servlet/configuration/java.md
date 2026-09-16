---
title: "Java Configuration"
source: "ROOT:servlet/configuration/java.adoc"
---

<a id="jc"></a>

# Java Configuration

General support for [Java configuration](https://docs.spring.io/spring-framework/reference/6.2.13/core/beans/java.html) was added to Spring Framework in Spring 3.1.
Spring Security 3.2 introduced Java configuration to let users configure Spring Security without the use of any XML.

If you are familiar with the [Security Namespace Configuration](xml-namespace.md#ns-config), you should find quite a few similarities between it and Spring Security Java configuration.

> [!NOTE]
> Spring Security provides [lots of sample applications](https://github.com/spring-projects/spring-security-samples/tree/main/servlet/java-configuration) to demonstrate the use of Spring Security Java Configuration.

<a id="jc-hello-wsca"></a>

## Hello Web Security Java Configuration

The first step is to create our Spring Security Java Configuration.
The configuration creates a Servlet Filter known as the `springSecurityFilterChain`, which is responsible for all the security (protecting the application URLs, validating submitted username and passwords, redirecting to the log in form, and so on) within your application.
The following example shows the most basic example of a Spring Security Java Configuration:

```java
import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.authentication.builders.*;
import org.springframework.security.config.annotation.web.configuration.*;

@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

	@Bean
	public UserDetailsService userDetailsService() {
		InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
		manager.createUser(User.withDefaultPasswordEncoder().username("user").password("password").roles("USER").build());
		return manager;
	}
}
```

This configuration is not complex or extensive, but it does a lot:

- Require authentication to every URL in your application
- Generate a login form for you
- Let the user with a **Username** of `user` and a **Password** of `password` authenticate with form based authentication
- Let the user logout
- [CSRF attack](https://en.wikipedia.org/wiki/Cross-site_request_forgery) prevention
- [Session Fixation](https://en.wikipedia.org/wiki/Session_fixation) protection
- Security Header integration:

  - [HTTP Strict Transport Security](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) for secure requests
  - [X-Content-Type-Options](<https://msdn.microsoft.com/en-us/library/ie/gg622941(v=vs.85).aspx>) integration
  - Cache Control (which you can override later in your application to allow caching of your static resources)
  - [X-XSS-Protection](<https://msdn.microsoft.com/en-us/library/dd565647(v=vs.85).aspx>) integration
  - X-Frame-Options integration to help prevent [Clickjacking](https://en.wikipedia.org/wiki/Clickjacking)
- Integration with the following Servlet API methods:

  - [`HttpServletRequest#getRemoteUser()`](<https://docs.oracle.com/javaee/6/api/javax/servlet/http/HttpServletRequest.html#getRemoteUser()>)
  - [`HttpServletRequest#getUserPrincipal()`](<https://docs.oracle.com/javaee/6/api/javax/servlet/http/HttpServletRequest.html#getUserPrincipal()>)
  - [`HttpServletRequest#isUserInRole(java.lang.String)`](<https://docs.oracle.com/javaee/6/api/javax/servlet/http/HttpServletRequest.html#isUserInRole(java.lang.String)>)
  - [`HttpServletRequest#login(java.lang.String, java.lang.String)`](<https://docs.oracle.com/javaee/6/api/javax/servlet/http/HttpServletRequest.html#login(java.lang.String,%20java.lang.String)>)
  - [`HttpServletRequest#logout()`](<https://docs.oracle.com/javaee/6/api/javax/servlet/http/HttpServletRequest.html#logout()>)

<a id="_abstractsecuritywebapplicationinitializer"></a>

### AbstractSecurityWebApplicationInitializer

The next step is to register the `springSecurityFilterChain` with the WAR file.
You can do so in Java configuration with [Spring’s `WebApplicationInitializer` support](https://docs.spring.io/spring-framework/reference/6.2.13/web/webmvc/mvc-servlet/container-config.html) in a Servlet 3.0+ environment.
Not surprisingly, Spring Security provides a base class (`AbstractSecurityWebApplicationInitializer`) to ensure that the `springSecurityFilterChain` gets registered for you.
The way in which we use `AbstractSecurityWebApplicationInitializer` differs depending on if we are already using Spring or if Spring Security is the only Spring component in our application.

- [AbstractSecurityWebApplicationInitializer without Existing Spring](#abstractsecuritywebapplicationinitializer-without-existing-spring) - Use these instructions if you are not already using Spring
- [AbstractSecurityWebApplicationInitializer with Spring MVC](#abstractsecuritywebapplicationinitializer-with-spring-mvc) - Use these instructions if you are already using Spring

<a id="abstractsecuritywebapplicationinitializer-without-existing-spring"></a>

### AbstractSecurityWebApplicationInitializer without Existing Spring

If you are not using Spring or Spring MVC, you need to pass the `WebSecurityConfig` to the superclass to ensure the configuration is picked up:

```java
import org.springframework.security.web.context.*;

public class SecurityWebApplicationInitializer
	extends AbstractSecurityWebApplicationInitializer {

	public SecurityWebApplicationInitializer() {
		super(WebSecurityConfig.class);
	}
}
```

The `SecurityWebApplicationInitializer`:

- Automatically registers the `springSecurityFilterChain` Filter for every URL in your application.
- Add a `ContextLoaderListener` that loads the [WebSecurityConfig](#jc-hello-wsca).

<a id="abstractsecuritywebapplicationinitializer-with-spring-mvc"></a>

### AbstractSecurityWebApplicationInitializer with Spring MVC

If we use Spring elsewhere in our application, we probably already have a `WebApplicationInitializer` that is loading our Spring Configuration.
If we use the previous configuration, we would get an error.
Instead, we should register Spring Security with the existing `ApplicationContext`.
For example, if we use Spring MVC, our `SecurityWebApplicationInitializer` could look something like the following:

```java
import org.springframework.security.web.context.*;

public class SecurityWebApplicationInitializer
	extends AbstractSecurityWebApplicationInitializer {

}
```

This only registers the `springSecurityFilterChain` for every URL in your application.
After that, we need to ensure that `WebSecurityConfig` was loaded in our existing `ApplicationInitializer`.
For example, if we use Spring MVC it is added in the `getServletConfigClasses()`:

<a id="message-web-application-inititializer-java"></a>

```java
public class MvcWebApplicationInitializer extends
		AbstractAnnotationConfigDispatcherServletInitializer {

	@Override
	protected Class<?>[] getServletConfigClasses() {
		return new Class[] { WebSecurityConfig.class, WebMvcConfig.class };
	}

	// ... other overrides ...
}
```

The reason for this is that Spring Security needs to be able to inspect some Spring MVC configuration in order to appropriately configure [underlying request matchers](../authorization/authorize-http-requests.md#authorizing-endpoints), so they need to be in the same application context.
Placing Spring Security in `getRootConfigClasses` places it into a parent application context that may not be able to find Spring MVC’s `HandlerMappingIntrospector`.

<a id="_configuring_for_multiple_spring_mvc_dispatchers"></a>

#### Configuring for Multiple Spring MVC Dispatchers

If desired, any Spring Security configuration that is unrelated to Spring MVC may be placed in a different configuration class like so:

```java
public class MvcWebApplicationInitializer extends
		AbstractAnnotationConfigDispatcherServletInitializer {

	@Override
    protected Class<?>[] getRootConfigClasses() {
		return new Class[] { NonWebSecurityConfig.class };
    }

	@Override
	protected Class<?>[] getServletConfigClasses() {
		return new Class[] { WebSecurityConfig.class, WebMvcConfig.class };
	}

	// ... other overrides ...
}
```

This can be helpful if you have multiple instances of `AbstractAnnotationConfigDispatcherServletInitializer` and don’t want to duplicate the general security configuration across both of them.

<a id="jc-httpsecurity"></a>

## HttpSecurity

Thus far, our [`WebSecurityConfig`](#jc-hello-wsca) contains only information about how to authenticate our users.
How does Spring Security know that we want to require all users to be authenticated?
How does Spring Security know we want to support form-based authentication?
Actually, there is a configuration class (called `SecurityFilterChain`) that is being invoked behind the scenes.
It is configured with the following default implementation:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests(authorize -> authorize
			.anyRequest().authenticated()
		)
		.formLogin(Customizer.withDefaults())
		.httpBasic(Customizer.withDefaults());
	return http.build();
}
```

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

<a id="multiple-httpsecurity-instances-java"></a>

```java
@Configuration
@EnableWebSecurity
public class MultiHttpSecurityConfig {
	@Bean                                                             <1>
	public UserDetailsService userDetailsService() throws Exception {
		UserBuilder users = User.withDefaultPasswordEncoder();
		InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
		manager.createUser(users.username("user").password("password").roles("USER").build());
		manager.createUser(users.username("admin").password("password").roles("USER","ADMIN").build());
		return manager;
	}

	@Bean
	@Order(1)                                                        <2>
	public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
		http
			.securityMatcher("/api/**")                              <3>
			.authorizeHttpRequests(authorize -> authorize
				.anyRequest().hasRole("ADMIN")
			)
			.httpBasic(Customizer.withDefaults());
		return http.build();
	}

	@Bean                                                            <4>
	public SecurityFilterChain formLoginFilterChain(HttpSecurity http) throws Exception {
		http
			.authorizeHttpRequests(authorize -> authorize
				.anyRequest().authenticated()
			)
			.formLogin(Customizer.withDefaults());
		return http.build();
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

<a id="choosing-security-matcher-request-matchers-java"></a>

```java
@Configuration
@EnableWebSecurity
public class PartialSecurityConfig {

	@Bean
	public UserDetailsService userDetailsService() throws Exception {
		// ...
	}

	@Bean
	public SecurityFilterChain securedFilterChain(HttpSecurity http) throws Exception {
		http
			.securityMatcher("/secured/**")                            <1>
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers("/secured/user").hasRole("USER")      <2>
				.requestMatchers("/secured/admin").hasRole("ADMIN")    <3>
				.anyRequest().authenticated()                          <4>
			)
			.httpBasic(Customizer.withDefaults())
			.formLogin(Customizer.withDefaults());
		return http.build();
	}
}
```

1. Requests that begin with `/secured/` will be protected but any other requests are not protected.
1. Requests to `/secured/user` require the `ROLE_USER` authority.
1. Requests to `/secured/admin` require the `ROLE_ADMIN` authority.
1. Any other requests (such as `/secured/other`) simply require an authenticated user.

> [!TIP]
> It is *recommended* to provide a `SecurityFilterChain` that does not specify any `securityMatcher` to ensure the entire application is protected, as demonstrated in the [earlier example](#multiple-httpsecurity-instances-java).

Notice that the `requestMatchers` method only applies to individual authorization rules.
Each request listed there must also match the overall `securityMatcher` for this particular `HttpSecurity` instance used to create the `SecurityFilterChain`.
Using `anyRequest()` in this example matches all other requests within this particular `SecurityFilterChain` (which must begin with `/secured/`).

> [!NOTE]
> See [Authorize HttpServletRequests](../authorization/authorize-http-requests.md) for more information on `requestMatchers`.

<a id="_securityfilterchain_endpoints"></a>

### `SecurityFilterChain` Endpoints

Several filters in the `SecurityFilterChain` directly provide endpoints, such as the `UsernamePasswordAuthenticationFilter` which is set up by `http.formLogin()` and provides the `POST /login` endpoint.
In the [above example](#choosing-security-matcher-request-matchers-java), the `/login` endpoint is not matched by `http.securityMatcher("/secured/**")` and therefore that application would not have any `GET /login` or `POST /login` endpoint.
Such requests would return `404 Not Found`.
This is often surprising to users.

Specifying `http.securityMatcher()` affects what requests are matched by that `SecurityFilterChain`.
However, it does not automatically affect endpoints provided by the filter chain.
In such cases, you may need to customize the URL of any endpoints you would like the filter chain to provide.

The following example demonstrates a configuration that secures requests that begin with `/secured/` and denies all other requests, while also customizing endpoints provided by the `SecurityFilterChain`:

<a id="security-filter-chain-endpoints-java"></a>

```java
@Configuration
@EnableWebSecurity
public class SecuredSecurityConfig {

	@Bean
	public UserDetailsService userDetailsService() throws Exception {
		// ...
	}

	@Bean
	@Order(1)
	public SecurityFilterChain securedFilterChain(HttpSecurity http) throws Exception {
		http
			.securityMatcher("/secured/**")                            <1>
			.authorizeHttpRequests(authorize -> authorize
				.anyRequest().authenticated()                          <2>
			)
			.formLogin(formLogin -> formLogin                          <3>
				.loginPage("/secured/login")
				.loginProcessingUrl("/secured/login")
				.permitAll()
			)
			.logout(logout -> logout                                   <4>
				.logoutUrl("/secured/logout")
				.logoutSuccessUrl("/secured/login?logout")
				.permitAll()
			)
			.formLogin(Customizer.withDefaults());
		return http.build();
	}

	@Bean
	public SecurityFilterChain defaultFilterChain(HttpSecurity http) throws Exception {
		http
			.authorizeHttpRequests(authorize -> authorize
				.anyRequest().denyAll()                                <5>
			);
		return http.build();
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

<a id="real-world-example-java"></a>

```java
@Configuration
@EnableWebSecurity
public class BankingSecurityConfig {

    @Bean                                                              <1>
    public UserDetailsService userDetailsService() {
		UserBuilder users = User.withDefaultPasswordEncoder();
        InMemoryUserDetailsManager manager = new InMemoryUserDetailsManager();
        manager.createUser(users.username("user1").password("password").roles("USER", "VIEW_BALANCE").build());
        manager.createUser(users.username("user2").password("password").roles("USER").build());
        manager.createUser(users.username("admin").password("password").roles("ADMIN").build());
        return manager;
    }

    @Bean
    @Order(1)                                                          <2>
    public SecurityFilterChain approvalsSecurityFilterChain(HttpSecurity http) throws Exception {
        String[] approvalsPaths = { "/accounts/approvals/**", "/loans/approvals/**", "/credit-cards/approvals/**" };
        http
            .securityMatcher(approvalsPaths)
            .authorizeHttpRequests(authorize -> authorize
				.anyRequest().hasRole("ADMIN")
            )
            .httpBasic(Customizer.withDefaults());
        return http.build();
    }

    @Bean
    @Order(2)                                                          <3>
    public SecurityFilterChain bankingSecurityFilterChain(HttpSecurity http) throws Exception {
        String[] bankingPaths = { "/accounts/**", "/loans/**", "/credit-cards/**", "/balances/**" };
		String[] viewBalancePaths = { "/balances/**" };
        http
			.securityMatcher(bankingPaths)
			.authorizeHttpRequests(authorize -> authorize
				.requestMatchers(viewBalancePaths).hasRole("VIEW_BALANCE")
				.anyRequest().hasRole("USER")
            );
        return http.build();
    }

    @Bean                                                              <4>
    public SecurityFilterChain defaultSecurityFilterChain(HttpSecurity http) throws Exception {
		String[] allowedPaths = { "/", "/user-login", "/user-logout", "/notices", "/contact", "/register" };
        http
            .authorizeHttpRequests(authorize -> authorize
				.requestMatchers(allowedPaths).permitAll()
				.anyRequest().authenticated()
            )
			.formLogin(formLogin -> formLogin
				.loginPage("/user-login")
				.loginProcessingUrl("/user-login")
			)
			.logout(logout -> logout
				.logoutUrl("/user-logout")
				.logoutSuccessUrl("/?logout")
			);
        return http.build();
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

<a id="jc-custom-dsls"></a>

## Custom DSLs

You can provide your own custom DSLs in Spring Security:

#### Java

```java
public class MyCustomDsl extends AbstractHttpConfigurer<MyCustomDsl, HttpSecurity> {
	private boolean flag;

	@Override
	public void init(HttpSecurity http) throws Exception {
		// any method that adds another configurer
		// must be done in the init method
		http.csrf().disable();
	}

	@Override
	public void configure(HttpSecurity http) throws Exception {
		ApplicationContext context = http.getSharedObject(ApplicationContext.class);

		// here we lookup from the ApplicationContext. You can also just create a new instance.
		MyFilter myFilter = context.getBean(MyFilter.class);
		myFilter.setFlag(flag);
		http.addFilterBefore(myFilter, UsernamePasswordAuthenticationFilter.class);
	}

	public MyCustomDsl flag(boolean value) {
		this.flag = value;
		return this;
	}

	public static MyCustomDsl customDsl() {
		return new MyCustomDsl();
	}
}
```

#### Kotlin

```kotlin
class MyCustomDsl : AbstractHttpConfigurer<MyCustomDsl, HttpSecurity>() {
    var flag: Boolean = false

    override fun init(http: HttpSecurity) {
        // any method that adds another configurer
        // must be done in the init method
        http.csrf().disable()
    }

    override fun configure(http: HttpSecurity) {
        val context: ApplicationContext = http.getSharedObject(ApplicationContext::class.java)

        // here we lookup from the ApplicationContext. You can also just create a new instance.
        val myFilter: MyFilter = context.getBean(MyFilter::class.java)
        myFilter.setFlag(flag)
        http.addFilterBefore(myFilter, UsernamePasswordAuthenticationFilter::class.java)
    }

    companion object {
        @JvmStatic
        fun customDsl(): MyCustomDsl {
            return MyCustomDsl()
        }
    }
}
```

> [!NOTE]
> This is actually how methods like `HttpSecurity.authorizeHttpRequests()` are implemented.

You can then use the custom DSL:

#### Java

```java
@Configuration
@EnableWebSecurity
public class Config {
	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
			.with(MyCustomDsl.customDsl(), (dsl) -> dsl
				.flag(true)
			)
			// ...
		return http.build();
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
class Config {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .with(MyCustomDsl.customDsl()) {
                flag = true
            }
            // ...

        return http.build()
    }
}
```

The code is invoked in the following order:

- Code in the `Config.filterChain` method is invoked
- Code in the `MyCustomDsl.init` method is invoked
- Code in the `MyCustomDsl.configure` method is invoked

If you want, you can have `HttpSecurity` add `MyCustomDsl` by default by using `SpringFactories`.
For example, you can create a resource on the classpath named `META-INF/spring.factories` with the following contents:

#### META-INF/spring.factories

```
org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer = sample.MyCustomDsl
```

You can also explicit disable the default:

#### Java

```java
@Configuration
@EnableWebSecurity
public class Config {
	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		http
			.with(MyCustomDsl.customDsl(), (dsl) -> dsl
				.disable()
			)
			...;
		return http.build();
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
class Config {

    @Bean
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .with(MyCustomDsl.customDsl()) {
                disable()
            }
            // ...
        return http.build()
    }

}
```

<a id="post-processing-configured-objects"></a>

## Post Processing Configured Objects

Spring Security’s Java configuration does not expose every property of every object that it configures.
This simplifies the configuration for a majority of users.
After all, if every property were exposed, users could use standard bean configuration.

While there are good reasons to not directly expose every property, users may still need more advanced configuration options.
To address this issue, Spring Security introduces the concept of an `ObjectPostProcessor`, which can be used to modify or replace many of the `Object` instances created by the Java Configuration.
For example, to configure the `filterSecurityPublishAuthorizationSuccess` property on `FilterSecurityInterceptor`, you can use the following:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests(authorize -> authorize
			.anyRequest().authenticated()
			.withObjectPostProcessor(new ObjectPostProcessor<FilterSecurityInterceptor>() {
				public <O extends FilterSecurityInterceptor> O postProcess(
						O fsi) {
					fsi.setPublishAuthorizationSuccess(true);
					return fsi;
				}
			})
		);
	return http.build();
}
```
