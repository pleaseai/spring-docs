---
title: "Form Login"
source: "ROOT:servlet/authentication/passwords/form.adoc"
---

<a id="servlet-authentication-form"></a>

# Form Login

Spring Security provides support for username and password being provided through an HTML form.
This section provides details on how form based authentication works within Spring Security.

This section examines how form-based login works within Spring Security.
First, we see how the user is redirected to the login form:

#### Redirecting to the Login Page

![loginurlauthenticationentrypoint](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/servlet/authentication/unpwd/loginurlauthenticationentrypoint.png)

The preceding figure builds off our [`SecurityFilterChain`](../../architecture.md#servlet-securityfilterchain) diagram.

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/icons/number_1.png) First, a user makes an unauthenticated request to the resource (`/private`) for which it is not authorized.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/icons/number_2.png) Spring Security’s [`AuthorizationFilter`](../../authorization/authorize-http-requests.md) indicates that the unauthenticated request is *Denied* by throwing an `AccessDeniedException`.

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/icons/number_3.png) Since the user is not authenticated, [`ExceptionTranslationFilter`](../../architecture.md#servlet-exceptiontranslationfilter) initiates *Start Authentication* and sends a redirect to the login page with the configured [`AuthenticationEntryPoint`](../architecture.md#servlet-authentication-authenticationentrypoint).
In most cases, the `AuthenticationEntryPoint` is an instance of [`LoginUrlAuthenticationEntryPoint`](https://docs.spring.io/spring-security/site/docs/6.3.3/api/org/springframework/security/web/authentication/LoginUrlAuthenticationEntryPoint.html).

![number 4](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/icons/number_4.png) The browser requests the login page to which it was redirected.

![number 5](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/icons/number_5.png) Something within the application, must [render the login page](#servlet-authentication-form-custom).

<a id="servlet-authentication-usernamepasswordauthenticationfilter"></a>

When the username and password are submitted, the `UsernamePasswordAuthenticationFilter` authenticates the username and password.
The `UsernamePasswordAuthenticationFilter` extends [AbstractAuthenticationProcessingFilter](../architecture.md#servlet-authentication-abstractprocessingfilter), so the following diagram should look pretty similar:

#### Authenticating Username and Password

![usernamepasswordauthenticationfilter](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/servlet/authentication/unpwd/usernamepasswordauthenticationfilter.png)

The figure builds off our [`SecurityFilterChain`](../../architecture.md#servlet-securityfilterchain) diagram.

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/icons/number_1.png) When the user submits their username and password, the `UsernamePasswordAuthenticationFilter` creates a `UsernamePasswordAuthenticationToken`, which is a type of  [`Authentication`](../architecture.md#servlet-authentication-authentication), by extracting the username and password from the `HttpServletRequest` instance.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/icons/number_2.png)  Next, the `UsernamePasswordAuthenticationToken` is passed into the `AuthenticationManager` instance to be authenticated.
The details of what `AuthenticationManager` looks like depend on how the [user information is stored](index.md#servlet-authentication-unpwd-storage).

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/icons/number_3.png) If authentication fails, then *Failure*.

1. The [SecurityContextHolder](../architecture.md#servlet-authentication-securitycontextholder) is cleared out.
1. `RememberMeServices.loginFail` is invoked.
If remember me is not configured, this is a no-op.
See the [`RememberMeServices`](https://docs.spring.io/spring-security/site/docs/6.3.3/api/org/springframework/security/web/authentication/RememberMeServices.html) interface in the Javadoc.
1. `AuthenticationFailureHandler` is invoked.
See the [`AuthenticationFailureHandler`](https://docs.spring.io/spring-security/site/docs/6.3.3/api/org/springframework/security/web/authentication/AuthenticationFailureHandler.html) class in the Javadoc

![number 4](https://raw.githubusercontent.com/spring-projects/spring-security/6.3.3/docs/modules/ROOT/assets/images/icons/number_4.png) If authentication is successful, then *Success*.

1. `SessionAuthenticationStrategy` is notified of a new login.
See the [`SessionAuthenticationStrategy`](https://docs.spring.io/spring-security/site/docs/6.3.3/api/org/springframework/security/web/authentication/session/SessionAuthenticationStrategy.html) interface in the Javadoc.
1. The [Authentication](../architecture.md#servlet-authentication-authentication) is set on the [SecurityContextHolder](../architecture.md#servlet-authentication-securitycontextholder).
See the [`SecurityContextPersistenceFilter`](https://docs.spring.io/spring-security/site/docs/6.3.3/api/org/springframework/security/web/context/SecurityContextPersistenceFilter.html) class in the Javadoc.
1. `RememberMeServices.loginSuccess` is invoked.
If remember me is not configured, this is a no-op.
See the [`RememberMeServices`](https://docs.spring.io/spring-security/site/docs/6.3.3/api/org/springframework/security/web/authentication/RememberMeServices.html) interface in the Javadoc.
1. `ApplicationEventPublisher` publishes an `InteractiveAuthenticationSuccessEvent`.
1. The `AuthenticationSuccessHandler` is invoked. Typically, this is a `SimpleUrlAuthenticationSuccessHandler`, which redirects to a request saved by [`ExceptionTranslationFilter`](../../architecture.md#servlet-exceptiontranslationfilter) when we redirect to the login page.

<a id="servlet-authentication-form-min"></a>

By default, Spring Security form login is enabled.
However, as soon as any servlet-based configuration is provided, form based login must be explicitly provided.
The following example shows a minimal, explicit Java configuration:

#### Java

```java
public SecurityFilterChain filterChain(HttpSecurity http) {
	http
		.formLogin(withDefaults());
	// ...
}
```

#### XML

```xml
<http>
	<!-- ... -->
	<form-login />
</http>
```

#### Kotlin

```kotlin
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
	http {
		formLogin { }
	}
	// ...
}
```

In the preceding configuration, Spring Security renders a default login page.
Most production applications require a custom login form.

<a id="servlet-authentication-form-custom"></a>

The following configuration demonstrates how to provide a custom login form.

#### Java

```java
public SecurityFilterChain filterChain(HttpSecurity http) {
	http
		.formLogin(form -> form
			.loginPage("/login")
			.permitAll()
		);
	// ...
}
```

#### XML

```xml
<http>
	<!-- ... -->
	<intercept-url pattern="/login" access="permitAll" />
	<form-login login-page="/login" />
</http>
```

#### Kotlin

```kotlin
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
	http {
		formLogin {
			loginPage = "/login"
			permitAll()
		}
	}
	// ...
}
```

<a id="servlet-authentication-form-custom-html"></a>

When the login page is specified in the Spring Security configuration, you are responsible for rendering the page.
The following [Thymeleaf](https://www.thymeleaf.org/) template produces an HTML login form that complies with a login page of `/login`.:

#### Login Form - src/main/resources/templates/login.html

```xml
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:th="https://www.thymeleaf.org">
	<head>
		<title>Please Log In</title>
	</head>
	<body>
		<h1>Please Log In</h1>
		<div th:if="${param.error}">
			Invalid username and password.</div>
		<div th:if="${param.logout}">
			You have been logged out.</div>
		<form th:action="@{/login}" method="post">
			<div>
			<input type="text" name="username" placeholder="Username"/>
			</div>
			<div>
			<input type="password" name="password" placeholder="Password"/>
			</div>
			<input type="submit" value="Log in" />
		</form>
	</body>
</html>
```

There are a few key points about the default HTML form:

- The form should perform a `post` to `/login`.
- The form needs to include a [CSRF Token](../../exploits/csrf.md#servlet-csrf), which is [automatically included](../../exploits/csrf.md#csrf-integration-form) by Thymeleaf.
- The form should specify the username in a parameter named `username`.
- The form should specify the password in a parameter named `password`.
- If the HTTP parameter named `error` is found, it indicates the user failed to provide a valid username or password.
- If the HTTP parameter named `logout` is found, it indicates the user has logged out successfully.

Many users do not need much more than to customize the login page.
However, if needed, you can customize everything shown earlier with additional configuration.

<a id="servlet-authentication-form-custom-controller"></a>

If you use Spring MVC, you need a controller that maps `GET /login` to the login template we created.
The following example shows a minimal `LoginController`:

#### Java

```java
@Controller
class LoginController {
	@GetMapping("/login")
	String login() {
		return "login";
	}
}
```

#### Kotlin

```kotlin
@Controller
class LoginController {
    @GetMapping("/login")
    fun login(): String {
        return "login"
    }
}
```
