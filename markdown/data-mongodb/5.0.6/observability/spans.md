---
title: "Spans"
source: "ROOT:observability/spans.adoc"
---

<a id="observability-spans"></a>

# Spans

Below you can find a list of all spans declared by this project.

<a id="observability-spans-mongodb-command-observation"></a>

## Mongodb Command Observation Span

> Timer created around a MongoDB command execution.

**Span name** `spring.data.mongodb.command`.

Fully qualified name of the enclosing class `org.springframework.data.mongodb.observability.MongoObservation`.

|  |  |
| --- | --- |
| Name | Description |
| `db.mongodb.collection` *(required)* | MongoDB collection name. |
| `db.name` *(required)* | MongoDB database name. |
| `db.operation` *(required)* | MongoDB command value. |
| `db.system` *(required)* | MongoDB database system. |
| `net.peer.name` *(required)* | Name of the database host. |
| `net.peer.port` *(required)* | Logical remote port number. |
| `net.sock.peer.addr` *(required)* | Mongo peer address. |
| `net.sock.peer.port` *(required)* | Mongo peer port. |
| `net.transport` *(required)* | Network transport. |
| `spring.data.mongodb.cluster_id` *(required)* | MongoDB cluster identifier. |
