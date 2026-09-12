---
title: "Spring Integration"
source: "reference:messaging/spring-integration.adoc"
---

<a id="messaging.spring-integration"></a>

# Spring Integration

Spring Boot offers several conveniences for working with [Spring Integration](https://spring.io/projects/spring-integration), including the `spring-boot-starter-integration` starter.
Spring Integration provides abstractions over messaging and also other transports such as HTTP, TCP, and others.
If Spring Integration is available on your classpath, it is initialized through the [`@EnableIntegration`](https://docs.spring.io/spring-integration/docs/6.5.x/api/org/springframework/integration/config/EnableIntegration.html) annotation.

Spring Integration polling logic relies [on the auto-configured [`TaskScheduler`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/scheduling/TaskScheduler.html)](../features/task-execution-and-scheduling.md).
The default [`PollerMetadata`](https://docs.spring.io/spring-integration/docs/6.5.x/api/org/springframework/integration/scheduling/PollerMetadata.html) (poll unbounded number of messages every second) can be customized with `spring.integration.poller.*` configuration properties.

Spring Boot also configures some features that are triggered by the presence of additional Spring Integration modules.
If `spring-integration-jmx` is also on the classpath, message processing statistics are published over JMX.
If `spring-integration-jdbc` is available, the default database schema can be created on startup, as shown in the following line:

#### Properties

```properties
spring.integration.jdbc.initialize-schema=always
```

#### YAML

```yaml
spring:
  integration:
    jdbc:
      initialize-schema: "always"
```

If `spring-integration-rsocket` is available, developers can configure an RSocket server using `spring.rsocket.server.*` properties and let it use [`IntegrationRSocketEndpoint`](https://docs.spring.io/spring-integration/docs/6.5.x/api/org/springframework/integration/rsocket/IntegrationRSocketEndpoint.html) or [`RSocketOutboundGateway`](https://docs.spring.io/spring-integration/docs/6.5.x/api/org/springframework/integration/rsocket/outbound/RSocketOutboundGateway.html) components to handle incoming RSocket messages.
This infrastructure can handle Spring Integration RSocket channel adapters and [`@MessageMapping`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/messaging/handler/annotation/MessageMapping.html) handlers (given `spring.integration.rsocket.server.message-mapping-enabled` is configured).

Spring Boot can also auto-configure an [`ClientRSocketConnector`](https://docs.spring.io/spring-integration/docs/6.5.x/api/org/springframework/integration/rsocket/ClientRSocketConnector.html) using configuration properties:

#### Properties

```properties
spring.integration.rsocket.client.host=example.org
spring.integration.rsocket.client.port=9898
```

#### YAML

```yaml
# Connecting to a RSocket server over TCP
spring:
  integration:
    rsocket:
      client:
        host: "example.org"
        port: 9898
```

#### Properties

```properties
spring.integration.rsocket.client.uri=ws://example.org
```

#### YAML

```yaml
# Connecting to a RSocket Server over WebSocket
spring:
  integration:
    rsocket:
      client:
        uri: "ws://example.org"
```

See the [`IntegrationAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.5.11/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/integration/IntegrationAutoConfiguration.java) and [`IntegrationProperties`](https://docs.spring.io/spring-boot/3.5.11/api/java/org/springframework/boot/autoconfigure/integration/IntegrationProperties.html) classes for more details.
