---
title: "Documentation Overview"
source: "ROOT:documentation.adoc"
---

<a id="documentation"></a>

# Documentation Overview

This section provides a brief overview of Spring Boot reference documentation.
It serves as a map for the rest of the document.

<a id="documentation.first-steps"></a>

## First Steps

If you are getting started with Spring Boot or 'Spring' in general, start with the following topics:

- **From scratch:** [Overview](index.md) | [Requirements](system-requirements.md) | [Installation](installing.md)
- **Tutorial:** [Part 1](tutorial/first-application/index.md) | [Part 2](tutorial/first-application/index.md#getting-started.first-application.code)
- **Running your example:** [Part 1](tutorial/first-application/index.md#getting-started.first-application.run) | [Part 2](tutorial/first-application/index.md#getting-started.first-application.executable-jar)

<a id="documentation.upgrading"></a>

## Upgrading From an Earlier Version

You should always ensure that you are running a [supported version](https://github.com/spring-projects/spring-boot/wiki/Supported-Versions) of Spring Boot.

Depending on the version that you are upgrading to, you can find some additional tips here:

- **From 1.x to 2.x:** [Upgrading from 1.x](upgrading.md#upgrading.from-1x)
- **From 2.x:** [Upgrading from 2.x](upgrading.md#upgrading.from-2x)
- **To a new feature release:** [Upgrading to New Feature Release](upgrading.md#upgrading.to-feature)
- **Spring Boot CLI:** [Upgrading the Spring Boot CLI](upgrading.md#upgrading.cli)

<a id="documentation.using"></a>

## Developing With Spring Boot

Ready to actually start using Spring Boot? [We have you covered](reference/using/index.md):

- **Build systems:** [Maven](reference/using/build-systems.md#using.build-systems.maven) | [Gradle](reference/using/build-systems.md#using.build-systems.gradle) | [Ant](reference/using/build-systems.md#using.build-systems.ant) | [Starters](reference/using/build-systems.md#using.build-systems.starters)
- **Best practices:** [Code Structure](reference/using/structuring-your-code.md) | [@Configuration](reference/using/configuration-classes.md) | [@EnableAutoConfiguration](reference/using/auto-configuration.md) | [Beans and Dependency Injection](reference/using/spring-beans-and-dependency-injection.md)
- **Running your code:** [IDE](reference/using/running-your-application.md#using.running-your-application.from-an-ide) | [Packaged](reference/using/running-your-application.md#using.running-your-application.as-a-packaged-application) | [Maven](reference/using/running-your-application.md#using.running-your-application.with-the-maven-plugin) | [Gradle](reference/using/running-your-application.md#using.running-your-application.with-the-gradle-plugin)
- **Packaging your app:** [Production jars](reference/using/packaging-for-production.md)
- **Spring Boot CLI:** [Using the CLI](cli/index.md)

<a id="documentation.features"></a>

## Learning About Spring Boot Features

Need more details about Spring Boot’s core features?
[The following content is for you](reference/features/index.md):

- **Spring Application:** [SpringApplication](reference/features/spring-application.md)
- **External Configuration:** [External Configuration](reference/features/external-config.md)
- **Profiles:** [Profiles](reference/features/profiles.md)
- **Logging:** [Logging](reference/features/logging.md)

<a id="documentation.web"></a>

## Web

If you develop Spring Boot web applications, take a look at the following content:

- **Servlet Web Applications:** [Spring MVC, Jersey, Embedded Servlet Containers](reference/web/servlet.md)
- **Reactive Web Applications:** [Spring Webflux, Embedded Servlet Containers](reference/web/reactive.md)
- **Graceful Shutdown:** [Graceful Shutdown](reference/web/graceful-shutdown.md)
- **Spring Security:** [Default Security Configuration, Auto-configuration for OAuth2, SAML](reference/web/spring-security.md)
- **Spring Session:** [Auto-configuration for Spring Session](reference/web/spring-session.md)
- **Spring HATEOAS:** [Auto-configuration for Spring HATEOAS](reference/web/spring-hateoas.md)

<a id="documentation.data"></a>

## Data

If your application deals with a datastore, you can see how to configure that here:

- **SQL:** [Configuring a SQL Datastore, Embedded Database support, Connection pools, and more.](reference/data/sql.md)
- **NOSQL:** [Auto-configuration for NOSQL stores such as Redis, MongoDB, Neo4j, and others.](reference/data/nosql.md)

<a id="documentation.messaging"></a>

## Messaging

If your application uses any messaging protocol, see one or more of the following sections:

- **JMS:** [Auto-configuration for ActiveMQ and Artemis, Sending and Receiving messages through JMS](reference/messaging/jms.md)
- **AMQP:** [Auto-configuration for RabbitMQ](reference/messaging/amqp.md)
- **Kafka:** [Auto-configuration for Spring Kafka](reference/messaging/kafka.md)
- **Pulsar:** [Auto-configuration for Spring for Apache Pulsar](reference/messaging/pulsar.md)
- **RSocket:** [Auto-configuration for Spring Framework’s RSocket Support](reference/messaging/rsocket.md)
- **Spring Integration:** [Auto-configuration for Spring Integration](reference/messaging/spring-integration.md)

<a id="documentation.io"></a>

## IO

If your application needs IO capabilities, see one or more of the following sections:

- **Caching:** [Caching support with EhCache, Hazelcast, Infinispan, and more](reference/io/caching.md)
- **Quartz:** [Quartz Scheduling](reference/io/quartz.md)
- **Mail:** [Sending Email](reference/io/email.md)
- **Validation:** [JSR-303 Validation](reference/io/validation.md)
- **REST Clients:** [Calling REST Services with RestTemplate and WebClient](reference/io/rest-client.md)
- **Webservices:** [Auto-configuration for Spring Web Services](reference/io/webservices.md)
- **JTA:** [Distributed Transactions with JTA](reference/io/jta.md)

<a id="documentation.container-images"></a>

## Container Images

Spring Boot provides first-class support for building efficient container images. You can read more about it here:

- **Efficient Container Images:** [Tips to optimize container images such as Docker images](reference/packaging/container-images/efficient-images.md)
- **Dockerfiles:** [Building container images using dockerfiles](reference/packaging/container-images/dockerfiles.md)
- **Cloud Native Buildpacks:** [Support for Cloud Native Buildpacks with Maven and Gradle](reference/packaging/container-images/cloud-native-buildpacks.md)

<a id="documentation.actuator"></a>

## Moving to Production

When you are ready to push your Spring Boot application to production, we have [some tricks](how-to/actuator.md) that you might like:

- **Management endpoints:** [Overview](reference/actuator/endpoints.md)
- **Connection options:** [HTTP](reference/actuator/monitoring.md) | [JMX](reference/actuator/jmx.md)
- **Monitoring:** [Metrics](reference/actuator/metrics.md) | [Auditing](reference/actuator/auditing.md) | [HTTP Exchanges](reference/actuator/http-exchanges.md) | [Process](reference/actuator/process-monitoring.md)

<a id="documentation.packaging"></a>

## Optimizing for Production

Spring Boot applications can be optimized for production using technologies described in these sections:

- **Efficient Deployments:** [Unpacking the Executable JAR](reference/packaging/efficient.md#packaging.efficient.unpacking)
- **GraalVM Native Images:** [Introduction](reference/packaging/native-image/introducing-graalvm-native-images.md) | [Advanced Topics](reference/packaging/native-image/advanced-topics.md) | [Getting Started](how-to/native-image/developing-your-first-application.md) | [Testing](how-to/native-image/testing-native-applications.md)
- **Class Data Sharing:** [Overview](reference/packaging/class-data-sharing.md)
- **Checkpoint and Restore** [Overview](reference/packaging/checkpoint-restore.md)

<a id="documentation.advanced"></a>

## Advanced Topics

Finally, we have a few topics for more advanced users:

- **Spring Boot Applications Deployment:** [Cloud Deployment](how-to/deployment/cloud.md) | [OS Service](how-to/deployment/installing.md)
- **Build tool plugins:** [Maven](https://docs.spring.io/spring-boot/3.3.7/maven-plugin/index.html) | [Gradle](https://docs.spring.io/spring-boot/3.3.7/gradle-plugin/index.html)
- **Appendix:** [Application Properties](appendix/application-properties/index.md) | [Configuration Metadata](specification/configuration-metadata/index.md) | [Auto-configuration Classes](appendix/auto-configuration-classes/index.md) | [Test Auto-configuration Annotations](appendix/test-auto-configuration/index.md) | [Executable Jars](specification/executable-jar/index.md) | [Dependency Versions](appendix/dependency-versions/index.md)
