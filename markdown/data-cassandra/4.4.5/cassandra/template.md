---
title: "Persisting Entities"
source: "ROOT:cassandra/template.adoc"
---

<a id="cassandra.template"></a>

# Persisting Entities

The `CassandraTemplate` class (and its reactive variant `ReactiveCassandraTemplate`), located in the `org.springframework.data.cassandra` package, is the central class in Spring’s Cassandra support and provides a rich feature set to interact with the database.
The template offers convenience operations to create, update, delete, and query Cassandra, and provides a mapping between your domain objects and rows in Cassandra tables.

> [!NOTE]
> Once configured, a template instance is thread-safe and can be reused across multiple instances.

The mapping between rows in Cassandra and application domain classes is done by delegating to an implementation of the `CassandraConverter` interface.
Spring provides a default implementation, `MappingCassandraConverter`, but you can also write your own custom converter.
See the section on
[Cassandra conversion](../object-mapping.md) for more detailed information.

The `CassandraTemplate` class implements the `CassandraOperations` interface and its reactive variant `ReactiveCassandraTemplate` implements `ReactiveCassandraOperations`.
In as much as possible, the methods on `[Reactive]CassandraOperations` are named after methods available in Cassandra to make the API familiar to developers who are already familiar with Cassandra.

For example, you can find methods such as `select`, `insert`, `delete`, and `update`.
The design goal was to make it as easy as possible to transition between the use of the base Cassandra driver and `[Reactive]CassandraOperations`.
A major difference between the two APIs is that `CassandraOperations` can be passed domain objects instead of CQL and query objects.

> [!NOTE]
> The preferred way to reference operations on a `[Reactive]CassandraTemplate` instance is through the
> `[Reactive]CassandraOperations` interface.

The default converter implementation used by `[Reactive]CassandraTemplate` is `MappingCassandraConverter`.
While `MappingCassandraConverter` can use additional metadata to specify the mapping of objects to rows, it can also convert objects that contain no additional metadata by using some conventions for the mapping of fields and table names.
These conventions, as well as the use of mapping annotations, are explained in the [“Mapping” chapter](../object-mapping.md).

Another central feature of `[Reactive]CassandraTemplate` is exception translation of exceptions thrown in the Cassandra Java driver into Spring’s portable Data Access Exception hierarchy.
See the section on
[exception translation](cql-template.md#exception-translation) for more information.

> [!NOTE]
> The Template API has different execution model flavors.
> The basic `CassandraTemplate` uses a blocking (imperative-synchronous) execution model.
> You can use `AsyncCassandraTemplate` for asynchronous execution and synchronization with `ListenableFuture` instances or `ReactiveCassandraTemplate` for reactive execution.

<a id="cassandra.template.instantiating"></a>

## Instantiating `CassandraTemplate`

`CassandraTemplate` should always be configured as a Spring bean, although we show an example earlier where you can instantiate it directly.
However, because we are assuming the context of making a Spring module, we assume the presence of the Spring container.

There are two ways to get a `CassandraTemplate`, depending on how you load you Spring `ApplicationContext`:

- [Autowiring](#cassandra-template-autowiring)
- [Bean Lookup with `ApplicationContext`](#cassandra-template-bean-lookup-applicationcontext)

<a id="cassandra-template-autowiring"></a>

### Autowiring

You can autowire a `[Reactive]CassandraOperations` into your project, as the following example shows:

#### Imperative

```java
@Autowired
private CassandraOperations cassandraOperations;
```

#### Reactive

```java
@Autowired
private ReactiveCassandraOperations reactiveCassandraOperations;
```

As with all Spring autowiring, this assumes there is only one bean of type `[Reactive]CassandraOperations` in the `ApplicationContext`.
If you have multiple `[Reactive]CassandraTemplate` beans (which is the case if you work with multiple keyspaces in the same project), then you can use the `@Qualifier` annotation to designate the bean you want to autowire.

#### Imperative

```java
@Autowired
@Qualifier("keyspaceOneTemplateBeanId")
private CassandraOperations cassandraOperations;
```

#### Reactive

```java
@Autowired
@Qualifier("keyspaceOneTemplateBeanId")
private ReactiveCassandraOperations reactiveCassandraOperations;
```

<a id="cassandra-template-bean-lookup-applicationcontext"></a>

### Bean Lookup with `ApplicationContext`

You can also look up the `[Reactive]CassandraTemplate` bean from the `ApplicationContext`, as shown in the following example:

#### Imperative

```java
CassandraOperations cassandraOperations = applicationContext.getBean("cassandraTemplate", CassandraOperations.class);
```

#### Reactive

```java
ReactiveCassandraOperations cassandraOperations = applicationContext.getBean("ReactiveCassandraOperations", ReactiveCassandraOperations.class);
```

<a id="cassandra.template.query"></a>

## Querying Rows

You can express your queries by using the `Query` and `Criteria` classes, which have method names that reflect the native Cassandra predicate operator names, such as `lt`, `lte`, `is`, and others.

The `Query` and `Criteria` classes follow a fluent API style so that you can easily chain together multiple method criteria and queries while having easy-to-understand code.
Static imports are used in Java when creating `Query`
and `Criteria` instances to improve readability.

<a id="cassandra.template.query.table"></a>

### Querying Rows in a Table

In earlier sections, we saw how to retrieve a single object by using the `selectOneById` method on `[Reactive]CassandraTemplate`.
Doing so returns a single domain object.
We can also query for a collection of rows to be returned as a list of domain objects.
Assuming we have a number of `Person` objects with name and age values stored as rows in a table and that each person has an account balance, we can now run a query by using the following code:

#### Imperative

```java
import static org.springframework.data.cassandra.core.query.Criteria.where;
import static org.springframework.data.cassandra.core.query.Query.query;

…

List<Person> result = cassandraTemplate.select(query(where("age").is(50))
  .and(where("balance").gt(1000.00d)).withAllowFiltering(), Person.class);
```

#### Reactive

```java
import static org.springframework.data.cassandra.core.query.Criteria.where;
import static org.springframework.data.cassandra.core.query.Query.query;

…

Flux<Person> result = reactiveCassandraTemplate.select(query(where("age").is(50))
  .and(where("balance").gt(1000.00d)).withAllowFiltering(), Person.class);
```

The `select`, `selectOne`, and `stream` methods take a `Query` object as a parameter.
This object defines the criteria and options used to perform the query.
The criteria is specified by using a `Criteria` object that has a static factory method named `where` that instantiates a new `Criteria` object.
We recommend using a static import for `org.springframework.data.cassandra.core.query.Criteria.where` and `Query.query`, to make the query more readable.

This query should return a list of `Person` objects that meet the specified criteria.
The `Criteria` class has the following methods that correspond to the operators provided in Apache Cassandra:

<a id="cassandra.template.query.criteria"></a>

#### Methods for the Criteria class

- `CriteriaDefinition` **gt** `(Object value)`: Creates a criterion by using the `>` operator.
- `CriteriaDefinition` **gte** `(Object value)`: Creates a criterion by using the `>=` operator.
- `CriteriaDefinition` **in** `(Object…​ values)`: Creates a criterion by using the `IN` operator for a varargs argument.
- `CriteriaDefinition` **in** `(Collection<?> collection)`: Creates a criterion by using the `IN` operator using a collection.
- `CriteriaDefinition` **is** `(Object value)`: Creates a criterion by using field matching (`column = value`).
- `CriteriaDefinition` **lt** `(Object value)`: Creates a criterion by using the `<` operator.
- `CriteriaDefinition` **lte** `(Object value)`: Creates a criterion by using the `⇐` operator.
- `CriteriaDefinition` **like** `(Object value)`: Creates a criterion by using the `LIKE` operator.
- `CriteriaDefinition` **contains** `(Object value)`: Creates a criterion by using the `CONTAINS` operator.
- `CriteriaDefinition` **containsKey** `(Object key)`: Creates a criterion by using the `CONTAINS KEY` operator.

`Criteria` is immutable once created.

<a id="cassandra.template.query.query-class"></a>

### Methods for the Query class

The `Query` class has some additional methods that you can use to provide options for the query:

- `Query` **by** `(CriteriaDefinition…​ criteria)`: Used to create a `Query` object.
- `Query` **and** `(CriteriaDefinition criteria)`: Used to add additional criteria to the query.
- `Query` **columns** `(Columns columns)`: Used to define columns to be included in the query results.
- `Query` **limit** `(Limit limit)`: Used to limit the size of the returned results to the provided limit (used `SELECT` limiting).
- `Query` **limit** `(long limit)`: Used to limit the size of the returned results to the provided limit (used `SELECT` limiting).
- `Query` **pageRequest** `(Pageable pageRequest)`: Used to associate `Sort`, `PagingState`, and `fetchSize` with the query (used for paging).
- `Query` **pagingState** `(ByteBuffer pagingState)`: Used to associate a `ByteBuffer` with the query (used for paging).
- `Query` **queryOptions** `(QueryOptions queryOptions)`: Used to associate `QueryOptions` with the query.
- `Query` **sort** `(Sort sort)`: Used to provide a sort definition for the results.
- `Query` **withAllowFiltering** `()`: Used to render `ALLOW FILTERING` queries.

`Query` is immutable once created.
Invoking methods creates new immutable (intermediate) `Query` objects.

<a id="cassandra.template.query.rows"></a>

### Methods for Querying for Rows

The `Query` class has the following methods that return rows:

- `List<T>` **select** `(Query query, Class<T> entityClass)`: Query for a list of objects of type `T` from the table.
- `T` **selectOne** `(Query query, Class<T> entityClass)`: Query for a single object of type `T` from the table.
- `Slice<T>` **slice** `(Query query, Class<T> entityClass)`: Starts or continues paging by querying for a `Slice` of objects of type `T` from the table.
- `Stream<T>` **stream** `(Query query, Class<T> entityClass)`: Query for a stream of objects of type `T` from the table.
- `List<T>` **select** `(String cql, Class<T> entityClass)`: Ad-hoc query for a list of objects of type `T` from the table by providing a CQL statement.
- `T` **selectOne** `(String cql, Class<T> entityClass)`: Ad-hoc query for a single object of type `T` from the table by providing a CQL statement.
- `Stream<T>` **stream** `(String cql, Class<T> entityClass)`: Ad-hoc query for a stream of objects of type `T` from the table by providing a CQL statement.

The query methods must specify the target type `T` that is returned.

<a id="cassandra.template.query.fluent-template-api"></a>

### Fluent Template API

The `[Reactive]CassandraOperations` interface is one of the central components when it comes to more low-level interaction with Apache Cassandra.
It offers a wide range of methods.
You can find multiple overloads for every method.
Most of them cover optional (nullable) parts of the API.

`FluentCassandraOperations` and its reactive variant `ReactiveFluentCassandraOperations` provide a more narrow interface for common methods of `[Reactive]CassandraOperations`
providing a more readable, fluent API.
The entry points (`query(…)`, `insert(…)`, `update(…)`, and `delete(…)`) follow a natural naming scheme based on the operation to execute.
Moving on from the entry point, the API is designed to offer only context-dependent methods that guide the developer towards a terminating method that invokes the actual `[Reactive]CassandraOperations`.
The following example shows the fluent API:

#### Imperative

```java
List<SWCharacter> all = ops.query(SWCharacter.class)
  .inTable("star_wars")                        <1>
  .all();
```

1. Skip this step if `SWCharacter` defines the table name with `@Table` or if using the class name as the table name is not a problem

#### Reactive

```java
Flux<SWCharacter> all = ops.query(SWCharacter.class)
  .inTable("star_wars")                        <1>
  .all();
```

1. Skip this step if `SWCharacter` defines the table name with `@Table` or if using the class name as the table name is not a problem

If a table in Cassandra holds entities of different types, such as a `Jedi` within a Table of `SWCharacters`, you can use different types to map the query result.
You can use `as(Class<?> targetType)` to map results to a different target type, while `query(Class<?> entityType)` still applies to the query and table name.
The following example uses the `query` and `as` methods:

#### Imperative

```java
List<Jedi> all = ops.query(SWCharacter.class)    <1>
  .as(Jedi.class)                                <2>
  .matching(query(where("jedi").is(true)))
  .all();
```

1. The query fields are mapped against the `SWCharacter` type.
1. Resulting rows are mapped into `Jedi`.

#### Reactive

```java
Flux<Jedi> all = ops.query(SWCharacter.class)    <1>
  .as(Jedi.class)                                <2>
  .matching(query(where("jedi").is(true)))
  .all();
```

1. The query fields are mapped against the `SWCharacter` type.
1. Resulting rows are mapped into `Jedi`.

> [!TIP]
> You can directly apply [repositories/projections.adoc](../repositories/projections.md) to resulting documents by providing only the `interface` type through `as(Class<?>)`.

The terminating methods (`first()`, `one()`, `all()`, and `stream()`) handle switching between retrieving a single entity and retrieving multiple entities as `List` or `Stream` and similar operations.

> [!WARNING]
> The new fluent template API methods (that is, `query(..)`, `insert(..)`, `update(..)`, and `delete(..)`) use effectively thread-safe supporting objects to compose the CQL statement.
> However, it comes at the added cost of additional young-gen JVM heap overhead, since the design is based on final fields for the various CQL statement components and construction on mutation.
> You should be careful when possibly inserting or deleting a large number of objects (such as inside of a loop, for instance).

<a id="cassandra-template.save-update-remove"></a>

## Saving, Updating, and Removing Rows

`[Reactive]CassandraTemplate` provides a simple way for you to save, update, and delete your domain objects and map those objects to tables managed in Cassandra.

<a id="cassandra.template.type-mapping"></a>

### Type Mapping

Spring Data for Apache Cassandra relies on the DataStax Java driver’s `CodecRegistry` to ensure type support.
As types are added or changed, the Spring Data for Apache Cassandra module continues to function without requiring changes.
See [CQL data types](https://docs.datastax.com/en/cql/3.3/cql/cql_reference/cql_data_types_c.html)
and “[Data Mapping and Type Conversion](../object-mapping.md#mapping-conversion)” for the current type mapping matrix.

<a id="cassandra.template.insert-update"></a>

### Methods for Inserting and Updating rows

`[Reactive]CassandraTemplate` has several convenient methods for saving and inserting your objects.
To have more fine-grained control over the conversion process, you can register Spring `Converter` instances with the `MappingCassandraConverter`
(for example, `Converter<Row, Person>`).

> [!NOTE]
> The difference between insert and update operations is that `INSERT` operations do not insert `null` values.

The simple case of using the `INSERT` operation is to save a POJO.
In this case, the table name is determined by the simple class name (not the fully qualified class name).
The table to store the object can be overridden by using mapping metadata.

When inserting or updating, the `id` property must be set.
Apache Cassandra has no means to generate an ID.

The following example uses the save operation and retrieves its contents:

#### Imperative

```java
import static org.springframework.data.cassandra.core.query.Criteria.where;
import static org.springframework.data.cassandra.core.query.Query.query;
…

Person bob = new Person("Bob", 33);
cassandraTemplate.insert(bob);

Person queriedBob = cassandraTemplate.selectOneById(query(where("age").is(33)), Person.class);
```

#### Reactive

```java
import static org.springframework.data.cassandra.core.query.Criteria.where;
import static org.springframework.data.cassandra.core.query.Query.query;
…

Person bob = new Person("Bob", 33);
cassandraTemplate.insert(bob);

Mono<Person> queriedBob = reactiveCassandraTemplate.selectOneById(query(where("age").is(33)), Person.class);
```

You can use the following operations to insert and save:

- `void` **insert** `(Object objectToSave)`: Inserts the object in an Apache Cassandra table.
- `WriteResult` **insert** `(Object objectToSave, InsertOptions options)`: Inserts the object in an Apache Cassandra table and applies `InsertOptions`.

You can use the following update operations:

- `void` **update** `(Object objectToSave)`: Updates the object in an Apache Cassandra table.
- `WriteResult` **update** `(Object objectToSave, UpdateOptions options)`: Updates the object in an Apache Cassandra table and applies `UpdateOptions`.

You can also use the old fashioned way and write your own CQL statements, as the following example shows:

#### Imperative

```java
String cql = "INSERT INTO person (age, name) VALUES (39, 'Bob')";

cassandraTemplate().getCqlOperations().execute(cql);
```

#### Reactive

```java
String cql = "INSERT INTO person (age, name) VALUES (39, 'Bob')";

Mono<Boolean> applied = reactiveCassandraTemplate.getReactiveCqlOperations().execute(cql);
```

You can also configure additional options such as TTL, consistency level, and lightweight transactions when using `InsertOptions` and `UpdateOptions`.

<a id="cassandra.template.insert-update.table"></a>

#### Which Table Are My Rows Inserted into?

You can manage the table name that is used for operating on the tables in two ways.
The default table name is the simple class name changed to start with a lower-case letter.
So, an instance of the `com.example.Person` class would be stored in the `person` table.
The second way is to specify a table name in the `@Table` annotation.

<a id="cassandra.template.batch"></a>

#### Inserting, Updating, and Deleting Individual Objects in a Batch

The Cassandra protocol supports inserting a collection of rows in one operation by using a batch.

The following methods in the `[Reactive]CassandraTemplate` interface support this functionality:

- `batchOps`: Creates a new `[Reactive]CassandraBatchOperations` to populate the batch.

`[Reactive]CassandraBatchOperations`

- `insert`: Takes a single object, an array (var-args), or an `Iterable` of objects to insert.
- `update`: Takes a single object, an array (var-args), or an `Iterable` of objects to update.
- `delete`: Takes a single object, an array (var-args), or an `Iterable` of objects to delete.
- `withTimestamp`: Applies a TTL to the batch.
- `execute`: Executes the batch.

<a id="cassandra.template.update"></a>

### Updating Rows in a Table

For updates, you can select to update a number of rows.

The following example shows updating a single account object by adding a one-time $50.00 bonus to the balance with the `+` assignment:

#### Imperative

```java
import static org.springframework.data.cassandra.core.query.Criteria.where;
import org.springframework.data.cassandra.core.query.Query;
import org.springframework.data.cassandra.core.query.Update;

…

boolean applied = cassandraTemplate.update(Query.query(where("id").is("foo")),
  Update.create().increment("balance", 50.00), Account.class);
```

#### Reactive

```java
import static org.springframework.data.cassandra.core.query.Criteria.where;
import org.springframework.data.cassandra.core.query.Query;
import org.springframework.data.cassandra.core.query.Update;

…

Mono<Boolean> wasApplied = reactiveCassandraTemplate.update(Query.query(where("id").is("foo")),
  Update.create().increment("balance", 50.00), Account.class);
```

In addition to the `Query` discussed earlier, we provide the update definition by using an `Update` object.
The `Update` class has methods that match the update assignments available for Apache Cassandra.

Most methods return the `Update` object to provide a fluent API for code styling purposes.

<a id="cassandra.template.update.methods"></a>

#### Methods for Executing Updates for Rows

The update method can update rows, as follows:

- `boolean` **update** `(Query query, Update update, Class<?> entityClass)`: Updates a selection of objects in the Apache Cassandra table.

<a id="cassandra.template.update.update"></a>

#### Methods for the Update class

The `Update` class can be used with a little 'syntax sugar', as its methods are meant to be chained together.
Also, you can kick-start the creation of a new `Update` instance with the static method `public static Update update(String key, Object value)` and by using static imports.

The `Update` class has the following methods:

- `AddToBuilder` **addTo** `(String columnName)` `AddToBuilder` entry-point:

  - Update `prepend(Object value)`: Prepends a collection value to the existing collection by using the `+` update assignment.
  - Update `prependAll(Object…​ values)`: Prepends all collection values to the existing collection by using the `+` update assignment.
  - Update `append(Object value)`: Appends a collection value to the existing collection by using the `+` update assignment.
  - Update `append(Object…​ values)`: Appends all collection values to the existing collection by using the `+` update assignment.
  - Update `entry(Object key, Object value)`: Adds a map entry by using the `+` update assignment.
  - Update `addAll(Map<? extends Object, ? extends Object> map)`: Adds all map entries to the map by using the `+` update assignment.
- `Update` **remove** `(String columnName, Object value)`: Removes the value from the collection by using the `-` update assignment.
- `Update` **clear** `(String columnName)`: Clears the collection.
- `Update` **increment** `(String columnName, Number delta)`: Updates by using the `+` update assignment.
- `Update` **decrement** `(String columnName, Number delta)`: Updates by using the `-` update assignment.
- `Update` **set** `(String columnName, Object value)`: Updates by using the `=` update assignment.
- `SetBuilder` **set** `(String columnName)` `SetBuilder` entry-point:

  - Update `atIndex(int index).to(Object value)`: Sets a collection at the given index to a value using the `=` update assignment.
  - Update `atKey(String object).to(Object value)`: Sets a map entry at the given key to a value the `=` update assignment.

The following listing shows a few update examples:

```
// UPDATE … SET key = 'Spring Data';
Update.update("key", "Spring Data")

// UPDATE … SET key[5] = 'Spring Data';
Update.empty().set("key").atIndex(5).to("Spring Data");

// UPDATE … SET key = key + ['Spring', 'DATA'];
Update.empty().addTo("key").appendAll("Spring", "Data");
```

Note that `Update` is immutable once created.
Invoking methods creates new immutable (intermediate) `Update` objects.

<a id="cassandra.template.delete"></a>

### Methods for Removing Rows

You can use the following overloaded methods to remove an object from the database:

- `boolean` **delete** `(Query query, Class<?> entityClass)`: Deletes the objects selected by `Query`.
- `T` **delete** `(T entity)`: Deletes the given object.
- `T` **delete** `(T entity, QueryOptions queryOptions)`: Deletes the given object applying `QueryOptions`.
- `boolean` **deleteById** `(Object id, Class<?> entityClass)`: Deletes the object using the given Id.

<a id="cassandra.template.optimistic-locking"></a>

### Optimistic Locking

The `@Version` annotation provides syntax similar to that of JPA in the context of Cassandra and makes sure updates are only applied to rows with a matching version.
Optimistic Locking leverages Cassandra’s lightweight transactions to conditionally insert, update and delete rows.
Therefore, `INSERT` statements are executed with the `IF NOT EXISTS` condition.
For updates and deletes, the actual value of the version property is added to the `UPDATE` condition in such a way that the modification does not have any effect if another operation altered the row in the meantime.
In that case, an `OptimisticLockingFailureException` is thrown.
The following example shows these features:

```java
@Table
class Person {

  @Id String id;
  String firstname;
  String lastname;
  @Version Long version;
}

Person daenerys = template.insert(new Person("Daenerys"));                            <1>

Person tmp = template.findOne(query(where("id").is(daenerys.getId())), Person.class); <2>

daenerys.setLastname("Targaryen");
template.save(daenerys);                                                              <3>

template.save(tmp); // throws OptimisticLockingFailureException                       <4>
```

1. Intially insert document. `version` is set to `0`.
1. Load the just inserted document. `version` is still `0`.
1. Update the document with `version = 0`.
Set the `lastname` and bump `version` to `1`.
1. Try to update the previously loaded document that still has `version = 0`.
The operation fails with an `OptimisticLockingFailureException`, as the current `version` is `1`.

> [!NOTE]
> Optimistic Locking is only supported with single-entity operations and not for batch operations.
