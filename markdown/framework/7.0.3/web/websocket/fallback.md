---
title: "SockJS Fallback"
source: "ROOT:web/websocket/fallback.adoc"
---

<a id="websocket-fallback"></a>

# SockJS Fallback

Over the public Internet, restrictive proxies outside your control may preclude WebSocket
interactions, either because they are not configured to pass on the `Upgrade` header or
because they close long-lived connections that appear to be idle.

The solution to this problem is WebSocket emulation — that is, attempting to use WebSocket
first and then falling back on HTTP-based techniques that emulate a WebSocket
interaction and expose the same application-level API.

On the Servlet stack, the Spring Framework provides both server (and also client) support
for the SockJS protocol.

<a id="websocket-fallback-sockjs-overview"></a>

## Overview

The goal of SockJS is to let applications use a WebSocket API but fall back to
non-WebSocket alternatives when necessary at runtime, without the need to
change application code.

SockJS consists of:

- The [SockJS protocol](https://github.com/sockjs/sockjs-protocol)
defined in the form of executable
[narrated tests](https://sockjs.github.io/sockjs-protocol/sockjs-protocol-0.3.3.html).
- The [SockJS JavaScript client](https://github.com/sockjs/sockjs-client) — a client library for use in browsers.
- SockJS server implementations, including one in the Spring Framework `spring-websocket` module.
- A SockJS Java client in the `spring-websocket` module (since version 4.1).

SockJS is designed for use in browsers. It uses a variety of techniques
to support a wide range of browser versions.
For the full list of SockJS transport types and browsers, see the
[SockJS client](https://github.com/sockjs/sockjs-client) page. Transports
fall in three general categories: WebSocket, HTTP Streaming, and HTTP Long Polling.
For an overview of these categories, see
[this blog post](https://spring.io/blog/2012/05/08/spring-mvc-3-2-preview-techniques-for-real-time-updates/).

The SockJS client begins by sending `GET /info` to
obtain basic information from the server. After that, it must decide what transport
to use. If possible, WebSocket is used. If not, in most browsers,
there is at least one HTTP streaming option. If not, then HTTP (long)
polling is used.

All transport requests have the following URL structure:

```
https://host:port/myApp/myEndpoint/{server-id}/{session-id}/{transport}
```

where:

- `{server-id}` is useful for routing requests in a cluster but is not used otherwise.
- `{session-id}` correlates HTTP requests belonging to a SockJS session.
- `{transport}` indicates the transport type (for example, `websocket`, `xhr-streaming`, and others).

The WebSocket transport needs only a single HTTP request to do the WebSocket handshake.
All messages thereafter are exchanged on that socket.

HTTP transports require more requests. Ajax/XHR streaming, for example, relies on
one long-running request for server-to-client messages and additional HTTP POST
requests for client-to-server messages. Long polling is similar, except that it
ends the current request after each server-to-client send.

SockJS adds minimal message framing. For example, the server sends the letter `o`
(“open” frame) initially, messages are sent as `a["message1","message2"]`
(JSON-encoded array), the letter `h` (“heartbeat” frame) if no messages flow
for 25 seconds (by default), and the letter `c` (“close” frame) to close the session.

To learn more, run an example in a browser and watch the HTTP requests.
The SockJS client allows fixing the list of transports, so it is possible to
see each transport one at a time. The SockJS client also provides a debug flag,
which enables helpful messages in the browser console. On the server side, you can enable
`TRACE` logging for `org.springframework.web.socket`.
For even more detail, see the SockJS protocol
[narrated test](https://sockjs.github.io/sockjs-protocol/sockjs-protocol-0.3.3.html).

<a id="websocket-fallback-sockjs-enable"></a>

## Enabling SockJS

You can enable SockJS through configuration, as the following example shows:

#### Java

```java
@Configuration
@EnableWebSocket
public class WebSocketConfiguration implements WebSocketConfigurer {

	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
		registry.addHandler(myHandler(), "/myHandler").withSockJS();
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
		registry.addHandler(myHandler(), "/myHandler").withSockJS()
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
		<websocket:sockjs/>
	</websocket:handlers>

	<bean id="myHandler" class="org.springframework.docs.web.websocket.websocketserverhandler.MyHandler"/>

</beans>
```

The preceding example is for use in Spring MVC applications and should be included in the
configuration of a [`DispatcherServlet`](../webmvc/mvc-servlet.md). However, Spring’s WebSocket
and SockJS support does not depend on Spring MVC. It is relatively simple to
integrate into other HTTP serving environments with the help of
[`SockJsHttpRequestHandler`](https://docs.spring.io/spring-framework/docs/7.0.3/javadoc-api/org/springframework/web/socket/sockjs/support/SockJsHttpRequestHandler.html).

On the browser side, applications can use the
[`sockjs-client`](https://github.com/sockjs/sockjs-client) (version 1.0.x). It
emulates the W3C WebSocket API and communicates with the server to select the best
transport option, depending on the browser in which it runs. See the
[sockjs-client](https://github.com/sockjs/sockjs-client) page and the list of
transport types supported by browser. The client also provides several
configuration options — for example, to specify which transports to include.

<a id="websocket-fallback-xhr-vs-iframe"></a>

## IE 8 and 9

Internet Explorer 8 and 9 remain in use. They are
a key reason for having SockJS. This section covers important
considerations about running in those browsers.

The SockJS client supports Ajax/XHR streaming in IE 8 and 9 by using Microsoft’s
[`XDomainRequest`](https://web.archive.org/web/20160219230343/https://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx).
That works across domains but does not support sending cookies.
Cookies are often essential for Java applications.
However, since the SockJS client can be used with many server
types (not just Java ones), it needs to know whether cookies matter.
If so, the SockJS client prefers Ajax/XHR for streaming. Otherwise, it
relies on an iframe-based technique.

The first `/info` request from the SockJS client is a request for
information that can influence the client’s choice of transports.
One of those details is whether the server application relies on cookies
(for example, for authentication purposes or clustering with sticky sessions).
Spring’s SockJS support includes a property called `sessionCookieNeeded`.
It is enabled by default, since most Java applications rely on the `JSESSIONID`
cookie. If your application does not need it, you can turn off this option,
and SockJS client should then choose `xdr-streaming` in IE 8 and 9.

If you do use an iframe-based transport, keep in mind
that browsers can be instructed to block the use of IFrames on a given page by
setting the HTTP response header `X-Frame-Options` to `DENY`,
`SAMEORIGIN`, or `ALLOW-FROM <origin>`. This is used to prevent
[clickjacking](https://www.owasp.org/index.php/Clickjacking).

> [!NOTE]
> Spring Security 3.2+ provides support for setting `X-Frame-Options` on every
> response. By default, the Spring Security Java configuration sets it to `DENY`.
> In 3.2, the Spring Security XML namespace does not set that header by default
> but can be configured to do so. In the future, it may set it by default.
>
> See [Default Security Headers](https://docs.spring.io/spring-security/reference/features/exploits/headers.html#headers-default)
> of the Spring Security documentation for details on how to configure the
> setting of the `X-Frame-Options` header. You can also see
> [gh-2718](https://github.com/spring-projects/spring-security/issues/2718)
> for additional background.

If your application adds the `X-Frame-Options` response header (as it should!)
and relies on an iframe-based transport, you need to set the header value to
`SAMEORIGIN` or `ALLOW-FROM <origin>`. The Spring SockJS
support also needs to know the location of the SockJS client, because it is loaded
from the iframe. By default, the iframe is set to download the SockJS client
from a CDN location. It is a good idea to configure this option to use
a URL from the same origin as the application.

The following example shows how to configure it:

#### Java

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfiguration implements WebSocketMessageBrokerConfigurer {

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/portfolio").withSockJS()
				.setClientLibraryUrl("http://localhost:8080/myapp/js/sockjs-client.js");
	}

	// ...

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		// Configure message broker...
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfiguration : WebSocketMessageBrokerConfigurer {

	override fun registerStompEndpoints(registry: StompEndpointRegistry) {
		registry.addEndpoint("/portfolio").withSockJS()
				.setClientLibraryUrl("http://localhost:8080/myapp/js/sockjs-client.js")
	}

	// ...

	override fun configureMessageBroker(registry: MessageBrokerRegistry) {
		// Configure message broker...
	}
}
```

> [!NOTE]
> During initial development, do enable the SockJS client `devel` mode that prevents
> the browser from caching SockJS requests (like the iframe) that would otherwise
> be cached. For details on how to enable it see the
> [SockJS client](https://github.com/sockjs/sockjs-client) page.

<a id="websocket-fallback-sockjs-heartbeat"></a>

## Heartbeats

The SockJS protocol requires servers to send heartbeat messages to preclude proxies
from concluding that a connection is hung. The Spring SockJS configuration has a property
called `heartbeatTime` that you can use to customize the frequency. By default, a
heartbeat is sent after 25 seconds, assuming no other messages were sent on that
connection. This 25-second value is in line with the following
[IETF recommendation](https://datatracker.ietf.org/doc/html/rfc6202) for public Internet applications.

> [!NOTE]
> When using STOMP over WebSocket and SockJS, if the STOMP client and server negotiate
> heartbeats to be exchanged, the SockJS heartbeats are disabled.

The Spring SockJS support also lets you configure the `TaskScheduler` to
schedule heartbeats tasks. The task scheduler is backed by a thread pool,
with default settings based on the number of available processors. You
should consider customizing the settings according to your specific needs.

<a id="websocket-fallback-sockjs-servlet3-async"></a>

## Client Disconnects

HTTP streaming and HTTP long polling SockJS transports require a connection to remain
open longer than usual. For an overview of these techniques, see
[this blog post](https://spring.io/blog/2012/05/08/spring-mvc-3-2-preview-techniques-for-real-time-updates/).

In Servlet containers, this is done through Servlet 3 asynchronous support that
allows exiting the Servlet container thread, processing a request, and continuing
to write to the response from another thread.

A specific issue is that the Servlet API does not provide notifications for a client
that has gone away. See [eclipse-ee4j/servlet-api#44](https://github.com/eclipse-ee4j/servlet-api/issues/44).
However, Servlet containers raise an exception on subsequent attempts to write
to the response. Since Spring’s SockJS Service supports server-sent heartbeats (every
25 seconds by default), that means a client disconnect is usually detected within that
time period (or earlier, if messages are sent more frequently).

> [!NOTE]
> As a result, network I/O failures can occur because a client has disconnected, which
> can fill the log with unnecessary stack traces. Spring makes a best effort to identify
> such network failures that represent client disconnects (specific to each server) and log
> a minimal message by using the dedicated log category, `DISCONNECTED_CLIENT_LOG_CATEGORY`
> (defined in `AbstractSockJsSession`). If you need to see the stack traces, you can set that
> log category to TRACE.

<a id="websocket-fallback-cors"></a>

## SockJS and CORS

If you allow cross-origin requests (see
[Allowed Origins](server.md#websocket-server-allowed-origins)), the SockJS
protocol uses CORS for cross-domain support in the XHR streaming and polling transports.
Therefore, CORS headers are added automatically, unless the presence of CORS headers in the
response is detected. So, if an application is already configured to provide CORS support
(for example, through a Servlet Filter), Spring’s `SockJsService` skips this part.

It is also possible to disable the addition of these CORS headers by setting the
`suppressCors` property in Spring’s SockJsService.

SockJS expects the following headers and values:

- `Access-Control-Allow-Origin`: Initialized from the value of the `Origin` request header.
- `Access-Control-Allow-Credentials`: Always set to `true`.
- `Access-Control-Request-Headers`: Initialized from values from the equivalent request header.
- `Access-Control-Allow-Methods`: The HTTP methods a transport supports (see `TransportType` enum).
- `Access-Control-Max-Age`: Set to 31536000 (1 year).

For the exact implementation, see `addCorsHeaders` in `AbstractSockJsService` and
the `TransportType` enum in the source code.

Alternatively, if the CORS configuration allows it, consider excluding URLs with the
SockJS endpoint prefix, thus letting Spring’s `SockJsService` handle it.

<a id="websocket-fallback-sockjs-client"></a>

## `SockJsClient`

Spring provides a SockJS Java client to connect to remote SockJS endpoints without
using a browser. This can be especially useful when there is a need for bidirectional
communication between two servers over a public network (that is, where network proxies can
preclude the use of the WebSocket protocol). A SockJS Java client is also very useful
for testing purposes (for example, to simulate a large number of concurrent users).

The SockJS Java client supports the `websocket`, `xhr-streaming`, and `xhr-polling`
transports. The remaining ones only make sense for use in a browser.

You can configure the `WebSocketTransport` with:

- `StandardWebSocketClient` in a JSR-356 runtime.
- `JettyWebSocketClient` by using the Jetty 9+ native WebSocket API.
- Any implementation of Spring’s `WebSocketClient`.

An `XhrTransport`, by definition, supports both `xhr-streaming` and `xhr-polling`, since,
from a client perspective, there is no difference other than in the URL used to connect
to the server. At present there are two implementations:

- `RestTemplateXhrTransport` uses Spring’s `RestTemplate` for HTTP requests.
- `JettyXhrTransport` uses Jetty’s `HttpClient` for HTTP requests.

The following example shows how to create a SockJS client and connect to a SockJS endpoint:

```java
List<Transport> transports = new ArrayList<>(2);
transports.add(new WebSocketTransport(new StandardWebSocketClient()));
transports.add(new RestTemplateXhrTransport());

SockJsClient sockJsClient = new SockJsClient(transports);
sockJsClient.doHandshake(new MyWebSocketHandler(), "ws://example.com:8080/sockjs");
```

> [!NOTE]
> SockJS uses JSON formatted arrays for messages. By default, Jackson 2 is used and needs
> to be on the classpath. Alternatively, you can configure a custom implementation of
> `SockJsMessageCodec` and configure it on the `SockJsClient`.

To use `SockJsClient` to simulate a large number of concurrent users, you
need to configure the underlying HTTP client (for XHR transports) to allow a sufficient
number of connections and threads. The following example shows how to do so with Jetty:

```java
HttpClient jettyHttpClient = new HttpClient();
jettyHttpClient.setMaxConnectionsPerDestination(1000);
jettyHttpClient.setExecutor(new QueuedThreadPool(1000));
```

The following example shows the server-side SockJS-related properties (see javadoc for details)
that you should also consider customizing:

#### Java

```java
@Configuration
public class WebSocketConfiguration extends WebSocketMessageBrokerConfigurationSupport {

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/sockjs").withSockJS()
			// Set the streamBytesLimit property to 512KB (the default is 128KB -- 128 * 1024)
			.setStreamBytesLimit(512 * 1024)
			// Set the httpMessageCacheSize property to 1,000 (the default is 100)
			.setHttpMessageCacheSize(1000)
			// Set the disconnectDelay property to 30 property seconds (the default is five seconds -- 5 * 1000)
			.setDisconnectDelay(30 * 1000);
	}

	// ...
}
```

#### Kotlin

```kotlin
@Configuration
class WebSocketConfiguration : WebSocketMessageBrokerConfigurationSupport() {

	override fun registerStompEndpoints(registry: StompEndpointRegistry) {
		registry.addEndpoint("/sockjs").withSockJS()
			// Set the streamBytesLimit property to 512KB (the default is 128KB -- 128 * 1024)
			.setStreamBytesLimit(512 * 1024)
			// Set the httpMessageCacheSize property to 1,000 (the default is 100)
			.setHttpMessageCacheSize(1000)
			// Set the disconnectDelay property to 30 property seconds (the default is five seconds -- 5 * 1000)
			.setDisconnectDelay(30 * 1000)
	}

	// ...
}
```
