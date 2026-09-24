---
title: "Query methods"
source: "ROOT:elasticsearch/repositories/elasticsearch-repository-queries.adoc"
---

<a id="elasticsearch.query-methods"></a>

# Query methods

<a id="elasticsearch.query-methods.finders"></a>

## Query lookup strategies

The Elasticsearch module supports all basic query building feature as string queries, native search queries, criteria based queries or have it being derived from the method name.

<a id="elasticsearch.query-methods.finders.declared"></a>

### Declared queries

Deriving the query from the method name is not always sufficient and/or may result in unreadable method names.
In this case one might make use of the `@Query` annotation (see [Using @Query Annotation](#elasticsearch.query-methods.at-query) ).

<a id="elasticsearch.query-methods.criterions"></a>

## Query creation

Generally the query creation mechanism for Elasticsearch works as described in [repositories/query-methods-details.adoc](../../repositories/query-methods-details.md).
Here’s a short example of what a Elasticsearch query method translates into:

```java
interface BookRepository extends Repository<Book, String> {
  List<Book> findByNameAndPrice(String name, Integer price);
}
```

The method name above will be translated into the following Elasticsearch json query

```
{
    "query": {
        "bool" : {
            "must" : [
                { "query_string" : { "query" : "?", "fields" : [ "name" ] } },
                { "query_string" : { "query" : "?", "fields" : [ "price" ] } }
            ]
        }
    }
}
```

A list of supported keywords for Elasticsearch is shown below.

| Keyword | Sample | Elasticsearch Query String |
| --- | --- | --- |
| `And` | `findByNameAndPrice` | `{ "query" : { "bool" : { "must" : [ { "query_string" : { "query" : "?", "fields" : [ "name" ] } }, { "query_string" : { "query" : "?", "fields" : [ "price" ] } } ] } }}` |
| `Or` | `findByNameOrPrice` | `{ "query" : { "bool" : { "should" : [ { "query_string" : { "query" : "?", "fields" : [ "name" ] } }, { "query_string" : { "query" : "?", "fields" : [ "price" ] } } ] } }}` |
| `Is` | `findByName` | `{ "query" : { "bool" : { "must" : [ { "query_string" : { "query" : "?", "fields" : [ "name" ] } } ] } }}` |
| `Not` | `findByNameNot` | `{ "query" : { "bool" : { "must_not" : [ { "query_string" : { "query" : "?", "fields" : [ "name" ] } } ] } }}` |
| `Between` | `findByPriceBetween` | `{ "query" : { "bool" : { "must" : [ {"range" : {"price" : {"from" : ?, "to" : ?, "include_lower" : true, "include_upper" : true } } } ] } }}` |
| `LessThan` | `findByPriceLessThan` | `{ "query" : { "bool" : { "must" : [ {"range" : {"price" : {"from" : null, "to" : ?, "include_lower" : true, "include_upper" : false } } } ] } }}` |
| `LessThanEqual` | `findByPriceLessThanEqual` | `{ "query" : { "bool" : { "must" : [ {"range" : {"price" : {"from" : null, "to" : ?, "include_lower" : true, "include_upper" : true } } } ] } }}` |
| `GreaterThan` | `findByPriceGreaterThan` | `{ "query" : { "bool" : { "must" : [ {"range" : {"price" : {"from" : ?, "to" : null, "include_lower" : false, "include_upper" : true } } } ] } }}` |
| `GreaterThanEqual` | `findByPriceGreaterThanEqual` | `{ "query" : { "bool" : { "must" : [ {"range" : {"price" : {"from" : ?, "to" : null, "include_lower" : true, "include_upper" : true } } } ] } }}` |
| `Before` | `findByPriceBefore` | `{ "query" : { "bool" : { "must" : [ {"range" : {"price" : {"from" : null, "to" : ?, "include_lower" : true, "include_upper" : true } } } ] } }}` |
| `After` | `findByPriceAfter` | `{ "query" : { "bool" : { "must" : [ {"range" : {"price" : {"from" : ?, "to" : null, "include_lower" : true, "include_upper" : true } } } ] } }}` |
| `Like` | `findByNameLike` | `{ "query" : { "bool" : { "must" : [ { "query_string" : { "query" : "?*", "fields" : [ "name" ] }, "analyze_wildcard": true } ] } }}` |
| `StartingWith` | `findByNameStartingWith` | `{ "query" : { "bool" : { "must" : [ { "query_string" : { "query" : "?*", "fields" : [ "name" ] }, "analyze_wildcard": true } ] } }}` |
| `EndingWith` | `findByNameEndingWith` | `{ "query" : { "bool" : { "must" : [ { "query_string" : { "query" : "*?", "fields" : [ "name" ] }, "analyze_wildcard": true } ] } }}` |
| `Contains/Containing` | `findByNameContaining` | `{ "query" : { "bool" : { "must" : [ { "query_string" : { "query" : "*?*", "fields" : [ "name" ] }, "analyze_wildcard": true } ] } }}` |
| `In` (when annotated as FieldType.Keyword) | `findByNameIn(Collection<String>names)` | `{ "query" : { "bool" : { "must" : [ {"bool" : {"must" : [ {"terms" : {"name" : ["?","?"]}} ] } } ] } }}` |
| `In` | `findByNameIn(Collection<String>names)` | `{ "query": {"bool": {"must": [{"query_string":{"query": "\"?\" \"?\"", "fields": ["name"]}}]}}}` |
| `NotIn`  (when annotated as FieldType.Keyword) | `findByNameNotIn(Collection<String>names)` | `{ "query" : { "bool" : { "must" : [ {"bool" : {"must_not" : [ {"terms" : {"name" : ["?","?"]}} ] } } ] } }}` |
| `NotIn` | `findByNameNotIn(Collection<String>names)` | `{"query": {"bool": {"must": [{"query_string": {"query": "NOT(\"?\" \"?\")", "fields": ["name"]}}]}}}` |
| `True` | `findByAvailableTrue` | `{ "query" : { "bool" : { "must" : [ { "query_string" : { "query" : "true", "fields" : [ "available" ] } } ] } }}` |
| `False` | `findByAvailableFalse` | `{ "query" : { "bool" : { "must" : [ { "query_string" : { "query" : "false", "fields" : [ "available" ] } } ] } }}` |
| `OrderBy` | `findByAvailableTrueOrderByNameDesc` | `{ "query" : { "bool" : { "must" : [ { "query_string" : { "query" : "true", "fields" : [ "available" ] } } ] } }, "sort":[{"name":{"order":"desc"}}] }` |
| `Exists` | `findByNameExists` | `{"query":{"bool":{"must":[{"exists":{"field":"name"}}]}}}` |
| `IsNull` | `findByNameIsNull` | `{"query":{"bool":{"must_not":[{"exists":{"field":"name"}}]}}}` |
| `IsNotNull` | `findByNameIsNotNull` | `{"query":{"bool":{"must":[{"exists":{"field":"name"}}]}}}` |
| `IsEmpty` | `findByNameIsEmpty` | `{"query":{"bool":{"must":[{"bool":{"must":[{"exists":{"field":"name"}}],"must_not":[{"wildcard":{"name":{"wildcard":"*"}}}]}}]}}}` |
| `IsNotEmpty` | `findByNameIsNotEmpty` | `{"query":{"bool":{"must":[{"wildcard":{"name":{"wildcard":"*"}}}]}}}` |

> [!NOTE]
> Methods names to build Geo-shape queries taking `GeoJson` parameters are not supported.
> Use `ElasticsearchOperations` with `CriteriaQuery` in a custom repository implementation if you need to have such a function in a repository.

<a id="elasticsearch.query-methods.return-types"></a>

## Method return types

Repository methods can be defined to have the following return types for returning multiple Elements:

- `List<T>`
- `Stream<T>`
- `SearchHits<T>`
- `List<SearchHit<T>>`
- `Stream<SearchHit<T>>`
- `SearchPage<T>`

<a id="elasticsearch.query-methods.at-query"></a>

## Using @Query Annotation

The arguments passed to the method can be inserted into placeholders in the query string. the placeholders are of the form `?0`, `?1`, `?2` etc. for the first, second, third parameter and so on.

```java
interface BookRepository extends ElasticsearchRepository<Book, String> {
    @Query("{\"match\": {\"name\": {\"query\": \"?0\"}}}")
    Page<Book> findByName(String name,Pageable pageable);
}
```

The String that is set as the annotation argument must be a valid Elasticsearch JSON query.
It will be sent to Easticsearch as value of the query element; if for example the function is called with the parameter *John*, it would produce the following query body:

```json
{
  "query": {
    "match": {
      "name": {
        "query": "John"
      }
    }
  }
}
```

A repository method such as

```java
@Query("{\"ids\": {\"values\": ?0 }}")
List<SampleEntity> getByIds(Collection<String> ids);
```

would make an [IDs query](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-ids-query.html) to return all the matching documents. So calling the method with a `List` of `["id1", "id2", "id3"]` would produce the query body

```json
{
  "query": {
    "ids": {
      "values": ["id1", "id2", "id3"]
    }
  }
}
```
