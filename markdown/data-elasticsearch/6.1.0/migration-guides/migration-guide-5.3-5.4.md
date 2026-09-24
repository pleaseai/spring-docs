---
title: "Upgrading from 5.3.x to 5.4.x"
source: "ROOT:migration-guides/migration-guide-5.3-5.4.adoc"
---

<a id="elasticsearch-migration-guide-5.3-5.4"></a>

# Upgrading from 5.3.x to 5.4.x

This section describes breaking changes from version 5.3.x to 5.4.x and how removed features can be replaced by new introduced features.

<a id="elasticsearch-migration-guide-5.3-5.4.breaking-changes"></a>

## Breaking Changes

<a id="elasticsearch-migration-guide-5.3-5.4.breaking-changes.knn-search"></a>

### knn search

The `withKnnQuery` method in `NativeQueryBuilder` has been replaced with `withKnnSearches` to build a `NativeQuery` with knn search.

`KnnQuery` and `KnnSearch` are two different classes in elasticsearch java client and are used for different queries, with different parameters supported:

- `KnnSearch`: is [the top level `knn` query](https://www.elastic.co/guide/en/elasticsearch/reference/8.13/search-search.html#search-api-knn) in the elasticsearch request;
- `KnnQuery`: is [the `knn` query inside `query` clause](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-knn-query.html);

If `KnnQuery` is still preferable, please be sure to construct it inside `query` clause manually, by means of `withQuery(co.elastic.clients.elasticsearch._types.query_dsl.Query query)` clause in `NativeQueryBuilder`.

<a id="elasticsearch-migration-guide-5.3-5.4.deprecations"></a>

## Deprecations

<a id="_removals"></a>

### Removals
