---
title: "Development-time Services"
source: "reference:features/dev-services.adoc"
---

<a id="features.dev-services"></a>

# Development-time Services

Development-time services provide external dependencies needed to run the application while developing it.
They are only supposed to be used while developing and are disabled when the application is deployed.

Spring Boot offers support for two development time services, Docker Compose and Testcontainers.
The next sections will provide more details about them.

<a id="features.dev-services.docker-compose"></a>

## Docker Compose Support

Docker Compose is a popular technology that can be used to define and manage multiple containers for services that your application needs.
A `compose.yml` file is typically created next to your application which defines and configures service containers.

A typical workflow with Docker Compose is to run `docker compose up`, work on your application with it connecting to started services, then run `docker compose down` when you are finished.

The `spring-boot-docker-compose` module can be included in a project to provide support for working with containers using Docker Compose.
Add the module dependency to your build, as shown in the following listings for Maven and Gradle:

#### Maven

```xml
<dependencies>
	<dependency>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-docker-compose</artifactId>
		<optional>true</optional>
	</dependency>
</dependencies>
```

#### Gradle

```gradle
dependencies {
	developmentOnly("org.springframework.boot:spring-boot-docker-compose")
}
```

When this module is included as a dependency Spring Boot will do the following:

- Search for a `compose.yml` and other common compose filenames in your working directory
- Call `docker compose up` with the discovered `compose.yml`
- Create service connection beans for each supported container
- Call `docker compose stop` when the application is shutdown

If the Docker Compose services are already running when starting the application, Spring Boot will only create the service connection beans for each supported container.
It will not call `docker compose up` again and it will not call `docker compose stop` when the application is shutdown.

> [!TIP]
> Repackaged archives do not contain Spring Boot’s Docker Compose by default.
> If you want to use this support, you need to include it.
> When using the Maven plugin, set the `excludeDockerCompose` property to `false`.
> When using the Gradle plugin, [configure the task’s classpath to include the `developmentOnly` configuration](https://docs.spring.io/spring-boot/3.4.11/gradle-plugin/packaging.html#packaging-executable.configuring.including-development-only-dependencies).

<a id="features.dev-services.docker-compose.prerequisites"></a>

### Prerequisites

You need to have the `docker` and `docker compose` (or `docker-compose`) CLI applications on your path.
The minimum supported Docker Compose version is 2.2.0.

<a id="features.dev-services.docker-compose.service-connections"></a>

### Service Connections

A service connection is a connection to any remote service.
Spring Boot’s auto-configuration can consume the details of a service connection and use them to establish a connection to a remote service.
When doing so, the connection details take precedence over any connection-related configuration properties.

When using Spring Boot’s Docker Compose support, service connections are established to the port mapped by the container.

> [!NOTE]
> Docker compose is usually used in such a way that the ports inside the container are mapped to ephemeral ports on your computer.
> For example, a Postgres server may run inside the container using port 5432 but be mapped to a totally different port locally.
> The service connection will always discover and use the locally mapped port.

Service connections are established by using the image name of the container.
The following service connections are currently supported:

| Connection Details | Matched on |
| --- | --- |
| [`ActiveMQConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/jms/activemq/ActiveMQConnectionDetails.html) | Containers named "symptoma/activemq" or "apache/activemq-classic" |
| [`ArtemisConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/jms/artemis/ArtemisConnectionDetails.html) | Containers named "apache/activemq-artemis" |
| [`CassandraConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/cassandra/CassandraConnectionDetails.html) | Containers named "cassandra", "bitnami/cassandra" or "bitnamilegacy/cassandra" |
| [`ElasticsearchConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/elasticsearch/ElasticsearchConnectionDetails.html) | Containers named "elasticsearch", "bitnami/elasticsearch" or "bitnamilegacy/elasticsearch" |
| [`HazelcastConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/hazelcast/HazelcastConnectionDetails.html) | Containers named "hazelcast/hazelcast". |
| [`JdbcConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/jdbc/JdbcConnectionDetails.html) | Containers named "clickhouse/clickhouse-server", "bitnami/clickhouse", "bitnamilegacy/clickhouse", "gvenzl/oracle-free", "gvenzl/oracle-xe", "mariadb", "bitnami/mariadb", "bitnamilegacy/mariadb", "mssql/server", "mysql", "bitnami/mysql", "bitnamilegacy/mysql", "postgres", "bitnami/postgresql" or "bitnamilegacy/postgresql" |
| [`LdapConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/ldap/LdapConnectionDetails.html) | Containers named "osixia/openldap" |
| [`MongoConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/mongo/MongoConnectionDetails.html) | Containers named "mongo", "bitnami/mongodb" or "bitnamilegacy/mongodb" |
| [`Neo4jConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/neo4j/Neo4jConnectionDetails.html) | Containers named "neo4j", "bitnami/neo4j" or "bitnamilegacy/neo4j" |
| [`OtlpLoggingConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/actuate/autoconfigure/logging/otlp/OtlpLoggingConnectionDetails.html) | Containers named "otel/opentelemetry-collector-contrib", "grafana/otel-lgtm" |
| [`OtlpMetricsConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/actuate/autoconfigure/metrics/export/otlp/OtlpMetricsConnectionDetails.html) | Containers named "otel/opentelemetry-collector-contrib", "grafana/otel-lgtm" |
| [`OtlpTracingConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/actuate/autoconfigure/tracing/otlp/OtlpTracingConnectionDetails.html) | Containers named "otel/opentelemetry-collector-contrib", "grafana/otel-lgtm" |
| [`PulsarConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/pulsar/PulsarConnectionDetails.html) | Containers named "apachepulsar/pulsar" |
| [`R2dbcConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/r2dbc/R2dbcConnectionDetails.html) | Containers named "clickhouse/clickhouse-server", "bitnami/clickhouse", "bitnamilegacy/clickhouse", "gvenzl/oracle-free", "gvenzl/oracle-xe", "mariadb", "bitnami/mariadb", "bitnamilegacy/mariadb", "mssql/server", "mysql", "bitnami/mysql", "bitnamilegacy/mysql", "postgres", "bitnami/postgresql" or "bitnamilegacy/postgresql" |
| [`RabbitConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/amqp/RabbitConnectionDetails.html) | Containers named "rabbitmq", "bitnami/rabbitmq" or "bitnamilegacy/rabbitmq" |
| [`RedisConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/data/redis/RedisConnectionDetails.html) | Containers named "redis", "bitnami/redis", "bitnamilegacy/redis", "redis/redis-stack" or "redis/redis-stack-server" |
| [`ZipkinConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/actuate/autoconfigure/tracing/zipkin/ZipkinConnectionDetails.html) | Containers named "openzipkin/zipkin". |

<a id="features.dev-services.docker-compose.custom-images"></a>

### Custom Images

Sometimes you may need to use your own version of an image to provide a service.
You can use any custom image as long as it behaves in the same way as the standard image.
Specifically, any environment variables that the standard image supports must also be used in your custom image.

If your image uses a different name, you can use a label in your `compose.yml` file so that Spring Boot can provide a service connection.
Use a label named `org.springframework.boot.service-connection` to provide the service name.

For example:

```yaml
services:
  redis:
    image: 'mycompany/mycustomredis:7.0'
    ports:
      - '6379'
    labels:
      org.springframework.boot.service-connection: redis
```

<a id="features.dev-services.docker-compose.skipping"></a>

### Skipping Specific Containers

If you have a container image defined in your `compose.yml` that you don’t want connected to your application you can use a label to ignore it.
Any container with labeled with `org.springframework.boot.ignore` will be ignored by Spring Boot.

For example:

```yaml
services:
  redis:
    image: 'redis:7.0'
    ports:
      - '6379'
    labels:
      org.springframework.boot.ignore: true
```

<a id="features.dev-services.docker-compose.specific-file"></a>

### Using a Specific Compose File

If your compose file is not in the same directory as your application, or if it’s named differently, you can use `spring.docker.compose.file` in your `application.properties` or `application.yaml` to point to a different file.
Properties can be defined as an exact path or a path that’s relative to your application.

For example:

#### Properties

```properties
spring.docker.compose.file=../my-compose.yml
```

#### YAML

```yaml
spring:
  docker:
    compose:
      file: "../my-compose.yml"
```

<a id="features.dev-services.docker-compose.readiness"></a>

### Waiting for Container Readiness

Containers started by Docker Compose may take some time to become fully ready.
The recommended way of checking for readiness is to add a `healthcheck` section under the service definition in your `compose.yml` file.

Since it’s not uncommon for `healthcheck` configuration to be omitted from `compose.yml` files, Spring Boot also checks directly for service readiness.
By default, a container is considered ready when a TCP/IP connection can be established to its mapped port.

You can disable this on a per-container basis by adding a `org.springframework.boot.readiness-check.tcp.disable` label in your `compose.yml` file.

For example:

```yaml
services:
  redis:
    image: 'redis:7.0'
    ports:
      - '6379'
    labels:
      org.springframework.boot.readiness-check.tcp.disable: true
```

You can also change timeout values in your `application.properties` or `application.yaml` file:

#### Properties

```properties
spring.docker.compose.readiness.tcp.connect-timeout=10s
spring.docker.compose.readiness.tcp.read-timeout=5s
```

#### YAML

```yaml
spring:
  docker:
    compose:
      readiness:
        tcp:
          connect-timeout: 10s
          read-timeout: 5s
```

The overall timeout can be configured using `spring.docker.compose.readiness.timeout`.

<a id="features.dev-services.docker-compose.lifecycle"></a>

### Controlling the Docker Compose Lifecycle

By default Spring Boot calls `docker compose up` when your application starts and `docker compose stop` when it’s shut down.
If you prefer to have different lifecycle management you can use the `spring.docker.compose.lifecycle-management` property.

The following values are supported:

- `none` - Do not start or stop Docker Compose
- `start-only` - Start Docker Compose when the application starts and leave it running
- `start-and-stop` - Start Docker Compose when the application starts and stop it when the JVM exits

In addition you can use the `spring.docker.compose.start.command` property to change whether `docker compose up` or `docker compose start` is used.
The `spring.docker.compose.stop.command` allows you to configure if `docker compose down` or `docker compose stop` is used.

The following example shows how lifecycle management can be configured:

#### Properties

```properties
spring.docker.compose.lifecycle-management=start-and-stop
spring.docker.compose.start.command=start
spring.docker.compose.stop.command=down
spring.docker.compose.stop.timeout=1m
```

#### YAML

```yaml
spring:
  docker:
    compose:
      lifecycle-management: start-and-stop
      start:
        command: start
      stop:
        command: down
        timeout: 1m
```

<a id="features.dev-services.docker-compose.profiles"></a>

### Activating Docker Compose Profiles

Docker Compose profiles are similar to Spring profiles in that they let you adjust your Docker Compose configuration for specific environments.
If you want to activate a specific Docker Compose profile you can use the `spring.docker.compose.profiles.active` property in your `application.properties` or `application.yaml` file:

#### Properties

```properties
spring.docker.compose.profiles.active=myprofile
```

#### YAML

```yaml
spring:
  docker:
    compose:
      profiles:
        active: "myprofile"
```

<a id="features.dev-services.docker-compose.tests"></a>

### Using Docker Compose in Tests

By default, Spring Boot’s Docker Compose support is disabled when running tests.

To enable Docker Compose support in tests, set `spring.docker.compose.skip.in-tests` to `false`.

When using Gradle, you also need to change the configuration of the `spring-boot-docker-compose` dependency from `developmentOnly` to `testAndDevelopmentOnly`:

#### Gradle

```gradle
dependencies {
	testAndDevelopmentOnly("org.springframework.boot:spring-boot-docker-compose")
}
```

<a id="features.dev-services.testcontainers"></a>

## Testcontainers Support

As well as [using Testcontainers for integration testing](../testing/testcontainers.md#testing.testcontainers), it’s also possible to use them at development time.
The next sections will provide more details about that.

<a id="features.dev-services.testcontainers.at-development-time"></a>

### Using Testcontainers at Development Time

This approach allows developers to quickly start containers for the services that the application depends on, removing the need to manually provision things like database servers.
Using Testcontainers in this way provides functionality similar to Docker Compose, except that your container configuration is in Java rather than YAML.

To use Testcontainers at development time you need to launch your application using your “test” classpath rather than “main”.
This will allow you to access all declared test dependencies and give you a natural place to write your test configuration.

To create a test launchable version of your application you should create an “Application” class in the `src/test` directory.
For example, if your main application is in `src/main/java/com/example/MyApplication.java`, you should create `src/test/java/com/example/TestMyApplication.java`

The `TestMyApplication` class can use the `SpringApplication.from(…​)` method to launch the real application:

#### Java

```java
import org.springframework.boot.SpringApplication;

public class TestMyApplication {

	public static void main(String[] args) {
		SpringApplication.from(MyApplication::main).run(args);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.fromApplication

fun main(args: Array<String>) {
	fromApplication<MyApplication>().run(*args)
}

```

You’ll also need to define the [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/Container.html) instances that you want to start along with your application.
To do this, you need to make sure that the `spring-boot-testcontainers` module has been added as a `test` dependency.
Once that has been done, you can create a [`@TestConfiguration`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/test/context/TestConfiguration.html) class that declares [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) methods for the containers you want to start.

You can also annotate your [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) methods with [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html) in order to create [`ConnectionDetails`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/autoconfigure/service/connection/ConnectionDetails.html) beans.
See [the service connections](../testing/testcontainers.md#testing.testcontainers.service-connections) section for details of the supported technologies.

A typical Testcontainers configuration would look like this:

#### Java

```java
import org.testcontainers.containers.Neo4jContainer;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;

@TestConfiguration(proxyBeanMethods = false)
public class MyContainersConfiguration {

	@Bean
	@ServiceConnection
	public Neo4jContainer<?> neo4jContainer() {
		return new Neo4jContainer<>("neo4j:5");
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.testcontainers.containers.Neo4jContainer

@TestConfiguration(proxyBeanMethods = false)
class MyContainersConfiguration {

	@Bean
	@ServiceConnection
	fun neo4jContainer(): Neo4jContainer<*> {
		return Neo4jContainer("neo4j:5")
	}

}

```

> [!NOTE]
> The lifecycle of [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/Container.html) beans is automatically managed by Spring Boot.
> Containers will be started and stopped automatically.

> [!TIP]
> You can use the `spring.testcontainers.beans.startup` property to change how containers are started.
> By default `sequential` startup is used, but you may also choose `parallel` if you wish to start multiple containers in parallel.

Once you have defined your test configuration, you can use the `with(…​)` method to attach it to your test launcher:

#### Java

```java
import org.springframework.boot.SpringApplication;

public class TestMyApplication {

	public static void main(String[] args) {
		SpringApplication.from(MyApplication::main).with(MyContainersConfiguration.class).run(args);
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.fromApplication
import org.springframework.boot.with

fun main(args: Array<String>) {
	fromApplication<MyApplication>().with(MyContainersConfiguration::class).run(*args)
}

```

You can now launch `TestMyApplication` as you would any regular Java `main` method application to start your application and the containers that it needs to run.

> [!TIP]
> You can use the Maven goal `spring-boot:test-run` or the Gradle task `bootTestRun` to do this from the command line.

<a id="features.dev-services.testcontainers.at-development-time.dynamic-properties"></a>

#### Contributing Dynamic Properties at Development Time

If you want to contribute dynamic properties at development time from your [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/Container.html) [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) methods, define an additional [`DynamicPropertyRegistrar`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/test/context/DynamicPropertyRegistrar.html) bean.
The registrar should be defined using a [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) method that injects the container from which the properties will be sourced as a parameter.
This arrangement ensures that container has been started before the properties are used.

A typical configuration would look like this:

#### Java

```java
import org.testcontainers.containers.MongoDBContainer;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.test.context.DynamicPropertyRegistrar;

@TestConfiguration(proxyBeanMethods = false)
public class MyContainersConfiguration {

	@Bean
	public MongoDBContainer mongoDbContainer() {
		return new MongoDBContainer("mongo:5.0");
	}

	@Bean
	public DynamicPropertyRegistrar mongoDbProperties(MongoDBContainer container) {
		return (properties) -> {
			properties.add("spring.data.mongodb.host", container::getHost);
			properties.add("spring.data.mongodb.port", container::getFirstMappedPort);
		};
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.test.context.DynamicPropertyRegistrar;
import org.testcontainers.containers.MongoDBContainer

@TestConfiguration(proxyBeanMethods = false)
class MyContainersConfiguration {

	@Bean
	fun mongoDbContainer(): MongoDBContainer {
		return MongoDBContainer("mongo:5.0")
	}
	
	@Bean
	fun mongoDbProperties(container: MongoDBContainer): DynamicPropertyRegistrar {
		return DynamicPropertyRegistrar { properties ->
			properties.add("spring.data.mongodb.host") { container.host }
			properties.add("spring.data.mongodb.port") { container.firstMappedPort }
		}
	}

}

```

> [!NOTE]
> Using a [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html) is recommended whenever possible, however, dynamic properties can be a useful fallback for technologies that don’t yet have [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html) support.

<a id="features.dev-services.testcontainers.at-development-time.importing-container-declarations"></a>

#### Importing Testcontainers Declaration Classes

A common pattern when using Testcontainers is to declare [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/Container.html) instances as static fields.
Often these fields are defined directly on the test class.
They can also be declared on a parent class or on an interface that the test implements.

For example, the following `MyContainers` interface declares `mongo` and `neo4j` containers:

#### Java

```java
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.junit.jupiter.Container;

import org.springframework.boot.testcontainers.service.connection.ServiceConnection;

public interface MyContainers {

	@Container
	@ServiceConnection
	MongoDBContainer mongoContainer = new MongoDBContainer("mongo:5.0");

	@Container
	@ServiceConnection
	Neo4jContainer<?> neo4jContainer = new Neo4jContainer<>("neo4j:5");

}
```

#### Kotlin

```kotlin
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.testcontainers.containers.MongoDBContainer
import org.testcontainers.containers.Neo4jContainer
import org.testcontainers.junit.jupiter.Container

interface MyContainers {

	companion object {

		@Container
		@ServiceConnection
		@JvmField
		val mongoContainer = MongoDBContainer("mongo:5.0")

		@Container
		@ServiceConnection
		@JvmField
		val neo4jContainer = Neo4jContainer("neo4j:5")

	}

}

```

If you already have containers defined in this way, or you just prefer this style, you can import these declaration classes rather than defining your containers as [`@Bean`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/context/annotation/Bean.html) methods.
To do so, add the [`@ImportTestcontainers`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/testcontainers/context/ImportTestcontainers.html) annotation to your test configuration class:

#### Java

```java
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.context.ImportTestcontainers;

@TestConfiguration(proxyBeanMethods = false)
@ImportTestcontainers(MyContainers.class)
public class MyContainersConfiguration {

}
```

#### Kotlin

```kotlin
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.context.ImportTestcontainers

@TestConfiguration(proxyBeanMethods = false)
@ImportTestcontainers(MyContainers::class)
class MyContainersConfiguration

```

> [!TIP]
> If you don’t intend to use the [service connections feature](../testing/testcontainers.md#testing.testcontainers.service-connections) but want to use [`@DynamicPropertySource`](../testing/testcontainers.md#testing.testcontainers.dynamic-properties) instead, remove the [`@ServiceConnection`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/testcontainers/service/connection/ServiceConnection.html) annotation from the [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/Container.html) fields.
> You can also add [`@DynamicPropertySource`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/test/context/DynamicPropertySource.html) annotated methods to your declaration class.

<a id="features.dev-services.testcontainers.at-development-time.devtools"></a>

#### Using DevTools with Testcontainers at Development Time

When using devtools, you can annotate beans and bean methods with [`@RestartScope`](https://docs.spring.io/spring-boot/3.4.11/api/java/org/springframework/boot/devtools/restart/RestartScope.html).
Such beans won’t be recreated when the devtools restart the application.
This is especially useful for [`Container`](https://javadoc.io/doc/org.testcontainers/testcontainers/1.20.6/org/testcontainers/containers/Container.html) beans, as they keep their state despite the application restart.

#### Java

```java
import org.testcontainers.containers.MongoDBContainer;

import org.springframework.boot.devtools.restart.RestartScope;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;

@TestConfiguration(proxyBeanMethods = false)
public class MyContainersConfiguration {

	@Bean
	@RestartScope
	@ServiceConnection
	public MongoDBContainer mongoDbContainer() {
		return new MongoDBContainer("mongo:5.0");
	}

}
```

#### Kotlin

```kotlin
import org.springframework.boot.devtools.restart.RestartScope
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.boot.testcontainers.service.connection.ServiceConnection
import org.springframework.context.annotation.Bean
import org.testcontainers.containers.MongoDBContainer

@TestConfiguration(proxyBeanMethods = false)
class MyContainersConfiguration {

	@Bean
	@RestartScope
	@ServiceConnection
	fun mongoDbContainer(): MongoDBContainer {
		return MongoDBContainer("mongo:5.0")
	}

}

```

> [!WARNING]
> If you’re using Gradle and want to use this feature, you need to change the configuration of the `spring-boot-devtools` dependency from `developmentOnly` to `testAndDevelopmentOnly`.
> With the default scope of `developmentOnly`, the `bootTestRun` task will not pick up changes in your code, as the devtools are not active.
