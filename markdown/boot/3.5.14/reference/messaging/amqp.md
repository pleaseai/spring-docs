---
title: "AMQP"
source: "reference:messaging/amqp.adoc"
---

<a id="messaging.amqp"></a>

# AMQP

The Advanced Message Queuing Protocol (AMQP) is a platform-neutral, wire-level protocol for message-oriented middleware.
The Spring AMQP project applies core Spring concepts to the development of AMQP-based messaging solutions.
Spring Boot offers several conveniences for working with AMQP through RabbitMQ, including the `spring-boot-starter-amqp` starter.

<a id="messaging.amqp.rabbitmq"></a>

## RabbitMQ Support

[RabbitMQ](https://www.rabbitmq.com/) is a lightweight, reliable, scalable, and portable message broker based on the AMQP protocol.
Spring uses RabbitMQ to communicate through the AMQP protocol.

RabbitMQ configuration is controlled by external configuration properties in `spring.rabbitmq.*`.
For example, you might declare the following section in `application.properties`:

#### Properties

```properties
spring.rabbitmq.host=localhost
spring.rabbitmq.port=5672
spring.rabbitmq.username=admin
spring.rabbitmq.password=secret
```

#### YAML

```yaml
spring:
  rabbitmq:
    host: "localhost"
    port: 5672
    username: "admin"
    password: "secret"
```

Alternatively, you could configure the same connection using the `addresses` attribute:

#### Properties

```properties
spring.rabbitmq.addresses=amqp://admin:secret@localhost
```

#### YAML

```yaml
spring:
  rabbitmq:
    addresses: "amqp://admin:secret@localhost"
```

> [!NOTE]
> When specifying addresses that way, the `host` and `port` properties are ignored.
> If the address uses the `amqps` protocol, SSL support is enabled automatically.

See [`RabbitProperties`](https://docs.spring.io/spring-boot/3.5.14/api/java/org/springframework/boot/autoconfigure/amqp/RabbitProperties.html) for more of the supported property-based configuration options.
To configure lower-level details of the RabbitMQ [`ConnectionFactory`](https://rabbitmq.github.io/rabbitmq-java-client/api/current/com/rabbitmq/client/ConnectionFactory.html) that is used by Spring AMQP, define a [`ConnectionFactoryCustomizer`](https://docs.spring.io/spring-boot/3.5.14/api/java/org/springframework/boot/autoconfigure/amqp/ConnectionFactoryCustomizer.html) bean.

If a [`ConnectionNameStrategy`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/connection/ConnectionNameStrategy.html) bean exists in the context, it will be automatically used to name connections created by the auto-configured [`CachingConnectionFactory`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/connection/CachingConnectionFactory.html).

To make an application-wide, additive customization to the [`RabbitTemplate`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/core/RabbitTemplate.html), use a [`RabbitTemplateCustomizer`](https://docs.spring.io/spring-boot/3.5.14/api/java/org/springframework/boot/autoconfigure/amqp/RabbitTemplateCustomizer.html) bean.

> [!TIP]
> See [Understanding AMQP, the protocol used by RabbitMQ](https://spring.io/blog/2010/06/14/understanding-amqp-the-protocol-used-by-rabbitmq/) for more details.

<a id="messaging.amqp.sending"></a>

## Sending a Message

Spring’s [`AmqpTemplate`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/core/AmqpTemplate.html) and [`AmqpAdmin`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/core/AmqpAdmin.html) are auto-configured, and you can autowire them directly into your own beans, as shown in the following example:

#### Java

```java
import org.springframework.amqp.core.AmqpAdmin;
import org.springframework.amqp.core.AmqpTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final AmqpAdmin amqpAdmin;

	private final AmqpTemplate amqpTemplate;

	public MyBean(AmqpAdmin amqpAdmin, AmqpTemplate amqpTemplate) {
		this.amqpAdmin = amqpAdmin;
		this.amqpTemplate = amqpTemplate;
	}
	public void someMethod() {
		this.amqpAdmin.getQueueInfo("someQueue");
	}

	public void someOtherMethod() {
		this.amqpTemplate.convertAndSend("hello");
	}
}
```

#### Kotlin

```kotlin
import org.springframework.amqp.core.AmqpAdmin
import org.springframework.amqp.core.AmqpTemplate
import org.springframework.stereotype.Component

@Component
class MyBean(private val amqpAdmin: AmqpAdmin, private val amqpTemplate: AmqpTemplate) {
	fun someMethod() {
		amqpAdmin.getQueueInfo("someQueue")
	}

	fun someOtherMethod() {
		amqpTemplate.convertAndSend("hello")
	}
}

```

> [!NOTE]
> [`RabbitMessagingTemplate`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/core/RabbitMessagingTemplate.html) can be injected in a similar manner.
> If a [`MessageConverter`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/support/converter/MessageConverter.html) bean is defined, it is associated automatically to the auto-configured [`AmqpTemplate`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/core/AmqpTemplate.html).

If necessary, any [`Queue`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/core/Queue.html) that is defined as a bean is automatically used to declare a corresponding queue on the RabbitMQ instance.

To retry operations, you can enable retries on the [`AmqpTemplate`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/core/AmqpTemplate.html) (for example, in the event that the broker connection is lost):

#### Properties

```properties
spring.rabbitmq.template.retry.enabled=true
spring.rabbitmq.template.retry.initial-interval=2s
```

#### YAML

```yaml
spring:
  rabbitmq:
    template:
      retry:
        enabled: true
        initial-interval: "2s"
```

Retries are disabled by default.
You can also customize the [`RetryTemplate`](https://docs.spring.io/spring-retry/docs/2.0.12/apidocs/org/springframework/retry/support/RetryTemplate.html) programmatically by declaring a [`RabbitRetryTemplateCustomizer`](https://docs.spring.io/spring-boot/3.5.14/api/java/org/springframework/boot/autoconfigure/amqp/RabbitRetryTemplateCustomizer.html) bean.

If you need to create more [`RabbitTemplate`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/core/RabbitTemplate.html) instances or if you want to override the default, Spring Boot provides a [`RabbitTemplateConfigurer`](https://docs.spring.io/spring-boot/3.5.14/api/java/org/springframework/boot/autoconfigure/amqp/RabbitTemplateConfigurer.html) bean that you can use to initialize a [`RabbitTemplate`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/core/RabbitTemplate.html) with the same settings as the factories used by the auto-configuration.

<a id="messaging.amqp.sending-stream"></a>

## Sending a Message To A Stream

To send a message to a particular stream, specify the name of the stream, as shown in the following example:

#### Properties

```properties
spring.rabbitmq.stream.name=my-stream
```

#### YAML

```yaml
spring:
  rabbitmq:
    stream:
      name: "my-stream"
```

If a [`MessageConverter`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/support/converter/MessageConverter.html), [`StreamMessageConverter`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/rabbit/stream/support/converter/StreamMessageConverter.html), or [`ProducerCustomizer`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/rabbit/stream/producer/ProducerCustomizer.html) bean is defined, it is associated automatically to the auto-configured [`RabbitStreamTemplate`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/rabbit/stream/producer/RabbitStreamTemplate.html).

If you need to create more [`RabbitStreamTemplate`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/rabbit/stream/producer/RabbitStreamTemplate.html) instances or if you want to override the default, Spring Boot provides a [`RabbitStreamTemplateConfigurer`](https://docs.spring.io/spring-boot/3.5.14/api/java/org/springframework/boot/autoconfigure/amqp/RabbitStreamTemplateConfigurer.html) bean that you can use to initialize a [`RabbitStreamTemplate`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/rabbit/stream/producer/RabbitStreamTemplate.html) with the same settings as the factories used by the auto-configuration.

<a id="messaging.amqp.receiving"></a>

## Receiving a Message

When the Rabbit infrastructure is present, any bean can be annotated with [`@RabbitListener`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/annotation/RabbitListener.html) to create a listener endpoint.
If no [`RabbitListenerContainerFactory`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/listener/RabbitListenerContainerFactory.html) has been defined, a default [`SimpleRabbitListenerContainerFactory`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/config/SimpleRabbitListenerContainerFactory.html) is automatically configured and you can switch to a direct container using the `spring.rabbitmq.listener.type` property.
If a [`MessageConverter`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/support/converter/MessageConverter.html) or a [`MessageRecoverer`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/retry/MessageRecoverer.html) bean is defined, it is automatically associated with the default factory.

The following sample component creates a listener endpoint on the `someQueue` queue:

#### Java

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	@RabbitListener(queues = "someQueue")
	public void processMessage(String content) {
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component

@Component
class MyBean {

	@RabbitListener(queues = ["someQueue"])
	fun processMessage(content: String?) {
		// ...
	}

}

```

> [!TIP]
> See [`@EnableRabbit`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/annotation/EnableRabbit.html) for more details.

If you need to create more [`RabbitListenerContainerFactory`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/listener/RabbitListenerContainerFactory.html) instances or if you want to override the default, Spring Boot provides a [`SimpleRabbitListenerContainerFactoryConfigurer`](https://docs.spring.io/spring-boot/3.5.14/api/java/org/springframework/boot/autoconfigure/amqp/SimpleRabbitListenerContainerFactoryConfigurer.html) and a [`DirectRabbitListenerContainerFactoryConfigurer`](https://docs.spring.io/spring-boot/3.5.14/api/java/org/springframework/boot/autoconfigure/amqp/DirectRabbitListenerContainerFactoryConfigurer.html) that you can use to initialize a [`SimpleRabbitListenerContainerFactory`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/config/SimpleRabbitListenerContainerFactory.html) and a [`DirectRabbitListenerContainerFactory`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/config/DirectRabbitListenerContainerFactory.html) with the same settings as the factories used by the auto-configuration.

> [!TIP]
> It does not matter which container type you chose.
> Those two beans are exposed by the auto-configuration.

For instance, the following configuration class exposes another factory that uses a specific [`MessageConverter`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/support/converter/MessageConverter.html):

#### Java

```java
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.boot.autoconfigure.amqp.SimpleRabbitListenerContainerFactoryConfigurer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
public class MyRabbitConfiguration {

	@Bean
	public SimpleRabbitListenerContainerFactory myFactory(SimpleRabbitListenerContainerFactoryConfigurer configurer) {
		SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
		ConnectionFactory connectionFactory = getCustomConnectionFactory();
		configurer.configure(factory, connectionFactory);
		factory.setMessageConverter(new MyMessageConverter());
		return factory;
	}

	private ConnectionFactory getCustomConnectionFactory() {
		return ...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory
import org.springframework.amqp.rabbit.connection.ConnectionFactory
import org.springframework.boot.autoconfigure.amqp.SimpleRabbitListenerContainerFactoryConfigurer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration(proxyBeanMethods = false)
class MyRabbitConfiguration {

	@Bean
	fun myFactory(configurer: SimpleRabbitListenerContainerFactoryConfigurer): SimpleRabbitListenerContainerFactory {
		val factory = SimpleRabbitListenerContainerFactory()
		val connectionFactory = getCustomConnectionFactory()
		configurer.configure(factory, connectionFactory)
		factory.setMessageConverter(MyMessageConverter())
		return factory
	}

	fun getCustomConnectionFactory() : ConnectionFactory? {
		return ...
	}

}

```

Then you can use the factory in any [`@RabbitListener`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/annotation/RabbitListener.html)-annotated method, as follows:

#### Java

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	@RabbitListener(queues = "someQueue", containerFactory = "myFactory")
	public void processMessage(String content) {
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.amqp.rabbit.annotation.RabbitListener
import org.springframework.stereotype.Component

@Component
class MyBean {

	@RabbitListener(queues = ["someQueue"], containerFactory = "myFactory")
	fun processMessage(content: String?) {
		// ...
	}

}

```

You can enable retries to handle situations where your listener throws an exception.
By default, [`RejectAndDontRequeueRecoverer`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/retry/RejectAndDontRequeueRecoverer.html) is used, but you can define a [`MessageRecoverer`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/rabbit/retry/MessageRecoverer.html) of your own.
When retries are exhausted, the message is rejected and either dropped or routed to a dead-letter exchange if the broker is configured to do so.
By default, retries are disabled.
You can also customize the [`RetryTemplate`](https://docs.spring.io/spring-retry/docs/2.0.12/apidocs/org/springframework/retry/support/RetryTemplate.html) programmatically by declaring a [`RabbitRetryTemplateCustomizer`](https://docs.spring.io/spring-boot/3.5.14/api/java/org/springframework/boot/autoconfigure/amqp/RabbitRetryTemplateCustomizer.html) bean.

> [!IMPORTANT]
> By default, if retries are disabled and the listener throws an exception, the delivery is retried indefinitely.
> You can modify this behavior in two ways: Set the `defaultRequeueRejected` property to `false` so that zero re-deliveries are attempted or throw an [`AmqpRejectAndDontRequeueException`](https://docs.spring.io/spring-amqp/docs/3.2.x/api/org/springframework/amqp/AmqpRejectAndDontRequeueException.html) to signal the message should be rejected.
> The latter is the mechanism used when retries are enabled and the maximum number of delivery attempts is reached.
