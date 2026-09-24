---
title: "Observability"
source: "ROOT:observability.adoc"
---

<a id="cassandra.observability"></a>

# Observability

Getting insights from an application component about its operations, timing and relation to application code is crucial to understand latency.
Spring Data Cassandra ships with a Micrometer instrumentation through the Cassandra driver to collect observations during Cassandra interaction.
Once the integration is set up, Micrometer will create meters and spans (for distributed tracing) for each Cassandra statement.

To enable the instrumentation, apply the following configuration to your application:

```java
@Configuration
class ObservabilityConfiguration {

  @Bean
  public ObservableCqlSessionFactoryBean observableCqlSession(CqlSessionBuilder builder,
                                                              ObservationRegistry registry) {
    return new ObservableCqlSessionFactoryBean(builder, registry); // <1>
  }

  @Bean
  public ObservableReactiveSessionFactoryBean observableReactiveSession(CqlSession session,
                                                              ObservationRegistry registry) {
    return new ObservableReactiveSessionFactoryBean(session, registry); // <2>
  }
}
```

1. Wraps the CQL session object to observe Cassandra statement execution.
Also, registers `ObservationRequestTracker.INSTANCE` with the `CqlSessionBuilder`.
1. Wraps a CQL session object to observe reactive Cassandra statement execution.

Both, [`ObservableCqlSessionFactoryBean`](https://docs.spring.io/spring-data/cassandra/docs/4.5.12/api/org/springframework/data/cassandra/observability/ObservableCqlSessionFactoryBean.html) and [`ObservableReactiveSessionFactoryBean`](https://docs.spring.io/spring-data/cassandra/docs/4.5.12/api/org/springframework/data/cassandra/observability/ObservableReactiveSessionFactoryBean.html) support configuration of [`CassandraObservationConvention`](https://docs.spring.io/spring-data/cassandra/docs/4.5.12/api/org/springframework/data/cassandra/observability/CassandraObservationConvention.html).

See also [OpenTelemetry Semantic Conventions](https://opentelemetry.io/docs/reference/specification/trace/semantic_conventions/database/#cassandra) for further reference.

<a id="observability-conventions"></a>

## Conventions

Below you can find a list of all `GlobalObservabilityConventions` and `ObservabilityConventions` declared by this project.

|  |  |
| --- | --- |
| ObservationConvention Class Name | Applicable ObservationContext Class Name |
| `org.springframework.data.cassandra.observability.DefaultCassandraObservationConvention` | `n/a` |

<a id="observability-metrics"></a>

## Metrics

Below you can find a list of all metrics declared by this project.

<a id="observability-metrics-cassandra-query-observation"></a>

### Cassandra Query Observation

> Create an `io.micrometer.observation.Observation` for Cassandra-based queries.

**Metric name** `spring.data.cassandra.query`. **Type** `timer` and **base unit** `seconds`.

Fully qualified name of the enclosing class `org.springframework.data.cassandra.observability.CassandraObservation`.

|  |  |
| --- | --- |
| Name | Description |
| `db.cassandra.coordinator.dc` |  |
| `db.cassandra.coordinator.id` |  |
| `db.name` | Name of the Cassandra keyspace. |
| `db.operation` | The database operation. |
| `db.system` | Database system. |
| `net.peer.name` | Name of the database host. |
| `net.peer.port` | Logical remote port number. |
| `net.sock.peer.addr` | Cassandra peer address. |
| `net.sock.peer.port` | Cassandra peer port. |
| `net.transport` | Network transport. |
| `spring.data.cassandra.methodName` | The method name |
| `spring.data.cassandra.sessionName` | Cassandra session |

|  |  |
| --- | --- |
| Name | Description |
| `db.cassandra.consistency_level` |  |
| `db.cassandra.idempotence` |  |
| `db.cassandra.page_size` |  |
| `db.statement` | A key-value containing Cassandra CQL. |
| `spring.data.cassandra.node[%s].error` | A tag containing error that occurred for the given node. (since the name contains `%s` the final value will be resolved at runtime) |

<a id="observability-spans"></a>

## Spans

Below you can find a list of all spans declared by this project.

<a id="observability-spans-cassandra-query-observation"></a>

### Cassandra Query Observation Span

> Create an `io.micrometer.observation.Observation` for Cassandra-based queries.

**Span name** `spring.data.cassandra.query`.

Fully qualified name of the enclosing class `org.springframework.data.cassandra.observability.CassandraObservation`.

|  |  |
| --- | --- |
| Name | Description |
| `db.cassandra.consistency_level` |  |
| `db.cassandra.coordinator.dc` |  |
| `db.cassandra.coordinator.id` |  |
| `db.cassandra.idempotence` |  |
| `db.cassandra.page_size` |  |
| `db.name` | Name of the Cassandra keyspace. |
| `db.operation` | The database operation. |
| `db.statement` | A key-value containing Cassandra CQL. |
| `db.system` | Database system. |
| `net.peer.name` | Name of the database host. |
| `net.peer.port` | Logical remote port number. |
| `net.sock.peer.addr` | Cassandra peer address. |
| `net.sock.peer.port` | Cassandra peer port. |
| `net.transport` | Network transport. |
| `spring.data.cassandra.methodName` | The method name |
| `spring.data.cassandra.node[%s].error` | A tag containing error that occurred for the given node. (since the name contains `%s` the final value will be resolved at runtime) |
| `spring.data.cassandra.sessionName` | Cassandra session |
