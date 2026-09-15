---
title: "WebSocket API"
source: "ROOT:web/websocket/server.adoc"
---

<a id="websocket-server"></a>

# WebSocket API

[See equivalent in the Reactive stack](../webflux-websocket.md#webflux-websocket-server)

The Spring Framework provides a WebSocket API that you can use to write client- and
server-side applications that handle WebSocket messages.

<a id="websocket-server-handler"></a>

## `WebSocketHandler`

[See equivalent in the Reactive stack](../webflux-websocket.md#webflux-websocket-server-handler)

Creating a WebSocket server is as simple as implementing `WebSocketHandler` or, more
likely, extending either `TextWebSocketHandler` or `BinaryWebSocketHandler`. The following
example uses `TextWebSocketHandler`:

#### Java

```java
public class MyHandler extends TextWebSocketHandler {

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) {
		// ...
	}
}
```

#### Kotlin

```kotlin
class MyHandler : TextWebSocketHandler() {

	override fun handleTextMessage(session: WebSocketSession, message: TextMessage) {
		// ...
	}
}
```

There is dedicated WebSocket programmatic configuration and XML namespace support for mapping the preceding
WebSocket handler to a specific URL, as the following example shows:

#### Java

```java
@Configuration
@EnableWebSocket
public class WebSocketConfiguration implements WebSocketConfigurer {

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(myHandler(), "/myHandler");
	}

	@Bean
	public WebSocketHandler myHandler() {
		return new MyHandler();
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSocket
class WebSocketConfiguration : WebSocketConfigurer {

	override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
		registry.addHandler(myHandler(), "/myHandler")
	}

	@Bean
	fun myHandler(): WebSocketHandler {
		return MyHandler()
	}
}
```

#### Xml

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xmlns:websocket="http://www.springframework.org/schema/websocket"
	   xsi:schemaLocation="
		http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/websocket
		https://www.springframework.org/schema/websocket/spring-websocket.xsd">

	<websocket:handlers>
		<websocket:mapping path="/myHandler" handler="myHandler"/>
	</websocket:handlers>

	<bean id="myHandler" class="org.springframework.docs.web.websocket.websocketserverhandler.MyHandler"/>

</beans>
```

The preceding example is for use in Spring MVC applications and should be included
in the configuration of a [`DispatcherServlet`](../webmvc/mvc-servlet.md). However, Spring’s
WebSocket support does not depend on Spring MVC. It is relatively simple to
integrate a `WebSocketHandler` into other HTTP-serving environments with the help of
[`WebSocketHttpRequestHandler`](https://docs.spring.io/spring-framework/docs/7.0.1/javadoc-api/org/springframework/web/socket/server/support/WebSocketHttpRequestHandler.html).

When using the `WebSocketHandler` API directly vs indirectly, for example, through the
[STOMP](stomp.md) messaging, the application must synchronize the sending of messages
since the underlying standard WebSocket session (JSR-356) does not allow concurrent
sending. One option is to wrap the `WebSocketSession` with
[`ConcurrentWebSocketSessionDecorator`](https://docs.spring.io/spring-framework/docs/7.0.1/javadoc-api/org/springframework/web/socket/handler/ConcurrentWebSocketSessionDecorator.html).

<a id="websocket-server-handshake"></a>

## WebSocket Handshake

[See equivalent in the Reactive stack](../webflux-websocket.md#webflux-websocket-server-handshake)

The easiest way to customize the initial HTTP WebSocket handshake request is through
a `HandshakeInterceptor`, which exposes methods for “before” and “after” the handshake.
You can use such an interceptor to preclude the handshake or to make any attributes
available to the `WebSocketSession`. The following example uses a built-in interceptor
to pass HTTP session attributes to the WebSocket session:

#### Java

```java
@Configuration
@EnableWebSocket
public class WebSocketConfiguration implements WebSocketConfigurer {

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(new MyHandler(), "/myHandler")
				.addInterceptors(new HttpSessionHandshakeInterceptor());
	}

}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSocket
class WebSocketConfiguration : WebSocketConfigurer {

	override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
		registry.addHandler(MyHandler(), "/myHandler")
			.addInterceptors(HttpSessionHandshakeInterceptor())
	}
}
```

#### Xml

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xmlns:websocket="http://www.springframework.org/schema/websocket"
	   xsi:schemaLocation="
		http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/websocket
		https://www.springframework.org/schema/websocket/spring-websocket.xsd">

	<websocket:handlers>
		<websocket:mapping path="/myHandler" handler="myHandler"/>
		<websocket:handshake-interceptors>
			<bean class="org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor"/>
		</websocket:handshake-interceptors>
	</websocket:handlers>

	<bean id="myHandler" class="org.springframework.docs.web.websocket.websocketserverhandler.MyHandler"/>

</beans>
```

A more advanced option is to extend the `DefaultHandshakeHandler` that performs
the steps of the WebSocket handshake, including validating the client origin,
negotiating a sub-protocol, and other details. An application may also need to use this
option if it needs to configure a custom `RequestUpgradeStrategy` in order to
adapt to a WebSocket server engine and version that is not yet supported
(see [Deployment](#websocket-server-deployment) for more on this subject).
Both the Java configuration and XML namespace make it possible to configure a custom
`HandshakeHandler`.

> [!TIP]
> Spring provides a `WebSocketHandlerDecorator` base class that you can use to decorate
> a `WebSocketHandler` with additional behavior. Logging and exception handling
> implementations are provided and added by default when using the WebSocket Java configuration
> or XML namespace. The `ExceptionWebSocketHandlerDecorator` catches all uncaught
> exceptions that arise from any `WebSocketHandler` method and closes the WebSocket
> session with status `1011`, which indicates a server error.

<a id="websocket-server-deployment"></a>

## Deployment

The Spring WebSocket API is easy to integrate into a Spring MVC application where
the `DispatcherServlet` serves both HTTP WebSocket handshake and other
HTTP requests. It is also easy to integrate into other HTTP processing scenarios
by invoking `WebSocketHttpRequestHandler`. This is convenient and easy to
understand. However, special considerations apply with regards to JSR-356 runtimes.

The Jakarta WebSocket API (JSR-356) provides two deployment mechanisms. The first
involves a Servlet container classpath scan (a Servlet 3 feature) at startup.
The other is a registration API to use at Servlet container initialization.
Neither of these mechanism makes it possible to use a single “front controller”
for all HTTP processing — including WebSocket handshake and all other HTTP
requests — such as Spring MVC’s `DispatcherServlet`.

This is a significant limitation of JSR-356 that Spring’s WebSocket support addresses with
a standard `RequestUpgradeStrategy` implementation when running in a WebSocket API 2.1+ runtime.

A secondary consideration is that Servlet containers with JSR-356 support are expected
to perform a `ServletContainerInitializer` (SCI) scan that can slow down application
startup — in some cases, dramatically. If a significant impact is observed after an
upgrade to a Servlet container version with JSR-356 support, it should
be possible to selectively enable or disable web fragments (and SCI scanning)
through the use of the `<absolute-ordering />` element in `web.xml`, as the following example shows:

```xml
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="
		https://jakarta.ee/xml/ns/jakartaee
		https://jakarta.ee/xml/ns/jakartaee/web-app_5_0.xsd"
	version="5.0">

	<absolute-ordering/>

</web-app>
```

You can then selectively enable web fragments by name, such as Spring’s own
`SpringServletContainerInitializer` that provides support for the Servlet 3
Java initialization API. The following example shows how to do so:

```xml
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="
		https://jakarta.ee/xml/ns/jakartaee
		https://jakarta.ee/xml/ns/jakartaee/web-app_5_0.xsd"
	version="5.0">

	<absolute-ordering>
		<name>spring_web</name>
	</absolute-ordering>

</web-app>
```

<a id="websocket-server-runtime-configuration"></a>

## Configuring the Server

[See equivalent in the Reactive stack](../webflux-websocket.md#webflux-websocket-server-config)

You can configure of the underlying WebSocket server such as input message buffer size,
idle timeout, and more.

For Jakarta WebSocket servers, you can add a `ServletServerContainerFactoryBean` to your
configuration. For example:

#### Java

```java
@Configuration
public class WebSocketConfiguration {

	@Bean
	public ServletServerContainerFactoryBean createWebSocketContainer() {
		ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
		container.setMaxTextMessageBufferSize(8192);
		container.setMaxBinaryMessageBufferSize(8192);
		return container;
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebSocketConfiguration {

	@Bean
	fun createWebSocketContainer() = ServletServerContainerFactoryBean().apply {
		maxTextMessageBufferSize = 8192
		maxBinaryMessageBufferSize = 8192
	}
}
```

#### Xml

```xml
<bean class="org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean">
	<property name="maxTextMessageBufferSize" value="8192"/>
	<property name="maxBinaryMessageBufferSize" value="8192"/>
</bean>
```

> [!NOTE]
> For client Jakarta WebSocket configuration, use
> ContainerProvider.getWebSocketContainer() in programmatic configuration, or
> `WebSocketContainerFactoryBean` in XML.

For Jetty, you can supply a callback to configure the WebSocket server:

#### Java

```java
@Configuration
@EnableWebSocket
public class JettyWebSocketConfiguration implements WebSocketConfigurer {

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(echoWebSocketHandler(), "/echo").setHandshakeHandler(handshakeHandler());
	}

	@Bean
	public WebSocketHandler echoWebSocketHandler() {
		return new MyEchoHandler();
	}

	@Bean
	public DefaultHandshakeHandler handshakeHandler() {
		JettyRequestUpgradeStrategy strategy = new JettyRequestUpgradeStrategy();
		strategy.addWebSocketConfigurer(configurable -> {
			configurable.setInputBufferSize(8192);
			configurable.setIdleTimeout(Duration.ofSeconds(600));
		});
		return new DefaultHandshakeHandler(strategy);
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSocket
class JettyWebSocketConfiguration : WebSocketConfigurer {

	override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
		registry.addHandler(echoWebSocketHandler(), "/echo").setHandshakeHandler(handshakeHandler())
	}

	@Bean
	fun echoWebSocketHandler(): WebSocketHandler {
		return MyEchoHandler()
	}

	@Bean
	fun handshakeHandler(): DefaultHandshakeHandler {
		val strategy = JettyRequestUpgradeStrategy()
		strategy.addWebSocketConfigurer {
			it.inputBufferSize = 8192
			it.idleTimeout = Duration.ofSeconds(600)
		}
		return DefaultHandshakeHandler(strategy)
	}
}
```

> [!TIP]
> When using STOMP over WebSocket, you will also need to configure
> [STOMP WebSocket transport](stomp/server-config.md)
> properties.

<a id="websocket-server-allowed-origins"></a>

## Allowed Origins

[See equivalent in the Reactive stack](../webflux-websocket.md#webflux-websocket-server-cors)

As of Spring Framework 4.1.5, the default behavior for WebSocket and SockJS is to accept
only same-origin requests. It is also possible to allow all or a specified list of origins.
This check is mostly designed for browser clients. Nothing prevents other types
of clients from modifying the `Origin` header value (see
[RFC 6454: The Web Origin Concept](https://datatracker.ietf.org/doc/html/rfc6454) for more details).

The three possible behaviors are:

- Allow only same-origin requests (default): In this mode, when SockJS is enabled, the
Iframe HTTP response header `X-Frame-Options` is set to `SAMEORIGIN`, and JSONP
transport is disabled, since it does not allow checking the origin of a request.
As a consequence, IE6 and IE7 are not supported when this mode is enabled.
- Allow a specified list of origins: Each allowed origin must start with `http://`
or `https://`. In this mode, when SockJS is enabled, IFrame transport is disabled.
As a consequence, IE6 through IE9 are not supported when this
mode is enabled.
- Allow all origins: To enable this mode, you should provide `*` as the allowed origin
value. In this mode, all transports are available.

You can configure WebSocket and SockJS allowed origins, as the following example shows:

#### Java

```java
@Configuration
@EnableWebSocket
public class WebSocketConfiguration implements WebSocketConfigurer {

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(myHandler(), "/myHandler").setAllowedOrigins("https://mydomain.com");
	}

	@Bean
	public WebSocketHandler myHandler() {
		return new MyHandler();
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSocket
class WebSocketConfiguration : WebSocketConfigurer {

	override fun registerWebSocketHandlers(registry: WebSocketHandlerRegistry) {
		registry.addHandler(myHandler(), "/myHandler").setAllowedOrigins("https://mydomain.com")
	}

	@Bean
	fun myHandler(): WebSocketHandler {
		return MyHandler()
	}
}
```

#### Xml

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xmlns:websocket="http://www.springframework.org/schema/websocket"
	   xsi:schemaLocation="
		http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/websocket
		https://www.springframework.org/schema/websocket/spring-websocket.xsd">

	<websocket:handlers allowed-origins="https://mydomain.com">
		<websocket:mapping path="/myHandler" handler="myHandler" />
	</websocket:handlers>

	<bean id="myHandler" class="org.springframework.docs.web.websocket.websocketserverhandler.MyHandler" />

</beans>
```
