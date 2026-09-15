---
title: "JDBC Testing Support"
source: "ROOT:testing/support-jdbc.adoc"
---

<a id="integration-testing-support-jdbc"></a>

# JDBC Testing Support

<a id="integration-testing-support-jdbc-test-utils"></a>

## JdbcTestUtils

The `org.springframework.test.jdbc` package contains `JdbcTestUtils`, which is a
collection of JDBC-related utility functions intended to simplify standard database
testing scenarios. Specifically, `JdbcTestUtils` provides the following static utility
methods.

- `countRowsInTable(..)`: Counts the number of rows in the given table.
- `countRowsInTableWhere(..)`: Counts the number of rows in the given table by using the
provided `WHERE` clause.
- `deleteFromTables(..)`: Deletes all rows from the specified tables.
- `deleteFromTableWhere(..)`: Deletes rows from the given table by using the provided
`WHERE` clause.
- `dropTables(..)`: Drops the specified tables.

> [!TIP]
> [`AbstractTransactionalJUnit4SpringContextTests`](testcontext-framework/support-classes.md#testcontext-support-classes-junit4)
> and [`AbstractTransactionalTestNGSpringContextTests`](testcontext-framework/support-classes.md#testcontext-support-classes-testng)
> provide convenience methods that delegate to the aforementioned methods in
> `JdbcTestUtils`.

<a id="integration-testing-support-jdbc-embedded-database"></a>

## Embedded Databases

The `spring-jdbc` module provides support for configuring and launching an embedded
database, which you can use in integration tests that interact with a database.
For details, see [Embedded Database Support](../data-access/jdbc/embedded-database-support.md)
 and [Testing Data Access
Logic with an Embedded Database](../data-access/jdbc/embedded-database-support.md#jdbc-embedded-database-dao-testing).
