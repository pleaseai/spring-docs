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

This will start up a docker container running Neo4j (if Docker is running locally) before any of the tests are run.
In most cases, you will need to configure the application to connect to the service running in the container.

<a id="testing.testcontainers.service-connections"></a>

## Service Connections

A service connection is a connection to any remote service.
Spring Boot’s auto-configuration can consume the details of a service connection and use them to establish a connection to a remote service.
When doing so, the connection details take precedence over any connection-related configuration properties.

When using Testcontainers, connection details can be automatically created for a service running in a container by annotating the container field in the test class.

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

Thanks to `@ServiceConnection`, the above configuration allows Neo4j-related beans in the application to communicate with Neo4j running inside the Testcontainers-managed Docker container.
This is done by automatically defining a `Neo4jConnectionDetails` bean which is then used by the Neo4j auto-configuration, overriding any connection-related configuration properties.

> [!NOTE]
> You’ll need to add the `spring-boot-testcontainers` module as a test dependency in order to use service connections with Testcontainers.

Service connection annotations are processed by `ContainerConnectionDetailsFactory` classes registered with `spring.factories`.
A `ContainerConnectionDetailsFactory` can create a `ConnectionDetails` bean based on a specific `Container` subclass, or the Docker image name.

The following service connection factories are provided in the `spring-boot-testcontainers` jar:

| Connection Details | Matched on |
| --- | --- |
| `ActiveMQConnectionDetails` | Containers named "symptoma/activemq" or `ActiveMQContainer` |
| `ArtemisConnectionDetails` | Containers of type `ArtemisContainer` |
| `CassandraConnectionDetails` | Containers of type `CassandraContainer` |
| `CouchbaseConnectionDetails` | Containers of type `CouchbaseContainer` |
| `ElasticsearchConnectionDetails` | Containers of type `ElasticsearchContainer` |
| `FlywayConnectionDetails` | Containers of type `JdbcDatabaseContainer` |
| `JdbcConnectionDetails` | Containers of type `JdbcDatabaseContainer` |
| `KafkaConnectionDetails` | Containers of type `org.testcontainers.containers.KafkaContainer` or `RedpandaContainer` |
| `LiquibaseConnectionDetails` | Containers of type `JdbcDatabaseContainer` |
| `MongoConnectionDetails` | Containers of type `MongoDBContainer` |
| `Neo4jConnectionDetails` | Containers of type `Neo4jContainer` |
| `OtlpMetricsConnectionDetails` | Containers named "otel/opentelemetry-collector-contrib" |
| `OtlpTracingConnectionDetails` | Containers named "otel/opentelemetry-collector-contrib" |
| `PulsarConnectionDetails` | Containers of type `PulsarContainer` |
| `R2dbcConnectionDetails` | Containers of type `MariaDBContainer`, `MSSQLServerContainer`, `MySQLContainer`, `OracleContainer`, or `PostgreSQLContainer` |
| `RabbitConnectionDetails` | Containers of type `RabbitMQContainer` |
| `RedisConnectionDetails` | Containers named "redis" |
| `ZipkinConnectionDetails` | Containers named "openzipkin/zipkin" |

> [!TIP]
> By default all applicable connection details beans will be created for a given `Container`.
> For example, a `PostgreSQLContainer` will create both `JdbcConnectionDetails` and `R2dbcConnectionDetails`.
>
> If you want to create only a subset of the applicable types, you can use the `type` attribute of `@ServiceConnection`.

By default `Container.getDockerImageName()` is used to obtain the name used to find connection details.
This works as long as Spring Boot is able to get the instance of the `Container`, which is the case when using a `static` field like in the example above.

If you’re using a `@Bean` method, Spring Boot won’t call the bean method to get the Docker image name, because this would cause eager initialization issues.
Instead, the return type of the bean method is used to find out which connection detail should be used.
This works as long as you’re using typed containers, e.g. `Neo4jContainer` or `RabbitMQContainer`.
This stops working if you’re using `GenericContainer`, e.g. with Redis, as shown in the following example:

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

Spring Boot can’t tell from `GenericContainer` which container image is used, so the `name` attribute from `@ServiceConnection` must be used to provide that hint.

You can also use the `name` attribute of `@ServiceConnection` to override which connection detail will be used, for example when using custom images.
If you are using the Docker image `registry.mycompany.com/mirror/myredis`, you’d use `@ServiceConnection(name="redis")` to ensure `RedisConnectionDetails` are created.

<a id="testing.testcontainers.dynamic-properties"></a>

## Dynamic Properties

A slightly more verbose but also more flexible alternative to service connections is `@DynamicPropertySource`.
A static `@DynamicPropertySource` method allows adding dynamic property values to the Spring Environment.

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

The above configuration allows Neo4j-related beans in the application to communicate with Neo4j running inside the Testcontainers-managed Docker container.
