---
title: "Namespace reference"
source: "ROOT:repositories/namespace-reference.adoc"
---

<a id="namespace-reference"></a>

# Namespace reference

<a id="populator.namespace-dao-config"></a>

## The `<repositories />` Element

The `<repositories />` element triggers the setup of the Spring Data repository infrastructure. The most important attribute is `base-package`, which defines the package to scan for Spring Data repository interfaces. See “[XML Configuration](create-instances.md#repositories.create-instances.xml)”. The following table describes the attributes of the `<repositories />` element:

| Name | Description |
| --- | --- |
| `base-package` | Defines the package to be scanned for repository interfaces that extend `*Repository` (the actual interface is determined by the specific Spring Data module) in auto-detection mode. All packages below the configured package are scanned, too. Wildcards are allowed. |
| `repository-impl-postfix` | Defines the postfix to autodetect custom repository implementations. Classes whose names end with the configured postfix are considered as candidates. Defaults to `Impl`. |
| `query-lookup-strategy` | Determines the strategy to be used to create finder queries. See “[Query Lookup Strategies](query-methods-details.md#repositories.query-methods.query-lookup-strategies)” for details. Defaults to `create-if-not-found`. |
| `named-queries-location` | Defines the location to search for a Properties file containing externally defined queries. |
| `consider-nested-repositories` | Whether nested repository interface definitions should be considered. Defaults to `false`. |
