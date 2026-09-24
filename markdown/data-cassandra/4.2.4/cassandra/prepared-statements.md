---
title: "Prepared Statements"
source: "ROOT:cassandra/prepared-statements.adoc"
---

<a id="cassandra.template.prepared-statements"></a>

# Prepared Statements

CQL statements that are executed multiple times can be prepared and stored in a `PreparedStatement` object to improve query performance.
Both, the driver and Cassandra maintain a mapping of `PreparedStatement` queries to their metadata.
You can use prepared statements through the following abstractions:

- [`CqlTemplate`, `AsyncCqlTemplate`, or `ReactiveCqlTemplate`](cql-template.md) through the choice of API
- [`CassandraTemplate`, `AsyncCassandraTemplate`, or `ReactiveCassandraTemplate`](template.md) by enabling prepared statements
- [Cassandra repositories](../repositories.md) as they are built on top of the Template API

<a id="cassandra.template.prepared-statements.cql"></a>

## Using `CqlTemplate`

The `CqlTemplate` class (and its asynchronous and reactive variants) offers various methods accepting static CQL, `Statement` objects and `PreparedStatementCreator`.
Methods accepting static CQL without additional arguments typically run the CQL statement as-is without further processing.
Methods accepting static CQL in combination with an arguments array (such as `execute(String cql, Object…​ args)` and `queryForRows(String cql, Object…​ args)`) use prepared statements.
Internally, these methods create a `PreparedStatementCreator` and `PreparedStatementBinder` objects to prepare the statement and later on to bind values to the statement to run it.
Spring Data Cassandra generally uses index-based parameter bindings for prepared statements.

Since Cassandra Driver version 4, prepared statements are cached on the driver level which removes the need to keep track of prepared statements in the application.

The following example shows how to issue a query with a parametrized prepared statement:

#### Imperative

```java
String lastName = cqlTemplate.queryForObject(
		"SELECT last_name FROM t_actor WHERE id = ?",
		String.class, 1212L);
```

#### Reactive

```java
Mono<String> lastName = reactiveCqlTemplate.queryForObject(
	"SELECT last_name FROM t_actor WHERE id = ?",
	String.class, 1212L);
```

In cases where you require more control over statement preparation and parameter binding (for example, using named binding parameters), you can fully control prepared statement creation and parameter binding by calling query methods with `PreparedStatementCreator` and `PreparedStatementBinder` arguments:

#### Imperative

```java
List<String> lastNames = cqlTemplate.query(
		session -> session.prepare("SELECT last_name FROM t_actor WHERE id = ?"),
		ps -> ps.bind(1212L),
		(row, rowNum) -> row.getString(0));
```

#### Reactive

```java
Flux<String> lastNames = reactiveCqlTemplate.query(
		session -> session.prepare("SELECT last_name FROM t_actor WHERE id = ?"),
		ps -> ps.bind(1212L),
		(row, rowNum) -> row.getString(0));
```

Spring Data Cassandra ships with classes supporting that pattern in the `cql` package:

- `SimplePreparedStatementCreator` - utility class to create a prepared statement.
- `ArgumentPreparedStatementBinder` - utility class to bind arguments to a prepared statement.

<a id="cassandra.template.prepared-statements.cassandra-template"></a>

### Using `CassandraTemplate`

The `CassandraTemplate` class is built on top of `CqlTemplate` to provide a higher level of abstraction.
The use of prepared statements can be controlled directly on `CassandraTemplate` (and its asynchronous and reactive variants) by calling `setUsePreparedStatements(false)` respective `setUsePreparedStatements(true)`.
Note that the use of prepared statements by `CassandraTemplate` is enabled by default.

The following example shows the use of methods that generate and that accept CQL:

#### Imperative

```java
template.setUsePreparedStatements(true);

Actor actorByQuery = template.selectOne(query(where("id").is(42)), Actor.class);

Actor actorByStatement = template.selectOne(
		SimpleStatement.newInstance("SELECT id, name FROM actor WHERE id = ?", 42),
		Actor.class);
```

#### Reactive

```java
template.setUsePreparedStatements(true);

Mono<Actor> actorByQuery = template.selectOne(query(where("id").is(42)), Actor.class);

Mono<Actor> actorByStatement = template.selectOne(
		SimpleStatement.newInstance("SELECT id, name FROM actor WHERE id = ?", 42),
		Actor.class);
```

Calling entity-bound methods such as `select(Query, Class<T>)` or `update(Query, Update, Class<T>)` build CQL statements themselves to perform the intended operations.
Some `CassandraTemplate` methods (such as `select(Statement<?>, Class<T>)`) also accepts CQL `Statement` objects as part of their API.

It’s possible to participate in prepared statements when calling methods accepting a `Statement` with a `SimpleStatement` object.
The template API extracts the query string and parameters (positional and named parameters) and uses these to prepare, bind, and run the statement.
Non-`SimpleStatement` objects cannot be used with prepared statements.

<a id="cassandra.template.prepared-statements.caching"></a>

## Caching Prepared Statements

Since Cassandra driver 4.0, prepared statements are cached by the `CqlSession` cache so it is okay to prepare the same string twice.
Previous versions required caching of prepared statements outside of the driver.
See also the [Driver documentation on Prepared Statements](https://docs.datastax.com/en/developer/java-driver/latest/manual/core/statements/prepared/) for further reference.
