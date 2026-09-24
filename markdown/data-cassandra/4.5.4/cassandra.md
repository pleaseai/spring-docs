---
title: "Cassandra Support"
source: "ROOT:cassandra.adoc"
---

<a id="cassandra.core"></a>

# Cassandra Support

This part of the reference documentation explains the core functionality offered by Spring Data for Apache Cassandra.
Spring Data support for Apache Cassandra contains a wide range of features:

- Spring configuration support with [Java-based `@Configuration` classes or the XML namespace](cassandra/configuration.md).
- The [`CqlTemplate`, `AsyncCqlTemplate`, and `ReactiveCqlTemplate`](cassandra/cql-template.md) helper classes that increases productivity by properly handling common Cassandra data access operations.
- The [`CassandraTemplate`, `AsyncCassandraTemplate`, and `ReactiveCassandraTemplate`](cassandra/template.md) helper classes that provide object mapping between CQL Tables and POJOs.
- [Exception translation](cassandra/cql-template.md#exception-translation) into Spring’s portable [Data Access Exception Hierarchy](https://docs.spring.io/spring-framework/reference/6.2/data-access/dao.html#dao-exceptions).
- Feature rich [object mapping](object-mapping.md) integrated with *Spring’s* [Conversion Service](https://docs.spring.io/spring-framework/reference/6.2/core/validation/convert.html).
- [Annotation-based mapping](object-mapping.md#mapping.usage-annotations) metadata that is extensible to support other metadata formats.
- Java-based [query, criteria, and update DSLs](cassandra/template.md#cassandra.template.query).
- Automatic implementation of [imperative and reactive `Repository` interfaces](repositories.md) including support for [custom query methods](repositories/custom-implementations.md).

<a id="cassandra.abstractions"></a>

## Abstractions

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

- [`CqlTemplate`](cassandra/cql-template.md) and [`ReactiveCqlTemplate`](cassandra/reactive-cassandra.md) are the classic Spring CQL approach and the most popular.
This is the “lowest-level” approach.
Note that components like `CassandraTemplate`
use `CqlTemplate` under-the-hood.
- [`CassandraTemplate`](cassandra/template.md) wraps a `CqlTemplate` to provide query result-to-object mapping and the use of `SELECT`, `INSERT`, `UPDATE`, and `DELETE` methods instead of writing CQL statements.
This approach provides better documentation and ease of use.
- [`ReactiveCassandraTemplate`](cassandra/reactive-cassandra.md) wraps a `ReactiveCqlTemplate` to provide query result-to-object mapping and the use of `SELECT`, `INSERT`, `UPDATE`, and `DELETE` methods instead of writing CQL statements.
This approach provides better documentation and ease of use.
- Repository Abstraction lets you create repository declarations in your data access layer.
The goal of Spring Data’s repository abstraction is to significantly reduce the amount of boilerplate code required to implement data access layers for various persistence stores.

For most data-oriented tasks, you can use the `[Reactive|Async]CassandraTemplate` or the `Repository` support, both of which use the rich object-mapping functionality. `[Reactive|Async]CqlTemplate` is commonly used to increment counters or perform ad-hoc CRUD operations. `[Reactive|Async]CqlTemplate` also provides callback methods that make it easy to get low-level API objects, such as `com.datastax.oss.driver.api.core.CqlSession`, which lets you communicate directly with Cassandra.
Spring Data for Apache Cassandra uses consistent naming conventions on objects in various APIs to those found in the DataStax Java Driver so that they are familiar and so that you can map your existing knowledge onto the Spring APIs.
