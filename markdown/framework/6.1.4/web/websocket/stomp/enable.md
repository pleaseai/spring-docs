---
title: "Enable STOMP"
source: "ROOT:web/websocket/stomp/enable.adoc"
---

<a id="websocket-stomp-enable"></a>

# Enable STOMP

STOMP over WebSocket support is available in the `spring-messaging` and
`spring-websocket` modules. Once you have those dependencies, you can expose a STOMP
endpoint over WebSocket, as the following example shows:

```java
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/portfolio"); // <1>
	}

	@Override
	public void configureMessageBroker(MessageBrokerRegistry config) {
		config.setApplicationDestinationPrefixes("/app"); // <2>
		config.enableSimpleBroker("/topic", "/queue"); // <3>
	}
}
```

1. `/portfolio` is the HTTP URL for the endpoint to which a WebSocket (or SockJS)
client needs to connect for the WebSocket handshake.
1. STOMP messages whose destination header begins with `/app` are routed to
`@MessageMapping` methods in `@Controller` classes.
1. Use the built-in message broker for subscriptions and broadcasting and
route messages whose destination header begins with `/topic` or `/queue` to the broker.

The following example shows the XML configuration equivalent of the preceding example:

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:websocket="http://www.springframework.org/schema/websocket"
	xsi:schemaLocation="
		http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/websocket
		https://www.springframework.org/schema/websocket/spring-websocket.xsd">

	<websocket:message-broker application-destination-prefix="/app">
		<websocket:stomp-endpoint path="/portfolio" />
		<websocket:simple-broker prefix="/topic, /queue"/>
	</websocket:message-broker>

</beans>
```

> [!NOTE]
> For the built-in simple broker, the `/topic` and `/queue` prefixes do not have any special
> meaning. They are merely a convention to differentiate between pub-sub versus point-to-point
> messaging (that is, many subscribers versus one consumer). When you use an external broker,
> check the STOMP page of the broker to understand what kind of STOMP destinations and
> prefixes it supports.

To connect from a browser, for STOMP, you can use
[`stomp-js/stompjs`](https://github.com/stomp-js/stompjs) which is the most
actively maintained JavaScript library.

The following example code is based on it:

```javascript
const stompClient = new StompJs.Client({
       brokerURL: 'ws://domain.com/portfolio',
       onConnect: () => {
           // ...
       }
   });
```

Alternatively, if you connect through SockJS, you can enable the
[SockJS Fallback](../fallback.md) on server-side with
`registry.addEndpoint("/portfolio").withSockJS()` and on JavaScript side,
by following
[those instructions](https://stomp-js.github.io/guide/stompjs/rx-stomp/using-stomp-with-sockjs.html).

Note that `stompClient` in the preceding example does not need to specify `login`
and `passcode` headers. Even if it did, they would be ignored (or, rather,
overridden) on the server side. See [Connecting to a Broker](handle-broker-relay-configure.md)
and [Authentication](authentication.md) for more information on authentication.

For more example code see:

- [Using WebSocket to build an
interactive web application](https://spring.io/guides/gs/messaging-stomp-websocket/) — a getting started guide.
- [Stock Portfolio](https://github.com/rstoyanchev/spring-websocket-portfolio) — a sample
application.
