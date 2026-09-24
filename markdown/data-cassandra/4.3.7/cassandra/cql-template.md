---
title: "CQL Template API"
source: "ROOT:cassandra/cql-template.adoc"
---

<a id="cassandra.cql-template"></a>

# CQL Template API

The [`CqlTemplate`](https://docs.spring.io/spring-data/cassandra/docs/4.3.7/api/org/springframework/data/cassandra/core/cql/CqlTemplate.html) class (and its reactive variant [`ReactiveCqlTemplate`](https://docs.spring.io/spring-data/cassandra/docs/4.3.7/api/org/springframework/data/cassandra/core/cql/ReactiveCqlTemplate.html)) is the central class in the core CQL package.
It handles the creation and release of resources.
It performs the basic tasks of the core CQL workflow, such as statement creation and execution, and leaves application code to provide CQL and extract results.
The `CqlTemplate` class executes CQL queries and update statements, performs iteration over `ResultSet` instances and extraction of returned parameter values.
It also catches CQL exceptions and translates them to the generic, more informative, exception hierarchy defined in the `org.springframework.dao` package.

When you use the `CqlTemplate` for your code, you need only implement callback interfaces, which have a clearly defined contract.
Given a `CqlSession`, the [`PreparedStatementCreator`](https://docs.spring.io/spring-data/cassandra/docs/4.3.7/api/org/springframework/data/cassandra/core/cql/PreparedStatementCreator.html) callback interface creates a [prepared statement](prepared-statements.md#cassandra.template.prepared-statements.cql) with the provided CQL and any necessary parameter arguments.
The [`RowCallbackHandler`](https://docs.spring.io/spring-data/cassandra/docs/4.3.7/api/org/springframework/data/cassandra/core/cql/RowCallbackHandler.html) interface extracts values from each row of a `ResultSet`.

The [`CqlTemplate`](https://docs.spring.io/spring-data/cassandra/docs/4.3.7/api/org/springframework/data/cassandra/core/cql/CqlTemplate.html) can be used within a DAO implementation through direct instantiation with a [`SessionFactory`](https://docs.spring.io/spring-data/cassandra/docs/4.3.7/api/org/springframework/data/cassandra/SessionFactory.html) reference or be configured in the Spring container and given to DAOs as a bean reference. `CqlTemplate` is a foundational building block for [`CassandraTemplate`](template.md).

All CQL issued by this class is logged at the `DEBUG` level under the category corresponding to the fully-qualified class name of the template instance (typically `CqlTemplate`, but it may be different if you use a custom subclass of the `CqlTemplate` class).

You can control fetch size, consistency level, and retry policy defaults by configuring these parameters on the CQL API instances:
[`CqlTemplate`](https://docs.spring.io/spring-data/cassandra/docs/4.3.7/api/org/springframework/data/cassandra/core/cql/CqlTemplate.html), [`AsyncCqlTemplate`](https://docs.spring.io/spring-data/cassandra/docs/4.3.7/api/org/springframework/data/cassandra/core/cql/AsyncCqlTemplate.html), and [`ReactiveCqlTemplate`](https://docs.spring.io/spring-data/cassandra/docs/4.3.7/api/org/springframework/data/cassandra/core/cql/ReactiveCqlTemplate.html).
Defaults apply if the particular query option is not set.

> [!NOTE]
> `CqlTemplate` comes in different execution model flavors.
> The basic `CqlTemplate` uses a blocking execution model.
> You can use `AsyncCqlTemplate` for asynchronous execution and synchronization with `ListenableFuture` instances or
> `ReactiveCqlTemplate` for reactive execution.

<a id="cassandracql-template.examples"></a>

## Examples of `CqlTemplate` Class Usage

This section provides some examples of the `CqlTemplate` class in action.
These examples are not an exhaustive list of all functionality exposed by the `CqlTemplate`.
See the [Javadoc](https://docs.spring.io/spring-data/cassandra/docs/4.3.7/api/org/springframework/data/cassandra/core/cql/CqlTemplate.html) for that.

<a id="cassandra.cql-template.examples.query"></a>

### Querying (SELECT) with `CqlTemplate`

The following query gets the number of rows in a table:

#### Imperative

```java
int rowCount = cqlTemplate.queryForObject("SELECT COUNT(*) FROM t_actor", Integer.class);
```

#### Reactive

```java
Mono<Integer> rowCount = reactiveCqlTemplate.queryForObject("SELECT COUNT(*) FROM t_actor", Integer.class);
```

The following query uses a bind variable:

#### Imperative

```java
int countOfActorsNamedJoe = cqlTemplate.queryForObject(
		"SELECT COUNT(*) FROM t_actor WHERE first_name = ?", Integer.class, "Joe");
```

#### Reactive

```java
Mono<Integer> countOfActorsNamedJoe = reactiveCqlTemplate.queryForObject(
	"SELECT COUNT(*) FROM t_actor WHERE first_name = ?", Integer.class, "Joe");
```

The following example queries for a `String`:

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

The following example queries and populates a single domain object:

#### Imperative

```java
Actor actor = cqlTemplate.queryForObject("SELECT first_name, last_name FROM t_actor WHERE id = ?",
		new RowMapper<Actor>() {
			public Actor mapRow(Row row, int rowNum) {
				Actor actor = new Actor();
				actor.setFirstName(row.getString("first_name"));
				actor.setLastName(row.getString("last_name"));
				return actor;
			}
		}, 1212L);
```

#### Reactive

```java
Mono<Actor> actor = reactiveCqlTemplate.queryForObject(
	"SELECT first_name, last_name FROM t_actor WHERE id = ?",
	new RowMapper<Actor>() {
		public Actor mapRow(Row row, int rowNum) {
			Actor actor = new Actor();
			actor.setFirstName(row.getString("first_name"));
			actor.setLastName(row.getString("last_name"));
			return actor;
		}},
	1212L);
```

The following example queries and populates multiple domain objects:

#### Imperative

```java
List<Actor> actors = cqlTemplate.query(
		"SELECT first_name, last_name FROM t_actor",
		new RowMapper<Actor>() {
			public Actor mapRow(Row row, int rowNum) {
				Actor actor = new Actor();
				actor.setFirstName(row.getString("first_name"));
				actor.setLastName(row.getString("last_name"));
				return actor;
			}
		});
```

#### Reactive

```java
Flux<Actor> actors = reactiveCqlTemplate.query(
"SELECT first_name, last_name FROM t_actor",
	new RowMapper<Actor>() {
		public Actor mapRow(Row row, int rowNum) {
			Actor actor = new Actor();
			actor.setFirstName(row.getString("first_name"));
			actor.setLastName(row.getString("last_name"));
			return actor;
		}
});
```

If the last two snippets of code actually existed in the same application, it would make sense to remove the duplication present in the two `RowMapper` anonymous inner classes and extract them out into a single class (typically a `static` nested class) that can then be referenced by DAO methods.

For example, it might be better to write the last code snippet as follows:

#### Imperative

```java
List<Actor> findAllActors() {
	return cqlTemplate.query("SELECT first_name, last_name FROM t_actor", ActorMapper.INSTANCE);
}

enum ActorMapper implements RowMapper<Actor> {

	INSTANCE;

	public Actor mapRow(Row row, int rowNum) {
		Actor actor = new Actor();
		actor.setFirstName(row.getString("first_name"));
		actor.setLastName(row.getString("last_name"));
		return actor;
	}
}
```

#### Reactive

```java
Flux<Actor> findAllActors() {
	return reactiveCqlTemplate.query("SELECT first_name, last_name FROM t_actor", ActorMapper.INSTANCE);
}

enum ActorMapper implements RowMapper<Actor> {

	INSTANCE;

	public Actor mapRow(Row row, int rowNum) {
		Actor actor = new Actor();
		actor.setFirstName(row.getString("first_name"));
		actor.setLastName(row.getString("last_name"));
		return actor;
	}
}
```

<a id="cassandra.cql-template.examples.update"></a>

### `INSERT`, `UPDATE`, and `DELETE` with `CqlTemplate`

You can use the `execute(…)` method to perform `INSERT`, `UPDATE`, and `DELETE` operations.
Parameter values are usually provided as variable arguments or, alternatively, as an object array.

The following example shows how to perform an `INSERT` operation with `CqlTemplate`:

#### Imperative

```java
cqlTemplate.execute(
		"INSERT INTO t_actor (first_name, last_name) VALUES (?, ?)",
		"Leonor", "Watling");
```

#### Reactive

```java
Mono<Boolean> applied = reactiveCqlTemplate.execute(
	"INSERT INTO t_actor (first_name, last_name) VALUES (?, ?)",
	"Leonor", "Watling");
```

The following example shows how to perform an `UPDATE` operation with `CqlTemplate`:

#### Imperative

```java
cqlTemplate.execute(
		"UPDATE t_actor SET last_name = ? WHERE id = ?",
		"Banjo", 5276L);
```

#### Reactive

```java
Mono<Boolean> applied = reactiveCqlTemplate.execute(
	"UPDATE t_actor SET last_name = ? WHERE id = ?",
	"Banjo", 5276L);
```

The following example shows how to perform an `DELETE` operation with `CqlTemplate`:

#### Imperative

```java
cqlTemplate.execute(
		"DELETE FROM t_actor WHERE id = ?",
		5276L);
```

#### Reactive

```java
Mono<Boolean> applied = reactiveCqlTemplate.execute(
	"DELETE FROM actor WHERE id = ?",
	actorId);
```

<a id="cassandra.cql-template.examples.other"></a>

### Other `CqlTemplate` operations

You can use the `execute(..)` method to execute any arbitrary CQL.
As a result, the method is often used for DDL statements.
It is heavily overloaded with variants that take callback interfaces, bind variable arrays, and so on.

The following example shows how to create and drop a table by using different API objects that are all passed to the `execute()` methods:

```java
		cqlTemplate.execute("CREATE TABLE test_table (id uuid primary key, event text)");

		DropTableSpecification dropper = DropTableSpecification.dropTable("test_table");
		String cql = DropTableCqlGenerator.toCql(dropper);

		cqlTemplate.execute(cql);
```

<a id="cassandra.connections"></a>

## Controlling Cassandra Connections

Applications connect to Apache Cassandra by using `CqlSession` objects.
A Cassandra `CqlSession` keeps track of multiple connections to the individual nodes and is designed to be a thread-safe, long-lived object.
Usually, you can use a single `CqlSession` for the whole application.

Spring acquires a Cassandra `CqlSession` through a `SessionFactory`. `SessionFactory` is part of Spring Data for Apache Cassandra and is a generalized connection factory.
It lets the container or framework hide connection handling and routing issues from the application code.

The following example shows how to configure a default `SessionFactory`:

#### Imperative

```java
CqlSession session = … // get a Cassandra Session

CqlTemplate template = new CqlTemplate();

template.setSessionFactory(new DefaultSessionFactory(session));
```

#### Reactive

```java
CqlSession session = … // get a Cassandra Session

ReactiveCqlTemplate template = new ReactiveCqlTemplate(new DefaultBridgedReactiveSession(session));
```

`CqlTemplate` and other Template API implementations obtain a `CqlSession` for each operation.
Due to their long-lived nature, sessions are not closed after invoking the desired operation.
Responsibility for proper resource disposal lies with the container or framework that uses the session.

You can find various `SessionFactory` implementations within the `org.springframework.data.cassandra.core.cql.session`
package.

<a id="exception-translation"></a>

## Exception Translation

The Spring Framework provides exception translation for a wide variety of database and mapping technologies.
This has traditionally been for JDBC and JPA.
Spring Data for Apache Cassandra extends this feature to Apache Cassandra by providing an implementation of the `org.springframework.dao.support.PersistenceExceptionTranslator` interface.

The motivation behind mapping to Spring’s [consistent data access exception hierarchy](https://docs.spring.io/spring-framework/reference/6.1html/dao.html#dao-exceptions)
is to let you write portable and descriptive exception handling code without resorting to coding against and handling specific Cassandra exceptions.
All of Spring’s data access exceptions are inherited from the
`DataAccessException` class, so you can be sure that you can catch all database-related exceptions within a single try-catch block.

`ReactiveCqlTemplate` and `ReactiveCassandraTemplate` propagate exceptions as early as possible.
Exceptions that occur during the processing of the reactive sequence are emitted as error signals.
