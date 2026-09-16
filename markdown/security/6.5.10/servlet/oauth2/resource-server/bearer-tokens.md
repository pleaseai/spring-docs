---
title: "OAuth 2.0 Bearer Tokens"
source: "ROOT:servlet/oauth2/resource-server/bearer-tokens.adoc"
---

# OAuth 2.0 Bearer Tokens

<a id="oauth2resourceserver-bearertoken-resolver"></a>

## Bearer Token Resolution

By default, Resource Server looks for a bearer token in the `Authorization` header.
This, however, can be customized in a handful of ways.

<a id="_reading_the_bearer_token_from_a_custom_header"></a>

### Reading the Bearer Token from a Custom Header

For example, you may have a need to read the bearer token from a custom header.
To achieve this, you can expose a `DefaultBearerTokenResolver` as a bean, or wire an instance into the DSL, as you can see in the following example:

#### Java

```java
@Bean
BearerTokenResolver bearerTokenResolver() {
    DefaultBearerTokenResolver bearerTokenResolver = new DefaultBearerTokenResolver();
    bearerTokenResolver.setBearerTokenHeaderName(HttpHeaders.PROXY_AUTHORIZATION);
    return bearerTokenResolver;
}
```

#### Kotlin

```kotlin
@Bean
fun bearerTokenResolver(): BearerTokenResolver {
    val bearerTokenResolver = DefaultBearerTokenResolver()
    bearerTokenResolver.setBearerTokenHeaderName(HttpHeaders.PROXY_AUTHORIZATION)
    return bearerTokenResolver
}
```

#### Xml

```xml
<http>
    <oauth2-resource-server bearer-token-resolver-ref="bearerTokenResolver"/>
</http>

<bean id="bearerTokenResolver"
        class="org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver">
    <property name="bearerTokenHeaderName" value="Proxy-Authorization"/>
</bean>
```

Or, in circumstances where a provider is using both a custom header and value, you can use `HeaderBearerTokenResolver` instead.

<a id="_reading_the_bearer_token_from_a_form_parameter"></a>

### Reading the Bearer Token from a Form Parameter

Or, you may wish to read the token from a form parameter, which you can do by configuring the `DefaultBearerTokenResolver`, as you can see below:

#### Java

```java
DefaultBearerTokenResolver resolver = new DefaultBearerTokenResolver();
resolver.setAllowFormEncodedBodyParameter(true);
http
    .oauth2ResourceServer(oauth2 -> oauth2
        .bearerTokenResolver(resolver)
    );
```

#### Kotlin

```kotlin
val resolver = DefaultBearerTokenResolver()
resolver.setAllowFormEncodedBodyParameter(true)
http {
    oauth2ResourceServer {
        bearerTokenResolver = resolver
    }
}
```

#### Xml

```xml
<http>
    <oauth2-resource-server bearer-token-resolver-ref="bearerTokenResolver"/>
</http>

<bean id="bearerTokenResolver"
        class="org.springframework.security.oauth2.server.resource.web.HeaderBearerTokenResolver">
    <property name="allowFormEncodedBodyParameter" value="true"/>
</bean>
```

<a id="_bearer_token_propagation"></a>

## Bearer Token Propagation

Now that your resource server has validated the token, it might be handy to pass it to downstream services.
This is quite simple with [`ServletBearerExchangeFilterFunction`](https://docs.spring.io/spring-security/site/docs/6.5.10/api/org/springframework/security/oauth2/server/resource/web/reactive/function/client/ServletBearerExchangeFilterFunction.html), which you can see in the following example:

#### Java

```java
@Bean
public WebClient rest() {
    return WebClient.builder()
            .filter(new ServletBearerExchangeFilterFunction())
            .build();
}
```

#### Kotlin

```kotlin
@Bean
fun rest(): WebClient {
    return WebClient.builder()
            .filter(ServletBearerExchangeFilterFunction())
            .build()
}
```

When the above `WebClient` is used to perform requests, Spring Security will look up the current `Authentication` and extract any [`AbstractOAuth2Token`](https://docs.spring.io/spring-security/site/docs/6.5.10/api/org/springframework/security/oauth2/core/AbstractOAuth2Token.html) credential.
Then, it will propagate that token in the `Authorization` header.

For example:

#### Java

```java
this.rest.get()
        .uri("https://other-service.example.com/endpoint")
        .retrieve()
        .bodyToMono(String.class)
        .block()
```

#### Kotlin

```kotlin
this.rest.get()
        .uri("https://other-service.example.com/endpoint")
        .retrieve()
        .bodyToMono<String>()
        .block()
```

Will invoke the `other-service.example.com/endpoint`, adding the bearer token `Authorization` header for you.

In places where you need to override this behavior, it’s a simple matter of supplying the header yourself, like so:

#### Java

```java
this.rest.get()
        .uri("https://other-service.example.com/endpoint")
        .headers(headers -> headers.setBearerAuth(overridingToken))
        .retrieve()
        .bodyToMono(String.class)
        .block()
```

#### Kotlin

```kotlin
this.rest.get()
        .uri("https://other-service.example.com/endpoint")
        .headers{  headers -> headers.setBearerAuth(overridingToken)}
        .retrieve()
        .bodyToMono<String>()
        .block()
```

In this case, the filter will fall back and simply forward the request onto the rest of the web filter chain.

> [!NOTE]
> Unlike the [OAuth 2.0 Client filter function](https://docs.spring.io/spring-security/site/docs/6.5.10/api/org/springframework/security/oauth2/client/web/reactive/function/client/ServletOAuth2AuthorizedClientExchangeFilterFunction.html), this filter function makes no attempt to renew the token, should it be expired.
> To obtain this level of support, please use the OAuth 2.0 Client filter.

<a id="_resttemplate_support"></a>

### `RestTemplate` support

There is no `RestTemplate` equivalent for `ServletBearerExchangeFilterFunction` at the moment, but you can propagate the request’s bearer token quite simply with your own interceptor:

#### Java

```java
@Bean
RestTemplate rest() {
	RestTemplate rest = new RestTemplate();
	rest.getInterceptors().add((request, body, execution) -> {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		if (authentication == null) {
			return execution.execute(request, body);
		}

		if (!(authentication.getCredentials() instanceof AbstractOAuth2Token)) {
			return execution.execute(request, body);
		}

		AbstractOAuth2Token token = (AbstractOAuth2Token) authentication.getCredentials();
	    request.getHeaders().setBearerAuth(token.getTokenValue());
	    return execution.execute(request, body);
	});
	return rest;
}
```

#### Kotlin

```kotlin
@Bean
fun rest(): RestTemplate {
    val rest = RestTemplate()
    rest.interceptors.add(ClientHttpRequestInterceptor { request, body, execution ->
        val authentication: Authentication? = SecurityContextHolder.getContext().authentication
        if (authentication == null) {
            return execution.execute(request, body)
        }

        if (authentication.credentials !is AbstractOAuth2Token) {
            return execution.execute(request, body)
        }

        request.headers.setBearerAuth(authentication.credentials.tokenValue)
        execution.execute(request, body)
    })
    return rest
}
```

> [!NOTE]
> Unlike the [OAuth 2.0 Authorized Client Manager](https://docs.spring.io/spring-security/site/docs/6.5.10/api/org/springframework/security/oauth2/client/OAuth2AuthorizedClientManager.html), this filter interceptor makes no attempt to renew the token, should it be expired.
> To obtain this level of support, please create an interceptor using the [OAuth 2.0 Authorized Client Manager](../client/index.md#oauth2client).

<a id="oauth2resourceserver-bearertoken-failure"></a>

## Bearer Token Failure

A bearer token may be invalid for a number of reasons. For example, the token may no longer be active.

In these circumstances, Resource Server throws an `InvalidBearerTokenException`.
Like other exceptions, this results in an OAuth 2.0 Bearer Token error response:

```http request
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error_code="invalid_token", error_description="Unsupported algorithm of none", error_uri="https://tools.ietf.org/html/rfc6750#section-3.1"
```

Additionally, it is published as an `AuthenticationFailureBadCredentialsEvent`, which you can [listen for in your application](../../authentication/events.md#servlet-events) like so:

#### Java

```java
@Component
public class FailureEvents {
	@EventListener
    public void onFailure(AuthenticationFailureBadCredentialsEvent badCredentials) {
		if (badCredentials.getAuthentication() instanceof BearerTokenAuthenticationToken) {
		    // ... handle
        }
    }
}
```

#### Kotlin

```kotlin
@Component
class FailureEvents {
    @EventListener
    fun onFailure(badCredentials: AuthenticationFailureBadCredentialsEvent) {
        if (badCredentials.authentication is BearerTokenAuthenticationToken) {
            // ... handle
        }
    }
}
```
