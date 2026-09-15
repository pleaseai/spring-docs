---
title: "Flow of Messages"
source: "ROOT:web/websocket/stomp/message-flow.adoc"
---

<a id="websocket-stomp-message-flow"></a>

# Flow of Messages

Once a STOMP endpoint is exposed, the Spring application becomes a STOMP broker for
connected clients. This section describes the flow of messages on the server side.

The `spring-messaging` module contains foundational support for messaging applications
that originated in [Spring Integration](https://spring.io/spring-integration) and was
later extracted and incorporated into the Spring Framework for broader use across many
[Spring projects](https://spring.io/projects) and application scenarios.
The following list briefly describes a few of the available messaging abstractions:

- [Message](https://docs.spring.io/spring-framework/docs/6.2.18/javadoc-api/org/springframework/messaging/Message.html):
Simple representation for a message, including headers and payload.
- [MessageHandler](https://docs.spring.io/spring-framework/docs/6.2.18/javadoc-api/org/springframework/messaging/MessageHandler.html):
Contract for handling a message.
- [MessageChannel](https://docs.spring.io/spring-framework/docs/6.2.18/javadoc-api/org/springframework/messaging/MessageChannel.html):
Contract for sending a message that enables loose coupling between producers and consumers.
- [SubscribableChannel](https://docs.spring.io/spring-framework/docs/6.2.18/javadoc-api/org/springframework/messaging/SubscribableChannel.html):
`MessageChannel` with `MessageHandler` subscribers.
- [ExecutorSubscribableChannel](https://docs.spring.io/spring-framework/docs/6.2.18/javadoc-api/org/springframework/messaging/support/ExecutorSubscribableChannel.html):
`SubscribableChannel` that uses an `Executor` for delivering messages.

Both the Java configuration (that is, `@EnableWebSocketMessageBroker`) and the XML namespace configuration
(that is, `<websocket:message-broker>`) use the preceding components to assemble a message
workflow. The following diagram shows the components used when the simple built-in message
broker is enabled:

![message flow simple broker](https://raw.githubusercontent.com/spring-projects/spring-framework/v6.2.18/framework-docs/modules/ROOT/assets/images/message-flow-simple-broker.png)

The preceding diagram shows three message channels:

- `clientInboundChannel`: For passing messages received from WebSocket clients.
- `clientOutboundChannel`: For sending server messages to WebSocket clients.
- `brokerChannel`: For sending messages to the message broker from within
server-side application code.

The next diagram shows the components used when an external broker (such as RabbitMQ)
is configured for managing subscriptions and broadcasting messages:

![message flow broker relay](https://raw.githubusercontent.com/spring-projects/spring-framework/v6.2.18/framework-docs/modules/ROOT/assets/images/message-flow-broker-relay.png)

The main difference between the two preceding diagrams is the use of the “broker relay” for passing
messages up to the external STOMP broker over TCP and for passing messages down from the
broker to subscribed clients.

When messages are received from a WebSocket connection, they are decoded to STOMP frames,
turned into a Spring `Message` representation, and sent to the
`clientInboundChannel` for further processing. For example, STOMP messages whose
destination headers start with `/app` may be routed to `@MessageMapping` methods in
annotated controllers, while `/topic` and `/queue` messages may be routed directly
to the message broker.

An annotated `@Controller` that handles a STOMP message from a client may send a message to
the message broker through the `brokerChannel`, and the broker broadcasts the
message to matching subscribers through the `clientOutboundChannel`. The same
controller can also do the same in response to HTTP requests, so a client can perform an
HTTP POST, and then a `@PostMapping` method can send a message to the message broker
to broadcast to subscribed clients.

We can trace the flow through a simple example. Consider the following example, which sets up a server:

#### Java

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfiguration implements WebSocketMessageBrokerConfigurer {

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/portfolio");
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.setApplicationDestinationPrefixes("/app");
		registry.enableSimpleBroker("/topic");
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfiguration : WebSocketMessageBrokerConfigurer {
	override fun registerStompEndpoints(registry: StompEndpointRegistry) {
		registry.addEndpoint("/portfolio")
	}

	override fun configureMessageBroker(registry: MessageBrokerRegistry) {
		registry.setApplicationDestinationPrefixes("/app")
		registry.enableSimpleBroker("/topic")
	}
}
```

#### Java

```java
@Controller
public class GreetingController {

	@MessageMapping("/greeting")
	public String handle(String greeting) {
		return "[" + getTimestamp() + ": " + greeting;
	}

	private String getTimestamp() {
		return new SimpleDateFormat("MM/dd/yyyy h:mm:ss a").format(new Date());
	}

}
```

#### Kotlin

```kotlin
@Controller
class GreetingController {
	
	@MessageMapping("/greeting")
	fun handle(greeting: String): String {
		return "[${getTimestamp()}: $greeting"
	}

	private fun getTimestamp(): String {
		return SimpleDateFormat("MM/dd/yyyy h:mm:ss a").format(Date())
	}
}
```

The preceding example supports the following flow:

1. The client connects to `localhost:8080/portfolio` and, once a WebSocket connection
is established, STOMP frames begin to flow on it.
1. The client sends a SUBSCRIBE frame with a destination header of `/topic/greeting`. Once received
and decoded, the message is sent to the `clientInboundChannel` and is then routed to the
message broker, which stores the client subscription.
1. The client sends a SEND frame to `/app/greeting`. The `/app` prefix helps to route it to
annotated controllers. After the `/app` prefix is stripped, the remaining `/greeting`
part of the destination is mapped to the `@MessageMapping` method in `GreetingController`.
1. The value returned from `GreetingController` is turned into a Spring `Message` with
a payload based on the return value and a default destination header of
`/topic/greeting` (derived from the input destination with `/app` replaced by
`/topic`). The resulting message is sent to the `brokerChannel` and handled
by the message broker.
1. The message broker finds all matching subscribers and sends a MESSAGE frame to each one
through the `clientOutboundChannel`, from where messages are encoded as STOMP frames
and sent on the WebSocket connection.

The next section provides more details on annotated methods, including the
kinds of arguments and return values that are supported.
