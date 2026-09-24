---
title: "Couchbase Support"
source: "ROOT:couchbase.adoc"
---

<a id="couchbase.core"></a>

# Couchbase Support

Spring Data support for Couchbase contains a wide range of features:

- Spring configuration support with [Java-based `@Configuration` classes](couchbase/configuration.md).
- The [`CouchbaseTemplate` and `ReactiveCouchbaseTemplate`](couchbase/template.md) helper classes that provide object mapping between Couchbase collections and POJOs.
- [Exception translation](couchbase/template.md#exception-translation) into Spring’s portable [data-access.html#dao-exceptions](https://docs.spring.io/spring-framework/reference/7.0/data-access/dao.html#dao-exceptions)\[Data Access Exception Hierarchy\].
- Feature rich object mapping integrated with *Spring’s* [Conversion Service](https://docs.spring.io/spring-framework/reference/7.0/core/validation/convert.html).
- Annotation-based mapping metadata that is extensible to support other metadata formats.
- Automatic implementation of [imperative and reactive `Repository` interfaces](repositories.md) including support for [custom query methods](repositories/custom-implementations.md).

For most data-oriented tasks, you can use the `[Reactive]CouchbaseTemplate` or the `Repository` support, both of which use the rich object-mapping functionality.
Spring Data Couchbase uses consistent naming conventions on objects in various APIs to those found in the Couchbase Java SDK so that they are familiar and so that you can map your existing knowledge onto the Spring APIs.
