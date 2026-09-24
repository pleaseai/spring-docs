---
title: "Miscellaneous Elasticsearch Operation Support"
source: "ROOT:elasticsearch/misc.adoc"
---

<a id="elasticsearch.misc"></a>

# Miscellaneous Elasticsearch Operation Support

This chapter covers additional support for Elasticsearch operations that cannot be directly accessed via the repository interface.
It is recommended to add those operations as custom implementation as described in [repositories/custom-implementations.adoc](../repositories/custom-implementations.md) .

<a id="elasticsearc.misc.index.settings"></a>

## Index settings

When creating Elasticsearch indices with Spring Data Elasticsearch different index settings can be defined by using the `@Setting` annotation.
The following arguments are available:

- `useServerConfiguration` does not send any settings parameters, so the Elasticsearch server configuration determines them.
- `settingPath` refers to a JSON file defining the settings that must be resolvable in the classpath
- `shards` the number of shards to use, defaults to *1*
- `replicas` the number of replicas, defaults to *1*
- `refreshIntervall`, defaults to *"1s"*
- `indexStoreType`, defaults to *"fs"*

It is as well possible to define [index sorting](https://www.elastic.co/guide/en/elasticsearch/reference/7.11/index-modules-index-sorting.html) (check the linked Elasticsearch documentation for the possible field types and values):

```java
@Document(indexName = "entities")
@Setting(
  sortFields = { "secondField", "firstField" },                                  <.>
  sortModes = { Setting.SortMode.max, Setting.SortMode.min },                    <.>
  sortOrders = { Setting.SortOrder.desc, Setting.SortOrder.asc },
  sortMissingValues = { Setting.SortMissing._last, Setting.SortMissing._first })
class Entity {
    @Nullable
    @Id private String id;

    @Nullable
    @Field(name = "first_field", type = FieldType.Keyword)
    private String firstField;

    @Nullable @Field(name = "second_field", type = FieldType.Keyword)
    private String secondField;

    // getter and setter...
}
```

1. when defining sort fields, use the name of the Java property (*firstField*), not the name that might be defined for Elasticsearch (*first\_field*)
1. `sortModes`, `sortOrders` and `sortMissingValues` are optional, but if they are set, the number of entries must match the number of `sortFields` elements

<a id="elasticsearch.misc.mappings"></a>

## Index Mapping

When Spring Data Elasticsearch creates the index mapping with the `IndexOperations.createMapping()` methods, it uses the annotations described in [Mapping Annotation Overview](object-mapping.md#elasticsearch.mapping.meta-model.annotations), especially the `@Field` annotation.
In addition to that it is possible to add the `@Mapping` annotation to a class.
This annotation has the following properties:

- `mappingPath` a classpath resource in JSON format; if this is not empty it is used as the mapping, no other mapping processing is done.
- `enabled`  when set to false, this flag is written to the mapping and no further processing is done.
- `dateDetection` and `numericDetection` set the corresponding properties in the mapping when not set to `DEFAULT`.
- `dynamicDateFormats` when this String array is not empty, it defines the date formats used for automatic date detection.
- `runtimeFieldsPath` a classpath resource in JSON format containing the definition of runtime fields which is written to the index mappings, for example:

```json
{
  "day_of_week": {
    "type": "keyword",
    "script": {
      "source": "emit(doc['@timestamp'].value.dayOfWeekEnum.getDisplayName(TextStyle.FULL, Locale.ROOT))"
    }
  }
}
```

<a id="elasticsearch.misc.filter"></a>

## Filter Builder

Filter Builder improves query speed.

```java
private ElasticsearchOperations operations;

IndexCoordinates index = IndexCoordinates.of("sample-index");

Query query = NativeQuery.builder()
	.withQuery(q -> q
		.matchAll(ma -> ma))
	.withFilter( q -> q
		.bool(b -> b
			.must(m -> m
				.term(t -> t
					.field("id")
					.value(documentId))
			)))
	.build();

SearchHits<SampleEntity> sampleEntities = operations.search(query, SampleEntity.class, index);
```

<a id="elasticsearch.scroll"></a>

## Using Scroll For Big Result Set

Elasticsearch has a scroll API for getting big result set in chunks.
This is internally used by Spring Data Elasticsearch to provide the implementations of the `<T> SearchHitsIterator<T> SearchOperations.searchForStream(Query query, Class<T> clazz, IndexCoordinates index)` method.

```java
IndexCoordinates index = IndexCoordinates.of("sample-index");

Query searchQuery = NativeQuery.builder()
    .withQuery(q -> q
        .matchAll(ma -> ma))
    .withFields("message")
    .withPageable(PageRequest.of(0, 10))
    .build();

SearchHitsIterator<SampleEntity> stream = elasticsearchOperations.searchForStream(searchQuery, SampleEntity.class,
index);

List<SampleEntity> sampleEntities = new ArrayList<>();
while (stream.hasNext()) {
  sampleEntities.add(stream.next());
}

stream.close();
```

There are no methods in the `SearchOperations` API to access the scroll id, if it should be necessary to access this, the following methods of the `AbstractElasticsearchTemplate` can be used (this is the base implementation for the different `ElasticsearchOperations` implementations):

```java
@Autowired ElasticsearchOperations operations;

AbstractElasticsearchTemplate template = (AbstractElasticsearchTemplate)operations;

IndexCoordinates index = IndexCoordinates.of("sample-index");

Query query = NativeQuery.builder()
    .withQuery(q -> q
        .matchAll(ma -> ma))
    .withFields("message")
    .withPageable(PageRequest.of(0, 10))
    .build();

SearchScrollHits<SampleEntity> scroll = template.searchScrollStart(1000, query, SampleEntity.class, index);

String scrollId = scroll.getScrollId();
List<SampleEntity> sampleEntities = new ArrayList<>();
while (scroll.hasSearchHits()) {
  sampleEntities.addAll(scroll.getSearchHits());
  scrollId = scroll.getScrollId();
  scroll = template.searchScrollContinue(scrollId, 1000, SampleEntity.class);
}
template.searchScrollClear(scrollId);
```

To use the Scroll API with repository methods, the return type must defined as `Stream` in the Elasticsearch Repository.
The implementation of the method will then use the scroll methods from the ElasticsearchTemplate.

```java
interface SampleEntityRepository extends Repository<SampleEntity, String> {

    Stream<SampleEntity> findBy();

}
```

<a id="elasticsearch.misc.sorts"></a>

## Sort options

In addition to the default sort options described in [Paging and Sorting](../repositories/query-methods-details.md#repositories.paging-and-sorting), Spring Data Elasticsearch provides the class `org.springframework.data.elasticsearch.core.query.Order` which derives from `org.springframework.data.domain.Sort.Order`.
It offers additional parameters that can be sent to Elasticsearch when specifying the sorting of the result (see [www.elastic.co/guide/en/elasticsearch/reference/7.15/sort-search-results.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.15/sort-search-results.html)).

There also is the  `org.springframework.data.elasticsearch.core.query.GeoDistanceOrder` class which can be used to have the result of a search operation ordered by geographical distance.

If the class to be retrieved has a `GeoPoint` property named *location*, the following `Sort` would sort the results by distance to the given point:

```java
Sort.by(new GeoDistanceOrder("location", new GeoPoint(48.137154, 11.5761247)))
```

<a id="elasticsearch.misc.runtime-fields"></a>

## Runtime Fields

From version 7.12 on Elasticsearch has added the feature of runtime fields ([www.elastic.co/guide/en/elasticsearch/reference/7.12/runtime.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.12/runtime.html)).
Spring Data Elasticsearch supports this in two ways:

<a id="elasticsearch.misc.runtime-fields.index-mappings"></a>

### Runtime field definitions in the index mappings

The first way to define runtime fields is by adding the definitions to the index mappings (see [www.elastic.co/guide/en/elasticsearch/reference/7.12/runtime-mapping-fields.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.12/runtime-mapping-fields.html)).
To use this approach in Spring Data Elasticsearch the user must provide a JSON file that contains the corresponding definition, for example:

```json
{
  "day_of_week": {
    "type": "keyword",
    "script": {
      "source": "emit(doc['@timestamp'].value.dayOfWeekEnum.getDisplayName(TextStyle.FULL, Locale.ROOT))"
    }
  }
}
```

The path to this JSON file, which must be present on the classpath, must then be set in the `@Mapping` annotation of the entity:

```java
@Document(indexName = "runtime-fields")
@Mapping(runtimeFieldsPath = "/runtime-fields.json")
public class RuntimeFieldEntity {
	// properties, getter, setter,...
}

```

<a id="elasticsearch.misc.runtime-fields.query"></a>

### Runtime fields definitions set on a Query

The second way to define runtime fields is by adding the definitions to a search query (see [www.elastic.co/guide/en/elasticsearch/reference/7.12/runtime-search-request.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.12/runtime-search-request.html)).
The following code example shows how to do this with Spring Data Elasticsearch :

The entity used is a simple object that has a `price` property:

```java
@Document(indexName = "some_index_name")
public class SomethingToBuy {

	private @Id @Nullable String id;
	@Nullable @Field(type = FieldType.Text) private String description;
	@Nullable @Field(type = FieldType.Double) private Double price;

	// getter and setter
}

```

The following query uses a runtime field that calculates a `priceWithTax` value by adding 19% to the price and uses this value in the search query to find all entities where `priceWithTax` is higher or equal than a given value:

```java
RuntimeField runtimeField = new RuntimeField("priceWithTax", "double", "emit(doc['price'].value * 1.19)");
Query query = new CriteriaQuery(new Criteria("priceWithTax").greaterThanEqual(16.5));
query.addRuntimeField(runtimeField);

SearchHits<SomethingToBuy> searchHits = operations.search(query, SomethingToBuy.class);
```

This works with every implementation of the `Query` interface.

<a id="elasticsearch.misc.point-in-time"></a>

## Point In Time (PIT) API

`ElasticsearchOperations` supports the point in time API of Elasticsearch (see [www.elastic.co/guide/en/elasticsearch/reference/8.3/point-in-time-api.html](https://www.elastic.co/guide/en/elasticsearch/reference/8.3/point-in-time-api.html)).
The following code snippet shows how to use this feature with a fictional `Person` class:

```java
ElasticsearchOperations operations; // autowired
Duration tenSeconds = Duration.ofSeconds(10);

String pit = operations.openPointInTime(IndexCoordinates.of("person"), tenSeconds); <.>

// create query for the pit
Query query1 = new CriteriaQueryBuilder(Criteria.where("lastName").is("Smith"))
    .withPointInTime(new Query.PointInTime(pit, tenSeconds))                        <.>
    .build();
SearchHits<Person> searchHits1 = operations.search(query1, Person.class);
// do something with the data

// create 2nd query for the pit, use the id returned in the previous result
Query query2 = new CriteriaQueryBuilder(Criteria.where("lastName").is("Miller"))
    .withPointInTime(
        new Query.PointInTime(searchHits1.getPointInTimeId(), tenSeconds))          <.>
    .build();
SearchHits<Person> searchHits2 = operations.search(query2, Person.class);
// do something with the data

operations.closePointInTime(searchHits2.getPointInTimeId());                        <.>

```

1. create a point in time for an index (can be multiple names) and a keep-alive duration and retrieve its id
1. pass that id into the query to search together with the next keep-alive value
1. for the next query, use the id returned from the previous search
1. when done, close the point in time using the last returned id

<a id="elasticsearch.misc.searchtemplates"></a>

## Search Template support

Use of the search template API is supported.
To use this, it first is necessary to create a stored script.
The `ElasticsearchOperations` interface extends `ScriptOperations` which provides the necessary functions.
The example used here assumes that we have `Person` entity with a property named `firstName`.
A search template script can be saved like this:

```java
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.script.Script;

operations.putScript(                            <.>
  Script.builder()
    .withId("person-firstname")                  <.>
    .withLanguage("mustache")                    <.>
    .withSource("""                              <.>
      {
        "query": {
          "bool": {
            "must": [
              {
                "match": {
                  "firstName": "{{firstName}}"   <.>
                }
              }
            ]
          }
        },
        "from": "{{from}}",                      <.>
        "size": "{{size}}"                       <.>
      }
      """)
    .build()
);
```

1. Use the `putScript()` method to store a search template script
1. The name / id of the script
1. Scripts that are used in search templates must be in the *mustache* language.
1. The script source
1. The search parameter in the script
1. Paging request offset
1. Paging request size

To use a search template in a search query, Spring Data Elasticsearch provides the `SearchTemplateQuery`, an implementation of the `org.springframework.data.elasticsearch.core.query.Query` interface.

In the following code, we will add a call using a search template query to a custom repository implementation (see
[repositories/custom-implementations.adoc](../repositories/custom-implementations.md)) as an example how this can be integrated into a repository call.

We first define the custom repository fragment interface:

```java
interface PersonCustomRepository {
	SearchPage<Person> findByFirstNameWithSearchTemplate(String firstName, Pageable pageable);
}
```

The implementation of this repository fragment looks like this:

```java
public class PersonCustomRepositoryImpl implements PersonCustomRepository {

  private final ElasticsearchOperations operations;

  public PersonCustomRepositoryImpl(ElasticsearchOperations operations) {
    this.operations = operations;
  }

  @Override
  public SearchPage<Person> findByFirstNameWithSearchTemplate(String firstName, Pageable pageable) {

    var query = SearchTemplateQuery.builder()                               <.>
      .withId("person-firstname")                                           <.>
      .withParams(
        Map.of(                                                             <.>
          "firstName", firstName,
          "from", pageable.getOffset(),
          "size", pageable.getPageSize()
          )
      )
      .build();

    SearchHits<Person> searchHits = operations.search(query, Person.class); <.>

    return SearchHitSupport.searchPageFor(searchHits, pageable);
  }
}
```

1. Create a `SearchTemplateQuery`
1. Provide the id of the search template
1. The parameters are passed in a `Map<String,Object>`
1. Do the search in the same way as with the other query types.

<a id="elasticsearch.misc.nested-sort"></a>

## Nested sort

Spring Data Elasticsearch supports sorting within nested objects ([www.elastic.co/guide/en/elasticsearch/reference/8.9/sort-search-results.html#nested-sorting](https://www.elastic.co/guide/en/elasticsearch/reference/8.9/sort-search-results.html#nested-sorting))

The following example, taken from the `org.springframework.data.elasticsearch.core.query.sort.NestedSortIntegrationTests` class, shows how to define the nested sort.

```java
var filter = StringQuery.builder("""
	{ "term": {"movies.actors.sex": "m"} }
	""").build();
var order = new org.springframework.data.elasticsearch.core.query.Order(Sort.Direction.DESC,
	"movies.actors.yearOfBirth")
	.withNested(
		Nested.builder("movies")
			.withNested(
				Nested.builder("movies.actors")
					.withFilter(filter)
					.build())
			.build());

var query = Query.findAll().addSort(Sort.by(order));

```

About the filter query: It is not possible to use a `CriteriaQuery` here, as this query would be converted into a Elasticsearch nested query which does not work in the filter context. So only `StringQuery` or `NativeQuery` can be used here. When using one of these, like the term query above, the Elasticsearch field names must be used, so take care, when these are redefined with the `@Field(name="…​")` definition.

For the definition of the order path and the nested paths, the Java entity property names should be used.
