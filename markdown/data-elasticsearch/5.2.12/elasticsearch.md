---
title: "Elasticsearch Support"
source: "ROOT:elasticsearch.adoc"
---

<a id="elasticsearch.core"></a>

# Elasticsearch Support

Spring Data support for Elasticsearch contains a wide range of features:

- Spring configuration support for various [Elasticsearch clients](elasticsearch/clients.md).
- The [`ElasticsearchTemplate` and `ReactiveElasticsearchTemplate`](elasticsearch/template.md) helper classes that provide object mapping between ES index operations and POJOs.
- [Exception translation](elasticsearch/template.md#exception-translation) into Spring’s portable [Data Access Exception Hierarchy](https://docs.spring.io/spring-framework/reference/6.1data-access.html#dao-exceptions).
- Feature rich [object mapping](elasticsearch/object-mapping.md) integrated with *Spring’s* [Conversion Service](https://docs.spring.io/spring-framework/reference/6.1core.html#core-convert).
- [Annotation-based mapping](elasticsearch/object-mapping.md#elasticsearch.mapping.meta-model.annotations) metadata that is extensible to support other metadata formats.
- Java-based [query, criteria, and update DSLs](elasticsearch/template.md#cassandra.template.query).
- Automatic implementation of [imperative and reactive `Repository` interfaces](repositories.md) including support for [custom query methods](repositories/custom-implementations.md).

For most data-oriented tasks, you can use the `[Reactive]ElasticsearchTemplate` or the `Repository` support, both of which use the rich object-mapping functionality.
Spring Data Elasticsearch uses consistent naming conventions on objects in various APIs to those found in the DataStax Java Driver so that they are familiar and so that you can map your existing knowledge onto the Spring APIs.
