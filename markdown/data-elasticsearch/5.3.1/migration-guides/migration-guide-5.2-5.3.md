---
title: "Upgrading from 5.2.x to 5.3.x"
source: "ROOT:migration-guides/migration-guide-5.2-5.3.adoc"
---

<a id="elasticsearch-migration-guide-5.2-5.3"></a>

# Upgrading from 5.2.x to 5.3.x

This section describes breaking changes from version 5.2.x to 5.3.x and how removed features can be replaced by new introduced features.

<a id="elasticsearch-migration-guide-5.2-5.3.breaking-changes"></a>

## Breaking Changes

<a id="elasticsearch-migration-guide-5.2-5.3.deprecations"></a>

## Deprecations

<a id="_removals"></a>

### Removals

The deprecated classes `org.springframework.data.elasticsearch.ELCQueries`
 and `org.springframework.data.elasticsearch.client.elc.QueryBuilders` have been removed, use `org.springframework.data.elasticsearch.client.elc.Queries` instead.
