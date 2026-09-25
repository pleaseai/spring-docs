---
title: "Collations"
source: "ROOT:mongodb/collation.adoc"
---

<a id="mongo.collation"></a>

# Collations

Since version 3.4, MongoDB supports collations for collection and index creation and various query operations.
Collations define string comparison rules based on the [ICU collations](http://userguide.icu-project.org/collation/concepts).
A collation document consists of various properties that are encapsulated in `Collation`, as the following listing shows:

```java
Collation collation = Collation.of("fr")         <1>

  .strength(ComparisonLevel.secondary()          <2>
    .includeCase())

  .numericOrderingEnabled()                      <3>

  .alternate(Alternate.shifted().punct())        <4>

  .forwardDiacriticSort()                        <5>

  .normalizationEnabled();                       <6>
```

1. `Collation` requires a locale for creation. This can be either a string representation of the locale, a `Locale` (considering language, country, and variant) or a `CollationLocale`. The locale is mandatory for creation.
1. Collation strength defines comparison levels that denote differences between characters. You can configure various options (case-sensitivity, case-ordering, and others), depending on the selected strength.
1. Specify whether to compare numeric strings as numbers or as strings.
1. Specify whether the collation should consider whitespace and punctuation as base characters for purposes of comparison.
1. Specify whether strings with diacritics sort from back of the string, such as with some French dictionary ordering.
1. Specify whether to check whether text requires normalization and whether to perform normalization.

Collations can be used to create collections and indexes. If you create a collection that specifies a collation, the
collation is applied to index creation and queries unless you specify a different collation. A collation is valid for a
whole operation and cannot be specified on a per-field basis.

Like other metadata, collations can be be derived from the domain type via the `collation` attribute of the `@Document`
annotation and will be applied directly when running queries, creating collections or indexes.

> [!NOTE]
> Annotated collations will not be used when a collection is auto created by MongoDB on first interaction. This would
> require additional store interaction delaying the entire process. Please use `MongoOperations.createCollection` for those cases.

```java
Collation french = Collation.of("fr");
Collation german = Collation.of("de");

template.createCollection(Person.class, CollectionOptions.just(collation));

template.indexOps(Person.class).ensureIndex(new Index("name", Direction.ASC).collation(german));
```

> [!NOTE]
> MongoDB uses simple binary comparison if no collation is specified (`Collation.simple()`).

Using collations with collection operations is a matter of specifying a `Collation` instance in your query or operation options, as the following two examples show:

```java
Collation collation = Collation.of("de");

Query query = new Query(Criteria.where("firstName").is("Amél")).collation(collation);

List<Person> results = template.find(query, Person.class);
```

```java
Collation collation = Collation.of("de");

AggregationOptions options = AggregationOptions.builder().collation(collation).build();

Aggregation aggregation = newAggregation(
  project("tags"),
  unwind("tags"),
  group("tags")
    .count().as("count")
).withOptions(options);

AggregationResults<TagCount> results = template.aggregate(aggregation, "tags", TagCount.class);
```

> [!WARNING]
> Indexes are only used if the collation used for the operation matches the index collation.

[MongoDB Repositories](repositories/repositories.md) support `Collations` via the `collation` attribute of the `@Query` annotation.
