---
title: "Caching `UserDetails`"
source: "ROOT:servlet/authentication/passwords/caching.adoc"
---

<a id="servlet-authentication-caching-user-details"></a>

# Caching `UserDetails`

Spring Security provides support for caching `UserDetails` with [`CachingUserDetailsService`](#servlet-authentication-caching-user-details-service).
Alternatively, you can use Spring Framework’s [`@Cacheable`](#servlet-authentication-caching-user-details-cacheable) annotation.
In either case, you will need to [disable credential erasure](#servlet-authentication-caching-user-details-credential-erasure) in order to validate passwords retrieved from the cache.

<a id="servlet-authentication-caching-user-details-service"></a>

## `CachingUserDetailsService`

Spring Security’s `CachingUserDetailsService` implements [UserDetailsService](user-details-service.md#servlet-authentication-userdetailsservice) to provide support for caching `UserDetails`.
`CachingUserDetailsService` provides caching support for `UserDetails` by delegating to the provided `UserDetailsService`.
The result is then stored in a `UserCache` to reduce computation in subsequent calls.

The following example simply defines a `@Bean` that encapsulates a concrete implementation of `UserDetailsService` and a `UserCache` for caching the `UserDetails`:

#### Java

```java
@Bean
public CachingUserDetailsService cachingUserDetailsService(UserCache userCache) {
	UserDetailsService delegate = ...;
    CachingUserDetailsService service = new CachingUserDetailsService(delegate);
    service.setUserCache(userCache);
    return service;
}
```

#### Kotlin

```kotlin
@Bean
fun cachingUserDetailsService(userCache: UserCache): CachingUserDetailsService {
    val delegate: UserDetailsService = ...
    val service = CachingUserDetailsService(delegate)
    service.userCache = userCache
    return service
}
```

<a id="servlet-authentication-caching-user-details-cacheable"></a>

## `@Cacheable`

An alternative approach would be to use Spring Framework’s [`@Cacheable`](https://docs.spring.io/spring-framework/reference/6.1.18/integration.html#cache-annotations-cacheable) in your `UserDetailsService` implementation to cache `UserDetails` by `username`.
The benefit to this approach is simpler configuration, especially if you are already using caching elsewhere in your application.

The following example assumes caching is already configured, and annotates the `loadUserByUsername` with `@Cacheable`:

#### Java

```java
@Service
public class MyCustomUserDetailsImplementation implements UserDetailsService {

    @Override
    @Cacheable
    public UserDetails loadUserByUsername(String username) {
        // some logic here to get the actual user details
        return userDetails;
    }
}
```

#### Kotlin

```kotlin
@Service
class MyCustomUserDetailsImplementation : UserDetailsService {

    @Cacheable
    override fun loadUserByUsername(username: String): UserDetails {
        // some logic here to get the actual user details
        return userDetails
    }
}
```

<a id="servlet-authentication-caching-user-details-credential-erasure"></a>

## Disable Credential Erasure

Whether you use [`CachingUserDetailsService`](#servlet-authentication-caching-user-details-service) or [`@Cacheable`](#servlet-authentication-caching-user-details-cacheable), you will need to disable [credential erasure](../architecture.md#servlet-authentication-providermanager-erasing-credentials) so that the `UserDetails` will contain a `password` to be validated when retrieved from the cache.
The following example disables credential erasure for the global `AuthenticationManager` by configuring the `AuthenticationManagerBuilder` provided by Spring Security:

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
