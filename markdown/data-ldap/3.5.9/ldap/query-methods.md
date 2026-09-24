---
title: "Query Methods"
source: "ROOT:ldap/query-methods.adoc"
---

<a id="ldap.repositories.queries"></a>

# Query Methods

Most of the data access operations you usually trigger on a repository result in a query being run against the LDAP directory.
Defining such a query is a matter of declaring a method on the repository interface, as the following example shows:

#### PersonRepository with query methods

```java
interface PersonRepository extends PagingAndSortingRepository<Person, String> {

    List<Person> findByLastname(String lastname);                            <1>

    List<Person> findByLastnameFirstname(String lastname, String firstname); <2>
}
```

1. The method shows a query for all people with the given `lastname`.
The query is derived by parsing the method name for constraints that can be concatenated with `And` and `Or`.
Thus, the method name results in a query expression of `(&(objectclass=person)(lastname=lastname))`.
1. The method shows a query for all people with the given `lastname` and `firstname`.
The query is derived by parsing the method name.
Thus, the method name results in a query expression of `(&(objectclass=person)(lastname=lastname)(firstname=firstname))`.

The following table provides samples of the keywords that you can use with query methods:

| Keyword | Sample | Logical result |
| --- | --- | --- |
| `LessThanEqual` | `findByAgeLessThanEqual(int age)` | `(attribute⇐age)` |
| `GreaterThanEqual` | `findByAgeGreaterThanEqual(int age)` | `(attribute>=age)` |
| `IsNotNull`, `NotNull` | `findByFirstnameNotNull()` | `(firstname=*)` |
| `IsNull`, `Null` | `findByFirstnameNull()` | `(!(firstname=*))` |
| `Like` | `findByFirstnameLike(String name)` | `(firstname=name)` |
| `NotLike`, `IsNotLike` | `findByFirstnameNotLike(String name)` | `(!(firstname=name*))` |
| `StartingWith` | `findByStartingWith(String name)` | `(firstname=name*)` |
| `EndingWith` | `findByFirstnameLike(String name)` | `(firstname=*name)` |
| `Containing` | `findByFirstnameLike(String name)` | `(firstname=*name*)` |
| `(No keyword)` | `findByFirstname(String name)` | `(Firstname=name)` |
| `Not` | `findByFirstnameNot(String name)` | `(!(Firstname=name))` |

<a id="ldap.query-methods.at-query"></a>

## Using `@Query`

If you need to use a custom query that can’t be derived from the method name, you can use the `@Query` annotation to define the query.
As queries are tied to the Java method that runs them, you can actually bind parameters to be passed to the query.

The following example shows a query created with the `@Query` annotation:

```java
interface PersonRepository extends LdapRepository<Person, Long> {

  @Query("(&(employmentType=*)(!(employmentType=Hired))(mail=:emailAddress))")
  Person findEmployeeByEmailAddress(String emailAddress);

}
```

> [!NOTE]
> Spring Data supports named (parameter names prefixed with `:`) and positional parameter binding (in the form of zero-based `?0`).
> We recommend using named parameters for easier readability.
> Also, using positional parameters makes query methods a little error-prone when refactoring regarding the parameter position.

<a id="ldap.encoding"></a>

## Parameter Encoding

Query parameters of String-based queries are encoded according to [RFC2254](https://datatracker.ietf.org/doc/html/rfc2254).
This can lead to undesired escaping of certain characters.
You can specify your own encoder through the `@LdapEncode` annotation that defines which [`LdapEncoder`](https://docs.spring.io/spring-data/ldap/docs/3.5.9/api/org/springframework/data/ldap/repository/LdapEncoder.html) to use.

`@LdapEncode` applies to individual parameters of a query method.
It is not applies for derived queries or Value Expressions (SpEL, Property Placeholders).

```java
interface PersonRepository extends LdapRepository<Person, Long> {

  @Query("(&(employmentType=*)(!(employmentType=Hired))(firstName=:firstName))")
  Person findEmployeeByFirstNameLike(@LdapEncode(MyLikeEncoder.class) String firstName);

}
```

<a id="ldap.query.spel-expressions"></a>

## Using SpEL Expressions

Spring Data allows you to use SpEL expressions in your query methods.
SpEL expressions are part of Spring Data’s [Value Expressions](value-expressions.md) support.
SpEL expressions can be used to manipulate query method arguments as well as to invoke bean methods.
Method arguments can be accessed by name or index as demonstrated in the following example.

```java
@Query("(&(firstName=?#{[0]})(mail=:?#{principal.emailAddress}))")
List<Person> findByFirstnameAndCurrentUserWithCustomQuery(String firstname);
```

> [!NOTE]
> Values provided by SpEL expressions are not escaped according to RFC2254.
> You have to ensure that the values are properly escaped if needed.
> Consider using Spring Ldap’s `org.springframework.ldap.support.LdapEncoder` helper class.

<a id="ldap.query.property-placeholders"></a>

## Using Property Placeholders

Property Placeholders (see [Value Expressions](value-expressions.md)) can help to easily customize your queries based on configuration properties from Spring’s `Environment`.
These are useful for queries that need to be customized based on the environment or configuration.

```java
@Query("(&(firstName=?0)(stage=:?${myapp.stage:dev}))")
List<Person> findByFirstnameAndStageWithCustomQuery(String firstname);
```

> [!NOTE]
> Values provided by Property Placeholders are not escaped according to RFC2254.
> You have to ensure that the values are properly escaped if needed.
> Consider using Spring Ldap’s `org.springframework.ldap.support.LdapEncoder` helper class.
