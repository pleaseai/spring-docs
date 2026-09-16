---
title: "CORS"
source: "ROOT:reactive/integrations/cors.adoc"
---

<a id="webflux-cors"></a>

# CORS

Spring Framework provides [first class support for CORS](https://docs.spring.io/spring-framework/reference/7.0.9/web/webflux-cors.html#webflux-cors-intro).
CORS must be processed before Spring Security because the pre-flight request will not contain any cookies (i.e. the `JSESSIONID`).
If the request does not contain any cookies and Spring Security is first, the request will determine the user is not authenticated (since there are no cookies in the request) and reject it.

The easiest way to ensure that CORS is handled first is to use the `CorsWebFilter`.
Users can integrate the `CorsWebFilter` with Spring Security by providing a `CorsConfigurationSource`.
For example, the following will integrate CORS support within Spring Security:

#### Java

```java
@Bean
UrlBasedCorsConfigurationSource corsConfigurationSource() {
	CorsConfiguration configuration = new CorsConfiguration();
	configuration.setAllowedOrigins(Arrays.asList("https://example.com"));
	configuration.setAllowedMethods(Arrays.asList("GET","POST"));
	UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
	source.registerCorsConfiguration("/**", configuration);
	return source;
}
```

#### Kotlin

```kotlin
@Bean
fun corsConfigurationSource(): UrlBasedCorsConfigurationSource {
    val configuration = CorsConfiguration()
    configuration.allowedOrigins = listOf("https://example.com")
    configuration.allowedMethods = listOf("GET", "POST")
    val source = UrlBasedCorsConfigurationSource()
    source.registerCorsConfiguration("/**", configuration)
    return source
}
```

The following will disable the CORS integration within Spring Security:

#### Java

```java
@Bean
SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
	http
		// ...
		.cors((cors) -> cors.disable());
	return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun springSecurityFilterChain(http: ServerHttpSecurity): SecurityWebFilterChain {
    return http {
        // ...
        cors {
            disable()
        }
    }
}
```

> [!WARNING]
> CORS is a browser-based security feature.
> By disabling CORS in Spring Security, you are not removing CORS protection from your browser.
> Instead, you are removing CORS support from Spring Security, and users will not be able to interact with your Spring backend from a cross-origin browser application.
> To fix CORS errors in your application, you must enable CORS support, and provide an appropriate configuration source.
