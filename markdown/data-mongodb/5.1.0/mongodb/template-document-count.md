---
title: "Counting Documents"
source: "ROOT:mongodb/template-document-count.adoc"
---

<a id="mongo.query.count"></a>

# Counting Documents

The template API offers various methods to count the number of documents matching a given criteria.
One of them outlined below.

```java
template.query(Person.class)
    .matching(query(where("firstname").is("luke")))
    .count();
```

In pre-3.x versions of SpringData MongoDB the count operation used MongoDBs internal collection statistics.
With the introduction of [MongoDB Transactions](client-session-transactions.md#mongo.transactions) this was no longer possible because statistics would not correctly reflect potential changes during a transaction requiring an aggregation-based count approach.
So in version 2.x `MongoOperations.count()` would use the collection statistics if no transaction was in progress, and the aggregation variant if so.

As of Spring Data MongoDB 3.x any `count` operation uses regardless the existence of filter criteria the aggregation-based count approach via MongoDBs `countDocuments`.
If the application is fine with the limitations of working upon collection statistics `MongoOperations.estimatedCount()` offers an alternative.

> [!TIP]
> By setting `MongoTemplate#useEstimatedCount(…​)` to `true` *MongoTemplate#count(…​)* operations, that use an empty filter query, will be delegated to `estimatedCount`, as long as there is no transaction active and the template is not bound to a [session](client-session-transactions.md).
> It will still be possible to obtain exact numbers via `MongoTemplate#exactCount`, but may speed up things.

> [!NOTE]
> MongoDBs native `countDocuments` method and the `$match` aggregation, do not support `$near` and `$nearSphere` but require `$geoWithin` along with `$center` or `$centerSphere` which does not support `$minDistance` (see [jira.mongodb.org/browse/SERVER-37043](https://jira.mongodb.org/browse/SERVER-37043)).
>
> Therefore a given `Query` will be rewritten for `count` operations using `Reactive`-/`MongoTemplate` to bypass the issue like shown below.
>
> ```javascript
> { location : { $near : [-73.99171, 40.738868], $maxDistance : 1.1 } } <1>
> { location : { $geoWithin : { $center: [ [-73.99171, 40.738868], 1.1] } } } <2>
>
> { location : { $near : [-73.99171, 40.738868], $minDistance : 0.1, $maxDistance : 1.1 } } <3>
> {$and :[ { $nor :[ { location :{ $geoWithin :{ $center :[ [-73.99171, 40.738868 ], 0.01] } } } ]}, { location :{ $geoWithin :{ $center :[ [-73.99171, 40.738868 ], 1.1] } } } ] } <4>
> ```
>
> 1. Count source query using `$near`.
> 1. Rewritten query now using `$geoWithin` with `$center`.
> 1. Count source query using `$near` with `$minDistance` and `$maxDistance`.
> 1. Rewritten query now a combination of `$nor` `$geowithin` critierias to work around unsupported `$minDistance`.
