---
title: "R2DBC"
source: "ROOT:r2dbc.adoc"
---

<a id="r2dbc.repositories"></a>

# R2DBC

The Spring Data R2DBC module applies core Spring concepts to the development of solutions that use R2DBC database drivers aligned with [Domain-driven design principles](jdbc/domain-driven-design.md).
We provide a “template” as a high-level abstraction for storing and querying aggregates.

This document is the reference guide for Spring Data R2DBC support.
It explains the concepts and semantics and syntax.

This chapter points out the specialties for repository support for JDBC.
This builds on the core repository support explained in [Working with Spring Data Repositories](repositories/introduction.md).
You should have a sound understanding of the basic concepts explained there.

R2DBC contains a wide range of features:

- Spring configuration support with [Java-based `@Configuration`](r2dbc/getting-started.md#r2dbc.connectionfactory) classes for an R2DBC driver instance.
- [`R2dbcEntityTemplate`](r2dbc/entity-persistence.md) as central class for entity-bound operations that increases productivity when performing common R2DBC operations with integrated object mapping between rows and POJOs.
- Feature-rich [object mapping](r2dbc/mapping.md) integrated with Spring’s Conversion Service.
- [Annotation-based mapping metadata](r2dbc/mapping.md#mapping.usage.annotations) that is extensible to support other metadata formats.
- [Automatic implementation of Repository interfaces](r2dbc/repositories.md), including support for [custom query methods](repositories/custom-implementations.md).

For most tasks, you should use `R2dbcEntityTemplate` or the repository support, which both use the rich mapping functionality.
`R2dbcEntityTemplate` is the place to look for accessing functionality such as ad-hoc CRUD operations.
