---
title: "Migration Guide from 3.x to 4.x"
source: "ROOT:migration-guide/migration-guide-3.0-to-4.0.adoc"
---

<a id="cassandra.migration.3.x-to-4.x"></a>

# Migration Guide from 3.x to 4.x

Spring Data for Apache Cassandra 4.0 introduces a set of breaking changes when upgrading from earlier versions.

<a id="asynchronous-template-api"></a>

## Asynchronous Template API

With the deprecation of `ListenableFuture`, `AsyncCqlOperations` and `AsyncCassandraOperations` and their dependant classes were migrated to `CompletableFuture`.
If your application heavily depends on `ListenableFuture` and you cannot easily migrate to `CompletableFuture` then we suggest switching to the legacy `Async…Operations` types in the `legacy` subpackage.
That is `org.springframework.data.cassandra.core.cql.legacy` for `AsyncCqlOperations` and `org.springframework.data.cassandra.core.legacy` for `AsyncCassandraOperations`.
