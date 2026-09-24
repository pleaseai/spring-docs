---
title: "Upgrading from 4.0.x to 4.1.x"
source: "ROOT:migration-guides/migration-guide-4.0-4.1.adoc"
---

<a id="elasticsearch-migration-guide-4.0-4.1"></a>

# Upgrading from 4.0.x to 4.1.x

This section describes breaking changes from version 4.0.x to 4.1.x and how removed features can be replaced by new introduced features.

<a id="elasticsearch-migration-guide-4.0-4.1.deprecations"></a>

## Deprecations

It is possible to define a property of en entity as the id property by naming it either `id` or  `document`.
This behaviour is now deprecated and will produce a warning.
Please use the `@Id` annotation to mark a property as being the id property.

In the `ReactiveElasticsearchClient.Indices` interface the `updateMapping` methods are deprecated in favour of the `putMapping` methods.
They do the same, but `putMapping` is consistent with the naming in the Elasticsearch API:

In the `IndexOperations` interface the methods `addAlias(AliasQuery)`, `removeAlias(AliasQuery)` and `queryForAlias()` have been deprecated.
The new methods `alias(AliasAction)`, `getAliases(String…​)` and `getAliasesForIndex(String…​)` offer more functionality and a cleaner API.

Usage of a parent-id has been removed from Elasticsearch since version 6. We now deprecate the corresponding fields and methods.

<a id="elasticsearch-migration-guide-4.0-4.1.removal"></a>

## Removals

The *type mappings* parameters of the `@Document` annotation and the `IndexCoordinates` object were removed.
They had been deprecated in Spring Data Elasticsearch 4.0 and their values weren’t used anymore.

<a id="elasticsearch-migration-guide-4.0-4.1.breaking-changes"></a>

## Breaking Changes

<a id="elasticsearch-migration-guide-4.0-4.1.breaking-changes.returntypes-1"></a>

### Return types of ReactiveElasticsearchClient.Indices methods

The methods in the `ReactiveElasticsearchClient.Indices` were not used up to now.
With the introduction of the `ReactiveIndexOperations` it became necessary to change some of the return types:

- the `createIndex`  variants now return a `Mono<Boolean>` instead of a `Mono<Void>` to signal successful index creation.
- the `updateMapping`  variants now return a `Mono<Boolean>` instead of a `Mono<Void>` to signal successful mappings storage.

<a id="elasticsearch-migration-guide-4.0-4.1.breaking-changes.returntypes-2"></a>

### Return types of DocumentOperations.bulkIndex methods

These methods were returning a `List<String>` containing the ids of the new indexed records.
Now they return a `List<IndexedObjectInformation>`; these objects contain the id and information about optimistic locking (seq\_no and primary\_term)
