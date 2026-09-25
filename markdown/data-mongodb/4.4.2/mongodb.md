---
title: "MongoDB Support"
source: "ROOT:mongodb.adoc"
---

<a id="mongodb.core"></a>

# MongoDB Support

Spring Data support for MongoDB contains a wide range of features:

- [Spring configuration support](mongodb/template-config.md) with Java-based `@Configuration` classes or an XML namespace for a Mongo driver instance and replica sets.
- [`MongoTemplate` helper class](mongodb/template-api.md) that increases productivity when performing common Mongo operations.
Includes integrated object mapping between documents and POJOs.
- [Exception translation](mongodb/template-api.md#mongo-template.exception-translation) into Spring’s portable Data Access Exception hierarchy.
- Feature-rich [Object Mapping](mongodb/mapping/mapping.md) integrated with Spring’s Conversion Service.
- [Annotation-based mapping metadata](mongodb/mapping/mapping.md#mapping-usage-annotations) that is extensible to support other metadata formats.
- [Persistence and mapping lifecycle events](mongodb/lifecycle-events.md).
- [Java-based Query, Criteria, and Update DSLs](mongodb/template-query-operations.md).
- Automatic implementation of [Repository interfaces](repositories.md), including support for custom query methods.
- [QueryDSL integration](mongodb/repositories/repositories.md#mongodb.repositories.queries.type-safe) to support type-safe queries.
- [Multi-Document Transactions](mongodb/client-session-transactions.md).
- [GeoSpatial integration](mongodb/template-query-operations.md#mongo.geo-json).

For most tasks, you should use `MongoTemplate` or the Repository support, which both leverage the rich mapping functionality.
`MongoTemplate` is the place to look for accessing functionality such as incrementing counters or ad-hoc CRUD operations.
`MongoTemplate` also provides callback methods so that it is easy for you to get the low-level API artifacts, such as `com.mongodb.client.MongoDatabase`, to communicate directly with MongoDB.
The goal with naming conventions on various API artifacts is to copy those in the base MongoDB Java driver so you can easily map your existing knowledge onto the Spring APIs.
