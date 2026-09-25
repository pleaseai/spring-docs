---
title: "MongoDB-specific Query Methods"
source: "ROOT:mongodb/repositories/query-methods.adoc"
---

<a id="mongodb.repositories.queries"></a>

# MongoDB-specific Query Methods

Most of the data access operations you usually trigger on a repository result in a query being executed against the MongoDB databases.
Defining such a query is a matter of declaring a method on the repository interface, as the following example shows:

#### Imperative

```java
public interface PersonRepository extends PagingAndSortingRepository<Person, String> {

    List<Person> findByLastname(String lastname);                      <1>

    Page<Person> findByFirstname(String firstname, Pageable pageable); <2>

    Person findByShippingAddresses(Address address);                   <3>

    Person findFirstByLastname(String lastname);                       <4>

    Stream<Person> findAllBy();                                        <5>
}
```

1. The `findByLastname` method shows a query for all people with the given last name.
The query is derived by parsing the method name for constraints that can be concatenated with `And` and `Or`.
Thus, the method name results in a query expression of `{"lastname" : lastname}`.
1. Applies pagination to a query.
You can equip your method signature with a `Pageable` parameter and let the method return a `Page` instance and Spring Data automatically pages the query accordingly.
1. Shows that you can query based on properties that are not primitive types.
Throws `IncorrectResultSizeDataAccessException` if more than one match is found.
1. Uses the `First` keyword to restrict the query to only the first result.
Unlike <3>, this method does not throw an exception if more than one match is found.
1. Uses a Java 8 `Stream` that reads and converts individual elements while iterating the stream.

#### Reactive

```java
public interface ReactivePersonRepository extends ReactiveSortingRepository<Person, String> {

    Flux<Person> findByFirstname(String firstname);                                   <1>

    Flux<Person> findByFirstname(Publisher<String> firstname);                        <2>

    Flux<Person> findByFirstnameOrderByLastname(String firstname, Pageable pageable); <3>

    Mono<Person> findByFirstnameAndLastname(String firstname, String lastname);       <4>

    Mono<Person> findFirstByLastname(String lastname);                                <5>
}
```

1. The method shows a query for all people with the given `lastname`. The query is derived by parsing the method name for constraints that can be concatenated with `And` and `Or`. Thus, the method name results in a query expression of `{"lastname" : lastname}`.
1. The method shows a query for all people with the given `firstname` once the `firstname` is emitted by the given `Publisher`.
1. Use `Pageable` to pass offset and sorting parameters to the database.
1. Find a single entity for the given criteria. It completes with `IncorrectResultSizeDataAccessException` on non-unique results.
1. Unless <4>, the first entity is always emitted even if the query yields more result documents.

> [!WARNING]
> The `Page` return type (as in `Mono<Page>`) is not supported by reactive repositories.

It is possible to use `Pageable` in derived finder methods, to pass on `sort`, `limit` and `offset` parameters to the query to reduce load and network traffic.
The returned `Flux` will only emit data within the declared range.

```java
Pageable page = PageRequest.of(1, 10, Sort.by("lastname"));
Flux<Person> persons = repository.findByFirstnameOrderByLastname("luke", page);
```

> [!NOTE]
> We do not support referring to parameters that are mapped as `DBRef` in the domain class.

| Keyword | Sample | Logical result |
| --- | --- | --- |
| `After` | `findByBirthdateAfter(Date date)` | `{"birthdate" : {"$gt" : date}}` |
| `GreaterThan` | `findByAgeGreaterThan(int age)` | `{"age" : {"$gt" : age}}` |
| `GreaterThanEqual` | `findByAgeGreaterThanEqual(int age)` | `{"age" : {"$gte" : age}}` |
| `Before` | `findByBirthdateBefore(Date date)` | `{"birthdate" : {"$lt" : date}}` |
| `LessThan` | `findByAgeLessThan(int age)` | `{"age" : {"$lt" : age}}` |
| `LessThanEqual` | `findByAgeLessThanEqual(int age)` | `{"age" : {"$lte" : age}}` |
| `Between` | `findByAgeBetween(int from, int to)` `findByAgeBetween(Range<Integer> range)` | `{"age" : {"$gt" : from, "$lt" : to}}` lower / upper bounds (`$gt` / `$gte` & `$lt` / `$lte`) according to `Range` |
| `In` | `findByAgeIn(Collection ages)` | `{"age" : {"$in" : [ages…​]}}` |
| `NotIn` | `findByAgeNotIn(Collection ages)` | `{"age" : {"$nin" : [ages…​]}}` |
| `IsNotNull`, `NotNull` | `findByFirstnameNotNull()` | `{"firstname" : {"$ne" : null}}` |
| `IsNull`, `Null` | `findByFirstnameNull()` | `{"firstname" : null}` |
| `Like`, `StartingWith`, `EndingWith` | `findByFirstnameLike(String name)` | `{"firstname" : name} (name as regex)` |
| `NotLike`, `IsNotLike` | `findByFirstnameNotLike(String name)` | `{"firstname" : { "$not" : name }} (name as regex)` |
| `Containing` on String | `findByFirstnameContaining(String name)` | `{"firstname" : name} (name as regex)` |
| `NotContaining` on String | `findByFirstnameNotContaining(String name)` | `{"firstname" : { "$not" : name}} (name as regex)` |
| `Containing` on Collection | `findByAddressesContaining(Address address)` | `{"addresses" : { "$in" : address}}` |
| `NotContaining` on Collection | `findByAddressesNotContaining(Address address)` | `{"addresses" : { "$not" : { "$in" : address}}}` |
| `Regex` | `findByFirstnameRegex(String firstname)` | `{"firstname" : {"$regex" : firstname }}` |
| `(No keyword)` | `findByFirstname(String name)` | `{"firstname" : name}` |
| `Not` | `findByFirstnameNot(String name)` | `{"firstname" : {"$ne" : name}}` |
| `Near` | `findByLocationNear(Point point)` | `{"location" : {"$near" : [x,y]}}` |
| `Near` | `findByLocationNear(Point point, Distance max)` | `{"location" : {"$near" : [x,y], "$maxDistance" : max}}` |
| `Near` | `findByLocationNear(Point point, Distance min, Distance max)` | `{"location" : {"$near" : [x,y], "$minDistance" : min, "$maxDistance" : max}}` |
| `Within` | `findByLocationWithin(Circle circle)` | `{"location" : {"$geoWithin" : {"$center" : [ [x, y], distance]}}}` |
| `Within` | `findByLocationWithin(Box box)` | `{"location" : {"$geoWithin" : {"$box" : [ [x1, y1], x2, y2]}}}` |
| `IsTrue`, `True` | `findByActiveIsTrue()` | `{"active" : true}` |
| `IsFalse`,  `False` | `findByActiveIsFalse()` | `{"active" : false}` |
| `Exists` | `findByLocationExists(boolean exists)` | `{"location" : {"$exists" : exists }}` |
| `IgnoreCase` | `findByUsernameIgnoreCase(String username)` | `{"username" : {"$regex" : "^username$", "$options" : "i" }}` |

> [!NOTE]
> If the property criterion compares a document, the order of the fields and exact equality in the document matters.

> [!NOTE]
> In some scenarios, you might require additional options, such as a maximum run time, additional log comments, or the permission to temporarily write data to disk.
> Use the `@Meta` annotation to set those options via `maxExecutionTimeMs`, `comment` or `allowDiskUse`. `@Meta` can only be used on repository query methods, not on base interface or fragment interface methods.

<a id="mongodb.repositories.queries.geo-spatial"></a>

## Geo-spatial Queries

As you saw in the preceding table of keywords, a few keywords trigger geo-spatial operations within a MongoDB query.
The `Near` keyword allows some further modification, as the next few examples show.

The following example shows how to define a `near` query that finds all persons with a given distance of a given point:

#### Imperative

```java
public interface PersonRepository extends MongoRepository<Person, String> {

    // { 'location' : { '$near' : [point.x, point.y], '$maxDistance' : distance}}
    List<Person> findByLocationNear(Point location, Distance distance);
}
```

#### Reactive

```java
interface PersonRepository extends ReactiveMongoRepository<Person, String> {

    // { 'location' : { '$near' : [point.x, point.y], '$maxDistance' : distance}}
    Flux<Person> findByLocationNear(Point location, Distance distance);
}
```

Adding a `Distance` parameter to the query method allows restricting results to those within the given distance.
If the `Distance` was set up containing a `Metric`, we transparently use `$nearSphere` instead of `$code`, as the following example shows:

```java
Point point = new Point(43.7, 48.8);
Distance distance = new Distance(200, Metrics.KILOMETERS);
… = repository.findByLocationNear(point, distance);
// {'location' : {'$nearSphere' : [43.7, 48.8], '$maxDistance' : 0.03135711885774796}}
```

> [!NOTE]
> Reactive Geo-spatial repository queries support the domain type and `GeoResult<T>` results within a reactive wrapper type. `GeoPage` and `GeoResults` are not supported as they contradict the deferred result approach with pre-calculating the average distance. However, you can still pass in a `Pageable` argument to page results yourself.

Using a `Distance` with a `Metric` causes a `$nearSphere` (instead of a plain `$near`) clause to be added.
Beyond that, the actual distance gets calculated according to the `Metrics` used.

(Note that `Metric` does not refer to metric units of measure.
It could be miles rather than kilometers.
Rather, `metric` refers to the concept of a system of measurement, regardless of which system you use.)

> [!NOTE]
> Using `@GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)` on the target property forces usage of the `$nearSphere` operator.

#### Imperative

```java
public interface PersonRepository extends MongoRepository<Person, String> {

    // {'geoNear' : 'location', 'near' : [x, y] }
    GeoResults<Person> findByLocationNear(Point location);

    // No metric: {'geoNear' : 'person', 'near' : [x, y], maxDistance : distance }
    // Metric: {'geoNear' : 'person', 'near' : [x, y], 'maxDistance' : distance,
    //          'distanceMultiplier' : metric.multiplier, 'spherical' : true }
    GeoResults<Person> findByLocationNear(Point location, Distance distance);

    // Metric: {'geoNear' : 'person', 'near' : [x, y], 'minDistance' : min,
    //          'maxDistance' : max, 'distanceMultiplier' : metric.multiplier,
    //          'spherical' : true }
    GeoResults<Person> findByLocationNear(Point location, Distance min, Distance max);

    // {'geoNear' : 'location', 'near' : [x, y] }
    GeoResults<Person> findByLocationNear(Point location);
}
```

#### Reactive

```java
interface PersonRepository extends ReactiveMongoRepository<Person, String>  {

    // {'geoNear' : 'location', 'near' : [x, y] }
    Flux<GeoResult<Person>> findByLocationNear(Point location);

    // No metric: {'geoNear' : 'person', 'near' : [x, y], maxDistance : distance }
    // Metric: {'geoNear' : 'person', 'near' : [x, y], 'maxDistance' : distance,
    //          'distanceMultiplier' : metric.multiplier, 'spherical' : true }
    Flux<GeoResult<Person>> findByLocationNear(Point location, Distance distance);

    // Metric: {'geoNear' : 'person', 'near' : [x, y], 'minDistance' : min,
    //          'maxDistance' : max, 'distanceMultiplier' : metric.multiplier,
    //          'spherical' : true }
    Flux<GeoResult<Person>> findByLocationNear(Point location, Distance min, Distance max);

    // {'geoNear' : 'location', 'near' : [x, y] }
    Flux<GeoResult<Person>> findByLocationNear(Point location);
}
```

<a id="mongodb.repositories.queries.json-based"></a>

## JSON-based Query Methods and Field Restriction

By adding the `org.springframework.data.mongodb.repository.Query` annotation to your repository query methods, you can specify a MongoDB JSON query string to use instead of having the query be derived from the method name, as the following example shows:

#### Imperative

```java
public interface PersonRepository extends MongoRepository<Person, String> {

    @Query("{ 'firstname' : ?0 }")
    List<Person> findByThePersonsFirstname(String firstname);

}
```

#### Reactive

```java
public interface PersonRepository extends ReactiveMongoRepository<Person, String> {

    @Query("{ 'firstname' : ?0 }")
    Flux<Person> findByThePersonsFirstname(String firstname);

}
```

The `?0` placeholder lets you substitute the value from the method arguments into the JSON query string.

> [!NOTE]
> `String` parameter values are escaped during the binding process, which means that it is not possible to add MongoDB specific operators through the argument.

You can also use the filter property to restrict the set of properties that is mapped into the Java object, as the following example shows:

#### Imperative

```java
public interface PersonRepository extends MongoRepository<Person, String> {

    @Query(value="{ 'firstname' : ?0 }", fields="{ 'firstname' : 1, 'lastname' : 1}")
    List<Person> findByThePersonsFirstname(String firstname);

}
```

#### Reactive

```java
public interface PersonRepository extends ReactiveMongoRepository<Person, String> {

    @Query(value="{ 'firstname' : ?0 }", fields="{ 'firstname' : 1, 'lastname' : 1}")
    Flux<Person> findByThePersonsFirstname(String firstname);

}
```

The query in the preceding example returns only the `firstname`, `lastname` and `Id` properties of the `Person` objects.
The `age` property, a `java.lang.Integer`, is not set and its value is therefore null.

<a id="mongodb.repositories.queries.json-spel"></a>

## JSON-based Queries with SpEL Expressions

Query strings and field definitions can be used together with SpEL expressions to create dynamic queries at runtime.
SpEL expressions can provide predicate values and can be used to extend predicates with subdocuments.

Expressions expose method arguments through an array that contains all the arguments.
The following query uses `[0]`
to declare the predicate value for `lastname` (which is equivalent to the `?0` parameter binding):

#### Imperative

```java
public interface PersonRepository extends MongoRepository<Person, String> {

    @Query("{'lastname': ?#{[0]} }")
    List<Person> findByQueryWithExpression(String param0);
}
```

#### Reactive

```java
public interface PersonRepository extends ReactiveMongoRepository<Person, String> {

    @Query("{'lastname': ?#{[0]} }")
    Flux<Person> findByQueryWithExpression(String param0);
}
```

Expressions can be used to invoke functions, evaluate conditionals, and construct values.
SpEL expressions used in conjunction with JSON reveal a side effect, because Map-like declarations inside of SpEL read like JSON, as the following example shows:

#### Imperative

```java
public interface PersonRepository extends MongoRepository<Person, String> {

    @Query("{'id': ?#{ [0] ? {$exists :true} : [1] }}")
    List<Person> findByQueryWithExpressionAndNestedObject(boolean param0, String param1);
}
```

#### Reactive

```java
public interface PersonRepository extends ReactiveMongoRepository<Person, String> {

    @Query("{'id': ?#{ [0] ? {$exists :true} : [1] }}")
    Flux<Person> findByQueryWithExpressionAndNestedObject(boolean param0, String param1);
}
```

> [!WARNING]
> SpEL in query strings can be a powerful way to enhance queries.
> However, they can also accept a broad range of unwanted arguments.
> Make sure to sanitize strings before passing them to the query to avoid creation of vulnerabilities or unwanted changes to your query.

Expression support is extensible through the Query SPI: `EvaluationContextExtension` & `ReactiveEvaluationContextExtension`
The Query SPI can contribute properties and functions and can customize the root object.
Extensions are retrieved from the application context at the time of SpEL evaluation when the query is built.
The following example shows how to use an evaluation context extension:

#### Imperative

```java
public class SampleEvaluationContextExtension extends EvaluationContextExtensionSupport {

    @Override
    public String getExtensionId() {
        return "security";
    }

    @Override
    public Map<String, Object> getProperties() {
        return Collections.singletonMap("principal", SecurityContextHolder.getCurrent().getPrincipal());
    }
}
```

#### Reactive

```java
public class SampleEvaluationContextExtension implements ReactiveEvaluationContextExtension {

    @Override
    public String getExtensionId() {
        return "security";
    }

    @Override
    public Mono<? extends EvaluationContextExtension> getExtension() {
        return Mono.just(new EvaluationContextExtensionSupport() { ... });
    }
}
```

> [!NOTE]
> Bootstrapping `MongoRepositoryFactory` yourself is not application context-aware and requires further configuration to pick up Query SPI extensions.

> [!NOTE]
> Reactive query methods can make use of `org.springframework.data.spel.spi.ReactiveEvaluationContextExtension`.

<a id="mongodb.repositories.queries.full-text"></a>

## Full-text Search Queries

MongoDB’s full-text search feature is store-specific and, therefore, can be found on `MongoRepository` rather than on the more general `CrudRepository`.
We need a document with a full-text index (see “[Text Indexes](../mapping/mapping.md#mapping-usage-indexes.text-index)” to learn how to create a full-text index).

Additional methods on `MongoRepository` take `TextCriteria` as an input parameter.
In addition to those explicit methods, it is also possible to add a `TextCriteria`-derived repository method.
The criteria are added as an additional `AND` criteria.
Once the entity contains a `@TextScore`-annotated property, the document’s full-text score can be retrieved.
Furthermore, the `@TextScore` annotated also makes it possible to sort by the document’s score, as the following example shows:

```java
@Document
class FullTextDocument {

  @Id String id;
  @TextIndexed String title;
  @TextIndexed String content;
  @TextScore Float score;
}

interface FullTextRepository extends Repository<FullTextDocument, String> {

  // Execute a full-text search and define sorting dynamically
  List<FullTextDocument> findAllBy(TextCriteria criteria, Sort sort);

  // Paginate over a full-text search result
  Page<FullTextDocument> findAllBy(TextCriteria criteria, Pageable pageable);

  // Combine a derived query with a full-text search
  List<FullTextDocument> findByTitleOrderByScoreDesc(String title, TextCriteria criteria);
}
Sort sort = Sort.by("score");
TextCriteria criteria = TextCriteria.forDefaultLanguage().matchingAny("spring", "data");
List<FullTextDocument> result = repository.findAllBy(criteria, sort);

criteria = TextCriteria.forDefaultLanguage().matching("film");
Page<FullTextDocument> page = repository.findAllBy(criteria, PageRequest.of(1, 1, sort));
List<FullTextDocument> result = repository.findByTitleOrderByScoreDesc("mongodb", criteria);
```

<a id="mongodb.repositories.queries.aggregation"></a>

## Aggregation Methods

The repository layer offers means to interact with [the aggregation framework](../aggregation-framework.md) via annotated repository query methods.
Similar to the [JSON based queries](repositories.md#mongodb.repositories.queries.json-based), you can define a pipeline using the `org.springframework.data.mongodb.repository.Aggregation` annotation.
The definition may contain simple placeholders like `?0` as well as [SpEL expressions](https://docs.spring.io/spring-framework/reference/6.2/core.html#expressions) `?#{ … }`.

```java
public interface PersonRepository extends CrudRepository<Person, String> {

  @Aggregation("{ $group: { _id : $lastname, names : { $addToSet : $firstname } } }")
  List<PersonAggregate> groupByLastnameAndFirstnames();                            <1>

  @Aggregation("{ $group: { _id : $lastname, names : { $addToSet : $firstname } } }")
  List<PersonAggregate> groupByLastnameAndFirstnames(Sort sort);                   <2>

  @Aggregation("{ $group: { _id : $lastname, names : { $addToSet : ?0 } } }")
  List<PersonAggregate> groupByLastnameAnd(String property);                       <3>

  @Aggregation("{ $group: { _id : $lastname, names : { $addToSet : ?0 } } }")
  Slice<PersonAggregate> groupByLastnameAnd(String property, Pageable page);       <4>

  @Aggregation("{ $group: { _id : $lastname, names : { $addToSet : $firstname } } }")
  Stream<PersonAggregate> groupByLastnameAndFirstnamesAsStream();                  <5>

  @Aggregation(pipeline = {
      "{ '$match' :  { 'lastname' :  '?0'} }",
      "{ '$project': { _id : 0, firstname : 1, lastname : 1 } }"
  })
  Stream<PersonAggregate> groupByLastnameAndFirstnamesAsStream();                  <6>

  @Aggregation("{ $group : { _id : null, total : { $sum : $age } } }")
  SumValue sumAgeUsingValueWrapper();                                              <7>

  @Aggregation("{ $group : { _id : null, total : { $sum : $age } } }")
  Long sumAge();                                                                   <8>

  @Aggregation("{ $group : { _id : null, total : { $sum : $age } } }")
  AggregationResults<SumValue> sumAgeRaw();                                        <9>

  @Aggregation("{ '$project': { '_id' : '$lastname' } }")
  List<String> findAllLastnames();                                                 <10>

  @Aggregation(pipeline = {
		  "{ $group : { _id : '$author', books: { $push: '$title' } } }",
		  "{ $out : 'authors' }"
  })
  void groupAndOutSkippingOutput();                                                <11>
}
```

```java
public class PersonAggregate {

  private @Id String lastname;                                                     <2>
  private List<String> names;

  public PersonAggregate(String lastname, List<String> names) {
     // ...
  }

  // Getter / Setter omitted
}

public class SumValue {

  private final Long total;                                                        <6> <8>

  public SumValue(Long total) {
    // ...
  }

  // Getter omitted
}

interface PersonProjection {
    String getFirstname();
    String getLastname();
}
```

1. Aggregation pipeline to group first names by `lastname` in the `Person` collection returning these as `PersonAggregate`.
1. If `Sort` argument is present, `$sort` is appended after the declared pipeline stages so that it only affects the order of the final results after having passed all other aggregation stages.
Therefore, the `Sort` properties are mapped against the methods return type `PersonAggregate` which turns `Sort.by("lastname")` into `{ $sort : { '_id', 1 } }` because `PersonAggregate.lastname` is annotated with `@Id`.
1. Replaces `?0` with the given value for `property` for a dynamic aggregation pipeline.
1. `$skip`, `$limit` and `$sort` can be passed on via a `Pageable` argument. Same as in <2>, the operators are appended to the pipeline definition. Methods accepting `Pageable` can return `Slice` for easier pagination.
1. Aggregation methods can return interface based projections wrapping the resulting `org.bson.Document` behind a proxy, exposing getters delegating to fields within the document.
1. Aggregation methods can return `Stream` to consume results directly from an underlying cursor. Make sure to close the stream after consuming it to release the server-side cursor by either calling `close()` or through `try-with-resources`.
1. Map the result of an aggregation returning a single `Document` to an instance of a desired `SumValue` target type.
1. Aggregations resulting in single document holding just an accumulation result like e.g. `$sum` can be extracted directly from the result `Document`.
To gain more control, you might consider `AggregationResult` as method return type as shown in <7>.
1. Obtain the raw `AggregationResults` mapped to the generic target wrapper type `SumValue` or `org.bson.Document`.
1. Like in <6>, a single value can be directly obtained from multiple result `Document`s.
1. Skips the output of the `$out` stage when return type is `void`.

In some scenarios, aggregations might require additional options, such as a maximum run time, additional log comments, or the permission to temporarily write data to disk.
Use the `@Meta` annotation to set those options via `maxExecutionTimeMs`, `comment` or `allowDiskUse`.

```java
interface PersonRepository extends CrudRepository<Person, String> {

  @Meta(allowDiskUse = true)
  @Aggregation("{ $group: { _id : $lastname, names : { $addToSet : $firstname } } }")
  List<PersonAggregate> groupByLastnameAndFirstnames();
}
```

Or use `@Meta` to create your own annotation as shown in the sample below.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ ElementType.METHOD })
@Meta(allowDiskUse = true)
@interface AllowDiskUse { }

interface PersonRepository extends CrudRepository<Person, String> {

  @AllowDiskUse
  @Aggregation("{ $group: { _id : $lastname, names : { $addToSet : $firstname } } }")
  List<PersonAggregate> groupByLastnameAndFirstnames();
}
```

> [!NOTE]
> Simple-type single-result inspects the returned `Document` and checks for the following:
>
> 1. Only one entry in the document, return it.
> 1. Two entries, one is the `_id` value. Return the other.
> 1. Return for the first value assignable to the return type.
> 1. Throw an exception if none of the above is applicable.

> [!WARNING]
> The `Page` return type is not supported for repository methods using `@Aggregation`. However, you can use a
> `Pageable` argument to add `$skip`, `$limit` and `$sort` to the pipeline and let the method return `Slice`.

<a id="query-by-example"></a>

## Query by Example

<a id="query-by-example.introduction"></a>

### Introduction

This chapter provides an introduction to Query by Example and explains how to use it.

Query by Example (QBE) is a user-friendly querying technique with a simple interface.
It allows dynamic query creation and does not require you to write queries that contain field names.
In fact, Query by Example does not require you to write queries by using store-specific query languages at all.

> [!NOTE]
> This chapter explains the core concepts of Query by Example.
> The information is pulled from the Spring Data Commons module.
> Depending on your database, String matching support can be limited.

<a id="query-by-example.usage"></a>

### Usage

The Query by Example API consists of four parts:

- Probe: The actual example of a domain object with populated fields.
- `ExampleMatcher`: The `ExampleMatcher` carries details on how to match particular fields.
It can be reused across multiple Examples.
- `Example`: An `Example` consists of the probe and the `ExampleMatcher`.
It is used to create the query.
- `FetchableFluentQuery`: A `FetchableFluentQuery` offers a fluent API, that allows further customization of a query derived from an `Example`.
Using the fluent API lets you specify ordering projection and result processing for your query.

Query by Example is well suited for several use cases:

- Querying your data store with a set of static or dynamic constraints.
- Frequent refactoring of the domain objects without worrying about breaking existing queries.
- Working independently of the underlying data store API.

Query by Example also has several limitations:

- No support for nested or grouped property constraints, such as `firstname = ?0 or (firstname = ?1 and lastname = ?2)`.
- Store-specific support on string matching.
Depending on your databases, String matching can support starts/contains/ends/regex for strings.
- Exact matching for other property types.

Before getting started with Query by Example, you need to have a domain object.
To get started, create an interface for your repository, as shown in the following example:

#### Sample Person object

```java
public class Person {

  @Id
  private String id;
  private String firstname;
  private String lastname;
  private Address address;

  // … getters and setters omitted
}
```

The preceding example shows a simple domain object.
You can use it to create an `Example`.
By default, fields having `null` values are ignored, and strings are matched by using the store specific defaults.

> [!NOTE]
> Inclusion of properties into a Query by Example criteria is based on nullability.
> Properties using primitive types (`int`, `double`, …) are always included unless  the [`ExampleMatcher` ignores the property path](#query-by-example.matchers).

Examples can be built by either using the `of` factory method or by using [`ExampleMatcher`](#query-by-example.matchers). `Example` is immutable.
The following listing shows a simple Example:

```java
Person person = new Person();                         <1>
person.setFirstname("Dave");                          <2>

Example<Person> example = Example.of(person);         <3>
```

1. Create a new instance of the domain object.
1. Set the properties to query.
1. Create the `Example`.

You can run the example queries by using repositories.
To do so, let your repository interface extend `QueryByExampleExecutor<T>`.
The following listing shows an excerpt from the `QueryByExampleExecutor` interface:

#### The `QueryByExampleExecutor`

```java
public interface QueryByExampleExecutor<T> {

  <S extends T> S findOne(Example<S> example);

  <S extends T> Iterable<S> findAll(Example<S> example);

  // … more functionality omitted.
}
```

<a id="query-by-example.matchers"></a>

### Example Matchers

Examples are not limited to default settings.
You can specify your own defaults for string matching, null handling, and property-specific settings by using the `ExampleMatcher`, as shown in the following example:

```java
Person person = new Person();                          <1>
person.setFirstname("Dave");                           <2>

ExampleMatcher matcher = ExampleMatcher.matching()     <3>
  .withIgnorePaths("lastname")                         <4>
  .withIncludeNullValues()                             <5>
  .withStringMatcher(StringMatcher.ENDING);            <6>

Example<Person> example = Example.of(person, matcher); <7>

```

1. Create a new instance of the domain object.
1. Set properties.
1. Create an `ExampleMatcher` to expect all values to match.
It is usable at this stage even without further configuration.
1. Construct a new `ExampleMatcher` to ignore the `lastname` property path.
1. Construct a new `ExampleMatcher` to ignore the `lastname` property path and to include null values.
1. Construct a new `ExampleMatcher` to ignore the `lastname` property path, to include null values, and to perform suffix string matching.
1. Create a new `Example` based on the domain object and the configured `ExampleMatcher`.

By default, the `ExampleMatcher` expects all values set on the probe to match.
If you want to get results matching any of the predicates defined implicitly, use `ExampleMatcher.matchingAny()`.

You can specify behavior for individual properties (such as "firstname" and "lastname" or, for nested properties, "address.city").
You can tune it with matching options and case sensitivity, as shown in the following example:

#### Configuring matcher options

```java
ExampleMatcher matcher = ExampleMatcher.matching()
  .withMatcher("firstname", endsWith())
  .withMatcher("lastname", startsWith().ignoreCase());
}
```

Another way to configure matcher options is to use lambdas (introduced in Java 8).
This approach creates a callback that asks the implementor to modify the matcher.
You need not return the matcher, because configuration options are held within the matcher instance.
The following example shows a matcher that uses lambdas:

#### Configuring matcher options with lambdas

```java
ExampleMatcher matcher = ExampleMatcher.matching()
  .withMatcher("firstname", match -> match.endsWith())
  .withMatcher("firstname", match -> match.startsWith());
}
```

Queries created by `Example` use a merged view of the configuration.
Default matching settings can be set at the `ExampleMatcher` level, while individual settings can be applied to particular property paths.
Settings that are set on `ExampleMatcher` are inherited by property path settings unless they are defined explicitly.
Settings on a property patch have higher precedence than default settings.
The following table describes the scope of the various `ExampleMatcher` settings:

| Setting | Scope |
| --- | --- |
| Null-handling | `ExampleMatcher` |
| String matching | `ExampleMatcher` and property path |
| Ignoring properties | Property path |
| Case sensitivity | `ExampleMatcher` and property path |
| Value transformation | Property path |

<a id="query-by-example.fluent"></a>

### Fluent API

`QueryByExampleExecutor` defines fluent query methods for flexible execution of queries based on `Example` instances through `findBy(Example<S> example, Function<FluentQuery.FetchableFluentQuery<S>, R> queryFunction)`.

As with other methods, it executes a query derived from a `Example`.
However, the query function allows you to take control over aspects of query execution that you cannot dynamically control otherwise.
You do so by invoking the various intermediate and terminal methods of `FetchableFluentQuery`.

**Intermediate methods**

- `sortBy`: Apply an ordering for your result.
Repeated method calls append each `Sort` (note that `page(Pageable)` using a sorted `Pageable` overrides any previous sort order).
- `limit`: Limit the result count.
- `as`: Specify the type to be read or projected to.
- `project`: Limit the queries properties.

**Terminal methods**

- `first`, `firstValue`: Return the first value. `first` returns an `Optional<T>` or `Optional.empty()` if the query did not yield any result. `firstValue` is its nullable variant without the need to use `Optional`.
- `one`, `oneValue`: Return the one value. `one` returns an `Optional<T>` or `Optional.empty()` if the query did not yield any result. `oneValue` is its nullable variant without the need to use `Optional`.
Throws `IncorrectResultSizeDataAccessException` if more than one match found.
- `all`: Return all results as a `List<T>`.
- `page(Pageable)`: Return all results as a `Page<T>`.
- `slice(Pageable)`: Return all results as a `Slice<T>`.
- `scroll(ScrollPosition)`: Use scrolling (offset, keyset) to retrieve results as a `Window<T>`.
- `stream()`: Return a `Stream<T>` to process results lazily.
The stream is stateful and must be closed after use.
- `count` and `exists`: Return the count of matching entities or whether any match exists.

> [!NOTE]
> Intermediate and terminal methods must be invoked within the query function.

```java
Page<CustomerProjection> page = repository.findBy(example,
    q -> q.as(CustomerProjection.class)
          .page(PageRequest.of(0, 20, Sort.by("lastname")))
);
```

```java
Optional<Customer> match = repository.findBy(example,
    q -> q.sortBy(Sort.by("lastname").descending())
          .first()
);
```

<a id="query-by-example.running"></a>

### Running an Example

The following example shows how to query by example when using a repository (of `Person` objects, in this case):

```java
public interface PersonRepository extends QueryByExampleExecutor<Person> {

}

public class PersonService {

  @Autowired PersonRepository personRepository;

  public List<Person> findPeople(Person probe) {
    return personRepository.findAll(Example.of(probe));
  }
}
```

<a id="repositories.scrolling"></a>

## Scrolling

Scrolling is a more fine-grained approach to iterate through larger results set chunks.
Scrolling consists of a stable sort, a scroll type (Offset- or Keyset-based scrolling) and result limiting.
You can define simple sorting expressions by using property names and define static result limiting using the [`Top` or `First` keyword](../../repositories/query-methods-details.md#repositories.limit-query-result) through query derivation.
You can concatenate expressions to collect multiple criteria into one expression.

Scroll queries return a `Window<T>` that allows obtaining the element’s scroll position to fetch the next `Window<T>` until your application has consumed the entire query result.
Similar to consuming a Java `Iterator<List<…>>` by obtaining the next batch of results, query result scrolling lets you access the a `ScrollPosition` through `Window.positionAt(…)`, as in the following example:

```java
Window<User> users = repository.findFirst10ByLastnameOrderByFirstname("Doe", ScrollPosition.offset());
do {

  for (User u : users) {
    // consume the user
  }

  if (users.isLast() || users.isEmpty()) {
    break;
  }

  // obtain the next Scroll
  users = repository.findFirst10ByLastnameOrderByFirstname("Doe", users.positionAt(users.size() - 1));
} while (!users.isEmpty());
```

> [!NOTE]
> The `ScrollPosition` identifies the exact position of an element with the entire query result.
> Query execution treats the position parameter *exclusive*, results will start *after* the given position.
> `ScrollPosition#offset()` and `ScrollPosition#keyset()` as special incarnations of a `ScrollPosition` indicating the start of a scroll operation.

> [!NOTE]
> The above example shows static sorting and limiting.
> You can define query methods alternatively that accept a `Sort` object define a more complex sorting order or sorting on a per-request basis.
> In a similar way, providing a `Limit` object allows you to define a dynamic limit on a per-request basis instead of applying a static limitation.
> Read more on dynamic sorting and limiting in the [Query Methods Details](../../repositories/query-methods-details.md#repositories.special-parameters).

Scrolling through consuming `Window` instances requires quite a few conditionals to reach optimum database round-trips and can quickly become a repetitive task that can be simplified using `WindowIterator`.

`WindowIterator` provides a utility to simplify scrolling across `Window`s by removing the need to check for the presence of a next `Window` and applying the `ScrollPosition`.

```java
WindowIterator<User> users = WindowIterator.of(position -> repository.findFirst10ByLastnameOrderByFirstname("Doe", position))
  .startingAt(ScrollPosition.offset());

while (users.hasNext()) {
  User u = users.next();
  // consume the user
}
```

<a id="repositories.scrolling.offset"></a>

### Scrolling using Offset

Offset scrolling uses similar to pagination, an Offset counter to skip a number of results and let the data source only return results beginning at the given Offset.
This simple mechanism avoids large results being sent to the client application.
However, most databases require materializing the full query result before your server can return the results.

```java
interface UserRepository extends Repository<User, Long> {

  Window<User> findFirst10ByLastnameOrderByFirstname(String lastname, OffsetScrollPosition position);
}

WindowIterator<User> users = WindowIterator.of(position -> repository.findFirst10ByLastnameOrderByFirstname("Doe", position))
  .startingAt(OffsetScrollPosition.initial()); <1>
```

1. Start with no offset to include the element at position `0`.

> [!CAUTION]
> There is a difference between `ScrollPosition.offset()` and `ScrollPosition.offset(0L)`.
> The former indicates the start of scroll operation, pointing to no specific offset whereas the latter identifies the first element (at position `0`) of the result.
> Given the *exclusive* nature of scrolling, using `ScrollPosition.offset(0)` skips the first element and translate to an offset of `1`.

<a id="repositories.scrolling.keyset"></a>

### Scrolling using Keyset-Filtering

Offset-based requires most databases require materializing the entire result before your server can return the results.
So while the client only sees the portion of the requested results, your server needs to build the full result, which causes additional load.

Keyset-Filtering approaches result subset retrieval by leveraging built-in capabilities of your database aiming to reduce the computation and I/O requirements for individual queries.
This approach maintains a set of keys to resume scrolling by passing keys into the query, effectively amending your filter criteria.

The core idea of Keyset-Filtering is to start retrieving results using a stable sorting order.
Once you want to scroll to the next chunk, you obtain a `ScrollPosition` that is used to reconstruct the position within the sorted result.
The `ScrollPosition` captures the keyset of the last entity within the current `Window`.
To run the query, reconstruction rewrites the criteria clause to include all sort fields and the primary key so that the database can leverage potential indexes to run the query.
The database needs only constructing a much smaller result from the given keyset position without the need to fully materialize a large result and then skipping results until reaching a particular offset.

> [!WARNING]
> Keyset-Filtering requires the keyset properties (those used for sorting) to be non-nullable.
> This limitation applies due to the store specific `null` value handling of comparison operators as well as the need to run queries against an indexed source.
> Keyset-Filtering on nullable properties will lead to unexpected results.

#### Using `KeysetScrollPosition` with Repository Query Methods

```java
interface UserRepository extends Repository<User, Long> {

  Window<User> findFirst10ByLastnameOrderByFirstname(String lastname, KeysetScrollPosition position);
}

WindowIterator<User> users = WindowIterator.of(position -> repository.findFirst10ByLastnameOrderByFirstname("Doe", position))
  .startingAt(ScrollPosition.keyset()); <1>
```

1. Start at the very beginning and do not apply additional filtering.

Keyset-Filtering works best when your database contains an index that matches the sort fields, hence a static sort works well.
Scroll queries applying Keyset-Filtering require to the properties used in the sort order to be returned by the query, and these must be mapped in the returned entity.

You can use interface and DTO projections, however make sure to include all properties that you’ve sorted by to avoid keyset extraction failures.

When specifying your `Sort` order, it is sufficient to include sort properties relevant to your query;
You do not need to ensure unique query results if you do not want to.
The keyset query mechanism amends your sort order by including the primary key (or any remainder of composite primary keys) to ensure each query result is unique.

<a id="mongodb.repositories.queries.sort"></a>

## Sorting Results

MongoDB repositories allow various approaches to define sorting order.
Let’s take a look at the following example:

#### Imperative

```java
public interface PersonRepository extends MongoRepository<Person, String> {

    List<Person> findByFirstnameSortByAgeDesc(String firstname); <1>

    List<Person> findByFirstname(String firstname, Sort sort);   <2>

    @Query(sort = "{ age : -1 }")
    List<Person> findByFirstname(String firstname);              <3>

    @Query(sort = "{ age : -1 }")
    List<Person> findByLastname(String lastname, Sort sort);     <4>
}
```

1. Static sorting derived from method name. `SortByAgeDesc` results in `{ age : -1 }` for the sort parameter.
1. Dynamic sorting using a method argument.
`Sort.by(DESC, "age")` creates `{ age : -1 }` for the sort parameter.
1. Static sorting via `Query` annotation.
Sort parameter applied as stated in the `sort` attribute.
1. Default sorting via `Query` annotation combined with dynamic one via a method argument. `Sort.unsorted()`
results in `{ age : -1 }`.
Using `Sort.by(ASC, "age")` overrides the defaults and creates `{ age : 1 }`.
`Sort.by
(ASC, "firstname")` alters the default and results in `{ age : -1, firstname : 1 }`.

#### Reactive

```java
public interface PersonRepository extends ReactiveMongoRepository<Person, String> {

    Flux<Person> findByFirstnameSortByAgeDesc(String firstname);

    Flux<Person> findByFirstname(String firstname, Sort sort);

    @Query(sort = "{ age : -1 }")
    Flux<Person> findByFirstname(String firstname);

    @Query(sort = "{ age : -1 }")
    Flux<Person> findByLastname(String lastname, Sort sort);
}
```

<a id="mongodb.repositories.index-hint"></a>

## Index Hints

The `@Hint` annotation allows to override MongoDB’s default index selection and forces the database to use the specified index instead.

```java
@Hint("lastname-idx")                                          <1>
List<Person> findByLastname(String lastname);

@Query(value = "{ 'firstname' : ?0 }", hint = "firstname-idx") <2>
List<Person> findByFirstname(String firstname);
```

1. Use the index with name `lastname-idx`.
1. The `@Query` annotation defines the `hint` alias which is equivalent to adding the `@Hint` annotation.

For more information about index creation please refer to the [Collection Management](../template-collection-management.md) section.

<a id="mongo.repositories.collation"></a>

## Collation Support

Next to the [general Collation Support](../collation.md) repositories allow to define the collation for various operations.

```java
public interface PersonRepository extends MongoRepository<Person, String> {

  @Query(collation = "en_US")  <1>
  List<Person> findByFirstname(String firstname);

  @Query(collation = "{ 'locale' : 'en_US' }") <2>
  List<Person> findPersonByFirstname(String firstname);

  @Query(collation = "?1") <3>
  List<Person> findByFirstname(String firstname, Object collation);

  @Query(collation = "{ 'locale' : '?1' }") <4>
  List<Person> findByFirstname(String firstname, String collation);

  List<Person> findByFirstname(String firstname, Collation collation); <5>

  @Query(collation = "{ 'locale' : 'en_US' }")
  List<Person> findByFirstname(String firstname, @Nullable Collation collation); <6>
}
```

1. Static collation definition resulting in `{ 'locale' : 'en_US' }`.
1. Static collation definition resulting in `{ 'locale' : 'en_US' }`.
1. Dynamic collation depending on 2nd method argument. Allowed types include `String` (eg. 'en\_US'), `Locacle` (eg. Locacle.US)
and `Document` (eg. new Document("locale", "en\_US"))
1. Dynamic collation depending on 2nd method argument.
1. Apply the `Collation` method parameter to the query.
1. The `Collation` method parameter overrides the default `collation` from `@Query` if not null.

> [!NOTE]
> In case you enabled the automatic index creation for repository finder methods a potential static collation definition,
> as shown in (1) and (2), will be included when creating the index.

> [!TIP]
> The most specifc `Collation` outrules potentially defined others. Which means Method argument over query method annotation over domain type annotation.

To streamline usage of collation attributes throughout the codebase it is also possible to use the `@Collation` annotation, which serves as a meta annotation for the ones mentioned above.
The same rules and locations apply, plus, direct usage of `@Collation` supersedes any collation values defined on `@Query` and other annotations.
Which means, if a collation is declared via `@Query` and additionally via `@Collation`, then the one from `@Collation` is picked.

```java
@Collation("en_US") <1>
class Game {
  // ...
}

interface GameRepository extends Repository<Game, String> {

  @Collation("en_GB")  <2>
  List<Game> findByTitle(String title);

  @Collation("de_AT")  <3>
  @Query(collation="en_GB")
  List<Game> findByDescriptionContaining(String keyword);
}
```

1. Instead of `@Document(collation=…​)`.
1. Instead of `@Query(collation=…​)`.
1. Favors `@Collation` over meta usage.

<a id="_read_preferences"></a>

## Read Preferences

The `@ReadPreference` annotation allows you to configure MongoDB’s ReadPreferences.

```java
@ReadPreference("primaryPreferred") <1>
public interface PersonRepository extends CrudRepository<Person, String> {

    @ReadPreference("secondaryPreferred") <2>
    List<Person> findWithReadPreferenceAnnotationByLastname(String lastname);

    @Query(readPreference = "nearest") <3>
    List<Person> findWithReadPreferenceAtTagByFirstname(String firstname);

    List<Person> findWithReadPreferenceAtTagByFirstname(String firstname); <4>
```

1. Configure read preference for all repository operations (including inherited, non custom implementation ones) that do not have a query-level definition. Therefore, in this case the read preference mode will be `primaryPreferred`
1. Use the read preference mode defined in annotation `ReadPreference`, in this case secondaryPreferred
1. The `@Query` annotation defines the `read preference mode` alias which is equivalent to adding the `@ReadPreference` annotation.
1. This query will use the read preference mode defined in the repository.

> [!TIP]
> The `MongoOperations` and `Query` API offer more fine grained control for `ReadPreference`.
