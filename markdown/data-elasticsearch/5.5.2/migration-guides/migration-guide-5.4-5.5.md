---
title: "Upgrading from 5.4.x to 5.5.x"
source: "ROOT:migration-guides/migration-guide-5.4-5.5.adoc"
---

<a id="elasticsearch-migration-guide-5.4-5.5"></a>

# Upgrading from 5.4.x to 5.5.x

This section describes breaking changes from version 5.4.x to 5.5.x and how removed features can be replaced by new introduced features.

<a id="elasticsearch-migration-guide-5.4-5.5.breaking-changes"></a>

## Breaking Changes

<a id="elasticsearch-migration-guide-5.4-5.5.deprecations"></a>

## Deprecations

Some classes that probably are not used by a library user have been renamed, the classes with the old names are still there, but are deprecated:

| old name | new name |
| --- | --- |
| ElasticsearchPartQuery | RepositoryPartQuery |
| ElasticsearchStringQuery | RepositoryStringQuery |
| ReactiveElasticsearchStringQuery | ReactiveRepositoryStringQuery |

<a id="_removals"></a>

### Removals

The following methods that had been deprecated since release 5.3 have been removed:

```
DocumentOperations.delete(Query, Class<?>)
DocumentOperations.delete(Query, Class<?>, IndexCoordinates)
ReactiveDocumentOperations.delete(Query, Class<?>)
ReactiveDocumentOperations.delete(Query, Class<?>, IndexCoordinates)
```
