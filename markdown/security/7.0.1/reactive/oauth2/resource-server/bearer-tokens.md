---
title: "OAuth 2.0 Resource Server Bearer Tokens"
source: "ROOT:reactive/oauth2/resource-server/bearer-tokens.adoc"
---

# OAuth 2.0 Resource Server Bearer Tokens

<a id="webflux-oauth2resourceserver-bearertoken-resolver"></a>

## Bearer Token Resolution

By default, Resource Server looks for a bearer token in the `Authorization` header.
However, you can verify this token.

For example, you may have a need to read the bearer token from a custom header.
To do so, you can wire an instance of `ServerBearerTokenAuthenticationConverter` into the DSL:

#### Java

```java
ServerBearerTokenAuthenticationConverter converter = new ServerBearerTokenAuthenticationConverter();
converter.setBearerTokenHeaderName(HttpHeaders.PROXY_AUTHORIZATION);
http
    .oauth2ResourceServer((oauth2) -> oauth2
        .bearerTokenConverter(converter)
    );
```

#### Kotlin

```kotlin
val converter = ServerBearerTokenAuthenticationConverter()
converter.setBearerTokenHeaderName(HttpHeaders.PROXY_AUTHORIZATION)
return http {
    oauth2ResourceServer {
        bearerTokenConverter = converter
    }
}
```

<a id="_bearer_token_propagation"></a>

## Bearer Token Propagation

Now that you have a bearer token, you can pass that to downstream services.
This is possible with [`ServerBearerExchangeFilterFunction`](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/oauth2/server/resource/web/reactive/function/client/ServerBearerExchangeFilterFunction.html):

#### Java

```java
@Bean
public WebClient rest() {
    return WebClient.builder()
            .filter(new ServerBearerExchangeFilterFunction())
            .build();
}
```

#### Kotlin

```kotlin
@Bean
fun rest(): WebClient {
    return WebClient.builder()
            .filter(ServerBearerExchangeFilterFunction())
            .build()
}
```

When the `WebClient` shown in the preceding example performs requests, Spring Security looks up the current `Authentication` and extract any [`AbstractOAuth2Token`](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/oauth2/core/AbstractOAuth2Token.html) credential.
Then, it propagates that token in the `Authorization` header — for example:

#### Java

```java
this.rest.get()
        .uri("https://other-service.example.com/endpoint")
        .retrieve()
        .bodyToMono(String.class)
```

#### Kotlin

```kotlin
this.rest.get()
        .uri("https://other-service.example.com/endpoint")
        .retrieve()
        .bodyToMono<String>()
```

The preceding example invokes the `other-service.example.com/endpoint`, adding the bearer token `Authorization` header for you.

In places where you need to override this behavior, you can supply the header yourself:

#### Java

```java
this.rest.get()
        .uri("https://other-service.example.com/endpoint")
        .headers((headers) -> headers.setBearerAuth(overridingToken))
        .retrieve()
        .bodyToMono(String.class)
```

#### Kotlin

```kotlin
rest.get()
        .uri("https://other-service.example.com/endpoint")
        .headers { it.setBearerAuth(overridingToken) }
        .retrieve()
        .bodyToMono<String>()
```

In this case, the filter falls back and forwards the request onto the rest of the web filter chain.

> [!NOTE]
> Unlike the [OAuth 2.0 Client filter function](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/oauth2/client/web/reactive/function/client/ServerOAuth2AuthorizedClientExchangeFilterFunction.html), this filter function makes no attempt to renew the token, should it be expired.
