---
title: "WebSocket Security"
source: "ROOT:servlet/integrations/websocket.adoc"
---

<a id="websocket"></a>

# WebSocket Security

Spring Security 4 added support for securing [Spring’s WebSocket support](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/websocket.html).
This section describes how to use Spring Security’s WebSocket support.

#### Direct JSR-356 Support

> Spring Security does not provide direct JSR-356 support, because doing so would provide little value.
> This is because the format is unknown, and there is [little Spring can do to secure an unknown format](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/websocket.html#websocket-intro-sub-protocol).
> Additionally, JSR-356 does not provide a way to intercept messages, so security would be invasive.

<a id="websocket-authentication"></a>

## WebSocket Authentication

WebSockets reuse the same authentication information that is found in the HTTP request when the WebSocket connection was made.
This means that the `Principal` on the `HttpServletRequest` will be handed off to WebSockets.
If you are using Spring Security, the `Principal` on the `HttpServletRequest` is overridden automatically.

More concretely, to ensure a user has authenticated to your WebSocket application, all that is necessary is to ensure that you setup Spring Security to authenticate your HTTP based web application.

<a id="websocket-authorization"></a>

## WebSocket Authorization

Spring Security 4.0 has introduced authorization support for WebSockets through the Spring Messaging abstraction.

In Spring Security 5.8, this support has been refreshed to use the `AuthorizationManager` API.

To configure authorization using Java Configuration, simply include the `@EnableWebSocketSecurity` annotation and publish an `AuthorizationManager<Message<?>>` bean or in [XML](../appendix/namespace/websocket.md#nsa-websocket-security) use the `use-authorization-manager` attribute.
One way to do this is by using the `AuthorizationManagerMessageMatcherRegistry` to specify endpoint patterns like so:

#### Java

```java
@Configuration
@EnableWebSocketSecurity // <1> <2>
public class WebSocketSecurityConfig {

    @Bean
    AuthorizationManager<Message<?>> messageAuthorizationManager(MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        messages
                .simpDestMatchers("/user/**").hasRole("USER") // <3>

        return messages.build();
    }
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSocketSecurity // <1> <2>
open class WebSocketSecurityConfig { // <1> <2>
    @Bean
    fun messageAuthorizationManager(messages: MessageMatcherDelegatingAuthorizationManager.Builder): AuthorizationManager<Message<*>> {
        messages.simpDestMatchers("/user/**").hasRole("USER") // <3>
        return messages.build()
    }
}
```

#### Xml

```xml
<websocket-message-broker use-authorization-manager="true"> <1> <2>
    <intercept-message pattern="/user/**" access="hasRole('USER')"/> <3>
</websocket-message-broker>
```

1. Any inbound CONNECT message requires a valid CSRF token to enforce the [Same Origin Policy](#websocket-sameorigin).
1. The `SecurityContextHolder` is populated with the user within the `simpUser` header attribute for any inbound request.
1. Our messages require the proper authorization. Specifically, any inbound message that starts with `/user/` will require `ROLE_USER`. You can find additional details on authorization in [WebSocket Authorization](#websocket-authorization)

<a id="_custom_authorization"></a>

### Custom Authorization

When using `AuthorizationManager`, customization is quite simple.
For example, you can publish an `AuthorizationManager` that requires that all messages have a role of "USER" using `AuthorityAuthorizationManager`, as seen below:

#### Java

```java
@Configuration
@EnableWebSocketSecurity // <1> <2>
public class WebSocketSecurityConfig {

    @Bean
    AuthorizationManager<Message<?>> messageAuthorizationManager(MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        return AuthorityAuthorizationManager.hasRole("USER");
    }
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSocketSecurity // <1> <2>
open class WebSocketSecurityConfig {
    @Bean
    fun messageAuthorizationManager(messages: MessageMatcherDelegatingAuthorizationManager.Builder): AuthorizationManager<Message<*>> {
        return AuthorityAuthorizationManager.hasRole("USER") // <3>
    }
}
```

#### Xml

```xml
<bean id="authorizationManager" class="org.example.MyAuthorizationManager"/>

<websocket-message-broker authorization-manager-ref="myAuthorizationManager"/>
```

There are several ways to further match messages, as can be seen in a more advanced example below:

#### Java

```java
@Configuration
public class WebSocketSecurityConfig {

    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager(MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        messages
                .nullDestMatcher().authenticated() // <1>
                .simpSubscribeDestMatchers("/user/queue/errors").permitAll() // <2>
                .simpDestMatchers("/app/**").hasRole("USER") // <3>
                .simpSubscribeDestMatchers("/user/**", "/topic/friends/*").hasRole("USER") // <4>
                .simpTypeMatchers(MESSAGE, SUBSCRIBE).denyAll() // <5>
                .anyMessage().denyAll(); // <6>

        return messages.build();
    }
}
```

#### Kotlin

```kotlin
@Configuration
open class WebSocketSecurityConfig {
    fun messageAuthorizationManager(messages: MessageMatcherDelegatingAuthorizationManager.Builder): AuthorizationManager<Message<*>> {
        messages
            .nullDestMatcher().authenticated() // <1>
            .simpSubscribeDestMatchers("/user/queue/errors").permitAll() // <2>
            .simpDestMatchers("/app/**").hasRole("USER") // <3>
            .simpSubscribeDestMatchers("/user/**", "/topic/friends/*").hasRole("USER") // <4>
            .simpTypeMatchers(MESSAGE, SUBSCRIBE).denyAll() // <5>
            .anyMessage().denyAll() // <6>

        return messages.build();
    }
}
```

#### Xml

```kotlin
<websocket-message-broker use-authorization-manager="true">
    <!--1-->
    <intercept-message type="CONNECT" access="permitAll" />
    <intercept-message type="UNSUBSCRIBE" access="permitAll" />
    <intercept-message type="DISCONNECT" access="permitAll" />

    <intercept-message pattern="/user/queue/errors" type="SUBSCRIBE" access="permitAll" /> <!--2-->
    <intercept-message pattern="/app/**" access="hasRole('USER')" />      <!--3-->

    <!--4-->
    <intercept-message pattern="/user/**" type="SUBSCRIBE" access="hasRole('USER')" />
    <intercept-message pattern="/topic/friends/*" type="SUBSCRIBE" access="hasRole('USER')" />

    <!--5-->
    <intercept-message type="MESSAGE" access="denyAll" />
    <intercept-message type="SUBSCRIBE" access="denyAll" />

    <intercept-message pattern="/**" access="denyAll" /> <!--6-->
</websocket-message-broker>
```

This will ensure that:

1. Any message without a destination (i.e. anything other than Message type of MESSAGE or SUBSCRIBE) will require the user to be authenticated
1. Anyone can subscribe to /user/queue/errors
1. Any message that has a destination starting with "/app/" will be require the user to have the role ROLE\_USER
1. Any message that starts with "/user/" or "/topic/friends/" that is of type SUBSCRIBE will require ROLE\_USER
1. Any other message of type MESSAGE or SUBSCRIBE is rejected. Due to 6 we do not need this step, but it illustrates how one can match on specific message types.
1. Any other Message is rejected. This is a good idea to ensure that you do not miss any messages.

<a id="websocket-authorization-notes"></a>

### WebSocket Authorization Notes

To properly secure your application, you need to understand Spring’s WebSocket support.

<a id="websocket-authorization-notes-messagetypes"></a>

#### WebSocket Authorization on Message Types

You need to understand the distinction between `SUBSCRIBE` and `MESSAGE` types of messages and how they work within Spring.

Consider a chat application:

- The system can send a notification `MESSAGE` to all users through a destination of `/topic/system/notifications`.
- Clients can receive notifications by `SUBSCRIBE` to the `/topic/system/notifications`.

While we want clients to be able to `SUBSCRIBE` to `/topic/system/notifications`, we do not want to enable them to send a `MESSAGE` to that destination.
If we allowed sending a `MESSAGE` to `/topic/system/notifications`, clients could send a message directly to that endpoint and impersonate the system.

In general, it is common for applications to deny any `MESSAGE` sent to a destination that starts with the [broker prefix](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/websocket.html#websocket-stomp) (`/topic/` or `/queue/`).

<a id="websocket-authorization-notes-destinations"></a>

#### WebSocket Authorization on Destinations

You should also understand how destinations are transformed.

Consider a chat application:

- Users can send messages to a specific user by sending a message to the `/app/chat` destination.
- The application sees the message, ensures that the `from` attribute is specified as the current user (we cannot trust the client).
- The application then sends the message to the recipient by using `SimpMessageSendingOperations.convertAndSendToUser("toUser", "/queue/messages", message)`.
- The message gets turned into the destination of `/queue/user/messages-<sessionid>`.

With this chat application, we want to let our client to listen `/user/queue`, which is transformed into `/queue/user/messages-<sessionid>`.
However, we do not want the client to be able to listen to `/queue/*`, because that would let the client see messages for every user.

In general, it is common for applications to deny any `SUBSCRIBE` sent to a message that starts with the [broker prefix](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/websocket.html#websocket-stomp) (`/topic/` or `/queue/`).
We may provide exceptions to account for things like

<a id="websocket-authorization-notes-outbound"></a>

### Outbound Messages

The Spring Framework reference documentation contains a section titled [“Flow of Messages”](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/websocket.html#websocket-stomp-message-flow) that describes how messages flow through the system.
Note that Spring Security secures only the `clientInboundChannel`.
Spring Security does not attempt to secure the `clientOutboundChannel`.

The most important reason for this is performance.
For every message that goes in, typically many more go out.
Instead of securing the outbound messages, we encourage securing the subscription to the endpoints.

<a id="websocket-sameorigin"></a>

## Enforcing Same Origin Policy

Note that the browser does not enforce the [Same Origin Policy](https://en.wikipedia.org/wiki/Same-origin_policy) for WebSocket connections.
This is an extremely important consideration.

<a id="websocket-sameorigin-why"></a>

### Why Same Origin?

Consider the following scenario.
A user visits `bank.com` and authenticates to their account.
The same user opens another tab in their browser and visits `evil.com`.
The Same Origin Policy ensures that `evil.com` cannot read data from or write data to `bank.com`.

With WebSockets, the Same Origin Policy does not apply.
In fact, unless `bank.com` explicitly forbids it, `evil.com` can read and write data on behalf of the user.
This means that anything the user can do over the webSocket (such as transferring money), `evil.com` can do on that user’s behalf.

Since SockJS tries to emulate WebSockets, it also bypasses the Same Origin Policy.
This means that developers need to explicitly protect their applications from external domains when they use SockJS.

<a id="websocket-sameorigin-spring"></a>

### Spring WebSocket Allowed Origin

Fortunately, since Spring 4.1.5 Spring’s WebSocket and SockJS support restricts access to the [current domain](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/websocket.html#websocket-server-allowed-origins).
Spring Security adds an additional layer of protection to provide [defense in depth](<https://en.wikipedia.org/wiki/Defence_in_depth_(non-military)#Information_security>).

<a id="websocket-sameorigin-csrf"></a>

### Adding CSRF to Stomp Headers

By default, Spring Security requires the [CSRF token](../../features/exploits/csrf.md#csrf)  in any `CONNECT` message type.
This ensures that only a site that has access to the CSRF token can connect.
Since only the **same origin** can access the CSRF token, external domains are not allowed to make a connection.

Typically we need to include the CSRF token in an HTTP header or an HTTP parameter.
However, SockJS does not allow for these options.
Instead, we must include the token in the Stomp headers.

Applications can [obtain a CSRF token](../exploits/csrf.md#csrf-integration) by accessing the request attribute named `_csrf`.
For example, the following allows accessing the `CsrfToken` in a JSP:

```javascript
var headerName = "${_csrf.headerName}";
var token = "${_csrf.token}";
```

If you use static HTML, you can expose the `CsrfToken` on a REST endpoint.
For example, the following would expose the `CsrfToken` on the `/csrf` URL:

#### Java

```java
@RestController
public class CsrfController {

    @RequestMapping("/csrf")
    public CsrfToken csrf(CsrfToken token) {
        return token;
    }
}
```

#### Kotlin

```kotlin
@RestController
class CsrfController {
    @RequestMapping("/csrf")
    fun csrf(token: CsrfToken): CsrfToken {
        return token
    }
}
```

The JavaScript can make a REST call to the endpoint and use the response to populate the `headerName` and the token.

We can now include the token in our Stomp client:

```javascript
...
var headers = {};
headers[headerName] = token;
stompClient.connect(headers, function(frame) {
  ...

})
```

<a id="websocket-sameorigin-disable"></a>

### Disable CSRF within WebSockets

> [!NOTE]
> At this point, CSRF is not configurable when using `@EnableWebSocketSecurity`, though this will likely be added in a future release.

To disable CSRF, instead of using `@EnableWebSocketSecurity`, you can use XML support or add the Spring Security components yourself, like so:

#### Java

```java
@Configuration
public class WebSocketSecurityConfig implements WebSocketMessageBrokerConfigurer {

    private final ApplicationContext applicationContext;

    private final AuthorizationManager<Message<?>> authorizationManager;

    public WebSocketSecurityConfig(ApplicationContext applicationContext, AuthorizationManager<Message<?>> authorizationManager) {
        this.applicationContext = applicationContext;
        this.authorizationManager = authorizationManager;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> argumentResolvers) {
        argumentResolvers.add(new AuthenticationPrincipalArgumentResolver());
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        AuthorizationChannelInterceptor authz = new AuthorizationChannelInterceptor(authorizationManager);
        AuthorizationEventPublisher publisher = new SpringAuthorizationEventPublisher(applicationContext);
        authz.setAuthorizationEventPublisher(publisher);
        registration.interceptors(new SecurityContextChannelInterceptor(), authz);
    }
}
```

#### Kotlin

```kotlin
@Configuration
open class WebSocketSecurityConfig(val applicationContext: ApplicationContext, val authorizationManager: AuthorizationManager<Message<*>>) : WebSocketMessageBrokerConfigurer {
    @Override
    override fun addArgumentResolvers(argumentResolvers: List<HandlerMethodArgumentResolver>) {
        argumentResolvers.add(AuthenticationPrincipalArgumentResolver())
    }

    @Override
    override fun configureClientInboundChannel(registration: ChannelRegistration) {
        var authz: AuthorizationChannelInterceptor = AuthorizationChannelInterceptor(authorizationManager)
        var publisher: AuthorizationEventPublisher = SpringAuthorizationEventPublisher(applicationContext)
        authz.setAuthorizationEventPublisher(publisher)
        registration.interceptors(SecurityContextChannelInterceptor(), authz)
    }
}
```

#### Xml

```xml
<websocket-message-broker use-authorization-manager="true" same-origin-disabled="true">
    <intercept-message pattern="/**" access="authenticated"/>
</websocket-message-broker>
```

On the other hand, if you are using the [legacy `AbstractSecurityWebSocketMessageBrokerConfigurer`](#legacy-websocket-configuration) and you want to allow other domains to access your site, you can disable Spring Security’s protection.
For example, in Java Configuration you can use the following:

#### Java

```java
@Configuration
public class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {

    ...

    @Override
    protected boolean sameOriginDisabled() {
        return true;
    }
}
```

#### Kotlin

```kotlin
@Configuration
open class WebSocketSecurityConfig : AbstractSecurityWebSocketMessageBrokerConfigurer() {

    // ...

    override fun sameOriginDisabled(): Boolean {
        return true
    }
}
```

<a id="websocket-expression-handler"></a>

### Custom Expression Handler

At times, there may be value in customizing how the `access` expressions are handled defined in your `intercept-message` XML elements.
To do this, you can create a class of type `SecurityExpressionHandler<MessageAuthorizationContext<?>>` and refer to it in your XML definition like so:

```xml
<websocket-message-broker use-authorization-manager="true">
    <expression-handler ref="myRef"/>
    ...
</websocket-message-broker>

<b:bean ref="myRef" class="org.springframework.security.messaging.access.expression.MessageAuthorizationContextSecurityExpressionHandler"/>
```

If you are migrating from a legacy usage of `websocket-message-broker` that implements a `SecurityExpressionHandler<Message<?>>`, you can:
 1. Additionally implement the `createEvaluationContext(Supplier, Message)` method and then
 2. Wrap that value in a `MessageAuthorizationContextSecurityExpressionHandler` like so:

```xml
<websocket-message-broker use-authorization-manager="true">
    <expression-handler ref="myRef"/>
    ...
</websocket-message-broker>

<b:bean ref="myRef" class="org.springframework.security.messaging.access.expression.MessageAuthorizationContextSecurityExpressionHandler">
    <b:constructor-arg>
        <b:bean class="org.example.MyLegacyExpressionHandler"/>
    </b:constructor-arg>
</b:bean>
```

<a id="websocket-sockjs"></a>

## Working with SockJS

[SockJS](https://docs.spring.io/spring/docs/current/spring-framework-reference/html/websocket.html#websocket-fallback) provides fallback transports to support older browsers.
When using the fallback options, we need to relax a few security constraints to allow SockJS to work with Spring Security.

<a id="websocket-sockjs-sameorigin"></a>

### SockJS & frame-options

SockJS may use a [transport that leverages an iframe](https://github.com/sockjs/sockjs-client/tree/v0.3.4).
By default, Spring Security [denies](../../features/exploits/headers.md#headers-frame-options) the site from being framed to prevent clickjacking attacks.
To allow SockJS frame-based transports to work, we need to configure Spring Security to let the same origin frame the content.

You can customize `X-Frame-Options` with the [frame-options](../appendix/namespace/http.md#nsa-frame-options) element.
For example, the following instructs Spring Security to use `X-Frame-Options: SAMEORIGIN`, which allows iframes within the same domain:

```xml
<http>
    <!-- ... -->

    <headers>
        <frame-options
          policy="SAMEORIGIN" />
    </headers>
</http>
```

Similarly, you can customize frame options to use the same origin within Java Configuration by using the following:

#### Java

```java
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // ...
            .headers(headers -> headers
                .frameOptions(frameOptions -> frameOptions
                     .sameOrigin()
                )
        );
        return http.build();
    }
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
open class WebSecurityConfig {
    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            // ...
            headers {
                frameOptions {
                    sameOrigin = true
                }
            }
        }
        return http.build()
    }
}
```

<a id="websocket-sockjs-csrf"></a>

### SockJS & Relaxing CSRF

SockJS uses a POST on the CONNECT messages for any HTTP-based transport.
Typically, we need to include the CSRF token in an HTTP header or an HTTP parameter.
However, SockJS does not allow for these options.
Instead, we must include the token in the Stomp headers as described in [Adding CSRF to Stomp Headers](#websocket-sameorigin-csrf).

It also means that we need to relax our CSRF protection with the web layer.
Specifically, we want to disable CSRF protection for our connect URLs.
We do NOT want to disable CSRF protection for every URL.
Otherwise, our site is vulnerable to CSRF attacks.

We can easily achieve this by providing a CSRF `RequestMatcher`.
Our Java configuration makes this easy.
For example, if our stomp endpoint is `/chat`, we can disable CSRF protection only for URLs that start with `/chat/` by using the following configuration:

#### Java

```java
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                // ignore our stomp endpoints since they are protected using Stomp headers
                .ignoringRequestMatchers("/chat/**")
            )
            .headers(headers -> headers
                // allow same origin to frame our site to support iframe SockJS
                .frameOptions(frameOptions -> frameOptions
                    .sameOrigin()
                )
            )
            .authorizeHttpRequests(authorize -> authorize
                ...
            )
            ...
    }
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
open class WebSecurityConfig {
    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            csrf {
                ignoringRequestMatchers("/chat/**")
            }
            headers {
                frameOptions {
                    sameOrigin = true
                }
            }
            authorizeRequests {
                // ...
            }
            // ...
        }
    }
}
```

If we use XML-based configuration, we can use the[csrf@request-matcher-ref](../appendix/namespace/http.md#nsa-csrf-request-matcher-ref).

```xml
<http ...>
    <csrf request-matcher-ref="csrfMatcher"/>

    <headers>
        <frame-options policy="SAMEORIGIN"/>
    </headers>

    ...
</http>

<b:bean id="csrfMatcher"
    class="AndRequestMatcher">
    <b:constructor-arg value="#{T(org.springframework.security.web.csrf.CsrfFilter).DEFAULT_CSRF_MATCHER}"/>
    <b:constructor-arg>
        <b:bean class="org.springframework.security.web.util.matcher.NegatedRequestMatcher">
          <b:bean class="org.springframework.security.web.util.matcher.AntPathRequestMatcher">
            <b:constructor-arg value="/chat/**"/>
          </b:bean>
        </b:bean>
    </b:constructor-arg>
</b:bean>
```

<a id="legacy-websocket-configuration"></a>

## Legacy WebSocket Configuration

Before Spring Security 5.8, the way to configure messaging authorization using Java Configuration, was to extend the `AbstractSecurityWebSocketMessageBrokerConfigurer` and configure the `MessageSecurityMetadataSourceRegistry`.
For example:

#### Java

```java
@Configuration
public class WebSocketSecurityConfig
      extends AbstractSecurityWebSocketMessageBrokerConfigurer { // <1> <2>

    protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
        messages
                .simpDestMatchers("/user/**").authenticated() // <3>
    }
}
```

#### Kotlin

```kotlin
@Configuration
open class WebSocketSecurityConfig : AbstractSecurityWebSocketMessageBrokerConfigurer() { // <1> <2>
    override fun configureInbound(messages: MessageSecurityMetadataSourceRegistry) {
        messages.simpDestMatchers("/user/**").authenticated() // <3>
    }
}
```

This will ensure that:

1. Any inbound CONNECT message requires a valid CSRF token to enforce [Same Origin Policy](#websocket-sameorigin)
1. The SecurityContextHolder is populated with the user within the simpUser header attribute for any inbound request.
1. Our messages require the proper authorization. Specifically, any inbound message that starts with "/user/" will require ROLE\_USER. Additional details on authorization can be found in [WebSocket Authorization](#websocket-authorization)

Using the legacy configuration is helpful in the event that you have a custom `SecurityExpressionHandler` that extends `AbstractSecurityExpressionHandler` and overrides `createEvaluationContextInternal` or `createSecurityExpressionRoot`.
In order to defer `Authorization` lookup, the new `AuthorizationManager` API does not invoke these when evaluating expressions.

If you are using XML, you can use the legacy APIs simply by not using the `use-authorization-manager` element or setting it to `false`.
