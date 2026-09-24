---
title: "Cassandra Support"
source: "ROOT:cassandra.adoc"
---

<a id="cassandra.core"></a>

# Cassandra Support

Spring Data support for Apache Cassandra contains a wide range of features:

- Spring configuration support with [Java-based `@Configuration` classes or the XML namespace](cassandra/configuration.md).
- The [`CqlTemplate`, `AsyncCqlTemplate`, and `ReactiveCqlTemplate`](cassandra/cql-template.md) helper classes that increases productivity by properly handling common Cassandra data access operations.
- The [`CassandraTemplate`, `AsyncCassandraTemplate`, and `ReactiveCassandraTemplate`](cassandra/template.md) helper classes that provide object mapping between CQL Tables and POJOs.
- [Exception translation](cassandra/cql-template.md#exception-translation) into Spring’s portable [Data Access Exception Hierarchy](https://docs.spring.io/spring-framework/reference/6.1data-access.html#dao-exceptions).
- Feature rich [object mapping](object-mapping.md) integrated with *Spring’s* [Conversion Service](https://docs.spring.io/spring-framework/reference/6.1core.html#core-convert).
- [Annotation-based mapping](object-mapping.md#mapping.usage-annotations) metadata that is extensible to support other metadata formats.
- Java-based [query, criteria, and update DSLs](cassandra/template.md#cassandra.template.query).
- Automatic implementation of [imperative and reactive `Repository` interfaces](repositories.md) including support for [custom query methods](repositories/custom-implementations.md).

For most data-oriented tasks, you can use the `[Reactive|Async]CassandraTemplate` or the `Repository` support, both of which use the rich object-mapping functionality. `[Reactive|Async]CqlTemplate` is commonly used to increment counters or perform ad-hoc CRUD operations. `[Reactive|Async]CqlTemplate` also provides callback methods that make it easy to get low-level API objects, such as `com.datastax.oss.driver.api.core.CqlSession`, which lets you communicate directly with Cassandra.
Spring Data for Apache Cassandra uses consistent naming conventions on objects in various APIs to those found in the DataStax Java Driver so that they are familiar and so that you can map your existing knowledge onto the Spring APIs.
