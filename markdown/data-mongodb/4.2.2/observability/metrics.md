---
title: "Metrics"
source: "ROOT:observability/metrics.adoc"
---

<a id="observability-metrics"></a>

# Metrics

Below you can find a list of all metrics declared by this project.

<a id="observability-metrics-mongodb-command-observation"></a>

## Mongodb Command Observation

> Timer created around a MongoDB command execution.

**Metric name** `spring.data.mongodb.command`. **Type** `timer`.

**Metric name** `spring.data.mongodb.command.active`. **Type** `long task timer`.

> [!IMPORTANT]
> KeyValues that are added after starting the Observation might be missing from the \*.active metrics.

> [!IMPORTANT]
> Micrometer internally uses `nanoseconds` for the baseunit. However, each backend determines the actual baseunit. (i.e. Prometheus uses seconds)

Fully qualified name of the enclosing class `org.springframework.data.mongodb.observability.MongoObservation`.

|  |  |
| --- | --- |
| Name | Description |
| `db.connection_string` *(required)* | MongoDB connection string. |
| `db.mongodb.collection` *(required)* | MongoDB collection name. |
| `db.name` *(required)* | MongoDB database name. |
| `db.operation` *(required)* | MongoDB command value. |
| `db.system` *(required)* | MongoDB database system. |
| `db.user` *(required)* | MongoDB user. |
| `net.peer.name` *(required)* | Name of the database host. |
| `net.peer.port` *(required)* | Logical remote port number. |
| `net.sock.peer.addr` *(required)* | Mongo peer address. |
| `net.sock.peer.port` *(required)* | Mongo peer port. |
| `net.transport` *(required)* | Network transport. |
| `spring.data.mongodb.cluster_id` *(required)* | MongoDB cluster identifier. |
