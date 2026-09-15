---
title: "Simple Broker"
source: "ROOT:web/websocket/stomp/handle-simple-broker.adoc"
---

<a id="websocket-stomp-handle-simple-broker"></a>

# Simple Broker

The built-in simple message broker handles subscription requests from clients,
stores them in memory, and broadcasts messages to connected clients that have matching
destinations. The broker supports path-like destinations, including subscriptions
to Ant-style destination patterns.

> [!NOTE]
> Applications can also use dot-separated (rather than slash-separated) destinations.
> See [Dots as Separators](destination-separator.md).

If configured with a task scheduler, the simple broker supports
[STOMP heartbeats](https://stomp.github.io/stomp-specification-1.2.html#Heart-beating).
To configure a scheduler, you can declare your own `TaskScheduler` bean and set it through
the `MessageBrokerRegistry`. Alternatively, you can use the one that is automatically
declared in the built-in WebSocket configuration, however, you’ll' need `@Lazy` to avoid
a cycle between the built-in WebSocket configuration and your
`WebSocketMessageBrokerConfigurer`. For example:

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	private TaskScheduler messageBrokerTaskScheduler;

	@Autowired
	public void setMessageBrokerTaskScheduler(@Lazy TaskScheduler taskScheduler) {
		this.messageBrokerTaskScheduler = taskScheduler;
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		registry.enableSimpleBroker("/queue/", "/topic/")
				.setHeartbeatValue(new long[] {10000, 20000})
				.setTaskScheduler(this.messageBrokerTaskScheduler);

		// ...
	}
}
```
