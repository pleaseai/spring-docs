---
title: "`@SqlConfig`"
source: "ROOT:testing/annotations/integration-spring/annotation-sqlconfig.adoc"
---

<a id="spring-testing-annotation-sqlconfig"></a>

# `@SqlConfig`

`@SqlConfig` defines metadata that is used to determine how to parse and run SQL scripts
configured with the `@Sql` annotation. The following example shows how to use it:

#### Java

```java
@Test
@Sql(
	scripts = "/test-user-data.sql",
	config = @SqlConfig(commentPrefix = "`", separator = "@@") // <1>
)
void userTest() {
	// run code that relies on the test data
}
```

1. Set the comment prefix and the separator in SQL scripts.

#### Kotlin

```kotlin
@Test
@Sql("/test-user-data.sql", config = SqlConfig(commentPrefix = "`", separator = "@@")) // <1>
fun userTest() {
	// run code that relies on the test data
}
```

1. Set the comment prefix and the separator in SQL scripts.
