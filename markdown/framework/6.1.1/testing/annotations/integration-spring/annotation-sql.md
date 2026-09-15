---
title: "`@Sql`"
source: "ROOT:testing/annotations/integration-spring/annotation-sql.adoc"
---

<a id="spring-testing-annotation-sql"></a>

# `@Sql`

`@Sql` is used to annotate a test class or test method to configure SQL scripts to be run
against a given database during integration tests. The following example shows how to use
it:

#### Java

```java
@Test
@Sql({"/test-schema.sql", "/test-user-data.sql"}) // <1>
void userTest() {
	// run code that relies on the test schema and test data
}
```

1. Run two scripts for this test.

#### Kotlin

```kotlin
@Test
@Sql("/test-schema.sql", "/test-user-data.sql") // <1>
fun userTest() {
	// run code that relies on the test schema and test data
}
```

1. Run two scripts for this test.

See [Executing SQL scripts declaratively with @Sql](../../testcontext-framework/executing-sql.md#testcontext-executing-sql-declaratively) for further details.
