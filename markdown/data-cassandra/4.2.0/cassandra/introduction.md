---
title: "Introduction"
source: "ROOT:cassandra/introduction.adoc"
---

<a id="cassandra.introduction"></a>

# Introduction

This part of the reference documentation explains the core functionality offered by Spring Data for Apache Cassandra.

- [Cassandra Support](../cassandra.md) introduces the Cassandra module feature set.
- [Reactive Cassandra Support](reactive-cassandra.md) explains reactive Cassandra specifics.
- [Cassandra Repositories](../repositories.md) introduces repository support for Cassandra.

<a id="cassandra.modules"></a>

## Spring CQL and Spring Data for Apache Cassandra Modules

Spring Data for Apache Cassandra allows interaction on both the CQL and the entity level.

The value provided by the Spring Data for Apache Cassandra abstraction is perhaps best shown by the sequence of actions outlined in the table below.
The table shows which actions Spring take care of and which actions are the responsibility of you, the application developer.

<a id="cassandra.modules.who-does-what"></a>

| Action | Spring | You |
| --- | --- | --- |
| Define connection parameters. |  | X |
| Open the connection. | X |  |
| Specify the CQL statement. |  | X |
| Declare parameters and provide parameter values |  | X |
| Prepare and run the statement. | X |  |
| Set up the loop to iterate through the results (if any). | X |  |
| Do the work for each iteration. |  | X |
| Process any exception. | X |  |
| Close the Session. | X |  |

The core CQL support takes care of all the low-level details that can make Cassandra and CQL such a tedious API with which to develop.
Using mapped entity objects allows schema generation, object mapping, and repository support.

<a id="cassandra.choose-style"></a>

### Choosing an Approach for Cassandra Database Access

You can choose among several approaches to use as a basis for your Cassandra database access.
Spring’s support for Apache Cassandra comes in different flavors.
Once you start using one of these approaches, you can still mix and match to include a feature from a different approach.
The following approaches work well:

- [`CqlTemplate`](cql-template.md) and [`ReactiveCqlTemplate`](reactive-cassandra.md#cassandra.reactive.cql-template) are the classic Spring CQL approach and the most popular.
This is the “lowest-level” approach.
Note that components like `CassandraTemplate`
use `CqlTemplate` under-the-hood.
- [`CassandraTemplate`](template.md) wraps a `CqlTemplate` to provide query result-to-object mapping and the use of `SELECT`, `INSERT`, `UPDATE`, and `DELETE` methods instead of writing CQL statements.
This approach provides better documentation and ease of use.
- [`ReactiveCassandraTemplate`](reactive-cassandra.md#cassandra.reactive.template) wraps a `ReactiveCqlTemplate` to provide query result-to-object mapping and the use of `SELECT`, `INSERT`, `UPDATE`, and `DELETE` methods instead of writing CQL statements.
This approach provides better documentation and ease of use.
- Repository Abstraction lets you create repository declarations in your data access layer.
The goal of Spring Data’s repository abstraction is to significantly reduce the amount of boilerplate code required to implement data access layers for various persistence stores.
