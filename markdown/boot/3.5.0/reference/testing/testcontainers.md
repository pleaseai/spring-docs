---
title: "Testcontainers"
source: "reference:testing/testcontainers.adoc"
---

<a id="testing.testcontainers"></a>

# Testcontainers

The [Testcontainers](https://www.testcontainers.org/) library provides a way to manage services running inside Docker containers.
It integrates with JUnit, allowing you to write a test class that can start up a container before any of the tests run.
Testcontainers is especially useful for writing integration tests that talk to a real backend service such as MySQL, MongoDB, Cassandra and others.

In following sections we will describe some of the methods you can use to integrate Testcontainers with your tests.

<a id="testing.testcontainers.spring-beans"></a>

## Using Spring Beans

The containers provided by Testcontainers can be managed by Spring Boot as beans.

To declare a container as a bean, add a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) method to your test configuration:

#### Java

```java
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

@TestConfiguration(proxyBeanMethods = false)
class MyTestConfiguration {

	@Bean
	MongoDBContainer mongoDbContainer() {
		return new MongoDBContainer(DockerImageName.parse("mongo:5.0"));
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.testcontainers.containers.MongoDBContainer
import org.testcontainers.utility.DockerImageName

@TestConfiguration(proxyBeanMethods = false)
class MyTestConfiguration {

	@Bean
	fun mongoDbContainer(): MongoDBContainer {
		return MongoDBContainer(DockerImageName.parse("mongo:5.0"))
	}

}
```

You can then inject and use the container by importing the configuration class in the test class:

#### Java

```java
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MongoDBContainer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

@SpringBootTest
@Import(MyTestConfiguration.class)
class MyIntegrationTests {

	@Autowired
	private MongoDBContainer mongo;

	@Test
	void myTest() {
		...
	}

}
```

#### Kotlin

```kotlin
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Import
import org.testcontainers.containers.MongoDBContainer

@SpringBootTest
@Import(MyTestConfiguration::class)
class MyIntegrationTests {

	@Autowired
	private val mongo: MongoDBContainer? = null

	@Test
	fun myTest() {
		...
	}

}
```

> [!TIP]
> This method of managing containers is often used in combination with [service connection annotations](#testing.testcontainers.service-connections).

<a id="testing.testcontainers.junit-extension"></a>

## Using the JUnit Extension

Testcontainers provides a JUnit extension which can be used to manage containers in your tests.
The extension is activated by applying the [`@Testcontainers`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/junit/jupiter/Testcontainers.html) annotation from Testcontainers to your test class.

You can then use the [`@Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/junit/jupiter/Container.html) annotation on static container fields.

The [`@Testcontainers`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/junit/jupiter/Testcontainers.html) annotation can be used on vanilla JUnit tests, or in combination with [`@SpringBootTest`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/test/context/SpringBootTest.html):

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
		...
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

@Testcontainers
@SpringBootTest
class MyIntegrationTests {

	@Test
	fun myTest() {
		...
	}

	companion object {

		@Container
		@JvmStatic
		val neo4j = Neo4jContainer("neo4j:5");

	}
}

```

The example above will start up a Neo4j container before any of the tests are run.
The lifecycle of the container instance is managed by Testcontainers, as described in [their official documentation](https://java.testcontainers.org/test_framework_integration/junit_5/#extension).

> [!NOTE]
> In most cases, you will additionally need to configure the application to connect to the service running in the container.

<a id="testing.testcontainers.importing-configuration-interfaces"></a>

## Importing Container Configuration Interfaces

A common pattern with Testcontainers is to declare the container instances as static fields in an interface.

For example, the following interface declares two containers, one named `mongo` of type [`MongoDBContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/containers/MongoDBContainer.html) and another named `neo4j` of type [`Neo4jContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/containers/Neo4jContainer/Neo4jContainer.html):

#### Java

```java
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.junit.jupiter.Container;

interface MyContainers {

	@Container
	MongoDBContainer mongoContainer = new MongoDBContainer("mongo:5.0");

	@Container
	Neo4jContainer<?> neo4jContainer = new Neo4jContainer<>("neo4j:5");

}
```

#### Kotlin

```kotlin
import org.testcontainers.containers.MongoDBContainer
import org.testcontainers.containers.Neo4jContainer
import org.testcontainers.junit.jupiter.Container

interface MyContainers {

	companion object {

		@Container
		val mongoContainer: MongoDBContainer = MongoDBContainer("mongo:5.0")

		@Container
		val neo4jContainer: Neo4jContainer<*> = Neo4jContainer("neo4j:5")

	}

}
```

When you have containers declared in this way, you can reuse their configuration in multiple tests by having the test classes implement the interface.

It’s also possible to use the same interface configuration in your Spring Boot tests.
To do so, add [`@ImportTestcontainers`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/context/ImportTestcontainers.html) to your test configuration class:

#### Java

```java
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.context.ImportTestcontainers;

@TestConfiguration(proxyBeanMethods = false)
@ImportTestcontainers(MyContainers.class)
class MyTestConfiguration {

}
```

#### Kotlin

```kotlin
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.context.ImportTestcontainers

@TestConfiguration(proxyBeanMethods = false)
@ImportTestcontainers(MyContainers::class)
class MyTestConfiguration {

}
```

<a id="testing.testcontainers.lifecycle"></a>

## Lifecycle of Managed Containers

If you have used the annotations and extensions provided by Testcontainers, then the lifecycle of container instances is managed entirely by Testcontainers.
Please refer to the [offical Testcontainers documentation](https://java.testcontainers.org) for the information.

When the containers are managed by Spring as beans, then their lifecycle is managed by Spring:

- Container beans are created and started before all other beans.
- Container beans are stopped after the destruction of all other beans.

This process ensures that any beans, which rely on functionality provided by the containers, can use those functionalities.
It also ensures that they are cleaned up whilst the container is still available.

> [!TIP]
> When your application beans rely on functionality of containers, prefer configuring the containers as Spring beans to ensure the correct lifecycle behavior.

> [!NOTE]
> Having containers managed by Testcontainers instead of as Spring beans provides no guarantee of the order in which beans and containers will shutdown.
> It can happen that containers are shutdown before the beans relying on container functionality are cleaned up.
> This can lead to exceptions being thrown by client beans, for example, due to loss of connection.

Container beans are created and started once per application context managed by Spring’s TestContext Framework.
For details about how TestContext Framework manages the underlying application contexts and beans therein, please refer to the [Spring Framework documentation](https://docs.spring.io/spring-framework/reference/6.2).

Container beans are stopped as part of the TestContext Framework’s standard application context shutdown process.
When the application context gets shutdown, the containers are shutdown as well.
This usually happens after all tests using that specific cached application context have finished executing.
It may also happen earlier, depending on the caching behavior configured in TestContext Framework.

> [!NOTE]
> A single test container instance can, and often is, retained across execution of tests from multiple test classes.

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
		...
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
		...
	}

	companion object {

		@Container
		@ServiceConnection
		@JvmStatic
		val neo4j = Neo4jContainer("neo4j:5");

	}

}
```

Thanks to [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html), the above configuration allows Neo4j-related beans in the application to communicate with Neo4j running inside the Testcontainers-managed Docker container.
This is done by automatically defining a [`Neo4jConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/neo4j/Neo4jConnectionDetails.html) bean which is then used by the Neo4j auto-configuration, overriding any connection-related configuration properties.

> [!NOTE]
> You’ll need to add the `spring-boot-testcontainers` module as a test dependency in order to use service connections with Testcontainers.

Service connection annotations are processed by [`ContainerConnectionDetailsFactory`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/ContainerConnectionDetailsFactory.html) classes registered with `spring.factories`.
A [`ContainerConnectionDetailsFactory`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/ContainerConnectionDetailsFactory.html) can create a [`ConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/service/connection/ConnectionDetails.html) bean based on a specific [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/containers/Container.html) subclass, or the Docker image name.

The following service connection factories are provided in the `spring-boot-testcontainers` jar:

| Connection Details | Matched on |
| --- | --- |
| [`ActiveMQConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/jms/activemq/ActiveMQConnectionDetails.html) | Containers named "symptoma/activemq" or [`ActiveMQContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/activemq/ActiveMQContainer.html) |
| [`ArtemisConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/jms/artemis/ArtemisConnectionDetails.html) | Containers of type [`ArtemisContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/activemq/ArtemisContainer.html) |
| [`CassandraConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/cassandra/CassandraConnectionDetails.html) | Containers of type [`CassandraContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/cassandra/CassandraContainer.html) |
| [`CouchbaseConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/couchbase/CouchbaseConnectionDetails.html) | Containers of type [`CouchbaseContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/couchbase/CouchbaseContainer.html) |
| [`ElasticsearchConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/elasticsearch/ElasticsearchConnectionDetails.html) | Containers of type [`ElasticsearchContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/elasticsearch/ElasticsearchContainer.html) |
| [`FlywayConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/flyway/FlywayConnectionDetails.html) | Containers of type [`JdbcDatabaseContainer`](https://javadoc.io/doc/org.testcontainers/jdbc/1.21.0/org/testcontainers/containers/JdbcDatabaseContainer.html) |
| [`JdbcConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/jdbc/JdbcConnectionDetails.html) | Containers of type [`JdbcDatabaseContainer`](https://javadoc.io/doc/org.testcontainers/jdbc/1.21.0/org/testcontainers/containers/JdbcDatabaseContainer.html) |
| [`KafkaConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/kafka/KafkaConnectionDetails.html) | Containers of type [`KafkaContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/kafka/KafkaContainer.html), [`ConfluentKafkaContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/kafka/ConfluentKafkaContainer.html) or [`RedpandaContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/redpanda/RedpandaContainer.html) |
| [`LdapConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/ldap/LdapConnectionDetails.html) | Containers named "osixia/openldap" or of type [`LLdapContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/ldap/LLdapContainer.html) |
| [`LiquibaseConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/liquibase/LiquibaseConnectionDetails.html) | Containers of type [`JdbcDatabaseContainer`](https://javadoc.io/doc/org.testcontainers/jdbc/1.21.0/org/testcontainers/containers/JdbcDatabaseContainer.html) |
| [`MongoConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/mongo/MongoConnectionDetails.html) | Containers of type [`MongoDBContainer`](https://javadoc.io/doc/org.testcontainers/mongodb/1.21.0/org/testcontainers/containers/MongoDBContainer.html) |
| [`Neo4jConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/neo4j/Neo4jConnectionDetails.html) | Containers of type [`Neo4jContainer`](https://javadoc.io/doc/org.testcontainers/neo4j/1.21.0/org/testcontainers/containers/Neo4jContainer.html) |
| [`OtlpLoggingConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/actuate/autoconfigure/logging/otlp/OtlpLoggingConnectionDetails.html) | Containers named "otel/opentelemetry-collector-contrib" or of type `LgtmStackContainer` |
| [`OtlpMetricsConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/actuate/autoconfigure/metrics/export/otlp/OtlpMetricsConnectionDetails.html) | Containers named "otel/opentelemetry-collector-contrib" or of type `LgtmStackContainer` |
| [`OtlpTracingConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/actuate/autoconfigure/tracing/otlp/OtlpTracingConnectionDetails.html) | Containers named "otel/opentelemetry-collector-contrib" or of type `LgtmStackContainer` |
| [`PulsarConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/pulsar/PulsarConnectionDetails.html) | Containers of type [`PulsarContainer`](https://javadoc.io/doc/org.testcontainers/pulsar/1.21.0/org/testcontainers/containers/PulsarContainer.html) |
| [`R2dbcConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/r2dbc/R2dbcConnectionDetails.html) | Containers of type `ClickHouseContainer`, [`MariaDBContainer`](https://javadoc.io/doc/org.testcontainers/mariadb/1.21.0/org/testcontainers/containers/MariaDBContainer.html), [`MSSQLServerContainer`](https://javadoc.io/doc/org.testcontainers/mssqlserver/1.21.0/org/testcontainers/containers/MSSQLServerContainer.html), [`MySQLContainer`](https://javadoc.io/doc/org.testcontainers/mysql/1.21.0/org/testcontainers/containers/MySQLContainer.html), [OracleContainer (free)](https://javadoc.io/doc/org.testcontainers/oracle-free/1.21.0/org/testcontainers/OracleContainer.html), [OracleContainer (XE)](https://javadoc.io/doc/org.testcontainers/oracle-xe/1.21.0/org/testcontainers/oracle/OracleContainer.html) or [`PostgreSQLContainer`](https://javadoc.io/doc/org.testcontainers/postgresql/1.21.0/org/testcontainers/containers/PostgreSQLContainer.html) |
| [`RabbitConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/amqp/RabbitConnectionDetails.html) | Containers of type [`RabbitMQContainer`](https://javadoc.io/doc/org.testcontainers/rabbitmq/1.21.0/org/testcontainers/containers/RabbitMQContainer.html) |
| [`RedisConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/data/redis/RedisConnectionDetails.html) | Containers of type [`RedisContainer`](https://javadoc.io/doc/com.redis/testcontainers-redis/2.2.4/com/redis/testcontainers/RedisContainer.html) or [`RedisStackContainer`](https://javadoc.io/doc/com.redis/testcontainers-redis/2.2.4/com/redis/testcontainers/RedisStackContainer.html), or containers named "redis", "redis/redis-stack" or "redis/redis-stack-server" |
| [`ZipkinConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/actuate/autoconfigure/tracing/zipkin/ZipkinConnectionDetails.html) | Containers named "openzipkin/zipkin" |

> [!TIP]
> By default all applicable connection details beans will be created for a given [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/containers/Container.html).
> For example, a [`PostgreSQLContainer`](https://javadoc.io/doc/org.testcontainers/postgresql/1.21.0/org/testcontainers/containers/PostgreSQLContainer.html) will create both [`JdbcConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/jdbc/JdbcConnectionDetails.html) and [`R2dbcConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/r2dbc/R2dbcConnectionDetails.html).
>
> If you want to create only a subset of the applicable types, you can use the `type` attribute of [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html).

By default `Container.getDockerImageName().getRepository()` is used to obtain the name used to find connection details.
The repository portion of the Docker image name ignores any registry and the version.
This works as long as Spring Boot is able to get the instance of the [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/containers/Container.html), which is the case when using a `static` field like in the example above.

If you’re using a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) method, Spring Boot won’t call the bean method to get the Docker image name, because this would cause eager initialization issues.
Instead, the return type of the bean method is used to find out which connection detail should be used.
This works as long as you’re using typed containers such as [`Neo4jContainer`](https://javadoc.io/doc/org.testcontainers/neo4j/1.21.0/org/testcontainers/containers/Neo4jContainer.html) or [`RabbitMQContainer`](https://javadoc.io/doc/org.testcontainers/rabbitmq/1.21.0/org/testcontainers/containers/RabbitMQContainer.html).
This stops working if you’re using [`GenericContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/containers/GenericContainer.html), for example with Redis as shown in the following example:

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

Spring Boot can’t tell from [`GenericContainer`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.21.0/org/testcontainers/containers/GenericContainer.html) which container image is used, so the `name` attribute from [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html) must be used to provide that hint.

You can also use the `name` attribute of [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html) to override which connection detail will be used, for example when using custom images.
If you are using the Docker image `registry.mycompany.com/mirror/myredis`, you’d use `@ServiceConnection(name="redis")` to ensure [`RedisConnectionDetails`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/autoconfigure/data/redis/RedisConnectionDetails.html) are created.

<a id="testing.testcontainers.service-connections.ssl"></a>

### SSL with Service Connections

You can use the [`@Ssl`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/Ssl.html), [`@JksKeyStore`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/JksKeyStore.html), [`@JksTrustStore`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/JksTrustStore.html), [`@PemKeyStore`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/PemKeyStore.html) and [`@PemTrustStore`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/PemTrustStore.html) annotations on a supported container to enable SSL support for that service connection.
Please note that you still have to enable SSL on the service which is running inside the Testcontainer yourself, the annotations only configure SSL on the client side in your application.

```java
import com.redis.testcontainers.RedisContainer;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.PemKeyStore;
import org.springframework.boot.testcontainers.service.connection.PemTrustStore;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.redis.core.RedisOperations;

@Testcontainers
@SpringBootTest
class MyRedisWithSslIntegrationTests {

	@Container
	@ServiceConnection
	@PemKeyStore(certificate = "classpath:client.crt", privateKey = "classpath:client.key")
	@PemTrustStore("classpath:ca.crt")
	static RedisContainer redis = new SecureRedisContainer("redis:latest");

	@Autowired
	private RedisOperations<Object, Object> operations;

	@Test
	void testRedis() {
		// ...
	}

}
```

The above code uses the [`@PemKeyStore`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/PemKeyStore.html) annotation to load the client certificate and key into the keystore and the and [`@PemTrustStore`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/PemTrustStore.html) annotation to load the CA certificate into the truststore.
This will authenticate the client against the server, and the CA certificate in the truststore makes sure that the server certificate is valid and trusted.

The `SecureRedisContainer` in this example is a custom subclass of `RedisContainer` which copies certificates to the correct places and invokes `redis-server` with commandline parameters enabling SSL.

The SSL annotations are supported for the following service connections:

- Cassandra
- Couchbase
- Elasticsearch
- Kafka
- MongoDB
- RabbitMQ
- Redis

The `ElasticsearchContainer` additionally supports automatic detection of server side SSL.
To use this feature, annotate the container with [`@Ssl`](https://docs.spring.io/spring-boot/3.5.0/api/java/org/springframework/boot/testcontainers/service/connection/Ssl.html), as seen in the following example, and Spring Boot takes care of the client side SSL configuration for you:

```java
import org.junit.jupiter.api.Test;
import org.testcontainers.elasticsearch.ElasticsearchContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.data.elasticsearch.DataElasticsearchTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.testcontainers.service.connection.Ssl;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;

@Testcontainers
@DataElasticsearchTest
class MyElasticsearchWithSslIntegrationTests {

	@Ssl
	@Container
	@ServiceConnection
	static ElasticsearchContainer elasticsearch = new ElasticsearchContainer(
			"docker.elastic.co/elasticsearch/elasticsearch:8.17.2");

	@Autowired
	private ElasticsearchTemplate elasticsearchTemplate;

	@Test
	void testElasticsearch() {
		// ...
	}

}
```

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
		...
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
