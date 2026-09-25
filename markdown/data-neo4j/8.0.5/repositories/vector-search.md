---
title: "Neo4j Vector Search"
source: "ROOT:repositories/vector-search.adoc"
---

<a id="sdn-vector-search"></a>

# Neo4j Vector Search

<a id="_the_vectorsearch_annotation"></a>

## The `@VectorSearch` annotation

Spring Data Neo4j supports Neo4j’s vector search on the repository level by using the `@VectorSearch` annotation.
For this to work, Neo4j needs to have a vector index in place.
How to create a vector index is explained in the [Neo4j documentation](https://neo4j.com/docs/cypher-manual/current/indexes/search-performance-indexes/managing-indexes/).

> [!NOTE]
> It’s not required to have any (Spring Data) Vector typed property be defined in the domain entities for this to work
> because the search operates exclusively on the index.

The `@VectorSearch` annotation requires two arguments:
The name of the vector index to be used and the number of nearest neighbours.

For a general vector search over the whole domain, it’s possible to use a derived finder method without any property.

```java
interface VectorSearchRepository extends Neo4jRepository<EntityWithVector, String> {

    @VectorSearch(indexName = "entityIndex", numberOfNodes = 2)
    List<EntityWithVector> findBy(Vector searchVector);

}
```

The vector index can be combined with any property-based finder method to filter down the results.

> [!NOTE]
> For technical reasons, the vector search will always be executed before the property search gets invoked.
> E.g. if the property filter looks for a person named "Helge",
> but the vector search only yields "Hannes", there won’t be a result.

```java
interface VectorSearchRepository extends Neo4jRepository<EntityWithVector, String> {

    @VectorSearch(indexName = "entityIndex", numberOfNodes = 1)
    List<EntityWithVector> findByName(String name, Vector searchVector);

}
```
