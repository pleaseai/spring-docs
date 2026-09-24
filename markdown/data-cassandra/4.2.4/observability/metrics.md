---
title: "Metrics"
source: "ROOT:observability/metrics.adoc"
---

<a id="observability-metrics"></a>

# Metrics

Below you can find a list of all metrics declared by this project.

<a id="observability-metrics-cassandra-query-observation"></a>

## Cassandra Query Observation

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
