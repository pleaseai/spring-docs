---
title: "What’s new"
source: "ROOT:elasticsearch/elasticsearch-new.adoc"
---

<a id="new-features"></a>

# What’s new

<a id="new-features.6-1-1"></a>

## New in Spring Data Elasticsearch 6.1.1

- Upgrade to Elasticsearch 9.4.5

<a id="new-features.6-1-0"></a>

## New in Spring Data Elasticsearch 6.1

- Upgrade to Elasticsearch 9.4.2
- Add support to use `IndexCoordinates` as repository query parameter
- Add support for includeNamedQueriesScore in Query
- Add support for Micrometer observation.

<a id="new-features.6-0-0"></a>

## New in Spring Data Elasticsearch 6.0

- Upgrade to Spring 7
- Switch to jspecify nullability annotations
- Upgrade to Elasticsearch 9.2.1
- Use the new Elasticsearch Rest5Client as default
- Add support for SpEL expressions in the `settingPath` parameter of the `@Setting` annotation

<a id="new-features.5-5-0"></a>

## New in Spring Data Elasticsearch 5.5

- Upgrade to Elasticsearch 8.18.1.
- Add support for the `@SearchTemplateQuery` annotation on repository methods.
- Scripted field properties of type collection can be populated from scripts returning arrays.

<a id="new-features.5-4-0"></a>

## New in Spring Data Elasticsearch 5.4

- Upgrade to Elasticsearch 8.15.3.
- Allow to customize the mapped type name for `@InnerField` and `@Field` annotations.
- Support for Elasticsearch SQL.
- Add support for retrieving request executionDuration.

<a id="new-features.5-3-0"></a>

## New in Spring Data Elasticsearch 5.3

- Upgrade to Elasticsearch 8.13.2.
- Add support for highlight queries in highlighting.
- Add shard statistics to the `SearchHit` class.
- Add support for multi search template API.
- Add support for SpEL in @Query.
- Add support for field aliases in the index mapping.
- Add support for has\_child and has\_parent queries.

<a id="new-features.5-2-0"></a>

## New in Spring Data Elasticsearch 5.2

- Upgrade to Elasticsearch 8.11.1
- The `JsonpMapper` for Elasticsearch is now configurable and provided as bean.
- Improved AOT runtime hints for Elasticsearch client library classes.
- Add Kotlin extensions and repository coroutine support.
- Introducing `VersionConflictException` class thrown in case thatElasticsearch reports an 409 error with a version conflict.
- Enable MultiField annotation on property getter
- Support nested sort option
- Improved scripted und runtime field support
- Improved refresh policy support

<a id="new-features.5-1-0"></a>

## New in Spring Data Elasticsearch 5.1

- Upgrade to Elasticsearch 8.7.1
- Allow specification of the TLS certificate when connecting to an Elasticsearch 8 cluster

<a id="new-features.5-0-0"></a>

## New in Spring Data Elasticsearch 5.0

- Upgrade to Java 17 baseline
- Upgrade to Spring Framework 6
- Upgrade to Elasticsearch 8.5.0
- Use the new Elasticsearch client library

<a id="new-features.4-4-0"></a>

## New in Spring Data Elasticsearch 4.4

- Introduction of new imperative and reactive clients using the classes from the new Elasticsearch Java client
- Upgrade to Elasticsearch 7.17.3.

<a id="new-features.4-3-0"></a>

## New in Spring Data Elasticsearch 4.3

- Upgrade to Elasticsearch 7.15.2.
- Allow runtime\_fields to be defined in the index mapping.
- Add native support for range field types by using a range object.
- Add repository search for nullable or empty properties.
- Enable custom converters for single fields.
- Supply a custom `Sort.Order` providing Elasticsearch specific parameters.

<a id="new-features.4-2-0"></a>

## New in Spring Data Elasticsearch 4.2

- Upgrade to Elasticsearch 7.10.0.
- Support for custom routing values

<a id="new-features.4-1-0"></a>

## New in Spring Data Elasticsearch 4.1

- Uses Spring 5.3.
- Upgrade to Elasticsearch 7.9.3.
- Improved API for alias management.
- Introduction of `ReactiveIndexOperations` for index management.
- Index templates support.
- Support for Geo-shape data with GeoJson.

<a id="new-features.4-0-0"></a>

## New in Spring Data Elasticsearch 4.0

- Uses Spring 5.2.
- Upgrade to Elasticsearch 7.6.2.
- Deprecation of `TransportClient` usage.
- Implements most of the mapping-types available for the index mappings.
- Removal of the Jackson `ObjectMapper`, now using the [MappingElasticsearchConverter](object-mapping.md#elasticsearch.mapping.meta-model)
- Cleanup of the API in the `*Operations` interfaces, grouping and renaming methods so that they match the Elasticsearch API, deprecating the old methods, aligning with other Spring Data modules.
- Introduction of `SearchHit<T>` class to represent a found document together with the relevant result metadata for this document (i.e. *sortValues*).
- Introduction of the `SearchHits<T>` class to represent a whole search result together with the metadata for the complete search result (i.e. *max\_score*).
- Introduction of `SearchPage<T>` class to represent a paged result containing a `SearchHits<T>` instance.
- Introduction of the `GeoDistanceOrder` class to be able to create sorting by geographical distance
- Implementation of Auditing Support
- Implementation of lifecycle entity callbacks

<a id="new-features.3-2-0"></a>

## New in Spring Data Elasticsearch 3.2

- Secured Elasticsearch cluster support with Basic Authentication and SSL transport.
- Upgrade to Elasticsearch 6.8.1.
- Reactive programming support with [Reactive Elasticsearch Repositories](repositories/reactive-elasticsearch-repositories.md) and xref:.
- Introduction of the [ElasticsearchEntityMapper](object-mapping.md#elasticsearch.mapping.meta-model) as an alternative to the Jackson `ObjectMapper`.
- Field name customization in `@Field`.
- Support for Delete by Query.
