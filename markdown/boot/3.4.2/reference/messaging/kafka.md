---
title: "Apache Kafka Support"
source: "reference:messaging/kafka.adoc"
---

<a id="messaging.kafka"></a>

# Apache Kafka Support

[Apache Kafka](https://kafka.apache.org/) is supported by providing auto-configuration of the `spring-kafka` project.

Kafka configuration is controlled by external configuration properties in `spring.kafka.*`.
For example, you might declare the following section in `application.properties`:

#### Properties

```properties
spring.kafka.bootstrap-servers=localhost:9092
spring.kafka.consumer.group-id=myGroup
```

#### YAML

```yaml
spring:
  kafka:
    bootstrap-servers: "localhost:9092"
    consumer:
      group-id: "myGroup"
```

> [!TIP]
> To create a topic on startup, add a bean of type [`NewTopic`](https://kafka.apache.org/38/javadoc/org/apache/kafka/clients/admin/NewTopic.html).
> If the topic already exists, the bean is ignored.

See [`KafkaProperties`](https://docs.spring.io/spring-boot/3.4.2/api/java/org/springframework/boot/autoconfigure/kafka/KafkaProperties.html) for more supported options.

<a id="messaging.kafka.sending"></a>

## Sending a Message

Spring’s [`KafkaTemplate`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/core/KafkaTemplate.html) is auto-configured, and you can autowire it directly in your own beans, as shown in the following example:

#### Java

```java
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	private final KafkaTemplate<String, String> kafkaTemplate;

	public MyBean(KafkaTemplate<String, String> kafkaTemplate) {
		this.kafkaTemplate = kafkaTemplate;
	}
	public void someMethod() {
		this.kafkaTemplate.send("someTopic", "Hello");
	}
}
```

#### Kotlin

```kotlin
import org.springframework.kafka.core.KafkaTemplate
import org.springframework.stereotype.Component

@Component
class MyBean(private val kafkaTemplate: KafkaTemplate<String, String>) {
	fun someMethod() {
		kafkaTemplate.send("someTopic", "Hello")
	}
}
```

> [!NOTE]
> If the property `spring.kafka.producer.transaction-id-prefix` is defined, a [`KafkaTransactionManager`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/transaction/KafkaTransactionManager.html) is automatically configured.
> Also, if a [`RecordMessageConverter`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/support/converter/RecordMessageConverter.html) bean is defined, it is automatically associated to the auto-configured [`KafkaTemplate`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/core/KafkaTemplate.html).

<a id="messaging.kafka.receiving"></a>

## Receiving a Message

When the Apache Kafka infrastructure is present, any bean can be annotated with [`@KafkaListener`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/annotation/KafkaListener.html) to create a listener endpoint.
If no [`KafkaListenerContainerFactory`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/config/KafkaListenerContainerFactory.html) has been defined, a default one is automatically configured with keys defined in `spring.kafka.listener.*`.

The following component creates a listener endpoint on the `someTopic` topic:

#### Java

```java
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class MyBean {

	@KafkaListener(topics = "someTopic")
	public void processMessage(String content) {
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.springframework.kafka.annotation.KafkaListener
import org.springframework.stereotype.Component

@Component
class MyBean {

	@KafkaListener(topics = ["someTopic"])
	fun processMessage(content: String?) {
		// ...
	}

}

```

If a [`KafkaTransactionManager`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/transaction/KafkaTransactionManager.html) bean is defined, it is automatically associated to the container factory.
Similarly, if a [`RecordFilterStrategy`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/listener/adapter/RecordFilterStrategy.html), [`CommonErrorHandler`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/listener/CommonErrorHandler.html), [`AfterRollbackProcessor`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/listener/AfterRollbackProcessor.html) or [`ConsumerAwareRebalanceListener`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/listener/ConsumerAwareRebalanceListener.html) bean is defined, it is automatically associated to the default factory.

Depending on the listener type, a [`RecordMessageConverter`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/support/converter/RecordMessageConverter.html) or [`BatchMessageConverter`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/support/converter/BatchMessageConverter.html) bean is associated to the default factory.
If only a [`RecordMessageConverter`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/support/converter/RecordMessageConverter.html) bean is present for a batch listener, it is wrapped in a [`BatchMessageConverter`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/support/converter/BatchMessageConverter.html).

> [!TIP]
> A custom [`ChainedKafkaTransactionManager`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/transaction/ChainedKafkaTransactionManager.html) must be marked [`@Primary`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Primary.html) as it usually references the auto-configured [`KafkaTransactionManager`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/transaction/KafkaTransactionManager.html) bean.

<a id="messaging.kafka.streams"></a>

## Kafka Streams

Spring for Apache Kafka provides a factory bean to create a [`StreamsBuilder`](https://kafka.apache.org/38/javadoc/org/apache/kafka/streams/StreamsBuilder.html) object and manage the lifecycle of its streams.
Spring Boot auto-configures the required [`KafkaStreamsConfiguration`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/config/KafkaStreamsConfiguration.html) bean as long as `kafka-streams` is on the classpath and Kafka Streams is enabled by the [`@EnableKafkaStreams`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/annotation/EnableKafkaStreams.html) annotation.

Enabling Kafka Streams means that the application id and bootstrap servers must be set.
The former can be configured using `spring.kafka.streams.application-id`, defaulting to `spring.application.name` if not set.
The latter can be set globally or specifically overridden only for streams.

Several additional properties are available using dedicated properties; other arbitrary Kafka properties can be set using the `spring.kafka.streams.properties` namespace.
See also [Additional Kafka Properties](#messaging.kafka.additional-properties) for more information.

To use the factory bean, wire [`StreamsBuilder`](https://kafka.apache.org/38/javadoc/org/apache/kafka/streams/StreamsBuilder.html) into your [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) as shown in the following example:

#### Java

```java
import java.util.Locale;

import org.apache.kafka.common.serialization.Serdes;
import org.apache.kafka.streams.KeyValue;
import org.apache.kafka.streams.StreamsBuilder;
import org.apache.kafka.streams.kstream.KStream;
import org.apache.kafka.streams.kstream.Produced;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafkaStreams;
import org.springframework.kafka.support.serializer.JsonSerde;

@Configuration(proxyBeanMethods = false)
@EnableKafkaStreams
public class MyKafkaStreamsConfiguration {

	@Bean
	public KStream<Integer, String> kStream(StreamsBuilder streamsBuilder) {
		KStream<Integer, String> stream = streamsBuilder.stream("ks1In");
		stream.map(this::uppercaseValue).to("ks1Out", Produced.with(Serdes.Integer(), new JsonSerde<>()));
		return stream;
	}

	private KeyValue<Integer, String> uppercaseValue(Integer key, String value) {
		return new KeyValue<>(key, value.toUpperCase(Locale.getDefault()));
	}

}
```

#### Kotlin

```kotlin
import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.StreamsBuilder
import org.apache.kafka.streams.kstream.KStream
import org.apache.kafka.streams.kstream.Produced
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.kafka.annotation.EnableKafkaStreams
import org.springframework.kafka.support.serializer.JsonSerde

@Configuration(proxyBeanMethods = false)
@EnableKafkaStreams
class MyKafkaStreamsConfiguration {

	@Bean
	fun kStream(streamsBuilder: StreamsBuilder): KStream<Int, String> {
		val stream = streamsBuilder.stream<Int, String>("ks1In")
		stream.map(this::uppercaseValue).to("ks1Out", Produced.with(Serdes.Integer(), JsonSerde()))
		return stream
	}

	private fun uppercaseValue(key: Int, value: String): KeyValue<Int?, String?> {
		return KeyValue(key, value.uppercase())
	}

}
```

By default, the streams managed by the [`StreamsBuilder`](https://kafka.apache.org/38/javadoc/org/apache/kafka/streams/StreamsBuilder.html) object are started automatically.
You can customize this behavior using the `spring.kafka.streams.auto-startup` property.

<a id="messaging.kafka.additional-properties"></a>

## Additional Kafka Properties

The properties supported by auto configuration are shown in the [Integration Properties](../../appendix/application-properties/index.md#appendix.application-properties.integration) section of the Appendix.
Note that, for the most part, these properties (hyphenated or camelCase) map directly to the Apache Kafka dotted properties.
See the Apache Kafka documentation for details.

Properties that don’t include a client type (`producer`, `consumer`, `admin`, or `streams`) in their name are considered to be common and apply to all clients.
Most of these common properties can be overridden for one or more of the client types, if needed.

Apache Kafka designates properties with an importance of HIGH, MEDIUM, or LOW.
Spring Boot auto-configuration supports all HIGH importance properties, some selected MEDIUM and LOW properties, and any properties that do not have a default value.

Only a subset of the properties supported by Kafka are available directly through the [`KafkaProperties`](https://docs.spring.io/spring-boot/3.4.2/api/java/org/springframework/boot/autoconfigure/kafka/KafkaProperties.html) class.
If you wish to configure the individual client types with additional properties that are not directly supported, use the following properties:

#### Properties

```properties
spring.kafka.properties[prop.one]=first
spring.kafka.admin.properties[prop.two]=second
spring.kafka.consumer.properties[prop.three]=third
spring.kafka.producer.properties[prop.four]=fourth
spring.kafka.streams.properties[prop.five]=fifth
```

#### YAML

```yaml
spring:
  kafka:
    properties:
      "[prop.one]": "first"
    admin:
      properties:
        "[prop.two]": "second"
    consumer:
      properties:
        "[prop.three]": "third"
    producer:
      properties:
        "[prop.four]": "fourth"
    streams:
      properties:
        "[prop.five]": "fifth"
```

This sets the common `prop.one` Kafka property to `first` (applies to producers, consumers, admins, and streams), the `prop.two` admin property to `second`, the `prop.three` consumer property to `third`, the `prop.four` producer property to `fourth` and the `prop.five` streams property to `fifth`.

You can also configure the Spring Kafka [`JsonDeserializer`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/support/serializer/JsonDeserializer.html) as follows:

#### Properties

```properties
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer
spring.kafka.consumer.properties[spring.json.value.default.type]=com.example.Invoice
spring.kafka.consumer.properties[spring.json.trusted.packages]=com.example.main,com.example.another
```

#### YAML

```yaml
spring:
  kafka:
    consumer:
      value-deserializer: "org.springframework.kafka.support.serializer.JsonDeserializer"
      properties:
        "[spring.json.value.default.type]": "com.example.Invoice"
        "[spring.json.trusted.packages]": "com.example.main,com.example.another"
```

Similarly, you can disable the [`JsonSerializer`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/support/serializer/JsonSerializer.html) default behavior of sending type information in headers:

#### Properties

```properties
spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer
spring.kafka.producer.properties[spring.json.add.type.headers]=false
```

#### YAML

```yaml
spring:
  kafka:
    producer:
      value-serializer: "org.springframework.kafka.support.serializer.JsonSerializer"
      properties:
        "[spring.json.add.type.headers]": false
```

> [!IMPORTANT]
> Properties set in this way override any configuration item that Spring Boot explicitly supports.

<a id="messaging.kafka.embedded"></a>

## Testing with Embedded Kafka

Spring for Apache Kafka provides a convenient way to test projects with an embedded Apache Kafka broker.
To use this feature, annotate a test class with [`@EmbeddedKafka`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/test/context/EmbeddedKafka.html) from the `spring-kafka-test` module.
For more information, please see the Spring for Apache Kafka [reference manual](https://docs.spring.io/spring-kafka/reference/3.3/testing.html#ekb).

To make Spring Boot auto-configuration work with the aforementioned embedded Apache Kafka broker, you need to remap a system property for embedded broker addresses (populated by the [`EmbeddedKafkaBroker`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/test/EmbeddedKafkaBroker.html)) into the Spring Boot configuration property for Apache Kafka.
There are several ways to do that:

- Provide a system property to map embedded broker addresses into `spring.kafka.bootstrap-servers` in the test class:

#### Java

```java
	static {
		System.setProperty(EmbeddedKafkaBroker.BROKER_LIST_PROPERTY, "spring.kafka.bootstrap-servers");
	}
```

#### Kotlin

```kotlin
	init {
		System.setProperty(EmbeddedKafkaBroker.BROKER_LIST_PROPERTY, "spring.kafka.bootstrap-servers")
	}
```

- Configure a property name on the [`@EmbeddedKafka`](https://docs.spring.io/spring-kafka/docs/3.3.x/api/org/springframework/kafka/test/context/EmbeddedKafka.html) annotation:

#### Java

```java
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.kafka.test.context.EmbeddedKafka;

@SpringBootTest
@EmbeddedKafka(topics = "someTopic", bootstrapServersProperty = "spring.kafka.bootstrap-servers")
class MyTest {

	// ...

}
```

#### Kotlin

```kotlin
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.kafka.test.context.EmbeddedKafka

@SpringBootTest
@EmbeddedKafka(topics = ["someTopic"], bootstrapServersProperty = "spring.kafka.bootstrap-servers")
class MyTest {

	// ...

}
```

- Use a placeholder in configuration properties:

#### Properties

```properties
spring.kafka.bootstrap-servers=${spring.embedded.kafka.brokers}
```

#### YAML

```yaml
spring:
  kafka:
    bootstrap-servers: "${spring.embedded.kafka.brokers}"
```
