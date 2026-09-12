---
title: "Apache Pulsar Support"
source: "reference:messaging/pulsar.adoc"
---

<a id="messaging.pulsar"></a>

# Apache Pulsar Support

[Apache Pulsar](https://pulsar.apache.org/) is supported by providing auto-configuration of the [Spring for Apache Pulsar](https://spring.io/projects/spring-pulsar) project.

Spring Boot will auto-configure and register the classic (imperative) Spring for Apache Pulsar components when `org.springframework.pulsar:spring-pulsar` is on the classpath.
It will do the same for the reactive components when `org.springframework.pulsar:spring-pulsar-reactive` is on the classpath.

There are `spring-boot-starter-pulsar` and `spring-boot-starter-pulsar-reactive` starters for conveniently collecting the dependencies for imperative and reactive use, respectively.

<a id="messaging.pulsar.connecting"></a>

## Connecting to Pulsar

When you use the Pulsar starter, Spring Boot will auto-configure and register a [`PulsarClient`](https://javadoc.io/doc/org.apache.pulsar/pulsar-client-api/3.3.7/org/apache/pulsar/client/api/PulsarClient.html) bean.

By default, the application tries to connect to a local Pulsar instance at `pulsar://localhost:6650`.
This can be adjusted by setting the `spring.pulsar.client.service-url` property to a different value.

> [!NOTE]
> The value must be a valid [Pulsar Protocol](https://pulsar.apache.org/docs/client-libraries-java/#connection-urls) URL

You can configure the client by specifying any of the `spring.pulsar.client.*` prefixed application properties.

If you need more control over the configuration, consider registering one or more [`PulsarClientBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarClientBuilderCustomizer.html) beans.

<a id="messaging.pulsar.connecting.auth"></a>

### Authentication

To connect to a Pulsar cluster that requires authentication, you need to specify which authentication plugin to use by setting the `pluginClassName` and any parameters required by the plugin.
You can set the parameters as a map of parameter names to parameter values.
The following example shows how to configure the `AuthenticationOAuth2` plugin.

#### Properties

```properties
spring.pulsar.client.authentication.plugin-class-name=org.apache.pulsar.client.impl.auth.oauth2.AuthenticationOAuth2
spring.pulsar.client.authentication.param.issuerUrl=https://auth.server.cloud/
spring.pulsar.client.authentication.param.privateKey=file:///Users/some-key.json
spring.pulsar.client.authentication.param.audience=urn:sn:acme:dev:my-instance
```

#### YAML

```yaml
spring:
  pulsar:
    client:
      authentication:
        plugin-class-name: org.apache.pulsar.client.impl.auth.oauth2.AuthenticationOAuth2
        param:
          issuerUrl: https://auth.server.cloud/
          privateKey: file:///Users/some-key.json
          audience: urn:sn:acme:dev:my-instance
```

> [!NOTE]
> You need to ensure that names defined under `spring.pulsar.client.authentication.param.*` exactly match those expected by your auth plugin (which is typically camel cased).
> Spring Boot will not attempt any kind of relaxed binding for these entries.
>
> For example, if you want to configure the issuer url for the `AuthenticationOAuth2` auth plugin you must use `spring.pulsar.client.authentication.param.issuerUrl`.
> If you use other forms, such as `issuerurl` or `issuer-url`, the setting will not be applied to the plugin.
>
> This lack of relaxed binding also makes using environment variables for authentication parameters problematic because the case sensitivity is lost during translation.
> If you use environment variables for the parameters then you will need to follow [these steps](https://docs.spring.io/spring-pulsar/docs/1.2.x/reference/reference/pulsar/pulsar-client.html#client-authentication-env-vars) in the Spring for Apache Pulsar reference documentation for it to work properly.

<a id="messaging.pulsar.connecting.ssl"></a>

### SSL

By default, Pulsar clients communicate with Pulsar services in plain text.
You can follow [these steps](https://docs.spring.io/spring-pulsar/docs/1.2.x/reference/reference/pulsar/pulsar-client.html#tls-encryption) in the Spring for Apache Pulsar reference documentation to enable TLS encryption.

For complete details on the client and authentication see the Spring for Apache Pulsar [reference documentation](https://docs.spring.io/spring-pulsar/docs/1.2.x/reference/reference/pulsar/pulsar-client.html).

<a id="messaging.pulsar.connecting-reactive"></a>

## Connecting to Pulsar Reactively

When the Reactive auto-configuration is activated, Spring Boot will auto-configure and register a [`ReactivePulsarClient`](https://javadoc.io/doc/org.apache.pulsar/pulsar-client-reactive-api/0.5.10/org/apache/pulsar/reactive/client/api/ReactivePulsarClient.html) bean.

The [`ReactivePulsarClient`](https://javadoc.io/doc/org.apache.pulsar/pulsar-client-reactive-api/0.5.10/org/apache/pulsar/reactive/client/api/ReactivePulsarClient.html) adapts an instance of the previously described [`PulsarClient`](https://javadoc.io/doc/org.apache.pulsar/pulsar-client-api/3.3.7/org/apache/pulsar/client/api/PulsarClient.html).
Therefore, follow the previous section to configure the [`PulsarClient`](https://javadoc.io/doc/org.apache.pulsar/pulsar-client-api/3.3.7/org/apache/pulsar/client/api/PulsarClient.html) used by the [`ReactivePulsarClient`](https://javadoc.io/doc/org.apache.pulsar/pulsar-client-reactive-api/0.5.10/org/apache/pulsar/reactive/client/api/ReactivePulsarClient.html).

<a id="messaging.pulsar.admin"></a>

## Connecting to Pulsar Administration

Spring for Apache Pulsar’s [`PulsarAdministration`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarAdministration.html) client is also auto-configured.

By default, the application tries to connect to a local Pulsar instance at `http://localhost:8080`.
This can be adjusted by setting the `spring.pulsar.admin.service-url` property to a different value in the form `(http|https)://<host>:<port>`.

If you need more control over the configuration, consider registering one or more [`PulsarAdminBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarAdminBuilderCustomizer.html) beans.

<a id="messaging.pulsar.admin.auth"></a>

### Authentication

When accessing a Pulsar cluster that requires authentication, the admin client requires the same security configuration as the regular Pulsar client.
You can use the aforementioned [authentication configuration](#messaging.pulsar.connecting.auth) by replacing `spring.pulsar.client.authentication` with `spring.pulsar.admin.authentication`.

> [!TIP]
> To create a topic on startup, add a bean of type [`PulsarTopic`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarTopic.html).
> If the topic already exists, the bean is ignored.

<a id="messaging.pulsar.sending"></a>

## Sending a Message

Spring’s [`PulsarTemplate`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarTemplate.html) is auto-configured, and you can use it to send messages, as shown in the following example:

#### Java

```java
import org.springframework.pulsar.core.PulsarTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final PulsarTemplate<String> pulsarTemplate;

	public MyBean(PulsarTemplate<String> pulsarTemplate) {
		this.pulsarTemplate = pulsarTemplate;
	}

	public void someMethod() {
		this.pulsarTemplate.send("someTopic", "Hello");
	}

}
```

#### Kotlin

```kotlin
import org.apache.pulsar.client.api.PulsarClientException
import org.springframework.pulsar.core.PulsarTemplate
import org.springframework.stereotype.Component

@Component
class MyBean(private val pulsarTemplate: PulsarTemplate<String>) {

	@Throws(PulsarClientException::class)
	fun someMethod() {
		pulsarTemplate.send("someTopic", "Hello")
	}

}

```

The [`PulsarTemplate`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarTemplate.html) relies on a [`PulsarProducerFactory`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarProducerFactory.html) to create the underlying Pulsar producer.
Spring Boot auto-configuration also provides this producer factory, which by default, caches the producers that it creates.
You can configure the producer factory and cache settings by specifying any of the `spring.pulsar.producer.*` and `spring.pulsar.producer.cache.*` prefixed application properties.

If you need more control over the producer factory configuration, consider registering one or more [`ProducerBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/ProducerBuilderCustomizer.html) beans.
These customizers are applied to all created producers.
You can also pass in a [`ProducerBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/ProducerBuilderCustomizer.html) when sending a message to only affect the current producer.

If you need more control over the message being sent, you can pass in a [`TypedMessageBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/TypedMessageBuilderCustomizer.html) when sending a message.

<a id="messaging.pulsar.sending-reactive"></a>

## Sending a Message Reactively

When the Reactive auto-configuration is activated, Spring’s [`ReactivePulsarTemplate`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/ReactivePulsarTemplate.html) is auto-configured, and you can use it to send messages, as shown in the following example:

#### Java

```java
import org.springframework.pulsar.reactive.core.ReactivePulsarTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final ReactivePulsarTemplate<String> pulsarTemplate;

	public MyBean(ReactivePulsarTemplate<String> pulsarTemplate) {
		this.pulsarTemplate = pulsarTemplate;
	}

	public void someMethod() {
		this.pulsarTemplate.send("someTopic", "Hello").subscribe();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.pulsar.reactive.core.ReactivePulsarTemplate
import org.springframework.stereotype.Component

@Component
class MyBean(private val pulsarTemplate: ReactivePulsarTemplate<String>) {

	fun someMethod() {
		pulsarTemplate.send("someTopic", "Hello").subscribe()
	}

}

```

The [`ReactivePulsarTemplate`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/ReactivePulsarTemplate.html) relies on a [`ReactivePulsarSenderFactory`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/ReactivePulsarSenderFactory.html) to actually create the underlying sender.
Spring Boot auto-configuration also provides this sender factory, which by default, caches the producers that it creates.
You can configure the sender factory and cache settings by specifying any of the `spring.pulsar.producer.*` and `spring.pulsar.producer.cache.*` prefixed application properties.

If you need more control over the sender factory configuration, consider registering one or more [`ReactiveMessageSenderBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/ReactiveMessageSenderBuilderCustomizer.html) beans.
These customizers are applied to all created senders.
You can also pass in a [`ReactiveMessageSenderBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/ReactiveMessageSenderBuilderCustomizer.html) when sending a message to only affect the current sender.

If you need more control over the message being sent, you can pass in a [`MessageSpecBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/MessageSpecBuilderCustomizer.html) when sending a message.

<a id="messaging.pulsar.receiving"></a>

## Receiving a Message

When the Apache Pulsar infrastructure is present, any bean can be annotated with [`@PulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarListener.html) to create a listener endpoint.
The following component creates a listener endpoint on the `someTopic` topic:

#### Java

```java
import org.springframework.pulsar.annotation.PulsarListener;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	@PulsarListener(topics = "someTopic")
	public void processMessage(String content) {
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.pulsar.annotation.PulsarListener
import org.springframework.stereotype.Component

@Component
class MyBean {

	@PulsarListener(topics = ["someTopic"])
	fun processMessage(content: String?) {
		// ...
	}

}

```

Spring Boot auto-configuration provides all the components necessary for [`PulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarListener.html), such as the [`PulsarListenerContainerFactory`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/config/PulsarListenerContainerFactory.html) and the consumer factory it uses to construct the underlying Pulsar consumers.
You can configure these components by specifying any of the `spring.pulsar.listener.*` and `spring.pulsar.consumer.*` prefixed application properties.

If you need more control over the configuration of the consumer factory, consider registering one or more [`ConsumerBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/ConsumerBuilderCustomizer.html) beans.
These customizers are applied to all consumers created by the factory, and therefore all [`@PulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarListener.html) instances.
You can also customize a single listener by setting the `consumerCustomizer` attribute of the [`@PulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarListener.html) annotation.

If you need more control over the actual container factory configuration, consider registering one or more `PulsarContainerFactoryCustomizer<ConcurrentPulsarListenerContainerFactory<?>>` beans.

<a id="messaging.pulsar.receiving-reactive"></a>

## Receiving a Message Reactively

When the Apache Pulsar infrastructure is present and the Reactive auto-configuration is activated, any bean can be annotated with [`@ReactivePulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/config/annotation/ReactivePulsarListener.html) to create a reactive listener endpoint.
The following component creates a reactive listener endpoint on the `someTopic` topic:

#### Java

```java
import reactor.core.publisher.Mono;

import org.springframework.pulsar.reactive.config.annotation.ReactivePulsarListener;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	@ReactivePulsarListener(topics = "someTopic")
	public Mono<Void> processMessage(String content) {
		// ...
		return Mono.empty();
	}

}
```

#### Kotlin

```kotlin
import org.springframework.pulsar.reactive.config.annotation.ReactivePulsarListener
import org.springframework.stereotype.Component
import reactor.core.publisher.Mono

@Component
class MyBean {

	@ReactivePulsarListener(topics = ["someTopic"])
	fun processMessage(content: String?): Mono<Void> {
		// ...
		return Mono.empty()
	}

}

```

Spring Boot auto-configuration provides all the components necessary for [`ReactivePulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/config/annotation/ReactivePulsarListener.html), such as the [`ReactivePulsarListenerContainerFactory`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/config/ReactivePulsarListenerContainerFactory.html) and the consumer factory it uses to construct the underlying reactive Pulsar consumers.
You can configure these components by specifying any of the `spring.pulsar.listener.*` and `spring.pulsar.consumer.*` prefixed application properties.

If you need more control over the configuration of the consumer factory, consider registering one or more [`ReactiveMessageConsumerBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/ReactiveMessageConsumerBuilderCustomizer.html) beans.
These customizers are applied to all consumers created by the factory, and therefore all [`@ReactivePulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/config/annotation/ReactivePulsarListener.html) instances.
You can also customize a single listener by setting the `consumerCustomizer` attribute of the [`@ReactivePulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/config/annotation/ReactivePulsarListener.html) annotation.

If you need more control over the actual container factory configuration, consider registering one or more `PulsarContainerFactoryCustomizer<DefaultReactivePulsarListenerContainerFactory<?>>` beans.

<a id="messaging.pulsar.reading"></a>

## Reading a Message

The Pulsar reader interface enables applications to manually manage cursors.
When you use a reader to connect to a topic you need to specify which message the reader begins reading from when it connects to a topic.

When the Apache Pulsar infrastructure is present, any bean can be annotated with [`@PulsarReader`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarReader.html) to consume messages using a reader.
The following component creates a reader endpoint that starts reading messages from the beginning of the `someTopic` topic:

#### Java

```java
import org.springframework.pulsar.annotation.PulsarReader;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	@PulsarReader(topics = "someTopic", startMessageId = "earliest")
	public void processMessage(String content) {
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.pulsar.annotation.PulsarReader
import org.springframework.stereotype.Component

@Component
class MyBean {

	@PulsarReader(topics = ["someTopic"], startMessageId = "earliest")
	fun processMessage(content: String?) {
		// ...
	}

}

```

The [`@PulsarReader`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarReader.html) relies on a [`PulsarReaderFactory`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarReaderFactory.html) to create the underlying Pulsar reader.
Spring Boot auto-configuration provides this reader factory which can be customized by setting any of the `spring.pulsar.reader.*` prefixed application properties.

If you need more control over the configuration of the reader factory, consider registering one or more [`ReaderBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/ReaderBuilderCustomizer.html) beans.
These customizers are applied to all readers created by the factory, and therefore all [`@PulsarReader`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarReader.html) instances.
You can also customize a single listener by setting the `readerCustomizer` attribute of the [`@PulsarReader`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarReader.html) annotation.

If you need more control over the actual container factory configuration, consider registering one or more `PulsarContainerFactoryCustomizer<DefaultPulsarReaderContainerFactory<?>>` beans.

<a id="messaging.pulsar.reading-reactive"></a>

## Reading a Message Reactively

When the Apache Pulsar infrastructure is present and the Reactive auto-configuration is activated, Spring’s [`ReactivePulsarReaderFactory`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/ReactivePulsarReaderFactory.html) is provided, and you can use it to create a reader in order to read messages in a reactive fashion.
The following component creates a reader using the provided factory and reads a single message from 5 minutes ago from the `someTopic` topic:

#### Java

```java
import java.time.Instant;
import java.util.List;

import org.apache.pulsar.client.api.Message;
import org.apache.pulsar.client.api.Schema;
import org.apache.pulsar.reactive.client.api.StartAtSpec;
import reactor.core.publisher.Mono;

import org.springframework.pulsar.reactive.core.ReactiveMessageReaderBuilderCustomizer;
import org.springframework.pulsar.reactive.core.ReactivePulsarReaderFactory;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final ReactivePulsarReaderFactory<String> pulsarReaderFactory;

	public MyBean(ReactivePulsarReaderFactory<String> pulsarReaderFactory) {
		this.pulsarReaderFactory = pulsarReaderFactory;
	}

	public void someMethod() {
		ReactiveMessageReaderBuilderCustomizer<String> readerBuilderCustomizer = (readerBuilder) -> readerBuilder
			.topic("someTopic")
			.startAtSpec(StartAtSpec.ofInstant(Instant.now().minusSeconds(5)));
		Mono<Message<String>> message = this.pulsarReaderFactory
			.createReader(Schema.STRING, List.of(readerBuilderCustomizer))
			.readOne();
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.apache.pulsar.client.api.Schema
import org.apache.pulsar.reactive.client.api.ReactiveMessageReaderBuilder
import org.apache.pulsar.reactive.client.api.StartAtSpec
import org.springframework.pulsar.reactive.core.ReactiveMessageReaderBuilderCustomizer
import org.springframework.pulsar.reactive.core.ReactivePulsarReaderFactory
import org.springframework.stereotype.Component
import java.time.Instant

@Component
class MyBean(private val pulsarReaderFactory: ReactivePulsarReaderFactory<String>) {

	fun someMethod() {
		val readerBuilderCustomizer = ReactiveMessageReaderBuilderCustomizer {
			readerBuilder: ReactiveMessageReaderBuilder<String> ->
				readerBuilder
					.topic("someTopic")
					.startAtSpec(StartAtSpec.ofInstant(Instant.now().minusSeconds(5)))
		}
		val message = pulsarReaderFactory
				.createReader(Schema.STRING, listOf(readerBuilderCustomizer))
				.readOne()
		// ...
	}

}

```

Spring Boot auto-configuration provides this reader factory which can be customized by setting any of the `spring.pulsar.reader.*` prefixed application properties.

If you need more control over the reader factory configuration, consider passing in one or more [`ReactiveMessageReaderBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/ReactiveMessageReaderBuilderCustomizer.html) instances when using the factory to create a reader.

If you need more control over the reader factory configuration, consider registering one or more [`ReactiveMessageReaderBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/ReactiveMessageReaderBuilderCustomizer.html) beans.
These customizers are applied to all created readers.
You can also pass one or more [`ReactiveMessageReaderBuilderCustomizer`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/reactive/core/ReactiveMessageReaderBuilderCustomizer.html) when creating a reader to only apply the customizations to the created reader.

> [!TIP]
> For more details on any of the above components and to discover other available features, see the Spring for Apache Pulsar [reference documentation](https://docs.spring.io/spring-pulsar/docs/1.2.x/reference).

<a id="messaging.pulsar.transactions"></a>

## Transaction Support

Spring for Apache Pulsar supports transactions when using [`PulsarTemplate`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarTemplate.html) and [`@PulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarListener.html).

> [!NOTE]
> Transactions are not currently supported when using the reactive variants.

Setting the `spring.pulsar.transaction.enabled` property to `true` will:

- Configure a [`PulsarTransactionManager`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/transaction/PulsarTransactionManager.html) bean
- Enable transaction support for [`PulsarTemplate`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarTemplate.html)
- Enable transaction support for [`@PulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarListener.html) methods

The `transactional` attribute of [`@PulsarListener`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/annotation/PulsarListener.html) can be used to fine-tune when transactions should be used with listeners.

For more control of the Spring for Apache Pulsar transaction features you should define your own [`PulsarTemplate`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/core/PulsarTemplate.html) and/or [`ConcurrentPulsarListenerContainerFactory`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/config/ConcurrentPulsarListenerContainerFactory.html) beans.
You can also define a [`PulsarAwareTransactionManager`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/transaction/PulsarAwareTransactionManager.html) bean if the default auto-configured [`PulsarTransactionManager`](https://docs.spring.io/spring-pulsar/docs/1.2.x/api/org/springframework/pulsar/transaction/PulsarTransactionManager.html) is not suitable.

<a id="messaging.pulsar.additional-properties"></a>

## Additional Pulsar Properties

The properties supported by auto-configuration are shown in the [Integration Properties](../../appendix/application-properties/index.md#appendix.application-properties.integration) section of the Appendix.
Note that, for the most part, these properties (hyphenated or camelCase) map directly to the Apache Pulsar configuration properties.
See the Apache Pulsar documentation for details.

Only a subset of the properties supported by Pulsar are available directly through the [`PulsarProperties`](https://docs.spring.io/spring-boot/3.4.8/api/java/org/springframework/boot/autoconfigure/pulsar/PulsarProperties.html) class.
If you wish to tune the auto-configured components with additional properties that are not directly supported, you can use the customizer supported by each aforementioned component.
