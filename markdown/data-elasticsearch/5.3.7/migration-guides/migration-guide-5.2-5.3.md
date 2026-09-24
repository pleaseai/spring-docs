---
title: "Upgrading from 5.2.x to 5.3.x"
source: "ROOT:migration-guides/migration-guide-5.2-5.3.adoc"
---

<a id="elasticsearch-migration-guide-5.2-5.3"></a>

# Upgrading from 5.2.x to 5.3.x

This section describes breaking changes from version 5.2.x to 5.3.x and how removed features can be replaced by new introduced features.

<a id="elasticsearch-migration-guide-5.2-5.3.breaking-changes"></a>

## Breaking Changes

During the parameter replacement in `@Query` annotated repository methods previous versions wrote the String *"null"* into the query that was sent to Elasticsearch
when the actual parameter value was `null`. As Elasticsearch does not store `null` values, this behaviour could lead to problems, for example whent the fields to be
searched contains the string `"null"`. In Version 5.3 a `null` value in a parameter will cause a `ConversionException` to be thrown. If you are using `"null"` as the
`null_value` defined in a field mapping, then pass that string into the query instead of a Java `null`.

<a id="elasticsearch-migration-guide-5.2-5.3.deprecations"></a>

## Deprecations

<a id="_removals"></a>

### Removals

The deprecated classes `org.springframework.data.elasticsearch.ELCQueries`
 and `org.springframework.data.elasticsearch.client.elc.QueryBuilders` have been removed, use `org.springframework.data.elasticsearch.client.elc.Queries` instead.
