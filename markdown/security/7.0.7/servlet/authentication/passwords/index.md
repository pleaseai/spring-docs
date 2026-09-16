---
title: "Username/Password Authentication"
source: "ROOT:servlet/authentication/passwords/index.adoc"
---

<a id="servlet-authentication-unpwd"></a>

# Username/Password Authentication

One of the most common ways to authenticate a user is by validating a username and password.
Spring Security provides comprehensive support for authenticating with a username and password.

You can configure username and password authentication using the following:

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.authorizeHttpRequests((authorize) -> authorize
				.anyRequest().authenticated()
			)
			.httpBasic(Customizer.withDefaults())
			.formLogin(Customizer.withDefaults());

		return http.build();
	}

	@Bean
	public UserDetailsService userDetailsService() {
		UserDetails userDetails = User.withDefaultPasswordEncoder()
			.username("user")
			.password("password")
			.roles("USER")
			.build();

		return new InMemoryUserDetailsManager(userDetails);
	}

}
```

#### XML

```xml
<http>
	<intercept-url pattern="/**" access="authenticated"/>
	<form-login />
	<http-basic />

	<user-service>
		<user name="user"
			password="{noop}password"
			authorities="ROLE_USER" />
	</user-service>
</http>
```

#### Kotlin

```kotlin
import org.springframework.security.config.annotation.web.invoke

@Configuration
@EnableWebSecurity
class SecurityConfig {

	@Bean
	fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
		http {
			authorizeHttpRequests {
				authorize(anyRequest, authenticated)
			}
			formLogin { }
			httpBasic { }
		}

		return http.build()
	}

	@Bean
	fun userDetailsService(): UserDetailsService {
		val user = User.withDefaultPasswordEncoder()
			.username("user")
			.password("password")
			.roles("USER")
			.build()

		return InMemoryUserDetailsManager(user)
	}

}
```

> [!WARNING]
> `User#withDefaultPasswordEncoder` is considered unsafe for production and is only intended for sample applications. See [User#withDefaultPasswordEncoder](<https://docs.spring.io/spring-security/site/docs/7.0.7/api/org/springframework/security/core/userdetails/User.html#withDefaultPasswordEncoder()>) for more details.

The preceding configuration automatically registers an [in-memory `UserDetailsService`](in-memory.md) with the `SecurityFilterChain`, registers the [`DaoAuthenticationProvider`](dao-authentication-provider.md) with the default [`AuthenticationManager`](../architecture.md#servlet-authentication-authenticationmanager), and enables [Form Login](form.md) and [HTTP Basic](basic.md) authentication.

To learn more about username/password authentication, consider the following use cases:

- I want to [learn how Form Login works](form.md)
- I want to [learn how HTTP Basic authentication works](basic.md)
- I want to [learn how `DaoAuthenticationProvider` works](dao-authentication-provider.md)
- I want to [manage users in memory](in-memory.md)
- I want to [manage users in a database](jdbc.md)
- I want to [manage users in LDAP](ldap.md#servlet-authentication-ldap-authentication)
- I want to [publish an `AuthenticationManager` bean](#publish-authentication-manager-bean) for custom authentication
- I want to [customize the global `AuthenticationManager`](#customize-global-authentication-manager)

<a id="publish-authentication-manager-bean"></a>

## Publish an `AuthenticationManager` bean

A fairly common requirement is publishing an `AuthenticationManager` bean to allow for custom authentication, such as in a `@Service` or Spring MVC `@Controller`.
For example, you may want to authenticate users via a REST API instead of using [Form Login](form.md).

You can publish such an `AuthenticationManager` for custom authentication scenarios using the following configuration:

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.authorizeHttpRequests((authorize) -> authorize
				.requestMatchers("/login").permitAll()
				.anyRequest().authenticated()
			);

		return http.build();
	}

	@Bean
	public AuthenticationManager authenticationManager(
			UserDetailsService userDetailsService,
			PasswordEncoder passwordEncoder) {
		DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider(userDetailsService);
		authenticationProvider.setPasswordEncoder(passwordEncoder);

		return new ProviderManager(authenticationProvider);
	}

	@Bean
	public UserDetailsService userDetailsService() {
		UserDetails userDetails = User.withDefaultPasswordEncoder()
			.username("user")
			.password("password")
			.roles("USER")
			.build();

		return new InMemoryUserDetailsManager(userDetails);
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder();
	}

}
```

#### XML

```xml
<http>
	<intercept-url pattern="/login" access="permitAll"/>
	<intercept-url pattern="/**" access="authenticated"/>

	<bean id="authenticationManager"
			class="org.springframework.security.authentication.ProviderManager">
		<constructor-arg>
			<bean class="org.springframework.security.authentication.dao.DaoAuthenticationProvider">
				<constructor-arg name="userDetailsService" ref="userDetailsService" />
				<property name="passwordEncoder" ref="passwordEncoder" />
			</bean>
		</constructor-arg>
	</bean>

	<user-service id="userDetailsService">
		<user name="user"
			password="{noop}password"
			authorities="ROLE_USER" />
	</user-service>

	<bean id="passwordEncoder"
			class="org.springframework.security.crypto.factory.PasswordEncoderFactories" factory-method="createDelegatingPasswordEncoder"/>
</http>
```

#### Kotlin

```kotlin
import org.springframework.security.config.annotation.web.invoke

@Configuration
@EnableWebSecurity
class SecurityConfig {

	@Bean
	fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
		http {
			authorizeHttpRequests {
				authorize("/login", permitAll)
				authorize(anyRequest, authenticated)
			}
		}

		return http.build()
	}

	@Bean
	fun authenticationManager(
			userDetailsService: UserDetailsService,
			passwordEncoder: PasswordEncoder): AuthenticationManager {
		val authenticationProvider = DaoAuthenticationProvider(userDetailsService)
		authenticationProvider.setPasswordEncoder(passwordEncoder)

		return ProviderManager(authenticationProvider)
	}

	@Bean
	fun userDetailsService(): UserDetailsService {
		val user = User.withDefaultPasswordEncoder()
			.username("user")
			.password("password")
			.roles("USER")
			.build()

		return InMemoryUserDetailsManager(user)
	}

	@Bean
	fun passwordEncoder(): PasswordEncoder {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder()
	}

}
```

With the preceding configuration in place, you can create a `@RestController` that uses the `AuthenticationManager` as follows:

#### Java

```java
@RestController
public class LoginController {

	private final AuthenticationManager authenticationManager;

	public LoginController(AuthenticationManager authenticationManager) {
		this.authenticationManager = authenticationManager;
	}

	@PostMapping("/login")
	public ResponseEntity<Void> login(@RequestBody LoginRequest loginRequest) {
		Authentication authenticationRequest =
			UsernamePasswordAuthenticationToken.unauthenticated(loginRequest.username(), loginRequest.password());
		Authentication authenticationResponse =
			this.authenticationManager.authenticate(authenticationRequest);
		// ...
	}

	public record LoginRequest(String username, String password) {
	}

}
```

#### Kotlin

```kotlin
@RestController
class LoginController(val authenticationManager: AuthenticationManager) {

	@PostMapping("/login")
	fun login(@RequestBody loginRequest: LoginRequest): ResponseEntity<Void> {
		val authenticationRequest =
			UsernamePasswordAuthenticationToken.unauthenticated(
				loginRequest.username, loginRequest.password)
		val authenticationResponse =
			authenticationManager.authenticate(authenticationRequest)
		// ...
	}

	data class LoginRequest(val username: String, val password: String)

}
```

> [!NOTE]
> In this example, it is your responsibility to save the authenticated user in the `SecurityContextRepository` if needed.
> For example, if using the `HttpSession` to persist the `SecurityContext` between requests, you can use [`HttpSessionSecurityContextRepository`](../persistence.md#httpsecuritycontextrepository).

<a id="customize-global-authentication-manager"></a>

## Customize the `AuthenticationManager`

Normally, Spring Security builds an `AuthenticationManager` internally composed of a `DaoAuthenticationProvider` for username/password authentication.
In certain cases, it may still be desired to customize the instance of `AuthenticationManager` used by Spring Security.
For example, you may need to simply disable [credential erasure](../architecture.md#servlet-authentication-providermanager-erasing-credentials) for cached users.

To do this, you can take advantage of the fact that the `AuthenticationManagerBuilder` used to build Spring Security’s global `AuthenticationManager` is published as a bean.
You can configure the builder as follows:

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		// ...
		return http.build();
	}

	@Bean
	public UserDetailsService userDetailsService() {
		// Return a UserDetailsService that caches users
		// ...
	}

	@Autowired
	public void configure(AuthenticationManagerBuilder builder) {
		builder.eraseCredentials(false);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.security.config.annotation.web.invoke

@Configuration
@EnableWebSecurity
class SecurityConfig {

	@Bean
	fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
		// ...
		return http.build()
	}

	@Bean
	fun userDetailsService(): UserDetailsService {
		// Return a UserDetailsService that caches users
		// ...
	}

	@Autowired
	fun configure(builder: AuthenticationManagerBuilder) {
		builder.eraseCredentials(false)
	}

}
```

Alternatively, you may configure a local `AuthenticationManager` to override the global one.

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
			.authorizeHttpRequests((authorize) -> authorize
				.anyRequest().authenticated()
			)
			.httpBasic(Customizer.withDefaults())
			.formLogin(Customizer.withDefaults())
			.authenticationManager(authenticationManager());

		return http.build();
	}

	private AuthenticationManager authenticationManager() {
		DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider(userDetailsService());
		authenticationProvider.setPasswordEncoder(passwordEncoder());

		ProviderManager providerManager = new ProviderManager(authenticationProvider);
		providerManager.setEraseCredentialsAfterAuthentication(false);

		return providerManager;
	}

	private UserDetailsService userDetailsService() {
		UserDetails userDetails = User.withDefaultPasswordEncoder()
			.username("user")
			.password("password")
			.roles("USER")
			.build();

		return new InMemoryUserDetailsManager(userDetails);
	}

	private PasswordEncoder passwordEncoder() {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder();
	}

}
```

#### XML

```xml
<http authentication-manager-ref="authenticationManager">
	<intercept-url pattern="/**" access="authenticated"/>
	<form-login />
	<http-basic />

	<bean id="authenticationManager"
			class="org.springframework.security.authentication.ProviderManager">
		<constructor-arg>
			<bean class="org.springframework.security.authentication.dao.DaoAuthenticationProvider">
				<constructor-arg name="userDetailsService" ref="userDetailsService" />
				<property name="passwordEncoder" ref="passwordEncoder" />
			</bean>
		</constructor-arg>
	</bean>

	<user-service id="userDetailsService">
		<user name="user"
			password="{noop}password"
			authorities="ROLE_USER" />
	</user-service>

	<bean id="passwordEncoder"
			class="org.springframework.security.crypto.factory.PasswordEncoderFactories" factory-method="createDelegatingPasswordEncoder"/>
</http>
```

#### Kotlin

```kotlin
import org.springframework.security.config.annotation.web.invoke

@Configuration
@EnableWebSecurity
class SecurityConfig {

	@Bean
	fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
		http {
			authorizeHttpRequests {
				authorize(anyRequest, authenticated)
			}
			formLogin { }
			httpBasic { }
			authenticationManager = authenticationManager()
		}

		return http.build()
	}

	@Bean
	fun authenticationManager(): AuthenticationManager {
		val authenticationProvider = DaoAuthenticationProvider(userDetailsService())
		authenticationProvider.setPasswordEncoder(passwordEncoder())

		val providerManager = ProviderManager(authenticationProvider)
		providerManager.eraseCredentialsAfterAuthentication = false

		return providerManager
	}

	private fun userDetailsService(): UserDetailsService {
		val user = User.withDefaultPasswordEncoder()
			.username("user")
			.password("password")
			.roles("USER")
			.build()

		return InMemoryUserDetailsManager(user)
	}

	private fun passwordEncoder(): PasswordEncoder {
		return PasswordEncoderFactories.createDelegatingPasswordEncoder()
	}

}
```
