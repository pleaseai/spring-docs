---
title: "Data Access with R2DBC"
source: "ROOT:data-access/r2dbc.adoc"
---

<a id="r2dbc"></a>

# Data Access with R2DBC

[R2DBC](https://r2dbc.io) ("Reactive Relational Database Connectivity") is a community-driven
specification effort to standardize access to SQL databases using reactive patterns.

<a id="r2dbc-packages"></a>

## Package Hierarchy

The Spring Framework’s R2DBC abstraction framework consists of two different packages:

- `core`: The `org.springframework.r2dbc.core` package contains the `DatabaseClient`
class plus a variety of related classes. See
[Using the R2DBC Core Classes to Control Basic R2DBC Processing and Error Handling](#r2dbc-core).
- `connection`: The `org.springframework.r2dbc.connection` package contains a utility class
for easy `ConnectionFactory` access and various simple `ConnectionFactory` implementations
that you can use for testing and running unmodified R2DBC. See
[Controlling Database Connections](#r2dbc-connections).

<a id="r2dbc-core"></a>

## Using the R2DBC Core Classes to Control Basic R2DBC Processing and Error Handling

This section covers how to use the R2DBC core classes to control basic R2DBC processing,
including error handling. It includes the following topics:

- [Using `DatabaseClient`](#r2dbc-DatabaseClient)
- [Executing Statements](#r2dbc-DatabaseClient-examples-statement)
- [Querying (`SELECT`)](#r2dbc-DatabaseClient-examples-query)
- [Updating (`INSERT`, `UPDATE`, and `DELETE`) with `DatabaseClient`](#r2dbc-DatabaseClient-examples-update)
- [Statement Filters](#r2dbc-DatabaseClient-filter)
- [Retrieving Auto-generated Keys](#r2dbc-auto-generated-keys)

<a id="r2dbc-DatabaseClient"></a>

### Using `DatabaseClient`

`DatabaseClient` is the central class in the R2DBC core package. It handles the
creation and release of resources, which helps to avoid common errors, such as
forgetting to close the connection. It performs the basic tasks of the core R2DBC
workflow (such as statement creation and execution), leaving application code to provide
SQL and extract results. The `DatabaseClient` class:

- Runs SQL queries
- Update statements and stored procedure calls
- Performs iteration over `Result` instances
- Catches R2DBC exceptions and translates them to the generic, more informative,
exception hierarchy defined in the `org.springframework.dao` package.
(See [Consistent Exception Hierarchy](dao.md#dao-exceptions).)

The client has a functional, fluent API using reactive types for declarative composition.

When you use the `DatabaseClient` for your code, you need only to implement
`java.util.function` interfaces, giving them a clearly defined contract.
Given a `Connection` provided by the `DatabaseClient` class, a `Function`
callback creates a `Publisher`. The same is true for mapping functions that
extract a `Row` result.

You can use `DatabaseClient` within a DAO implementation through direct instantiation
with a `ConnectionFactory` reference, or you can configure it in a Spring IoC container
and give it to DAOs as a bean reference.

The simplest way to create a `DatabaseClient` object is through a static factory method, as follows:

#### Java

```java
DatabaseClient client = DatabaseClient.create(connectionFactory);
```

#### Kotlin

```kotlin
val client = DatabaseClient.create(connectionFactory)
```

> [!NOTE]
> The `ConnectionFactory` should always be configured as a bean in the Spring IoC
> container.

The preceding method creates a `DatabaseClient` with default settings.

You can also obtain a `Builder` instance from `DatabaseClient.builder()`.
You can customize the client by calling the following methods:

- `….bindMarkers(…)`: Supply a specific `BindMarkersFactory` to configure named
parameter to database bind marker translation.
- `….executeFunction(…)`: Set the `ExecuteFunction` how `Statement` objects get
run.
- `….namedParameters(false)`: Disable named parameter expansion. Enabled by default.

> [!TIP]
> Dialects are resolved by [`BindMarkersFactoryResolver`](https://docs.spring.io/spring-framework/docs/6.1.16/javadoc-api/org/springframework/r2dbc/core/binding/BindMarkersFactoryResolver.html)
>  from a `ConnectionFactory`, typically by inspecting `ConnectionFactoryMetadata`.
>
>
> You can let Spring auto-discover your `BindMarkersFactory` by registering a
> class that implements `org.springframework.r2dbc.core.binding.BindMarkersFactoryResolver$BindMarkerFactoryProvider`
> through `META-INF/spring.factories`.
> `BindMarkersFactoryResolver` discovers bind marker provider implementations from
> the class path using Spring’s `SpringFactoriesLoader`.

Currently supported databases are:

- H2
- MariaDB
- Microsoft SQL Server
- MySQL
- Postgres

All SQL issued by this class is logged at the `DEBUG` level under the category
corresponding to the fully qualified class name of the client instance (typically
`DefaultDatabaseClient`). Additionally, each execution registers a checkpoint in
the reactive sequence to aid debugging.

The following sections provide some examples of `DatabaseClient` usage. These examples
are not an exhaustive list of all of the functionality exposed by the `DatabaseClient`.
See the attendant [javadoc](https://docs.spring.io/spring-framework/docs/6.1.16/javadoc-api/org/springframework/r2dbc/core/DatabaseClient.html) for that.

<a id="r2dbc-DatabaseClient-examples-statement"></a>

#### Executing Statements

`DatabaseClient` provides the basic functionality of running a statement.
The following example shows what you need to include for minimal but fully functional
code that creates a new table:

#### Java

```java
Mono<Void> completion = client.sql("CREATE TABLE person (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), age INTEGER);")
        .then();
```

#### Kotlin

```kotlin
client.sql("CREATE TABLE person (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255), age INTEGER);")
        .await()
```

`DatabaseClient` is designed for convenient, fluent usage.
It exposes intermediate, continuation, and terminal methods at each stage of the
execution specification. The preceding example above uses `then()` to return a completion
`Publisher` that completes as soon as the query (or queries, if the SQL query contains
multiple statements) completes.

> [!NOTE]
> `execute(…)` accepts either the SQL query string or a query `Supplier<String>`
> to defer the actual query creation until execution.

<a id="r2dbc-DatabaseClient-examples-query"></a>

#### Querying (`SELECT`)

SQL queries can return values through `Row` objects or the number of affected rows.
`DatabaseClient` can return the number of updated rows or the rows themselves,
depending on the issued query.

The following query gets the `id` and `name` columns from a table:

#### Java

```java
Mono<Map<String, Object>> first = client.sql("SELECT id, name FROM person")
        .fetch().first();
```

#### Kotlin

```kotlin
val first = client.sql("SELECT id, name FROM person")
        .fetch().awaitSingle()
```

The following query uses a bind variable:

#### Java

```java
Mono<Map<String, Object>> first = client.sql("SELECT id, name FROM person WHERE first_name = :fn")
        .bind("fn", "Joe")
        .fetch().first();
```

#### Kotlin

```kotlin
val first = client.sql("SELECT id, name FROM person WHERE first_name = :fn")
        .bind("fn", "Joe")
        .fetch().awaitSingle()
```

You might have noticed the use of `fetch()` in the example above. `fetch()` is a
continuation operator that lets you specify how much data you want to consume.

Calling `first()` returns the first row from the result and discards remaining rows.
You can consume data with the following operators:

- `first()` return the first row of the entire result. Its Kotlin Coroutine variant
is named `awaitSingle()` for non-nullable return values and `awaitSingleOrNull()`
if the value is optional.
- `one()` returns exactly one result and fails if the result contains more rows.
Using Kotlin Coroutines, `awaitOne()` for exactly one value or `awaitOneOrNull()`
if the value may be `null`.
- `all()` returns all rows of the result. When using Kotlin Coroutines, use `flow()`.
- `rowsUpdated()` returns the number of affected rows (`INSERT`/`UPDATE`/`DELETE`
count). Its Kotlin Coroutine variant is named `awaitRowsUpdated()`.

Without specifying further mapping details, queries return tabular results
as `Map` whose keys are case-insensitive column names that map to their column value.

You can take control over result mapping by supplying a `Function<Row, T>` that gets
called for each `Row` so it can return arbitrary values (singular values,
collections and maps, and objects).

The following example extracts the `name` column and emits its value:

#### Java

```java
Flux<String> names = client.sql("SELECT name FROM person")
        .map(row -> row.get("name", String.class))
        .all();
```

#### Kotlin

```kotlin
val names = client.sql("SELECT name FROM person")
        .map{ row: Row -> row.get("name", String.class) }
        .flow()
```

Alternatively, there is a shortcut for mapping to a single value:

```java
	Flux<String> names = client.sql("SELECT name FROM person")
			.mapValue(String.class)
			.all();
```

Or you may map to a result object with bean properties or record components:

```java
	// assuming a name property on Person
	Flux<Person> persons = client.sql("SELECT name FROM person")
			.mapProperties(Person.class)
			.all();
```

<a id="r2dbc-DatabaseClient-mapping-null"></a>

#### What about `null`?

> Relational database results can contain `null` values.
> The Reactive Streams specification forbids the emission of `null` values.
> That requirement mandates proper `null` handling in the extractor function.
> While you can obtain `null` values from a `Row`, you must not emit a `null`
> value. You must wrap any `null` values in an object (for example, `Optional`
> for singular values) to make sure a `null` value is never returned directly
> by your extractor function.

<a id="r2dbc-DatabaseClient-examples-update"></a>

#### Updating (`INSERT`, `UPDATE`, and `DELETE`) with `DatabaseClient`

The only difference of modifying statements is that these statements typically
do not return tabular data so you use `rowsUpdated()` to consume results.

The following example shows an `UPDATE` statement that returns the number
of updated rows:

#### Java

```java
Mono<Integer> affectedRows = client.sql("UPDATE person SET first_name = :fn")
        .bind("fn", "Joe")
        .fetch().rowsUpdated();
```

#### Kotlin

```kotlin
val affectedRows = client.sql("UPDATE person SET first_name = :fn")
        .bind("fn", "Joe")
        .fetch().awaitRowsUpdated()
```

<a id="r2dbc-DatabaseClient-named-parameters"></a>

#### Binding Values to Queries

A typical application requires parameterized SQL statements to select or
update rows according to some input. These are typically `SELECT` statements
constrained by a `WHERE` clause or `INSERT` and `UPDATE` statements that accept
input parameters. Parameterized statements bear the risk of SQL injection if
parameters are not escaped properly. `DatabaseClient` leverages R2DBC’s
`bind` API to eliminate the risk of SQL injection for query parameters.
You can provide a parameterized SQL statement with the `execute(…)` operator
and bind parameters to the actual `Statement`. Your R2DBC driver then runs
the statement by using prepared statements and parameter substitution.

Parameter binding supports two binding strategies:

- By Index, using zero-based parameter indexes.
- By Name, using the placeholder name.

The following example shows parameter binding for a query:

```java
    db.sql("INSERT INTO person (id, name, age) VALUES(:id, :name, :age)")
	    	.bind("id", "joe")
	    	.bind("name", "Joe")
			.bind("age", 34);
```

Alternatively, you may pass in a map of names and values:

```java
	Map<String, Object> params = new LinkedHashMap<>();
	params.put("id", "joe");
	params.put("name", "Joe");
	params.put("age", 34);
	db.sql("INSERT INTO person (id, name, age) VALUES(:id, :name, :age)")
			.bindValues(params);
```

Or you may pass in a parameter object with bean properties or record components:

```java
	// assuming id, name, age properties on Person
	db.sql("INSERT INTO person (id, name, age) VALUES(:id, :name, :age)")
			.bindProperties(new Person("joe", "Joe", 34);
```

#### R2DBC Native Bind Markers

> R2DBC uses database-native bind markers that depend on the actual database vendor.
> As an example, Postgres uses indexed markers, such as `$1`, `$2`, `$n`.
> Another example is SQL Server, which uses named bind markers prefixed with `@`.
>
> This is different from JDBC which requires `?` as bind markers.
> In JDBC, the actual drivers translate `?` bind markers to database-native
> markers as part of their statement execution.
>
> Spring Framework’s R2DBC support lets you use native bind markers or named bind
> markers with the `:name` syntax.
>
> Named parameter support leverages a `BindMarkersFactory` instance to expand named
> parameters to native bind markers at the time of query execution, which gives you
> a certain degree of query portability across various database vendors.

The query-preprocessor unrolls named `Collection` parameters into a series of bind
markers to remove the need of dynamic query creation based on the number of arguments.
Nested object arrays are expanded to allow usage of (for example) select lists.

Consider the following query:

```sql
SELECT id, name, state FROM table WHERE (name, age) IN (('John', 35), ('Ann', 50))
```

The preceding query can be parameterized and run as follows:

#### Java

```java
List<Object[]> tuples = new ArrayList<>();
tuples.add(new Object[] {"John", 35});
tuples.add(new Object[] {"Ann",  50});

client.sql("SELECT id, name, state FROM table WHERE (name, age) IN (:tuples)")
	    .bind("tuples", tuples);
```

#### Kotlin

```kotlin
val tuples: MutableList<Array<Any>> = ArrayList()
tuples.add(arrayOf("John", 35))
tuples.add(arrayOf("Ann", 50))

client.sql("SELECT id, name, state FROM table WHERE (name, age) IN (:tuples)")
	    .bind("tuples", tuples)
```

> [!NOTE]
> Usage of select lists is vendor-dependent.

The following example shows a simpler variant using `IN` predicates:

#### Java

```java
client.sql("SELECT id, name, state FROM table WHERE age IN (:ages)")
	    .bind("ages", Arrays.asList(35, 50));
```

#### Kotlin

```kotlin
client.sql("SELECT id, name, state FROM table WHERE age IN (:ages)")
	    .bind("ages", arrayOf(35, 50))
```

> [!NOTE]
> R2DBC itself does not support Collection-like values. Nevertheless,
> expanding a given `List` in the example above works for named parameters
> in Spring’s R2DBC support, e.g. for use in `IN` clauses as shown above.
> However, inserting or updating array-typed columns (e.g. in Postgres)
> requires an array type that is supported by the underlying R2DBC driver:
> typically a Java array, e.g. `String[]` to update a `text[]` column.
> Do not pass `Collection<String>` or the like as an array parameter.

<a id="r2dbc-DatabaseClient-filter"></a>

#### Statement Filters

Sometimes you need to fine-tune options on the actual `Statement`
before it gets run. To do so, register a `Statement` filter
(`StatementFilterFunction`) with the `DatabaseClient` to intercept and
modify statements in their execution, as the following example shows:

#### Java

```java
client.sql("INSERT INTO table (name, state) VALUES(:name, :state)")
	    .filter((s, next) -> next.execute(s.returnGeneratedValues("id")))
	    .bind("name", …)
	    .bind("state", …);
```

#### Kotlin

```kotlin
client.sql("INSERT INTO table (name, state) VALUES(:name, :state)")
		.filter { s: Statement, next: ExecuteFunction -> next.execute(s.returnGeneratedValues("id")) }
		.bind("name", …)
		.bind("state", …)
```

`DatabaseClient` also exposes a simplified `filter(…)` overload that accepts
a `Function<Statement, Statement>`:

#### Java

```java
client.sql("INSERT INTO table (name, state) VALUES(:name, :state)")
	    .filter(statement -> s.returnGeneratedValues("id"));

client.sql("SELECT id, name, state FROM table")
	    .filter(statement -> s.fetchSize(25));
```

#### Kotlin

```kotlin
client.sql("INSERT INTO table (name, state) VALUES(:name, :state)")
	    .filter { statement -> s.returnGeneratedValues("id") }

client.sql("SELECT id, name, state FROM table")
	    .filter { statement -> s.fetchSize(25) }
```

`StatementFilterFunction` implementations allow filtering of the
`Statement` and filtering of `Result` objects.

<a id="r2dbc-DatabaseClient-idioms"></a>

#### `DatabaseClient` Best Practices

Instances of the `DatabaseClient` class are thread-safe, once configured. This is
important because it means that you can configure a single instance of a `DatabaseClient`
and then safely inject this shared reference into multiple DAOs (or repositories).
The `DatabaseClient` is stateful, in that it maintains a reference to a `ConnectionFactory`,
but this state is not conversational state.

A common practice when using the `DatabaseClient` class is to configure a `ConnectionFactory`
in your Spring configuration file and then dependency-inject
that shared `ConnectionFactory` bean into your DAO classes. The `DatabaseClient` is created in
the setter for the `ConnectionFactory`. This leads to DAOs that resemble the following:

#### Java

```java
public class R2dbcCorporateEventDao implements CorporateEventDao {

	private DatabaseClient databaseClient;

	public void setConnectionFactory(ConnectionFactory connectionFactory) {
		this.databaseClient = DatabaseClient.create(connectionFactory);
	}

	// R2DBC-backed implementations of the methods on the CorporateEventDao follow...
}
```

#### Kotlin

```kotlin
class R2dbcCorporateEventDao(connectionFactory: ConnectionFactory) : CorporateEventDao {

	private val databaseClient = DatabaseClient.create(connectionFactory)

	// R2DBC-backed implementations of the methods on the CorporateEventDao follow...
}
```

An alternative to explicit configuration is to use component-scanning and annotation
support for dependency injection. In this case, you can annotate the class with `@Component`
(which makes it a candidate for component-scanning) and annotate the `ConnectionFactory` setter
method with `@Autowired`. The following example shows how to do so:

#### Java

```java
@Component // <1>
public class R2dbcCorporateEventDao implements CorporateEventDao {

	private DatabaseClient databaseClient;

	@Autowired // <2>
	public void setConnectionFactory(ConnectionFactory connectionFactory) {
		this.databaseClient = DatabaseClient.create(connectionFactory); // <3>
	}

	// R2DBC-backed implementations of the methods on the CorporateEventDao follow...
}
```

1. Annotate the class with `@Component`.
1. Annotate the `ConnectionFactory` setter method with `@Autowired`.
1. Create a new `DatabaseClient` with the `ConnectionFactory`.

#### Kotlin

```kotlin
@Component // <1>
class R2dbcCorporateEventDao(connectionFactory: ConnectionFactory) : CorporateEventDao { // <2>

	private val databaseClient = DatabaseClient(connectionFactory) // <3>

	// R2DBC-backed implementations of the methods on the CorporateEventDao follow...
}
```

1. Annotate the class with `@Component`.
1. Constructor injection of the `ConnectionFactory`.
1. Create a new `DatabaseClient` with the `ConnectionFactory`.

Regardless of which of the above template initialization styles you choose to use (or
not), it is seldom necessary to create a new instance of a `DatabaseClient` class each
time you want to run SQL. Once configured, a `DatabaseClient` instance is thread-safe.
If your application accesses multiple
databases, you may want multiple `DatabaseClient` instances, which requires multiple
`ConnectionFactory` and, subsequently, multiple differently configured `DatabaseClient`
instances.

<a id="r2dbc-auto-generated-keys"></a>

## Retrieving Auto-generated Keys

`INSERT` statements may generate keys when inserting rows into a table
that defines an auto-increment or identity column. To get full control over
the column name to generate, simply register a `StatementFilterFunction` that
requests the generated key for the desired column.

#### Java

```java
Mono<Integer> generatedId = client.sql("INSERT INTO table (name, state) VALUES(:name, :state)")
		.filter(statement -> s.returnGeneratedValues("id"))
		.map(row -> row.get("id", Integer.class))
		.first();

// generatedId emits the generated key once the INSERT statement has finished
```

#### Kotlin

```kotlin
val generatedId = client.sql("INSERT INTO table (name, state) VALUES(:name, :state)")
		.filter { statement -> s.returnGeneratedValues("id") }
		.map { row -> row.get("id", Integer.class) }
		.awaitOne()

// generatedId emits the generated key once the INSERT statement has finished
```

<a id="r2dbc-connections"></a>

## Controlling Database Connections

This section covers:

- [Using `ConnectionFactory`](#r2dbc-ConnectionFactory)
- [Using `ConnectionFactoryUtils`](#r2dbc-ConnectionFactoryUtils)
- [Using `SingleConnectionFactory`](#r2dbc-SingleConnectionFactory)
- [Using `TransactionAwareConnectionFactoryProxy`](#r2dbc-TransactionAwareConnectionFactoryProxy)
- [Using `R2dbcTransactionManager`](#r2dbc-R2dbcTransactionManager)

<a id="r2dbc-ConnectionFactory"></a>

### Using `ConnectionFactory`

Spring obtains an R2DBC connection to the database through a `ConnectionFactory`.
A `ConnectionFactory` is part of the R2DBC specification and is a common entry-point
for drivers. It lets a container or a framework hide connection pooling
and transaction management issues from the application code. As a developer,
you need not know details about how to connect to the database. That is the
responsibility of the administrator who sets up the `ConnectionFactory`. You
most likely fill both roles as you develop and test code, but you do not
necessarily have to know how the production data source is configured.

When you use Spring’s R2DBC layer, you can configure your own with a
connection pool implementation provided by a third party. A popular
implementation is R2DBC Pool (`r2dbc-pool`). Implementations in the Spring
distribution are meant only for testing purposes and do not provide pooling.

To configure a `ConnectionFactory`:

1. Obtain a connection with `ConnectionFactory` as you typically obtain an R2DBC `ConnectionFactory`.
1. Provide an R2DBC URL
(See the documentation for your driver for the correct value).

The following example shows how to configure a `ConnectionFactory`:

#### Java

```java
ConnectionFactory factory = ConnectionFactories.get("r2dbc:h2:mem:///test?options=DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
```

#### Kotlin

```kotlin
val factory = ConnectionFactories.get("r2dbc:h2:mem:///test?options=DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
```

<a id="r2dbc-ConnectionFactoryUtils"></a>

### Using `ConnectionFactoryUtils`

The `ConnectionFactoryUtils` class is a convenient and powerful helper class
that provides `static` methods to obtain connections from `ConnectionFactory`
and close connections (if necessary).

It supports subscriber `Context`-bound connections with, for example
`R2dbcTransactionManager`.

<a id="r2dbc-SingleConnectionFactory"></a>

### Using `SingleConnectionFactory`

The `SingleConnectionFactory` class is an implementation of `DelegatingConnectionFactory`
interface that wraps a single `Connection` that is not closed after each use.

If any client code calls `close` on the assumption of a pooled connection (as when using
persistence tools), you should set the `suppressClose` property to `true`. This setting
returns a close-suppressing proxy that wraps the physical connection. Note that you can
no longer cast this to a native `Connection` or a similar object.

`SingleConnectionFactory` is primarily a test class and may be used for specific requirements
such as pipelining if your R2DBC driver permits for such use.
In contrast to a pooled `ConnectionFactory`, it reuses the same connection all the time, avoiding
excessive creation of physical connections.

<a id="r2dbc-TransactionAwareConnectionFactoryProxy"></a>

### Using `TransactionAwareConnectionFactoryProxy`

`TransactionAwareConnectionFactoryProxy` is a proxy for a target `ConnectionFactory`.
The proxy wraps that target `ConnectionFactory` to add awareness of Spring-managed transactions.

> [!NOTE]
> Using this class is required if you use a R2DBC client that is not integrated otherwise
> with Spring’s R2DBC support. In this case, you can still use this client and, at
> the same time, have this client participating in Spring managed transactions. It is generally
> preferable to integrate a R2DBC client with proper access to `ConnectionFactoryUtils`
> for resource management.

See the [`TransactionAwareConnectionFactoryProxy`](https://docs.spring.io/spring-framework/docs/6.1.16/javadoc-api/org/springframework/r2dbc/connection/TransactionAwareConnectionFactoryProxy.html)
javadoc for more details.

<a id="r2dbc-R2dbcTransactionManager"></a>

### Using `R2dbcTransactionManager`

The `R2dbcTransactionManager` class is a `ReactiveTransactionManager` implementation for
a single R2DBC `ConnectionFactory`. It binds an R2DBC `Connection` from the specified
`ConnectionFactory` to the subscriber `Context`, potentially allowing for one subscriber
`Connection` for each `ConnectionFactory`.

Application code is required to retrieve the R2DBC `Connection` through
`ConnectionFactoryUtils.getConnection(ConnectionFactory)`, instead of R2DBC’s standard
`ConnectionFactory.create()`. All framework classes (such as `DatabaseClient`) use this
strategy implicitly. If not used with a transaction manager, the lookup strategy behaves
exactly like `ConnectionFactory.create()` and can therefore be used in any case.
