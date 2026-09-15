---
title: "WebSocket Server"
source: "ROOT:web/websocket/stomp/server-config.adoc"
---

<a id="websocket-stomp-server-config"></a>

# WebSocket Server

To configure the underlying WebSocket server, the information in
[Server Configuration](../server.md#websocket-server-runtime-configuration) applies. For Jetty, however you need to set
the `HandshakeHandler` and `WebSocketPolicy` through the `StompEndpointRegistry`:

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		registry.addEndpoint("/portfolio").setHandshakeHandler(handshakeHandler());
	}

	@Bean
	public DefaultHandshakeHandler handshakeHandler() {

		WebSocketPolicy policy = new WebSocketPolicy(WebSocketBehavior.SERVER);
		policy.setInputBufferSize(8192);
		policy.setIdleTimeout(600000);

		return new DefaultHandshakeHandler(
				new JettyRequestUpgradeStrategy(new WebSocketServerFactory(policy)));
	}
}
```
