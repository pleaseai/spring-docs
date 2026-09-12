---
title: "Testcontainers"
source: "reference:testing/testcontainers.adoc"
---

<a id="testing.testcontainers"></a>

# Testcontainers

The [Testcontainers](https://www.testcontainers.org/) library provides a way to manage services running inside Docker containers.
It integrates with JUnit, allowing you to write a test class that can start up a container before any of the tests run.
Testcontainers is especially useful for writing integration tests that talk to a real backend service such as MySQL, MongoDB, Cassandra and others.

Testcontainers can be used in a Spring Boot test as follows:

#### Java

```java
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import org.springframework.boot.test.context.SpringBootTest;

@Testcontainers
@SpringBootTest
class MyIntegrationTests {

	@Container
	static Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5");

	@Test
	void myTest() {
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection

@Testcontainers
@SpringBootTest
class MyIntegrationTests {

	@Test
	fun myTest() {
		// ...
	}

	companion object {
		@Container
		@JvmStatic
		val neo4j = Neo4jContainer("neo4j:5");
	}
}

```

This will start up a docker container running Neo4j (if Docker is running locally) before any of the tests are run.
In most cases, you will need to configure the application to connect to the service running in the container.

<a id="testing.testcontainers.service-connections"></a>

## Service Connections

A service connection is a connection to any remote service.
Spring Boot’s auto-configuration can consume the details of a service connection and use them to establish a connection to a remote service.
When doing so, the connection details take precedence over any connection-related configuration properties.

When using Testcontainers, connection details can be automatically created for a service running in a container by annotating the container field in the test class.

#### Java

```java
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;

@Testcontainers
@SpringBootTest
class MyIntegrationTests {

	@Container
	@ServiceConnection
	static Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5");

	@Test
	void myTest() {
		// ...
	}

}
```

#### Kotlin

```kotlin
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;

@Testcontainers
@SpringBootTest
class MyIntegrationTests {

	@Test
	fun myTest() {
		// ...
	}

	companion object {

		@Container
		@ServiceConnection
		@JvmStatic
		val neo4j = Neo4jContainer("neo4j:5");

	}

}
```

Thanks to [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html), the above configuration allows Neo4j-related beans in the application to communicate with Neo4j running inside the Testcontainers-managed Docker container.
This is done by automatically defining a [`Neo4jConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/neo4j/Neo4jConnectionDetails.html) bean which is then used by the Neo4j auto-configuration, overriding any connection-related configuration properties.

> [!NOTE]
> You’ll need to add the `spring-boot-testcontainers` module as a test dependency in order to use service connections with Testcontainers.

Service connection annotations are processed by [`ContainerConnectionDetailsFactory`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/testcontainers/service/connection/ContainerConnectionDetailsFactory.html) classes registered with `spring.factories`.
A [`ContainerConnectionDetailsFactory`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/testcontainers/service/connection/ContainerConnectionDetailsFactory.html) can create a [`ConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/service/connection/ConnectionDetails.html) bean based on a specific [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/Container.html) subclass, or the Docker image name.

The following service connection factories are provided in the `spring-boot-testcontainers` jar:

| Connection Details | Matched on |
| --- | --- |
| [`ActiveMQConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/jms/activemq/ActiveMQConnectionDetails.html) | Containers named "symptoma/activemq" or [`ActiveMQContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/activemq/ActiveMQContainer.html) |
| [`ArtemisConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/jms/artemis/ArtemisConnectionDetails.html) | Containers of type [`ArtemisContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/activemq/ArtemisContainer.html) |
| [`CassandraConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/cassandra/CassandraConnectionDetails.html) | Containers of type [`CassandraContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/cassandra/CassandraContainer.html) |
| [`CouchbaseConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/couchbase/CouchbaseConnectionDetails.html) | Containers of type [`CouchbaseContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/couchbase/CouchbaseContainer.html) |
| [`ElasticsearchConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/elasticsearch/ElasticsearchConnectionDetails.html) | Containers of type [`ElasticsearchContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/elasticsearch/ElasticsearchContainer.html) |
| [`FlywayConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/flyway/FlywayConnectionDetails.html) | Containers of type [`JdbcDatabaseContainer`](https://javadoc.io/doc/org.testcontainers/jdbc/{version-testcontainers-jdbc}/org/testcontainers/containers/JdbcDatabaseContainer.html) |
| [`JdbcConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/jdbc/JdbcConnectionDetails.html) | Containers of type [`JdbcDatabaseContainer`](https://javadoc.io/doc/org.testcontainers/jdbc/{version-testcontainers-jdbc}/org/testcontainers/containers/JdbcDatabaseContainer.html) |
| [`KafkaConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/kafka/KafkaConnectionDetails.html) | Containers of type [`KafkaContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/kafka/KafkaContainer.html), [`ConfluentKafkaContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/kafka/ConfluentKafkaContainer.html) or [`RedpandaContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/redpanda/RedpandaContainer.html) |
| [`LiquibaseConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/liquibase/LiquibaseConnectionDetails.html) | Containers of type [`JdbcDatabaseContainer`](https://javadoc.io/doc/org.testcontainers/jdbc/{version-testcontainers-jdbc}/org/testcontainers/containers/JdbcDatabaseContainer.html) |
| [`MongoConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/mongo/MongoConnectionDetails.html) | Containers of type [`MongoDBContainer`](https://javadoc.io/doc/org.testcontainers/mongodb/{version-testcontainers-mongodb}/org/testcontainers/containers/MongoDBContainer.html) |
| [`Neo4jConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/neo4j/Neo4jConnectionDetails.html) | Containers of type [`Neo4jContainer`](https://javadoc.io/doc/org.testcontainers/neo4j/{version-testcontainers-neo4j}/org/testcontainers/containers/Neo4jContainer.html) |
| [`OtlpLoggingConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/actuate/autoconfigure/logging/otlp/OtlpLoggingConnectionDetails.html) | Containers named "otel/opentelemetry-collector-contrib" or of type `LgtmStackContainer` |
| [`OtlpMetricsConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/actuate/autoconfigure/metrics/export/otlp/OtlpMetricsConnectionDetails.html) | Containers named "otel/opentelemetry-collector-contrib" or of type `LgtmStackContainer` |
| [`OtlpTracingConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/actuate/autoconfigure/tracing/otlp/OtlpTracingConnectionDetails.html) | Containers named "otel/opentelemetry-collector-contrib" or of type `LgtmStackContainer` |
| [`PulsarConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/pulsar/PulsarConnectionDetails.html) | Containers of type [`PulsarContainer`](https://javadoc.io/doc/org.testcontainers/pulsar/{version-testcontainers-pulsar}/org/testcontainers/containers/PulsarContainer.html) |
| [`R2dbcConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/r2dbc/R2dbcConnectionDetails.html) | Containers of type `ClickHouseContainer`, [`MariaDBContainer`](https://javadoc.io/doc/org.testcontainers/mariadb/{version-testcontainers-mariadb}/org/testcontainers/containers/MariaDBContainer.html), [`MSSQLServerContainer`](https://javadoc.io/doc/org.testcontainers/mssqlserver/{version-testcontainers-mssqlserver}/org/testcontainers/containers/MSSQLServerContainer.html), [`MySQLContainer`](https://javadoc.io/doc/org.testcontainers/mysql/{version-testcontainers-mysql}/org/testcontainers/containers/MySQLContainer.html), [OracleContainer (free)](https://javadoc.io/doc/org.testcontainers/oracle-free/{version-testcontainers-oracle-free}/org/testcontainers/OracleContainer.html), [OracleContainer (XE)](https://javadoc.io/doc/org.testcontainers/oracle-xe/{version-testcontainers-oracle-xe}/org/testcontainers/oracle/OracleContainer.html) or [`PostgreSQLContainer`](https://javadoc.io/doc/org.testcontainers/postgresql/{version-testcontainers-postgresql}/org/testcontainers/containers/PostgreSQLContainer.html) |
| [`RabbitConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/amqp/RabbitConnectionDetails.html) | Containers of type [`RabbitMQContainer`](https://javadoc.io/doc/org.testcontainers/rabbitmq/{version-testcontainers-rabbitmq}/org/testcontainers/containers/RabbitMQContainer.html) |
| [`RedisConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/data/redis/RedisConnectionDetails.html) | Containers of type [`RedisContainer`](https://javadoc.io/doc/com.redis/testcontainers-redis/2.2.4/com/redis/testcontainers/RedisContainer.html) or [`RedisStackContainer`](https://javadoc.io/doc/com.redis/testcontainers-redis/2.2.4/com/redis/testcontainers/RedisStackContainer.html), or containers named "redis", "redis/redis-stack" or "redis/redis-stack-server" |
| [`ZipkinConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/actuate/autoconfigure/tracing/zipkin/ZipkinConnectionDetails.html) | Containers named "openzipkin/zipkin" |

> [!TIP]
> By default all applicable connection details beans will be created for a given [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/Container.html).
> For example, a [`PostgreSQLContainer`](https://javadoc.io/doc/org.testcontainers/postgresql/{version-testcontainers-postgresql}/org/testcontainers/containers/PostgreSQLContainer.html) will create both [`JdbcConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/jdbc/JdbcConnectionDetails.html) and [`R2dbcConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/r2dbc/R2dbcConnectionDetails.html).
>
> If you want to create only a subset of the applicable types, you can use the `type` attribute of [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html).

By default `Container.getDockerImageName().getRepository()` is used to obtain the name used to find connection details.
The repository portion of the Docker image name ignores any registry and the version.
This works as long as Spring Boot is able to get the instance of the [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/Container.html), which is the case when using a `static` field like in the example above.

If you’re using a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) method, Spring Boot won’t call the bean method to get the Docker image name, because this would cause eager initialization issues.
Instead, the return type of the bean method is used to find out which connection detail should be used.
This works as long as you’re using typed containers such as [`Neo4jContainer`](https://javadoc.io/doc/org.testcontainers/neo4j/{version-testcontainers-neo4j}/org/testcontainers/containers/Neo4jContainer.html) or [`RabbitMQContainer`](https://javadoc.io/doc/org.testcontainers/rabbitmq/{version-testcontainers-rabbitmq}/org/testcontainers/containers/RabbitMQContainer.html).
This stops working if you’re using [`GenericContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/GenericContainer.html), for example with Redis as shown in the following example:

#### Java

```java
import org.testcontainers.containers.GenericContainer;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;

@TestConfiguration(proxyBeanMethods = false)
public class MyRedisConfiguration {

	@Bean
	@ServiceConnection(name = "redis")
	public GenericContainer<?> redisContainer() {
		return new GenericContainer<>("redis:7");
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.testcontainers.containers.GenericContainer

@TestConfiguration(proxyBeanMethods = false)
class MyRedisConfiguration {
	@Bean
	@ServiceConnection(name = "redis")
	fun redisContainer(): GenericContainer<*> {
		return GenericContainer("redis:7")
	}
}
```

Spring Boot can’t tell from [`GenericContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/GenericContainer.html) which container image is used, so the `name` attribute from [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html) must be used to provide that hint.

You can also use the `name` attribute of [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html) to override which connection detail will be used, for example when using custom images.
If you are using the Docker image `registry.mycompany.com/mirror/myredis`, you’d use `@ServiceConnection(name="redis")` to ensure [`RedisConnectionDetails`](https://docs.spring.io/spring-boot/3.4.4/api/java/org/springframework/boot/autoconfigure/data/redis/RedisConnectionDetails.html) are created.

<a id="testing.testcontainers.dynamic-properties"></a>

## Dynamic Properties

A slightly more verbose but also more flexible alternative to service connections is [`@DynamicPropertySource`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/test/context/DynamicPropertySource.html).
A static [`@DynamicPropertySource`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/test/context/DynamicPropertySource.html) method allows adding dynamic property values to the Spring Environment.

#### Java

```java
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

@Testcontainers
@SpringBootTest
class MyIntegrationTests {

	@Container
	static Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5");

	@Test
	void myTest() {
		// ...
	}

	@DynamicPropertySource
	static void neo4jProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.neo4j.uri", neo4j::getBoltUrl);
	}

}
```

#### Kotlin

```kotlin
import org.junit.jupiter.api.Test
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.testcontainers.containers.Neo4jContainer
import org.testcontainers.junit.jupiter.Container
import org.testcontainers.junit.jupiter.Testcontainers

@Testcontainers
@SpringBootTest
class MyIntegrationTests {

	@Test
	fun myTest() {
		// ...
	}

	companion object {
		@Container
		@JvmStatic
		val neo4j = Neo4jContainer("neo4j:5");

		@DynamicPropertySource
		@JvmStatic
		fun neo4jProperties(registry: DynamicPropertyRegistry) {
			registry.add("spring.neo4j.uri") { neo4j.boltUrl }
		}
	}
}
```

The above configuration allows Neo4j-related beans in the application to communicate with Neo4j running inside the Testcontainers-managed Docker container.
