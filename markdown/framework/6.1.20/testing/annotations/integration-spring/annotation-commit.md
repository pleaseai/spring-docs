---
title: "`@Commit`"
source: "ROOT:testing/annotations/integration-spring/annotation-commit.adoc"
---

<a id="spring-testing-annotation-commit"></a>

# `@Commit`

`@Commit` indicates that the transaction for a transactional test method should be
committed after the test method has completed. You can use `@Commit` as a direct
replacement for `@Rollback(false)` to more explicitly convey the intent of the code.
Analogous to `@Rollback`, `@Commit` can also be declared as a class-level or method-level
annotation.

The following example shows how to use the `@Commit` annotation:

#### Java

```java
@Commit // <1>
@Test
void testProcessWithoutRollback() {
	// ...
}
```

1. Commit the result of the test to the database.

#### Kotlin

```kotlin
@Commit // <1>
@Test
fun testProcessWithoutRollback() {
	// ...
}
```

1. Commit the result of the test to the database.
