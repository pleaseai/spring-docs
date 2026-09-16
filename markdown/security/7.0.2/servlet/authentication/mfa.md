---
title: "Multi-Factor Authentication"
source: "ROOT:servlet/authentication/mfa.adoc"
---

# Multi-Factor Authentication

[Multi-Factor Authentication (MFA)](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html) requires that a user provide factors in order to authenticate.
OWASP places factors into the following categories:

- Something the user knows (e.g. a password)
- Something that the user has (e.g. access to SMS or email)
- Something you are (e.g. biometrics)
- Somewhere you are (e.g. geolocation)
- Something you do (e.g. Behavior Profiling)

<a id="_factorgrantedauthority"></a>

## `FactorGrantedAuthority`

At the time of authentication, Spring Security’s authentication mechanisms add a [`FactorGrantedAuthority`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/core/authority/FactorGrantedAuthority.html).
For example, when a user authenticates using a password a `FactorGrantedAuthority` with the `authority` of `FactorGrantedAuthority.PASSWORD_AUTHORITY` is automatically added to the `Authentiation`.
In order to require MFA with Spring Security you must:

- Specify an authorization rule that requires multiple factors
- Setup authentication for each of those factors

<a id="emfa"></a>

## @EnableMultiFactorAuthentication

[`@EnableMultiFactorAuthentication`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/config/annotation/authorization/EnableMultiFactorAuthentication.html) makes it easy to enable multifactor authentication.
Below you can find a configuration that adds the requirement for both passwords and OTT to every authorization rule.

#### Java

```java
@EnableMultiFactorAuthentication(authorities = {
	FactorGrantedAuthority.PASSWORD_AUTHORITY,
	FactorGrantedAuthority.OTT_AUTHORITY })
```

#### Kotlin

```kotlin
@EnableMultiFactorAuthentication( authorities = [
    FactorGrantedAuthority.PASSWORD_AUTHORITY,
    FactorGrantedAuthority.OTT_AUTHORITY])
```

We are now able to concisely create a configuration that always requires multiple factors.

#### Java

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests((authorize) -> authorize
			// <1>
			.requestMatchers("/admin/**").hasRole("ADMIN")
			// <2>
			.anyRequest().authenticated()
		)
		// <3>
		.formLogin(Customizer.withDefaults())
		.oneTimeTokenLogin(Customizer.withDefaults());
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain? {
    http {
        authorizeHttpRequests {
            // <1>
            authorize("/admin/**", hasRole("ADMIN"))
            // <2>
            authorize(anyRequest, authenticated)
        }
        // <3>
        formLogin { }
        oneTimeTokenLogin {  }
    }
    return http.build()
}
```

1. URLs that begin with `/admin/**` require the authorities `FACTOR_OTT`, `FACTOR_PASSWORD`, `ROLE_ADMIN`.
1. Every other URL requires the authorities `FACTOR_OTT`, `FACTOR_PASSWORD`
1. Set up the authentication mechanisms that can provide the required factors.

Spring Security behind the scenes knows which endpoint to go to depending on which authority is missing.
If the user logged in initially with their username and password, then Spring Security redirects to the One-Time-Token Login page.
If the user logged in initially with a token, then Spring Security redirects to the Username/Password Login page.

<a id="authorization-manager-factory"></a>

## AuthorizationManagerFactory

The `@EnableMultiFactorAuthentication` `authorities` property is just a shortcut for publishing an [`AuthorizationManagerFactory`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/authorization/AuthorizationManagerFactory.html) Bean.
When an `AuthorizationManagerFactory` Bean is available, it is used by Spring Security to create authorization rules, like `hasAnyRole(String)`, that are defined on the `AuthorizationManagerFactory` Bean interface.
The implementation published by `@EnableMultiFactorAuthentication` will ensure that each authorization is combined with the requirement of having the specified factors.

The `AuthorizationManagerFactory` Bean below is what is published in the previously discussed [`@EnableMultiFactorAuthentication` example](#emfa).

#### Java

```java
@Bean
AuthorizationManagerFactory<Object> authz() {
	return AuthorizationManagerFactories.multiFactor()
		.requireFactors(
			FactorGrantedAuthority.PASSWORD_AUTHORITY,
			FactorGrantedAuthority.OTT_AUTHORITY
		)
		.build();
}
```

#### Kotlin

```kotlin
@Bean
fun authz(): AuthorizationManagerFactory<Object> {
    return AuthorizationManagerFactories.multiFactor<Object>()
        .requireFactors(
            FactorGrantedAuthority.PASSWORD_AUTHORITY,
            FactorGrantedAuthority.OTT_AUTHORITY
        )
        .build()
}
```

<a id="selective-mfa"></a>

## Selectively Requiring MFA

We have demonstrated how to configure an entire application to require MFA by using [`@EnableMultiFactorAuthentication`](#emfa)s `authorities` property.
However, there are times that an application only wants parts of the application to require MFA.
Consider the following requirements:

- URLs that begin with `/admin/` should require the authorities `FACTOR_OTT`, `FACTOR_PASSWORD`, `ROLE_ADMIN`.
- URLs that begin with `/user/settings` should require the authorities `FACTOR_OTT`, `FACTOR_PASSWORD`
- Every other URL requires an authenticated user

In this case, some URLs require MFA while others do not.
This means that the global approach that we saw before does not work.
Fortunately, we can use what we learned in [AuthorizationManagerFactory](#authorization-manager-factory) to solve this in a concise manner.

Start by specifying `@EnableMultiFactorAuthentication` without any authorities.
By doing so we enable MFA support, but no `AuthorizationManagerFactory` Bean is published.

#### Java

```java
@EnableMultiFactorAuthentication(authorities = {})
```

#### Kotlin

```kotlin
@EnableMultiFactorAuthentication(authorities = [])
```

Next create an `AuthorizationManagerFactory` instance, but do not publish it as a Bean.

#### Java

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	// <1>
	var mfa = AuthorizationManagerFactories.multiFactor()
		.requireFactors(
			FactorGrantedAuthority.PASSWORD_AUTHORITY,
			FactorGrantedAuthority.OTT_AUTHORITY
		)
		.build();
	http
		.authorizeHttpRequests((authorize) -> authorize
			// <2>
			.requestMatchers("/admin/**").access(mfa.hasRole("ADMIN"))
			// <3>
			.requestMatchers("/user/settings/**").access(mfa.authenticated())
			// <4>
			.anyRequest().authenticated()
		)
		// <5>
		.formLogin(Customizer.withDefaults())
		.oneTimeTokenLogin(Customizer.withDefaults());
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
@Throws(Exception::class)
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain? {
    // <1>
    val mfa = AuthorizationManagerFactories.multiFactor<Any>()
        .requireFactors(
            FactorGrantedAuthority.PASSWORD_AUTHORITY,
            FactorGrantedAuthority.OTT_AUTHORITY
        )
        .build()
    http {
        authorizeHttpRequests {
            // <2>
            authorize("/admin/**", mfa.hasRole("ADMIN"))
            // <3>
            authorize("/user/settings/**", mfa.authenticated())
            // <4>
            authorize(anyRequest, authenticated)
        }
        // <5>
        formLogin { }
        oneTimeTokenLogin {  }
    }
    return http.build()
}

```

1. Create a `DefaultAuthorizationManagerFactory` as we did previously, but do not publish it as a Bean.
By not publishing it as a Bean, we are able to selectively use the `AuthorizationManagerFactory` instead of using it for every authorization rule.
1. Explicitly use `AuthorizationManagerFactory` so that URLs that begin with `/admin/**` require `FACTOR_OTT`, `FACTOR_PASSWORD`, and `ROLE_ADMIN`.
1. Explicitly use `AuthorizationManagerFactory` so that URLs that begin with `/user/settings` require `FACTOR_OTT` and `FACTOR_PASSWORD`
1. Otherwise, the request must be authenticated.
There is no MFA requirement, because the `AuthorizationManagerFactory` is not used.
1. Set up the authentication mechanisms that can provide the required factors.

<a id="valid-duration"></a>

## Specifying a Valid Duration

At times, we may want to define authorization rules based upon how recently we authenticated.
For example, an application may want to require that the user has authenticated within the last hour in order to allow access to the `/user/settings` endpoint.

Remember at the time of authentication, a `FactorGrantedAuthority` is added to the `Authentication`.
The `FactorGrantedAuthority` specifies when it was `issuedAt`, but does not describe how long it is valid for.
This is intentional, because it allows a single `FactorGrantedAuthority` to be used with different `validDuration`s.

Let’s take a look at an example that illustrates how to meet the following requirements:

- URLs that begin with `/admin/` should require that a password has been provided within the last 30 minutes
- URLs that being with `/user/settings` should require that a password has been provided within the last hour
- Otherwise, authentication is required, but it does not care if it is a password or how long ago authentication occurred

#### Java

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	// <1>
	var passwordIn30m = AuthorizationManagerFactories.multiFactor()
		.requireFactor( (factor) -> factor
			.passwordAuthority()
			.validDuration(Duration.ofMinutes(30))
		)
		.build();
	// <2>
	var passwordInHour = AuthorizationManagerFactories.multiFactor()
		.requireFactor( (factor) -> factor
			.passwordAuthority()
			.validDuration(Duration.ofHours(1))
		)
		.build();
	http
		.authorizeHttpRequests((authorize) -> authorize
			// <3>
			.requestMatchers("/admin/**").access(passwordIn30m.hasRole("ADMIN"))
			// <4>
			.requestMatchers("/user/settings/**").access(passwordInHour.authenticated())
			// <5>
			.anyRequest().authenticated()
		)
		// <6>
		.formLogin(Customizer.withDefaults());
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
@Throws(Exception::class)
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain? {
    // <1>
    val passwordIn30m = AuthorizationManagerFactories.multiFactor<Any>()
        .requireFactor( { factor -> factor
            .passwordAuthority()
            .validDuration(Duration.ofMinutes(30))
        })
        .build()
    // <2>
    val passwordInHour = AuthorizationManagerFactories.multiFactor<Any>()
        .requireFactor( { factor -> factor
            .passwordAuthority()
            .validDuration(Duration.ofHours(1))
        })
        .build()
    http {
        authorizeHttpRequests {
            // <3>
            authorize("/admin/**", passwordIn30m.hasRole("ADMIN"))
            // <4>
            authorize("/user/settings/**", passwordInHour.authenticated())
            // <5>
            authorize(anyRequest, authenticated)
        }
        // <6>
        formLogin { }
    }
    return http.build()
}

```

1. First we define `passwordIn30m` as a requirement for a password within 30 minutes
1. Next, we define `passwordInHour` as a requirement for a password within an hour
1. We use `passwordIn30m` to require that URLs that begin with `/admin/` should require that a password has been provided in the last 30 minutes and that the user has the `ROLE_ADMIN` authority
1. We use `passwordInHour` to require that URLs that begin with `/user/settings` should require that a password has been provided in the last hour
1. Otherwise, authentication is required, but it does not care if it is a password or how long ago authentication occurred
1. Set up the authentication mechanisms that can provide the required factors.

<a id="programmatic-mfa"></a>

## Programmatic MFA

In our previous examples, MFA is a static decision per request.
There are times when we might want to require MFA for some users, but not others.
Determining if MFA is enabled per user can be achieved by creating a custom `AuthorizationManager` that conditionally requires factors based upon the `Authentication`.

#### Java

```java
@Component
class AdminMfaAuthorizationManager implements AuthorizationManager<Object> {
	@Override
	public AuthorizationResult authorize(Supplier<? extends @Nullable Authentication> authentication, Object context) {
		if ("admin".equals(authentication.get().getName())) {
			AuthorizationManager<Object> admins =
				AllAuthoritiesAuthorizationManager.hasAllAuthorities(
					FactorGrantedAuthority.OTT_AUTHORITY,
					FactorGrantedAuthority.PASSWORD_AUTHORITY
				);
			// <1>
			return admins.authorize(authentication, context);
		} else {
			// <2>
			return new AuthorizationDecision(true);
		}
	}
}
```

#### Kotlin

```kotlin
@Component
internal open class AdminMfaAuthorizationManager : AuthorizationManager<Object> {
    override fun authorize(
        authentication: Supplier<out Authentication?>, context: Object): AuthorizationResult {
        return if ("admin" == authentication.get().name) {
            var admins =
                AllAuthoritiesAuthorizationManager.hasAllAuthorities<Any>(
                    FactorGrantedAuthority.OTT_AUTHORITY,
                    FactorGrantedAuthority.PASSWORD_AUTHORITY)
            // <1>
            admins.authorize(authentication, context)
        } else {
            // <2>
            AuthorizationDecision(true)
        }
    }
}
```

1. MFA is required for the user with the username `admin`
1. Otherwise, MFA is not required

To enable the MFA rules globally, we can publish an `AuthorizationManagerFactory` Bean.

#### Java

```java
@Bean
AuthorizationManagerFactory<Object> authorizationManagerFactory(
		AdminMfaAuthorizationManager admins) {
	DefaultAuthorizationManagerFactory<Object> defaults = new DefaultAuthorizationManagerFactory<>();
	// <1>
	defaults.setAdditionalAuthorization(admins);
	// <2>
	return defaults;
}
```

#### Kotlin

```kotlin
@Bean
fun authorizationManagerFactory(admins: AdminMfaAuthorizationManager): AuthorizationManagerFactory<Object> {
    val defaults = DefaultAuthorizationManagerFactory<Object>()
    // <1>
    defaults.setAdditionalAuthorization(admins)
    // <2>
    return defaults
}
```

1. Inject the custom `AuthorizationManager` as the [DefaultAuthorization.additionalAuthorization](<https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/authorization/DefaultAuthorizationManagerFactory.html#setAdditionalAuthorization(org.springframework.security.authorization.AuthorizationManager)>).
This instructs `DefaultAuthorizationManagerFactory` that any authorization rule should apply our custom `AuthorizationManager` along with any authorization requirements defined by the application (e.g. `hasRole("ADMIN")).
1. Publish `DefaultAuthorizationManagerFactory` as a Bean, so it is used globally

This should feel very similar to our previous example in [AuthorizationManagerFactory](#authorization-manager-factory).
The difference is that in the previous example, the `AuthorizationManagerFactories` is setting `DefaultAuthorization.additionalAuthorization` with a built in `AuthorizationManager` that always requires the same authorities.

We can now define our authorization rules which are combined with `AdminMfaAuthorizationManager`.

#### Java

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests((authorize) -> authorize
			.requestMatchers("/admin/**").hasRole("ADMIN")
			.anyRequest().authenticated()
		)
		.formLogin(Customizer.withDefaults())
		.oneTimeTokenLogin(Customizer.withDefaults());
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain? {
    http {
        authorizeHttpRequests {
            // <1>
            authorize("/admin/**", hasRole("ADMIN"))
            // <2>
            authorize(anyRequest, authenticated)
        }
        formLogin { }
        oneTimeTokenLogin { }
    }
    return http.build()
}
```

1. URLs that begin with `/admin/**` require `ROLE_ADMIN`.
If the username is `admin`, then `FACTOR_OTT` and `FACTOR_PASSWORD` are also required.
1. Otherwise, the request must be authenticated.
If the username is `admin`, then `FACTOR_OTT` and `FACTOR_PASSWORD` are also required.

> [!NOTE]
> MFA is enabled by username and not role because that is how we implemented `RequiredAuthoritiesAuthorizationManagerConfiguration`.
> If we preferred, we could change our logic to enable MFA based upon the roles rather than the username.

<a id="raam-mfa"></a>

## RequiredAuthoritiesAuthorizationManager

We’ve demonstrated how we can dynamically determine the authorities for a particular user in [Programmatic MFA](#programmatic-mfa) using a custom `AuthorizationManager`.
However, this is such a common scenario that Spring Security provides built in support using [`RequiredAuthoritiesAuthorizationManager`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/authorization/RequiredAuthoritiesAuthorizationManager.html) and [`RequiredAuthoritiesRepository`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/authorization/RequiredAuthoritiesRepository.html).

Let’s implement the same requirement that we did in [Programmatic MFA](#programmatic-mfa) using the built-in support.

We start by creating the `RequiredAuthoritiesAuthorizationManager` Bean to use.

#### Java

```java
@Bean
RequiredAuthoritiesAuthorizationManager<Object> adminAuthorization() {
	// <1>
	MapRequiredAuthoritiesRepository authorities = new MapRequiredAuthoritiesRepository();
	authorities.saveRequiredAuthorities("admin", List.of(
		FactorGrantedAuthority.PASSWORD_AUTHORITY,
		FactorGrantedAuthority.OTT_AUTHORITY)
	);
	// <2>
	return new RequiredAuthoritiesAuthorizationManager<>(authorities);
}
```

#### Kotlin

```kotlin
@Bean
fun adminAuthorization(): RequiredAuthoritiesAuthorizationManager<Object> {
    // <1>
    val authorities = MapRequiredAuthoritiesRepository()
    authorities.saveRequiredAuthorities("admin", List.of(
        FactorGrantedAuthority.PASSWORD_AUTHORITY,
        FactorGrantedAuthority.OTT_AUTHORITY)
    )
    // <2>
    return RequiredAuthoritiesAuthorizationManager(authorities)
}
```

1. Create a [`MapRequiredAuthoritiesRepository`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/authorization/MapRequiredAuthoritiesRepository.html) that maps users with the username `admin` to require MFA.
1. Return a `RequiredAuthoritiesAuthorizationManager` that is injected with the `MapRequiredAuthoritiesRepository`.

Next we can define an `AuthorizationManagerFactory` that uses the `RequiredAuthoritiesAuthorizationManager`.

#### Java

```java
@Bean
AuthorizationManagerFactory<Object> authorizationManagerFactory(
		RequiredAuthoritiesAuthorizationManager admins) {
	DefaultAuthorizationManagerFactory<Object> defaults = new DefaultAuthorizationManagerFactory<>();
	// <1>
	defaults.setAdditionalAuthorization(admins);
	// <2>
	return defaults;
}
```

#### Kotlin

```kotlin
@Bean
fun authorizationManagerFactory(admins: RequiredAuthoritiesAuthorizationManager<Object>): AuthorizationManagerFactory<Object> {
    val defaults = DefaultAuthorizationManagerFactory<Object>()
    // <1>
    defaults.setAdditionalAuthorization(admins)
    // <2>
    return defaults
}
```

1. Inject the `RequiredAuthoritiesAuthorizationManager` as the [DefaultAuthorization.additionalAuthorization](<https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/authorization/DefaultAuthorizationManagerFactory.html#setAdditionalAuthorization(org.springframework.security.authorization.AuthorizationManager)>).
This instructs `DefaultAuthorizationManagerFactory` that any authorization rule should apply `RequiredAuthoritiesAuthorizationManager` along with any authorization requirements defined by the application (e.g. `hasRole("ADMIN")).
1. Publish `DefaultAuthorizationManagerFactory` as a Bean, so it is used globally

We can now define our authorization rules which are combined with `RequiredAuthoritiesAuthorizationManager`.
include-code::./RequiredAuthoritiesAuthorizationManagerConfiguration\[tag=httpSecurity,indent=0\]
<1> URLs that begin with `/admin/**` require `ROLE_ADMIN`.
If the username is `admin`, then `FACTOR_OTT` and `FACTOR_PASSWORD` are also required.
<2> Otherwise, the request must be authenticated.
If the username is `admin`, then `FACTOR_OTT` and `FACTOR_PASSWORD` are also required.

Our example uses an in memory mapping of usernames to the additional required authorities.
For more dynamic use cases that can be determined by the username, a custom implementation of [`RequiredAuthoritiesRepository`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/authorization/RequiredAuthoritiesRepository.html) can be created.
Possible examples would be looking up if a user has enabled MFA in an explicit setting, determining if a user has registered a passkey, etc.

For cases that need to determine MFA based upon the `Authentication`, a custom `AuthorizationManger` can be used as demonstrated in [Programmatic MFA](#programmatic-mfa)

<a id="hasallauthorities"></a>

## Using hasAllAuthorities

We’ve shown a lot of additional infrastructure for supporting MFA.
However, for simple MFA use-cases, using `hasAllAuthorities` to require multiple factors is effective.

#### Java

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests((authorize) -> authorize
			// <1>
			.anyRequest().hasAllAuthorities(
				FactorGrantedAuthority.PASSWORD_AUTHORITY,
				FactorGrantedAuthority.OTT_AUTHORITY
			)
		)
		// <2>
		.formLogin(Customizer.withDefaults())
		.oneTimeTokenLogin(Customizer.withDefaults());
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain? {
    http {
        authorizeHttpRequests {
            // <1>
            authorize(anyRequest, hasAllAuthorities(
                FactorGrantedAuthority.PASSWORD_AUTHORITY,
                FactorGrantedAuthority.OTT_AUTHORITY
            ))
        }
        // <2>
        formLogin { }
        oneTimeTokenLogin {  }
    }
    return http.build()
}
```

1. Require `FACTOR_PASSWORD` and `FACTOR_OTT` for every request
1. Set up the authentication mechanisms that can provide the required factors.

The configuration above works well only for the most simple use-cases.
If you have lots of endpoints, you probably do not want to repeat the requirements for MFA in every authorization rule.

For example, consider the following configuration:

#### Java

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests((authorize) -> authorize
			// <1>
			.requestMatchers("/admin/**").hasAllAuthorities(
				"ROLE_ADMIN",
				FactorGrantedAuthority.PASSWORD_AUTHORITY,
				FactorGrantedAuthority.OTT_AUTHORITY
			)
			// <2>
			.anyRequest().hasAllAuthorities(
				"ROLE_USER",
				FactorGrantedAuthority.PASSWORD_AUTHORITY,
				FactorGrantedAuthority.OTT_AUTHORITY
			)
		)
		// <3>
		.formLogin(Customizer.withDefaults())
		.oneTimeTokenLogin(Customizer.withDefaults());
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain? {
    http {
        authorizeHttpRequests {
            // <1>
            authorize("/admin/**", hasAllAuthorities(
                "ROLE_ADMIN",
                FactorGrantedAuthority.PASSWORD_AUTHORITY,
                FactorGrantedAuthority.OTT_AUTHORITY
            ))
            // <2>
            authorize(anyRequest, hasAllAuthorities(
                "ROLE_USER",
                FactorGrantedAuthority.PASSWORD_AUTHORITY,
                FactorGrantedAuthority.OTT_AUTHORITY
            ))
        }
        // <3>
        formLogin { }
        oneTimeTokenLogin {  }
    }
    return http.build()
}
```

1. For URLs that begin with `/admin/**`, the following authorities are required `FACTOR_OTT`, `FACTOR_PASSWORD`, `ROLE_ADMIN`.
1. For every other URL, the following authorities are required `FACTOR_OTT`, `FACTOR_PASSWORD`, `ROLE_USER`.
1. Set up the authentication mechanisms that can provide the required factors.

The configuration only specifies two authorization rules, but it is enough to see that the duplication is not desirable.
Can you imagine what it would be like to declare hundreds of rules like this?

What’s more that it becomes difficult to express more complicated authorization rules.
For example, how would you require two factors and either `ROLE_ADMIN` or `ROLE_USER`?

The answer to these questions, as we have already seen, is to use [\[egmfa\]](#egmfa)

<a id="re-authentication"></a>

## Re-authentication

The most common of these is re-authentication.
Imagine an application configured in the following way:

#### Java

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests((authorize) -> authorize.anyRequest().authenticated())
		.formLogin(Customizer.withDefaults())
		.oneTimeTokenLogin(Customizer.withDefaults());
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain? {
    http {
        authorizeHttpRequests {
            authorize(anyRequest, authenticated)
        }
        formLogin { }
        oneTimeTokenLogin { }
    }
    return http.build()
}
```

By default, this application has two authentication mechanisms that it allows, meaning that the user could use either one and be fully-authenticated.

If there is a set of endpoints that require a specific factor, we can specify that in `authorizeHttpRequests` as follows:

#### Java

```java
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests((authorize) -> authorize
			.requestMatchers("/profile/**").hasAuthority(FactorGrantedAuthority.OTT_AUTHORITY) // <1>
			.anyRequest().authenticated()
		)
		.formLogin(Customizer.withDefaults())
		.oneTimeTokenLogin(Customizer.withDefaults());
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain? {
    http {
        authorizeHttpRequests {
            authorize("/profile/**", hasAuthority(FactorGrantedAuthority.OTT_AUTHORITY)) // <1>
            authorize(anyRequest, authenticated)
        }
        formLogin { }
        oneTimeTokenLogin { }
    }
    return http.build()
}
```

1. - States that all `/profile/**` endpoints require one-time-token login to be authorized

Given the above configuration, users can log in with any mechanism that you support.
And, if they want to visit the profile page, then Spring Security will redirect them to the One-Time-Token Login page to obtain it.

In this way, the authority given to a user is directly proportional to the amount of proof given.
This adaptive approach allows users to give only the proof needed to perform their intended operations.

<a id="obtaining-more-authorization"></a>

## Authorizing More Scopes

You can also configure exception handling to direct Spring Security on how to obtain a missing scope.

Consider an application that requires a specific OAuth 2.0 scope for a given endpoint:

#### Java

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests((authorize) -> authorize
			.requestMatchers("/profile/**").hasAuthority("SCOPE_profile:read")
			.anyRequest().authenticated()
		)
		.x509(Customizer.withDefaults())
		.oauth2Login(Customizer.withDefaults());
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity): SecurityFilterChain? {
    http {
        authorizeHttpRequests {
            authorize("/profile/**", hasAuthority("SCOPE_profile:read"))
            authorize(anyRequest, authenticated)
        }
        x509 { }
        oauth2Login { }
    }
    return http.build()
}
```

If this is also configured with an `AuthorizationManagerFactory` bean like this one:

#### Java

```java
@Bean
AuthorizationManagerFactory<Object> authz() {
	return AuthorizationManagerFactories.multiFactor()
			.requireFactors(FactorGrantedAuthority.X509_AUTHORITY, FactorGrantedAuthority.AUTHORIZATION_CODE_AUTHORITY)
			.build();
}
```

#### Kotlin

```kotlin
@Bean
fun authz(): AuthorizationManagerFactory<Object> {
    return AuthorizationManagerFactories.multiFactor<Object>()
            .requireFactors(
                FactorGrantedAuthority.X509_AUTHORITY,
                FactorGrantedAuthority.AUTHORIZATION_CODE_AUTHORITY
            )
            .build()
}
```

Then the application will require an X.509 certificate as well as authorization from an OAuth 2.0 authorization server.

In the event that the user does not consent to `profile:read`, this application as it stands will issue a 403.
However, if you have a way for the application to re-ask for consent, then you can implement this in an `AuthenticationEntryPoint` like the following:

#### Java

```java
@Component
class ScopeRetrievingAuthenticationEntryPoint implements AuthenticationEntryPoint {
	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
			throws IOException, ServletException {
		response.sendRedirect("https://authz.example.org/authorize?scope=profile:read");
	}
}
```

#### Kotlin

```kotlin
@Component
internal class ScopeRetrievingAuthenticationEntryPoint : AuthenticationEntryPoint {
    override fun commence(request: HttpServletRequest, response: HttpServletResponse, authException: AuthenticationException) {
        response.sendRedirect("https://authz.example.org/authorize?scope=profile:read")
    }
}
```

Then, your filter chain declaration can bind this entry point to the given authority like so:

#### Java

```java
@Bean
SecurityFilterChain securityFilterChain(HttpSecurity http, ScopeRetrievingAuthenticationEntryPoint oauth2) throws Exception {
	http
		.authorizeHttpRequests((authorize) -> authorize
			.requestMatchers("/profile/**").hasAuthority("SCOPE_profile:read")
			.anyRequest().authenticated()
		)
		.x509(Customizer.withDefaults())
		.oauth2Login(Customizer.withDefaults())
		.exceptionHandling((exceptions) -> exceptions
			.defaultDeniedHandlerForMissingAuthority(oauth2, "SCOPE_profile:read")
		);
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilterChain(http: HttpSecurity, oauth2: ScopeRetrievingAuthenticationEntryPoint): DefaultSecurityFilterChain? {
    http {
        authorizeHttpRequests {
            authorize("/profile/**", hasAuthority("SCOPE_profile:read"))
            authorize(anyRequest, authenticated)
        }
        x509 { }
        oauth2Login { }
    }

    http.exceptionHandling { e: ExceptionHandlingConfigurer<HttpSecurity> -> e
        .defaultDeniedHandlerForMissingAuthority(oauth2, "SCOPE_profile:read")
    }
    return http.build()
}
```
