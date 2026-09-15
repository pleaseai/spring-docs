---
title: "RSocket"
source: "ROOT:rsocket.adoc"
---

<a id="rsocket"></a>

# RSocket

This section describes Spring Framework’s support for the RSocket protocol.

<a id="rsocket-overview"></a>

## Overview

RSocket is an application protocol for multiplexed, duplex communication over TCP,
WebSocket, and other byte stream transports, using one of the following interaction
models:

- `Request-Response` — send one message and receive one back.
- `Request-Stream` — send one message and receive a stream of messages back.
- `Channel` — send streams of messages in both directions.
- `Fire-and-Forget` — send a one-way message.

Once the initial connection is made, the "client" vs "server" distinction is lost as
both sides become symmetrical and each side can initiate one of the above interactions.
This is why in the protocol calls the participating sides "requester" and "responder"
while the above interactions are called "request streams" or simply "requests".

These are the key features and benefits of the RSocket protocol:

- [Reactive Streams](https://www.reactive-streams.org/) semantics across network boundary — for streaming requests such as `Request-Stream` and `Channel`, back pressure signals
travel between requester and responder, allowing a requester to slow down a responder at
the source, hence reducing reliance on network layer congestion control, and the need
for buffering at the network level or at any level.
- Request throttling — this feature is named "Leasing" after the `LEASE` frame that
can be sent from each end to limit the total number of requests allowed by other end
for a given time. Leases are renewed periodically.
- Session resumption — this is designed for loss of connectivity and requires some state
to be maintained. The state management is transparent for applications, and works well
in combination with back pressure which can stop a producer when possible and reduce
the amount of state required.
- Fragmentation and re-assembly of large messages.
- Keepalive (heartbeats).

RSocket has [implementations](https://github.com/rsocket) in multiple languages. The
[Java library](https://github.com/rsocket/rsocket-java) is built on [Project Reactor](https://projectreactor.io/),
and [Reactor Netty](https://github.com/reactor/reactor-netty) for the transport. That means
signals from Reactive Streams Publishers in your application propagate transparently
through RSocket across the network.

<a id="rsocket-protocol"></a>

### The Protocol

One of the benefits of RSocket is that it has well defined behavior on the wire and an
easy to read [specification](https://rsocket.io/about/protocol) along with some protocol
[extensions](https://github.com/rsocket/rsocket/tree/master/Extensions). Therefore it is
a good idea to read the spec, independent of language implementations and higher level
framework APIs. This section provides a succinct overview to establish some context.

**Connecting**

Initially a client connects to a server via some low level streaming transport such
as TCP or WebSocket and sends a `SETUP` frame to the server to set parameters for the
connection.

The server may reject the `SETUP` frame, but generally after it is sent (for the client)
and received (for the server), both sides can begin to make requests, unless `SETUP`
indicates use of leasing semantics to limit the number of requests, in which case
both sides must wait for a `LEASE` frame from the other end to permit making requests.

**Making Requests**

Once a connection is established, both sides may initiate a request through one of the
frames `REQUEST_RESPONSE`, `REQUEST_STREAM`, `REQUEST_CHANNEL`, or `REQUEST_FNF`. Each of
those frames carries one message from the requester to the responder.

The responder may then return `PAYLOAD` frames with response messages, and in the case
of `REQUEST_CHANNEL` the requester may also send `PAYLOAD` frames with more request
messages.

When a request involves a stream of messages such as `Request-Stream` and `Channel`,
the responder must respect demand signals from the requester. Demand is expressed as a
number of messages. Initial demand is specified in `REQUEST_STREAM` and
`REQUEST_CHANNEL` frames. Subsequent demand is signaled via `REQUEST_N` frames.

Each side may also send metadata notifications, via the `METADATA_PUSH` frame, that do not
pertain to any individual request but rather to the connection as a whole.

**Message Format**

RSocket messages contain data and metadata. Metadata can be used to send a route, a
security token, etc. Data and metadata can be formatted differently. Mime types for each
are declared in the `SETUP` frame and apply to all requests on a given connection.

While all messages can have metadata, typically metadata such as a route are per-request
and therefore only included in the first message on a request, i.e. with one of the frames
`REQUEST_RESPONSE`, `REQUEST_STREAM`, `REQUEST_CHANNEL`, or `REQUEST_FNF`.

Protocol extensions define common metadata formats for use in applications:

- [Composite Metadata](https://github.com/rsocket/rsocket/tree/master/Extensions/CompositeMetadata.md)-- multiple,
independently formatted metadata entries.
- [Routing](https://github.com/rsocket/rsocket/tree/master/Extensions/Routing.md) — the route for a request.

<a id="rsocket-java"></a>

### Java Implementation

The [Java implementation](https://github.com/rsocket/rsocket-java) for RSocket is built on
[Project Reactor](https://projectreactor.io/). The transports for  TCP and WebSocket are
built on [Reactor Netty](https://github.com/reactor/reactor-netty). As a Reactive Streams
library, Reactor simplifies the job of implementing the protocol. For applications it is
a natural fit to use `Flux` and `Mono` with declarative operators and transparent back
pressure support.

The API in RSocket Java is intentionally minimal and basic. It focuses on protocol
features and leaves the application programming model (for example, RPC codegen vs other) as a
higher level, independent concern.

The main contract
[io.rsocket.RSocket](https://github.com/rsocket/rsocket-java/tree/master//rsocket-core/src/main/java/io/rsocket/RSocket.java)
models the four request interaction types with `Mono` representing a promise for a
single message, `Flux` a stream of messages, and `io.rsocket.Payload` the actual
message with access to data and metadata as byte buffers. The `RSocket` contract is used
symmetrically. For requesting, the application is given an `RSocket` to perform
requests with. For responding, the application implements `RSocket` to handle requests.

This is not meant to be a thorough introduction. For the most part, Spring applications
will not have to use its API directly. However it may be important to see or experiment
with RSocket independent of Spring. The RSocket Java repository contains a number of
[sample apps](https://github.com/rsocket/rsocket-java/tree/master//rsocket-examples) that
demonstrate its API and protocol features.

<a id="rsocket-spring"></a>

### Spring Support

The `spring-messaging` module contains the following:

- [RSocketRequester](#rsocket-requester) — fluent API to make requests
through an `io.rsocket.RSocket` with data and metadata encoding/decoding.
- [Annotated Responders](#rsocket-annot-responders) — `@MessageMapping`
and `@RSocketExchange` annotated handler methods for responding.
- [RSocket Interface](#rsocket-interface) — RSocket service declaration
as Java interface with `@RSocketExchange` methods, for use as requester or responder.

The `spring-web` module contains `Encoder` and `Decoder` implementations such as Jackson
CBOR/JSON, and Protobuf that RSocket applications will likely need. It also contains the
`PathPatternParser` that can be plugged in for efficient route matching.

Spring Boot 2.2 supports standing up an RSocket server over TCP or WebSocket, including
the option to expose RSocket over WebSocket in a WebFlux server. There is also client
support and auto-configuration for an `RSocketRequester.Builder` and `RSocketStrategies`.
See the
[RSocket section](https://docs.spring.io/spring-boot/messaging.html#messaging.rsocket)
in the Spring Boot reference for more details.

Spring Security 5.2 provides RSocket support.

Spring Integration 5.2 provides inbound and outbound gateways to interact with RSocket
clients and servers. See the Spring Integration Reference Manual for more details.

Spring Cloud Gateway supports RSocket connections.

<a id="rsocket-requester"></a>

## RSocketRequester

`RSocketRequester` provides a fluent API to perform RSocket requests, accepting and
returning objects for data and metadata instead of low level data buffers. It can be used
symmetrically, to make requests from clients and to make requests from servers.

<a id="rsocket-requester-client"></a>

### Client Requester

To obtain an `RSocketRequester` on the client side is to connect to a server which involves
sending an RSocket `SETUP` frame with connection settings. `RSocketRequester` provides a
builder that helps to prepare an `io.rsocket.core.RSocketConnector` including connection
settings for the `SETUP` frame.

This is the most basic way to connect with default settings:

#### Java

```java
RSocketRequester requester = RSocketRequester.builder().tcp("localhost", 7000);

URI url = URI.create("https://example.org:8080/rsocket");
RSocketRequester requester = RSocketRequester.builder().webSocket(url);
```

#### Kotlin

```kotlin
val requester = RSocketRequester.builder().tcp("localhost", 7000)

URI url = URI.create("https://example.org:8080/rsocket");
val requester = RSocketRequester.builder().webSocket(url)
```

The above does not connect immediately. When requests are made, a shared connection is
established transparently and used.

<a id="rsocket-requester-client-setup"></a>

#### Connection Setup

`RSocketRequester.Builder` provides the following to customize the initial `SETUP` frame:

- `dataMimeType(MimeType)` — set the mime type for data on the connection.
- `metadataMimeType(MimeType)` — set the mime type for metadata on the connection.
- `setupData(Object)` — data to include in the `SETUP`.
- `setupRoute(String, Object…​)` — route in the metadata to include in the `SETUP`.
- `setupMetadata(Object, MimeType)` — other metadata to include in the `SETUP`.

For data, the default mime type is derived from the first configured `Decoder`. For
metadata, the default mime type is
[composite metadata](https://github.com/rsocket/rsocket/tree/master/Extensions/CompositeMetadata.md) which allows multiple
metadata value and mime type pairs per request. Typically both don’t need to be changed.

Data and metadata in the `SETUP` frame is optional. On the server side,
[@ConnectMapping](#rsocket-annot-connectmapping) methods can be used to
handle the start of a connection and the content of the `SETUP` frame. Metadata may be
used for connection level security.

<a id="rsocket-requester-client-strategies"></a>

#### Strategies

`RSocketRequester.Builder` accepts `RSocketStrategies` to configure the requester.
You’ll need to use this to provide encoders and decoders for (de)-serialization of data and
metadata values. By default only the basic codecs from `spring-core` for `String`,
`byte[]`, and `ByteBuffer` are registered. Adding `spring-web` provides access to more that
can be registered as follows:

#### Java

```java
RSocketStrategies strategies = RSocketStrategies.builder()
	.encoders(encoders -> encoders.add(new JacksonCborEncoder()))
	.decoders(decoders -> decoders.add(new JacksonCborDecoder()))
	.build();

RSocketRequester requester = RSocketRequester.builder()
	.rsocketStrategies(strategies)
	.tcp("localhost", 7000);
```

#### Kotlin

```kotlin
val strategies = RSocketStrategies.builder()
		.encoders { it.add(JacksonCborEncoder()) }
		.decoders { it.add(JacksonCborDecoder()) }
		.build()

val requester = RSocketRequester.builder()
		.rsocketStrategies(strategies)
		.tcp("localhost", 7000)
```

`RSocketStrategies` is designed for re-use. In some scenarios, for example, client and server in
the same application, it may be preferable to declare it in Spring configuration.

<a id="rsocket-requester-client-responder"></a>

#### Client Responders

`RSocketRequester.Builder` can be used to configure responders to requests from the
server.

You can use annotated handlers for client-side responding based on the same
infrastructure that’s used on a server, but registered programmatically as follows:

#### Java

```java
RSocketStrategies strategies = RSocketStrategies.builder()
	.routeMatcher(new PathPatternRouteMatcher())  // <1>
	.build();

SocketAcceptor responder =
	RSocketMessageHandler.responder(strategies, new ClientHandler()); // <2>

RSocketRequester requester = RSocketRequester.builder()
	.rsocketConnector(connector -> connector.acceptor(responder)) // <3>
	.tcp("localhost", 7000);
```

1. Use `PathPatternRouteMatcher`, if `spring-web` is present, for efficient
route matching.
1. Create a responder from a class with `@MessageMapping` and/or `@ConnectMapping` methods.
1. Register the responder.

#### Kotlin

```kotlin
val strategies = RSocketStrategies.builder()
		.routeMatcher(PathPatternRouteMatcher())  // <1>
		.build()

val responder =
	RSocketMessageHandler.responder(strategies, new ClientHandler()); // <2>

val requester = RSocketRequester.builder()
		.rsocketConnector { it.acceptor(responder) } // <3>
		.tcp("localhost", 7000)
```

1. Use `PathPatternRouteMatcher`, if `spring-web` is present, for efficient
route matching.
1. Create a responder from a class with `@MessageMapping` and/or `@ConnectMapping` methods.
1. Register the responder.

Note the above is only a shortcut designed for programmatic registration of client
responders. For alternative scenarios, where client responders are in Spring configuration,
you can still declare `RSocketMessageHandler` as a Spring bean and then apply as follows:

#### Java

```java
ApplicationContext context = ... ;
RSocketMessageHandler handler = context.getBean(RSocketMessageHandler.class);

RSocketRequester requester = RSocketRequester.builder()
	.rsocketConnector(connector -> connector.acceptor(handler.responder()))
	.tcp("localhost", 7000);
```

#### Kotlin

```kotlin
import org.springframework.beans.factory.getBean

val context: ApplicationContext = ...
val handler = context.getBean<RSocketMessageHandler>()

val requester = RSocketRequester.builder()
		.rsocketConnector { it.acceptor(handler.responder()) }
		.tcp("localhost", 7000)
```

For the above you may also need to use `setHandlerPredicate` in `RSocketMessageHandler` to
switch to a different strategy for detecting client responders, for example, based on a custom
annotation such as `@RSocketClientResponder` vs the default `@Controller`. This
is necessary in scenarios with client and server, or multiple clients in the same
application.

See also [Annotated Responders](#rsocket-annot-responders), for more on the programming model.

<a id="rsocket-requester-client-advanced"></a>

#### Advanced

`RSocketRequesterBuilder` provides a callback to expose the underlying
`io.rsocket.core.RSocketConnector` for further configuration options for keepalive
intervals, session resumption, interceptors, and more. You can configure options
at that level as follows:

#### Java

```java
RSocketRequester requester = RSocketRequester.builder()
	.rsocketConnector(connector -> {
		// ...
	})
	.tcp("localhost", 7000);
```

#### Kotlin

```kotlin
val requester = RSocketRequester.builder()
		.rsocketConnector {
			//...
		}
		.tcp("localhost", 7000)
```

<a id="rsocket-requester-server"></a>

### Server Requester

To make requests from a server to connected clients is a matter of obtaining the
requester for the connected client from the server.

In [Annotated Responders](#rsocket-annot-responders), `@ConnectMapping` and `@MessageMapping` methods support an
`RSocketRequester` argument. Use it to access the requester for the connection. Keep in
mind that `@ConnectMapping` methods are essentially handlers of the `SETUP` frame which
must be handled before requests can begin. Therefore, requests at the very start must be
decoupled from handling. For example:

#### Java

```java
@ConnectMapping
Mono<Void> handle(RSocketRequester requester) {
	requester.route("status").data("5")
		.retrieveFlux(StatusReport.class)
		.subscribe(bar -> { // <1>
			// ...
		});
	return ... // <2>
}
```

1. Start the request asynchronously, independent from handling.
1. Perform handling and return completion `Mono<Void>`.

#### Kotlin

```kotlin
@ConnectMapping
suspend fun handle(requester: RSocketRequester) {
	GlobalScope.launch {
		requester.route("status").data("5").retrieveFlow<StatusReport>().collect { // <1>
			// ...
		}
	}
	/// ... <2>
}
```

1. Start the request asynchronously, independent from handling.
1. Perform handling in the suspending function.

<a id="rsocket-requester-requests"></a>

### Requests

Once you have a [client](#rsocket-requester-client) or
[server](#rsocket-requester-server) requester, you can make requests as follows:

#### Java

```java
ViewBox viewBox = ... ;

Flux<AirportLocation> locations = requester.route("locate.radars.within") // <1>
		.data(viewBox) // <2>
		.retrieveFlux(AirportLocation.class); // <3>

```

1. Specify a route to include in the metadata of the request message.
1. Provide data for the request message.
1. Declare the expected response.

#### Kotlin

```kotlin
val viewBox: ViewBox = ...

val locations = requester.route("locate.radars.within") // <1>
		.data(viewBox) // <2>
		.retrieveFlow<AirportLocation>() // <3>
```

1. Specify a route to include in the metadata of the request message.
1. Provide data for the request message.
1. Declare the expected response.

The interaction type is determined implicitly from the cardinality of the input and
output. The above example is a `Request-Stream` because one value is sent and a stream
of values is received. For the most part you don’t need to think about this as long as the
choice of input and output matches an RSocket interaction type and the types of input and
output expected by the responder. The only example of an invalid combination is many-to-one.

The `data(Object)` method also accepts any Reactive Streams `Publisher`, including
`Flux` and `Mono`, as well as any other producer of value(s) that is registered in the
`ReactiveAdapterRegistry`. For a multi-value `Publisher` such as `Flux` which produces the
same types of values, consider using one of the overloaded `data` methods to avoid having
type checks and `Encoder` lookup on every element:

```java
data(Object producer, Class<?> elementClass);
data(Object producer, ParameterizedTypeReference<?> elementTypeRef);
```

The `data(Object)` step is optional. Skip it for requests that don’t send data:

#### Java

```java
Mono<AirportLocation> location = requester.route("find.radar.EWR"))
	.retrieveMono(AirportLocation.class);
```

#### Kotlin

```kotlin
import org.springframework.messaging.rsocket.retrieveAndAwait

val location = requester.route("find.radar.EWR")
	.retrieveAndAwait<AirportLocation>()
```

Extra metadata values can be added if using
[composite metadata](https://github.com/rsocket/rsocket/tree/master/Extensions/CompositeMetadata.md) (the default) and if the
values are supported by a registered `Encoder`. For example:

#### Java

```java
String securityToken = ... ;
ViewBox viewBox = ... ;
MimeType mimeType = MimeType.valueOf("message/x.rsocket.authentication.bearer.v0");

Flux<AirportLocation> locations = requester.route("locate.radars.within")
		.metadata(securityToken, mimeType)
		.data(viewBox)
		.retrieveFlux(AirportLocation.class);
```

#### Kotlin

```kotlin
import org.springframework.messaging.rsocket.retrieveFlow

val requester: RSocketRequester = ...

val securityToken: String = ...
val viewBox: ViewBox = ...
val mimeType = MimeType.valueOf("message/x.rsocket.authentication.bearer.v0")

val locations = requester.route("locate.radars.within")
		.metadata(securityToken, mimeType)
		.data(viewBox)
		.retrieveFlow<AirportLocation>()
```

For `Fire-and-Forget` use the `send()` method that returns `Mono<Void>`. Note that the `Mono`
indicates only that the message was successfully sent, and not that it was handled.

For `Metadata-Push` use the `sendMetadata()` method with a `Mono<Void>` return value.

<a id="rsocket-annot-responders"></a>

## Annotated Responders

RSocket responders can be implemented as `@MessageMapping` and `@ConnectMapping` methods.
`@MessageMapping` methods handle individual requests while `@ConnectMapping` methods handle
connection-level events (setup and metadata push). Annotated responders are supported
symmetrically, for responding from the server side and for responding from the client side.

<a id="rsocket-annot-responders-server"></a>

### Server Responders

To use annotated responders on the server side, add `RSocketMessageHandler` to your Spring
configuration to detect `@Controller` beans with `@MessageMapping` and `@ConnectMapping`
methods:

#### Java

```java
@Configuration
static class ServerConfig {

	@Bean
	public RSocketMessageHandler rsocketMessageHandler() {
		RSocketMessageHandler handler = new RSocketMessageHandler();
		handler.routeMatcher(new PathPatternRouteMatcher());
		return handler;
	}
}
```

#### Kotlin

```kotlin
@Configuration
class ServerConfig {

	@Bean
	fun rsocketMessageHandler() = RSocketMessageHandler().apply {
		routeMatcher = PathPatternRouteMatcher()
	}
}
```

Then start an RSocket server through the Java RSocket API and plug the
`RSocketMessageHandler` for the responder as follows:

#### Java

```java
ApplicationContext context = ... ;
RSocketMessageHandler handler = context.getBean(RSocketMessageHandler.class);

CloseableChannel server =
	RSocketServer.create(handler.responder())
		.bind(TcpServerTransport.create("localhost", 7000))
		.block();
```

#### Kotlin

```kotlin
import org.springframework.beans.factory.getBean

val context: ApplicationContext = ...
val handler = context.getBean<RSocketMessageHandler>()

val server = RSocketServer.create(handler.responder())
		.bind(TcpServerTransport.create("localhost", 7000))
		.awaitSingle()
```

`RSocketMessageHandler` supports
[composite](https://github.com/rsocket/rsocket/tree/master/Extensions/CompositeMetadata.md) and
[routing](https://github.com/rsocket/rsocket/tree/master/Extensions/Routing.md) metadata by default. You can set its
[MetadataExtractor](#rsocket-metadata-extractor) if you need to switch to a
different mime type or register additional metadata mime types.

You’ll need to set the `Encoder` and `Decoder` instances required for metadata and data
formats to support. You’ll likely need the `spring-web` module for codec implementations.

By default `SimpleRouteMatcher` is used for matching routes via `AntPathMatcher`.
We recommend plugging in the `PathPatternRouteMatcher` from `spring-web` for
efficient route matching. RSocket routes can be hierarchical but are not URL paths.
Both route matchers are configured to use "." as separator by default and there is no URL
decoding as with HTTP URLs.

`RSocketMessageHandler` can be configured via `RSocketStrategies` which may be useful if
you need to share configuration between a client and a server in the same process:

#### Java

```java
@Configuration
static class ServerConfig {

	@Bean
	public RSocketMessageHandler rsocketMessageHandler() {
		RSocketMessageHandler handler = new RSocketMessageHandler();
		handler.setRSocketStrategies(rsocketStrategies());
		return handler;
	}

	@Bean
	public RSocketStrategies rsocketStrategies() {
		return RSocketStrategies.builder()
			.encoders(encoders -> encoders.add(new JacksonCborEncoder()))
			.decoders(decoders -> decoders.add(new JacksonCborDecoder()))
			.routeMatcher(new PathPatternRouteMatcher())
			.build();
	}
}
```

#### Kotlin

```kotlin
@Configuration
class ServerConfig {

	@Bean
	fun rsocketMessageHandler() = RSocketMessageHandler().apply {
		rSocketStrategies = rsocketStrategies()
	}

	@Bean
	fun rsocketStrategies() = RSocketStrategies.builder()
			.encoders { it.add(JacksonCborEncoder()) }
			.decoders { it.add(JacksonCborDecoder()) }
			.routeMatcher(PathPatternRouteMatcher())
			.build()
}
```

<a id="rsocket-annot-responders-client"></a>

### Client Responders

Annotated responders on the client side need to be configured in the
`RSocketRequester.Builder`. For details, see
[Client Responders](#rsocket-requester-client-responder).

<a id="rsocket-annot-messagemapping"></a>

### @MessageMapping

Once [server](#rsocket-annot-responders-server) or
[client](#rsocket-annot-responders-client) responder configuration is in place,
`@MessageMapping` methods can be used as follows:

#### Java

```java
@Controller
public class RadarsController {

	@MessageMapping("locate.radars.within")
	public Flux<AirportLocation> radars(MapRequest request) {
		// ...
	}
}
```

#### Kotlin

```kotlin
@Controller
class RadarsController {

	@MessageMapping("locate.radars.within")
	fun radars(request: MapRequest): Flow<AirportLocation> {
		// ...
	}
}
```

The above `@MessageMapping` method responds to a Request-Stream interaction having the
route "locate.radars.within". It supports a flexible method signature with the option to
use the following method arguments:

| Method Argument | Description |
| --- | --- |
| `@Payload` | The payload of the request. This can be a concrete value of asynchronous types like `Mono` or `Flux`. **Note:** Use of the annotation is optional. A method argument that is not a simple type and is not any of the other supported arguments, is assumed to be the expected payload. |
| `RSocketRequester` | Requester for making requests to the remote end. |
| `@DestinationVariable` | Value extracted from the route based on variables in the mapping pattern, for example, `@MessageMapping("find.radar.{id}")`. |
| `@Header` | Metadata value registered for extraction as described in [MetadataExtractor](#rsocket-metadata-extractor). |
| `@Headers Map<String, Object>` | All metadata values registered for extraction as described in [MetadataExtractor](#rsocket-metadata-extractor). |

The return value is expected to be one or more Objects to be serialized as response
payloads. That can be asynchronous types like `Mono` or `Flux`, a concrete value, or
either `void` or a no-value asynchronous type such as `Mono<Void>`.

The RSocket interaction type that an `@MessageMapping` method supports is determined from
the cardinality of the input (i.e. `@Payload` argument) and of the output, where
cardinality means the following:

| Cardinality | Description |
| --- | --- |
| 1 | Either an explicit value, or a single-value asynchronous type such as `Mono<T>`. |
| Many | A multi-value asynchronous type such as `Flux<T>`. |
| 0 | For input this means the method does not have an `@Payload` argument. For output this is `void` or a no-value asynchronous type such as `Mono<Void>`. |

The table below shows all input and output cardinality combinations and the corresponding
interaction type(s):

| Input Cardinality | Output Cardinality | Interaction Types |
| --- | --- | --- |
| 0, 1 | 0 | Fire-and-Forget, Request-Response |
| 0, 1 | 1 | Request-Response |
| 0, 1 | Many | Request-Stream |
| Many | 0, 1, Many | Request-Channel |

<a id="rsocket-annot-rsocketexchange"></a>

### @RSocketExchange

As an alternative to  `@MessageMapping`, you can also handle requests with
`@RSocketExchange` methods. Such methods are declared on an
[RSocket Interface](#rsocket-interface) and can be used as a requester via
`RSocketServiceProxyFactory` or implemented by a responder.

For example, to handle requests as a responder:

#### Java

```java
public interface RadarsService {

	@RSocketExchange("locate.radars.within")
	Flux<AirportLocation> radars(MapRequest request);
}

@Controller
public class RadarsController implements RadarsService {

	public Flux<AirportLocation> radars(MapRequest request) {
		// ...
	}
}
```

#### Kotlin

```kotlin
interface RadarsService {

	@RSocketExchange("locate.radars.within")
	fun radars(request: MapRequest): Flow<AirportLocation>
}

@Controller
class RadarsController : RadarsService {

	override fun radars(request: MapRequest): Flow<AirportLocation> {
		// ...
	}
}
```

There some differences between `@RSocketExhange` and `@MessageMapping` since the
former needs to remain suitable for requester and responder use. For example, while
`@MessageMapping` can be declared to handle any number of routes and each route can
be a pattern, `@RSocketExchange` must be declared with a single, concrete route. There are
also small differences in the supported method parameters related to metadata, see
[@MessageMapping](#rsocket-annot-messagemapping) and
[RSocket Interface](#rsocket-interface) for a list of supported parameters.

`@RSocketExchange` can be used at the type level to specify a common prefix for all routes
for a given RSocket service interface.

<a id="rsocket-annot-connectmapping"></a>

### @ConnectMapping

`@ConnectMapping` handles the `SETUP` frame at the start of an RSocket connection, and
any subsequent metadata push notifications through the `METADATA_PUSH` frame, i.e.
`metadataPush(Payload)` in `io.rsocket.RSocket`.

`@ConnectMapping` methods support the same arguments as
[@MessageMapping](#rsocket-annot-messagemapping) but based on metadata and data from the `SETUP` and
`METADATA_PUSH` frames. `@ConnectMapping` can have a pattern to narrow handling to
specific connections that have a route in the metadata, or if no patterns are declared
then all connections match.

`@ConnectMapping` methods cannot return data and must be declared with `void` or
`Mono<Void>` as the return value. If handling returns an error for a new
connection then the connection is rejected. Handling must not be held up to make
requests to the `RSocketRequester` for the connection. See
[Server Requester](#rsocket-requester-server) for details.

<a id="rsocket-metadata-extractor"></a>

## MetadataExtractor

Responders must interpret metadata.
[Composite metadata](https://github.com/rsocket/rsocket/tree/master/Extensions/CompositeMetadata.md) allows independently
formatted metadata values (for example, for routing, security, tracing) each with its own mime
type. Applications need a way to configure metadata mime types to support, and a way
to access extracted values.

`MetadataExtractor` is a contract to take serialized metadata and return decoded
name-value pairs that can then be accessed like headers by name, for example via `@Header`
in annotated handler methods.

`DefaultMetadataExtractor` can be given `Decoder` instances to decode metadata. Out of
the box it has built-in support for
["message/x.rsocket.routing.v0"](https://github.com/rsocket/rsocket/tree/master/Extensions/Routing.md) which it decodes to
`String` and saves under the "route" key. For any other mime type you’ll need to provide
a `Decoder` and register the mime type as follows:

#### Java

```java
DefaultMetadataExtractor extractor = new DefaultMetadataExtractor(metadataDecoders);
extractor.metadataToExtract(fooMimeType, Foo.class, "foo");
```

#### Kotlin

```kotlin
import org.springframework.messaging.rsocket.metadataToExtract

val extractor = DefaultMetadataExtractor(metadataDecoders)
extractor.metadataToExtract<Foo>(fooMimeType, "foo")
```

Composite metadata works well to combine independent metadata values. However the
requester might not support composite metadata, or may choose not to use it. For this,
`DefaultMetadataExtractor` may needs custom logic to map the decoded value to the output
map. Here is an example where JSON is used for metadata:

#### Java

```java
DefaultMetadataExtractor extractor = new DefaultMetadataExtractor(metadataDecoders);
extractor.metadataToExtract(
	MimeType.valueOf("application/vnd.myapp.metadata+json"),
	new ParameterizedTypeReference<Map<String,String>>() {},
	(jsonMap, outputMap) -> {
		outputMap.putAll(jsonMap);
	});
```

#### Kotlin

```kotlin
import org.springframework.messaging.rsocket.metadataToExtract

val extractor = DefaultMetadataExtractor(metadataDecoders)
extractor.metadataToExtract<Map<String, String>>(MimeType.valueOf("application/vnd.myapp.metadata+json")) { jsonMap, outputMap ->
	outputMap.putAll(jsonMap)
}
```

When configuring `MetadataExtractor` through `RSocketStrategies`, you can let
`RSocketStrategies.Builder` create the extractor with the configured decoders, and
simply use a callback to customize registrations as follows:

#### Java

```java
RSocketStrategies strategies = RSocketStrategies.builder()
	.metadataExtractorRegistry(registry -> {
		registry.metadataToExtract(fooMimeType, Foo.class, "foo");
		// ...
	})
	.build();
```

#### Kotlin

```kotlin
import org.springframework.messaging.rsocket.metadataToExtract

val strategies = RSocketStrategies.builder()
		.metadataExtractorRegistry { registry: MetadataExtractorRegistry ->
			registry.metadataToExtract<Foo>(fooMimeType, "foo")
			// ...
		}
		.build()
```

<a id="rsocket-interface"></a>

## RSocket Interface

The Spring Framework lets you define an RSocket service as a Java interface with
`@RSocketExchange` methods. You can pass such an interface to `RSocketServiceProxyFactory`
to create a proxy which performs requests through an
[RSocketRequester](#rsocket-requester). You can also implement the
interface as a responder that handles requests.

Start by creating the interface with `@RSocketExchange` methods:

```java
interface RadarService {

	@RSocketExchange("radars")
	Flux<AirportLocation> getRadars(@Payload MapRequest request);

	// more RSocket exchange methods...

}
```

Now you can create a proxy that performs requests when methods are called:

```java
RSocketRequester requester = ... ;
RSocketServiceProxyFactory factory = RSocketServiceProxyFactory.builder(requester).build();

RadarService service = factory.createClient(RadarService.class);
```

You can also implement the interface to handle requests as a responder.
See [Annotated Responders](#rsocket-annot-rsocketexchange).

<a id="rsocket-interface-method-parameters"></a>

### Method Parameters

Annotated, RSocket exchange methods support flexible method signatures with the following
method parameters:

| Method argument | Description |
| --- | --- |
| `@DestinationVariable` | Add a route variable to pass to `RSocketRequester` along with the route from the `@RSocketExchange` annotation in order to expand template placeholders in the route. This variable can be a String or any Object, which is then formatted via `toString()`. |
| `@Payload` | Set the input payload(s) for the request. This can be a concrete value, or any producer of values that can be adapted to a Reactive Streams `Publisher` via `ReactiveAdapterRegistry`. A payload must be provided unless the `required` attribute is set to `false`, or the parameter is marked optional as determined by [`MethodParameter#isOptional`](<https://docs.spring.io/spring-framework/docs/7.0.4/javadoc-api/org/springframework/core/MethodParameter.html#isOptional()>). |
| `Object`, if followed by `MimeType` | The value for a metadata entry in the input payload. This can be any `Object` as long as the next argument is the metadata entry `MimeType`. The value can be a concrete value or any producer of a single value that can be adapted to a Reactive Streams `Publisher` via `ReactiveAdapterRegistry`. |
| `MimeType` | The `MimeType` for a metadata entry. The preceding method argument is expected to be the metadata value. |

<a id="rsocket-interface-return-values"></a>

### Return Values

Annotated, RSocket exchange methods support return values that are concrete value(s), or
any producer of value(s) that can be adapted to a Reactive Streams `Publisher` via
`ReactiveAdapterRegistry`.

By default, the behavior of RSocket service methods with synchronous (blocking) method
signature depends on response timeout settings of the underlying RSocket `ClientTransport`
as well as RSocket keep-alive settings. `RSocketServiceProxyFactory.Builder` does expose a
`blockTimeout` option that also lets you configure the maximum time to block for a response,
but we recommend configuring timeout values at the RSocket level for more control.
