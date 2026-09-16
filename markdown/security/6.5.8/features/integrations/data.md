---
title: "Spring Data Integration"
source: "ROOT:features/integrations/data.adoc"
---

<a id="data"></a>

# Spring Data Integration

Spring Security provides Spring Data integration that allows referring to the current user within your queries.
It is not only useful but necessary to include the user in the queries to support paged results since filtering the results afterwards would not scale.

<a id="data-configuration"></a>

## Spring Data & Spring Security Configuration

To use this support, add `org.springframework.security:spring-security-data` dependency and provide a bean of type `SecurityEvaluationContextExtension`.
In Java Configuration, this would look like:

#### Java

```java
@Bean
public SecurityEvaluationContextExtension securityEvaluationContextExtension() {
	return new SecurityEvaluationContextExtension();
}
```

#### Kotlin

```kotlin
@Bean
fun securityEvaluationContextExtension(): SecurityEvaluationContextExtension {
    return SecurityEvaluationContextExtension()
}
```

In XML Configuration, this would look like:

```xml
<bean class="org.springframework.security.data.repository.query.SecurityEvaluationContextExtension"/>
```

<a id="data-query"></a>

## Security Expressions within @Query

Now Spring Security can be used within your queries.
For example:

#### Java

```java
@Repository
public interface MessageRepository extends PagingAndSortingRepository<Message,Long> {
	@Query("select m from Message m where m.to.id = ?#{ principal?.id }")
	Page<Message> findInbox(Pageable pageable);
}
```

#### Kotlin

```kotlin
@Repository
interface MessageRepository : PagingAndSortingRepository<Message?, Long?> {
    @Query("select m from Message m where m.to.id = ?#{ principal?.id }")
    fun findInbox(pageable: Pageable?): Page<Message?>?
}
```

This checks to see if the `Authentication.getPrincipal().getId()` is equal to the recipient of the `Message`.
Note that this example assumes you have customized the principal to be an Object that has an id property.
By exposing the `SecurityEvaluationContextExtension` bean, all of the [Common Security Expressions](../../servlet/authorization/method-security.md#authorization-expressions) are available within the Query.
