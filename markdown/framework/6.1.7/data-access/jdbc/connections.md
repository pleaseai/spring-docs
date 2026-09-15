---
title: "Controlling Database Connections"
source: "ROOT:data-access/jdbc/connections.adoc"
---

<a id="jdbc-connections"></a>

# Controlling Database Connections

This section covers:

- [Using `DataSource`](#jdbc-datasource)
- [Using `DataSourceUtils`](#jdbc-DataSourceUtils)
- [Implementing `SmartDataSource`](#jdbc-SmartDataSource)
- [Extending `AbstractDataSource`](#jdbc-AbstractDataSource)
- [Using `SingleConnectionDataSource`](#jdbc-SingleConnectionDataSource)
- [Using `DriverManagerDataSource`](#jdbc-DriverManagerDataSource)
- [Using `TransactionAwareDataSourceProxy`](#jdbc-TransactionAwareDataSourceProxy)
- [Using `DataSourceTransactionManager` / `JdbcTransactionManager`](#jdbc-DataSourceTransactionManager)

<a id="jdbc-datasource"></a>

## Using `DataSource`

Spring obtains a connection to the database through a `DataSource`. A `DataSource` is
part of the JDBC specification and is a generalized connection factory. It lets a
container or a framework hide connection pooling and transaction management issues
from the application code. As a developer, you need not know details about how to
connect to the database. That is the responsibility of the administrator who sets up
the datasource. You most likely fill both roles as you develop and test code, but you
do not necessarily have to know how the production data source is configured.

When you use Spring’s JDBC layer, you can obtain a data source from JNDI, or you can
configure your own with a connection pool implementation provided by a third party.
Traditional choices are Apache Commons DBCP and C3P0 with bean-style `DataSource` classes;
for a modern JDBC connection pool, consider HikariCP with its builder-style API instead.

> [!NOTE]
> You should use the `DriverManagerDataSource` and `SimpleDriverDataSource` classes
> (as included in the Spring distribution) only for testing purposes! Those variants do not
> provide pooling and perform poorly when multiple requests for a connection are made.

The following section uses Spring’s `DriverManagerDataSource` implementation.
Several other `DataSource` variants are covered later.

To configure a `DriverManagerDataSource`:

1. Obtain a connection with `DriverManagerDataSource` as you typically obtain a JDBC
connection.
1. Specify the fully qualified class name of the JDBC driver so that the `DriverManager`
can load the driver class.
1. Provide a URL that varies between JDBC drivers. (See the documentation for your driver
for the correct value.)
1. Provide a username and a password to connect to the database.

The following example shows how to configure a `DriverManagerDataSource` in Java:

#### Java

```java
DriverManagerDataSource dataSource = new DriverManagerDataSource();
dataSource.setDriverClassName("org.hsqldb.jdbcDriver");
dataSource.setUrl("jdbc:hsqldb:hsql://localhost:");
dataSource.setUsername("sa");
dataSource.setPassword("");
```

#### Kotlin

```kotlin
val dataSource = DriverManagerDataSource().apply {
	setDriverClassName("org.hsqldb.jdbcDriver")
	url = "jdbc:hsqldb:hsql://localhost:"
	username = "sa"
	password = ""
}
```

The following example shows the corresponding XML configuration:

```xml
<bean id="dataSource" class="org.springframework.jdbc.datasource.DriverManagerDataSource">
	<property name="driverClassName" value="${jdbc.driverClassName}"/>
	<property name="url" value="${jdbc.url}"/>
	<property name="username" value="${jdbc.username}"/>
	<property name="password" value="${jdbc.password}"/>
</bean>

<context:property-placeholder location="jdbc.properties"/>
```

The next two examples show the basic connectivity and configuration for DBCP and C3P0.
To learn about more options that help control the pooling features, see the product
documentation for the respective connection pooling implementations.

The following example shows DBCP configuration:

```xml
<bean id="dataSource" class="org.apache.commons.dbcp.BasicDataSource" destroy-method="close">
	<property name="driverClassName" value="${jdbc.driverClassName}"/>
	<property name="url" value="${jdbc.url}"/>
	<property name="username" value="${jdbc.username}"/>
	<property name="password" value="${jdbc.password}"/>
</bean>

<context:property-placeholder location="jdbc.properties"/>
```

The following example shows C3P0 configuration:

```xml
<bean id="dataSource" class="com.mchange.v2.c3p0.ComboPooledDataSource" destroy-method="close">
	<property name="driverClass" value="${jdbc.driverClassName}"/>
	<property name="jdbcUrl" value="${jdbc.url}"/>
	<property name="user" value="${jdbc.username}"/>
	<property name="password" value="${jdbc.password}"/>
</bean>

<context:property-placeholder location="jdbc.properties"/>
```

<a id="jdbc-DataSourceUtils"></a>

## Using `DataSourceUtils`

The `DataSourceUtils` class is a convenient and powerful helper class that provides
`static` methods to obtain connections from JNDI and close connections if necessary.
It supports a thread-bound JDBC `Connection` with `DataSourceTransactionManager` but
also with `JtaTransactionManager` and `JpaTransactionManager`.

Note that `JdbcTemplate` implies `DataSourceUtils` connection access, using it
behind every JDBC operation, implicitly participating in an ongoing transaction.

<a id="jdbc-SmartDataSource"></a>

## Implementing `SmartDataSource`

The `SmartDataSource` interface should be implemented by classes that can provide a
connection to a relational database. It extends the `DataSource` interface to let
classes that use it query whether the connection should be closed after a given
operation. This usage is efficient when you know that you need to reuse a connection.

<a id="jdbc-AbstractDataSource"></a>

## Extending `AbstractDataSource`

`AbstractDataSource` is an `abstract` base class for Spring’s `DataSource`
implementations. It implements code that is common to all `DataSource` implementations.
You should extend the `AbstractDataSource` class if you write your own `DataSource`
implementation.

<a id="jdbc-SingleConnectionDataSource"></a>

## Using `SingleConnectionDataSource`

The `SingleConnectionDataSource` class is an implementation of the `SmartDataSource`
interface that wraps a single `Connection` that is not closed after each use.
This is not multi-threading capable.

If any client code calls `close` on the assumption of a pooled connection (as when using
persistence tools), you should set the `suppressClose` property to `true`. This setting
returns a close-suppressing proxy that wraps the physical connection. Note that you can
no longer cast this to a native Oracle `Connection` or a similar object.

`SingleConnectionDataSource` is primarily a test class. It typically enables easy testing
of code outside an application server, in conjunction with a simple JNDI environment.
In contrast to `DriverManagerDataSource`, it reuses the same connection all the time,
avoiding excessive creation of physical connections.

<a id="jdbc-DriverManagerDataSource"></a>

## Using `DriverManagerDataSource`

The `DriverManagerDataSource` class is an implementation of the standard `DataSource`
interface that configures a plain JDBC driver through bean properties and returns a new
`Connection` every time.

This implementation is useful for test and stand-alone environments outside of a Jakarta EE
container, either as a `DataSource` bean in a Spring IoC container or in conjunction
with a simple JNDI environment. Pool-assuming `Connection.close()` calls
close the connection, so any `DataSource`-aware persistence code should work. However,
using JavaBean-style connection pools (such as `commons-dbcp`) is so easy, even in a test
environment, that it is almost always preferable to use such a connection pool over
`DriverManagerDataSource`.

<a id="jdbc-TransactionAwareDataSourceProxy"></a>

## Using `TransactionAwareDataSourceProxy`

`TransactionAwareDataSourceProxy` is a proxy for a target `DataSource`. The proxy wraps that
target `DataSource` to add awareness of Spring-managed transactions. In this respect, it
is similar to a transactional JNDI `DataSource`, as provided by a Jakarta EE server.

> [!NOTE]
> It is rarely desirable to use this class, except when already existing code must be
> called and passed a standard JDBC `DataSource` interface implementation. In this case,
> you can still have this code be usable and, at the same time, have this code
> participating in Spring managed transactions. It is generally preferable to write your
> own new code by using the higher level abstractions for resource management, such as
> `JdbcTemplate` or `DataSourceUtils`.

See the [`TransactionAwareDataSourceProxy`](https://docs.spring.io/spring-framework/docs/6.1.7/javadoc-api/org/springframework/jdbc/datasource/TransactionAwareDataSourceProxy.html)
javadoc for more details.

<a id="jdbc-DataSourceTransactionManager"></a>

## Using `DataSourceTransactionManager` / `JdbcTransactionManager`

The `DataSourceTransactionManager` class is a `PlatformTransactionManager`
implementation for a single JDBC `DataSource`. It binds a JDBC `Connection`
from the specified `DataSource` to the currently executing thread, potentially
allowing for one thread-bound `Connection` per `DataSource`.

Application code is required to retrieve the JDBC `Connection` through
`DataSourceUtils.getConnection(DataSource)` instead of Java EE’s standard
`DataSource.getConnection`. It throws unchecked `org.springframework.dao` exceptions
instead of checked `SQLExceptions`. All framework classes (such as `JdbcTemplate`) use
this strategy implicitly. If not used with a transaction manager, the lookup strategy
behaves exactly like `DataSource.getConnection` and can therefore be used in any case.

The `DataSourceTransactionManager` class supports savepoints (`PROPAGATION_NESTED`),
custom isolation levels, and timeouts that get applied as appropriate JDBC statement
query timeouts. To support the latter, application code must either use `JdbcTemplate` or
call the `DataSourceUtils.applyTransactionTimeout(..)` method for each created statement.

You can use `DataSourceTransactionManager` instead of `JtaTransactionManager` in the
single-resource case, as it does not require the container to support a JTA transaction
coordinator. Switching between these transaction managers is just a matter of configuration,
provided you stick to the required connection lookup pattern. Note that JTA does not support
savepoints or custom isolation levels and has a different timeout mechanism but otherwise
exposes similar behavior in terms of JDBC resources and JDBC commit/rollback management.

For JTA-style lazy retrieval of actual resource connections, Spring provides a
corresponding `DataSource` proxy class for the target connection pool: see
[`LazyConnectionDataSourceProxy`](https://docs.spring.io/spring-framework/docs/6.1.7/javadoc-api/org/springframework/jdbc/datasource/LazyConnectionDataSourceProxy.html).
This is particularly useful for potentially empty transactions without actual statement
execution (never fetching an actual resource in such a scenario), and also in front of
a routing `DataSource` which means to take the transaction-synchronized read-only flag
and/or isolation level into account (e.g. `IsolationLevelDataSourceRouter`).

`LazyConnectionDataSourceProxy` also provides special support for a read-only connection
pool to use during a read-only transaction, avoiding the overhead of switching the JDBC
Connection’s read-only flag at the beginning and end of every transaction when fetching
it from the primary connection pool (which may be costly depending on the JDBC driver).

> [!NOTE]
> As of 5.3, Spring provides an extended `JdbcTransactionManager` variant which adds
> exception translation capabilities on commit/rollback (aligned with `JdbcTemplate`).
> Where `DataSourceTransactionManager` will only ever throw `TransactionSystemException`
> (analogous to JTA), `JdbcTransactionManager` translates database locking failures etc to
> corresponding `DataAccessException` subclasses. Note that application code needs to be
> prepared for such exceptions, not exclusively expecting `TransactionSystemException`.
> In scenarios where that is the case, `JdbcTransactionManager` is the recommended choice.

In terms of exception behavior, `JdbcTransactionManager` is roughly equivalent to
`JpaTransactionManager` and also to `R2dbcTransactionManager`, serving as an immediate
companion/replacement for each other. `DataSourceTransactionManager` on the other hand
is equivalent to `JtaTransactionManager` and can serve as a direct replacement there.
