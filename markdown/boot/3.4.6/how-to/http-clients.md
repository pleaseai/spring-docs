---
title: "HTTP Clients"
source: "how-to:http-clients.adoc"
---

<a id="howto.http-clients"></a>

# HTTP Clients

Spring Boot offers a number of starters that work with HTTP clients.
This section answers questions related to using them.

<a id="howto.http-clients.rest-template-proxy-configuration"></a>

## Configure RestTemplate to Use a Proxy

As described in [RestTemplate Customization](../reference/io/rest-client.md#io.rest-client.resttemplate.customization), you can use a [`RestTemplateCustomizer`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/web/client/RestTemplateCustomizer.html) with [`RestTemplateBuilder`](https://docs.spring.io/spring-boot/3.4.6/api/java/org/springframework/boot/web/client/RestTemplateBuilder.html) to build a customized [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestTemplate.html).
This is the recommended approach for creating a [`RestTemplate`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/client/RestTemplate.html) configured to use a proxy.

The exact details of the proxy configuration depend on the underlying client request factory that is being used.

<a id="howto.http-clients.webclient-reactor-netty-customization"></a>

## Configure the TcpClient used by a Reactor Netty-based WebClient

When Reactor Netty is on the classpath a Reactor Netty-based [`WebClient`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/web/reactive/function/client/WebClient.html) is auto-configured.
To customize the client’s handling of network connections, provide a [`ClientHttpConnector`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/client/reactive/ClientHttpConnector.html) bean.
The following example configures a 60 second connect timeout and adds a [`ReadTimeoutHandler`](https://netty.io/4.1/api/io/netty/handler/timeout/ReadTimeoutHandler.html):

#### Java

```java
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import reactor.netty.http.client.HttpClient;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.ReactorResourceFactory;
import org.springframework.http.client.reactive.ClientHttpConnector;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;

@Configuration(proxyBeanMethods = false)
public class MyReactorNettyClientConfiguration {

	@Bean
	ClientHttpConnector clientHttpConnector(ReactorResourceFactory resourceFactory) {
		HttpClient httpClient = HttpClient.create(resourceFactory.getConnectionProvider())
				.runOn(resourceFactory.getLoopResources())
				.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 60000)
				.doOnConnected((connection) -> connection.addHandlerLast(new ReadTimeoutHandler(60)));
		return new ReactorClientHttpConnector(httpClient);
	}

}
```

#### Kotlin

```kotlin
import io.netty.channel.ChannelOption
import io.netty.handler.timeout.ReadTimeoutHandler
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.client.reactive.ClientHttpConnector
import org.springframework.http.client.reactive.ReactorClientHttpConnector
import org.springframework.http.client.ReactorResourceFactory
import reactor.netty.http.client.HttpClient

@Configuration(proxyBeanMethods = false)
class MyReactorNettyClientConfiguration {

	@Bean
	fun clientHttpConnector(resourceFactory: ReactorResourceFactory): ClientHttpConnector {
		val httpClient = HttpClient.create(resourceFactory.connectionProvider)
			.runOn(resourceFactory.loopResources)
			.option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 60000)
			.doOnConnected { connection ->
				connection.addHandlerLast(ReadTimeoutHandler(60))
			}
		return ReactorClientHttpConnector(httpClient)
	}

}
```

> [!TIP]
> Note the use of [`ReactorResourceFactory`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/client/ReactorResourceFactory.html) for the connection provider and event loop resources.
> This ensures efficient sharing of resources for the server receiving requests and the client making requests.
