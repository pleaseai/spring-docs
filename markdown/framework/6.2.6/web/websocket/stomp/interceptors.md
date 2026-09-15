---
title: "Interception"
source: "ROOT:web/websocket/stomp/interceptors.adoc"
---

<a id="websocket-stomp-interceptors"></a>

# Interception

[Events](application-context-events.md) provide notifications for the lifecycle
of a STOMP connection but not for every client message. Applications can also register a
`ChannelInterceptor` to intercept any message and in any part of the processing chain.
The following example shows how to intercept inbound messages from clients:

#### Java

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfiguration implements WebSocketMessageBrokerConfigurer {

	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
		registration.interceptors(new MyChannelInterceptor());
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfiguration : WebSocketMessageBrokerConfigurer {

	override fun configureClientInboundChannel(registration: ChannelRegistration) {
		registration.interceptors(MyChannelInterceptor())
	}
}
```

A custom `ChannelInterceptor` can use `StompHeaderAccessor` or `SimpMessageHeaderAccessor`
to access information about the message, as the following example shows:

#### Java

```java
public class MyChannelInterceptor implements ChannelInterceptor {

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);
		StompCommand command = accessor.getCommand();
		// ...
		return message;
	}
}
```

#### Kotlin

```kotlin
class MyChannelInterceptor : ChannelInterceptor {

	override fun preSend(message: Message<*>, channel: MessageChannel): Message<*> {
		val accessor = StompHeaderAccessor.wrap(message)
		val command = accessor.command
		// ...
		return message
	}
}
```

Applications can also implement `ExecutorChannelInterceptor`, which is a sub-interface
of `ChannelInterceptor` with callbacks in the thread in which the messages are handled.
While a `ChannelInterceptor` is invoked once for each message sent to a channel, the
`ExecutorChannelInterceptor` provides hooks in the thread of each `MessageHandler`
subscribed to messages from the channel.

Note that, as with the `SessionDisconnectEvent` described earlier, a DISCONNECT message
can be from the client or it can also be automatically generated when
the WebSocket session is closed. In some cases, an interceptor may intercept this
message more than once for each session. Components should be idempotent with regard to
multiple disconnect events.
