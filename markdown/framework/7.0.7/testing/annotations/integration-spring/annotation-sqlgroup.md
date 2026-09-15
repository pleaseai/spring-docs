---
title: "`@SqlGroup`"
source: "ROOT:testing/annotations/integration-spring/annotation-sqlgroup.adoc"
---

<a id="spring-testing-annotation-sqlgroup"></a>

# `@SqlGroup`

`@SqlGroup` is a container annotation that aggregates several `@Sql` annotations. You can
use `@SqlGroup` natively to declare several nested `@Sql` annotations, or you can use it
in conjunction with Java’s support for repeatable annotations, where `@Sql` can be
declared several times on the same class or method, implicitly generating this container
annotation. The following example shows how to declare an SQL group:

#### Java

```java
@Test
@SqlGroup({ // <1>
	@Sql(scripts = "/test-schema.sql", config = @SqlConfig(commentPrefix = "`")),
	@Sql("/test-user-data.sql")
})
void userTest() {
	// run code that uses the test schema and test data
}
```

1. Declare a group of SQL scripts.

#### Kotlin

```kotlin
@Test
@SqlGroup( // <1>
	Sql("/test-schema.sql", config = SqlConfig(commentPrefix = "`")),
	Sql("/test-user-data.sql"))
fun userTest() {
	// run code that uses the test schema and test data
}
```

1. Declare a group of SQL scripts.
