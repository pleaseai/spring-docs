---
title: "Observability"
source: "ROOT:observability.adoc"
---

<a id="redis.observability"></a>

# Observability

Getting insights from an application component about its operations, timing and relation to application code is crucial to understand latency.
Spring Data Redis ships with a Micrometer integration through the Lettuce driver to collect observations during Redis interaction.
Once the integration is set up, Micrometer will create meters and spans (for distributed tracing) for each Redis command.

To enable the integration, apply the following configuration to `LettuceClientConfiguration`:

```java
@Configuration
class ObservabilityConfiguration {

  @Bean
  public ClientResources clientResources(ObservationRegistry observationRegistry) {

    return ClientResources.builder()
              .tracing(new MicrometerTracingAdapter(observationRegistry, "my-redis-cache"))
              .build();
  }

  @Bean
  public LettuceConnectionFactory lettuceConnectionFactory(ClientResources clientResources) {

    LettuceClientConfiguration clientConfig = LettuceClientConfiguration.builder()
                                                .clientResources(clientResources).build();
    RedisConfiguration redisConfiguration = …;
    return new LettuceConnectionFactory(redisConfiguration, clientConfig);
  }
}
```

See also [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/reference/specification/trace/semantic_conventions/database/#redis) for further reference.

<a id="observability-metrics"></a>

## Observability - Metrics

Below you can find a list of all metrics declared by this project.

<a id="observability-metrics-redis-command-observation"></a>

## Redis Command Observation

> Timer created around a Redis command execution.

**Metric name** `spring.data.redis`. **Type** `timer` and **base unit** `seconds`.

Fully qualified name of the enclosing class `org.springframework.data.redis.connection.lettuce.observability.RedisObservation`.

|  |  |
| --- | --- |
| Name | Description |
| `db.operation` | Redis command value. |
| `db.redis.database_index` | Redis database index. |
| `db.system` | Database system. |
| `db.user` | Redis user. |
| `net.peer.name` | Name of the database host. |
| `net.peer.port` | Logical remote port number. |
| `net.sock.peer.addr` | Mongo peer address. |
| `net.sock.peer.port` | Mongo peer port. |
| `net.transport` | Network transport. |

|  |  |
| --- | --- |
| Name | Description |
| `db.statement` | Redis statement. |
| `spring.data.redis.command.error` | Redis error response. |

<a id="observability-spans"></a>

## Observability - Spans

Below you can find a list of all spans declared by this project.

<a id="observability-spans-redis-command-observation"></a>

## Redis Command Observation Span

> Timer created around a Redis command execution.

**Span name** `spring.data.redis`.

Fully qualified name of the enclosing class `org.springframework.data.redis.connection.lettuce.observability.RedisObservation`.

|  |  |
| --- | --- |
| Name | Description |
| `db.operation` | Redis command value. |
| `db.redis.database_index` | Redis database index. |
| `db.statement` | Redis statement. |
| `db.system` | Database system. |
| `db.user` | Redis user. |
| `net.peer.name` | Name of the database host. |
| `net.peer.port` | Logical remote port number. |
| `net.sock.peer.addr` | Mongo peer address. |
| `net.sock.peer.port` | Mongo peer port. |
| `net.transport` | Network transport. |
| `spring.data.redis.command.error` | Redis error response. |
