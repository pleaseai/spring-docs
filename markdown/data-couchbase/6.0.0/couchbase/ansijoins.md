---
title: "ANSI Joins"
source: "ROOT:couchbase/ansijoins.adoc"
---

<a id="couchbase.ansijoins"></a>

# ANSI Joins

This chapter describes hows ANSI joins can be used across entities.
Since 5.5 version, Couchbase server provides support for ANSI joins for joining documents using fields.
Previous versions allowed index & lookup joins, which were supported in SDC only by querying directly through the SDK.

Relationships between entities across repositories can be one to one or one to many.
By defining such relationships, a synchronized view of associated entities can be fetched.

<a id="couchbase.ansijoins.configuration"></a>

## Configuration

Associated entities can be fetched by annotating the entity’s property reference with `@N1qlJoin`.
The prefix `lks` refers to left-hand side key space (current entity) and `rks` refers to the right-hand side key space (associated entity).
The required element for `@N1qlJoin` annotation is the `on` clause, a boolean expression representing the join condition between the left-hand side (`lks`) and the right-hand side (`rks`), which can be fields, constant expressions or any complex N1QL expression.
There could also be an optional `where` clause specified on the annotation for the join, similarly using
`lks` to refer the current entity and `rks` to refer the associated entity.

```java
@Document
public class Author {
      @Id
      String id;

      String name;

      @N1qlJoin(on = "lks.name=rks.authorName")
      List<Book> books;

      @N1qlJoin(on = "lks.name=rks.name")
      Address address;
     ...
}
```

<a id="couchbase.ansijoins.fetchtype"></a>

## Lazy fetching

Associated entities can be lazily fetched upon the first access of the property, this could save on fetching more data than required when loading the entity.
To load the associated entities lazily, `@N1qlJoin` annotation’s element `fetchType`
has to be set to `FetchType.LAZY`.
The default is `FetchType.IMMEDIATE`.

```java
@N1qlJoin(on = "lks.name=rks.authorName", fetchType = FetchType.LAZY)
List<Book> books;
```

<a id="couchbase.ansijoins.joinhints"></a>

## ANSI Join Hints

<a id="use-index-hint"></a>

### Use Index Hint

`index` element on the `@N1qlJoin` can be used to provided the hint for the `lks` (current entity) index and `rightIndex`
element can be used to provided the `rks` (associated entity) index.

<a id="hash-join-hint"></a>

### Hash Join Hint

If the join type is going to be hash join, the hash side can be specified for the `rks` (associated entity).
If the associated entity is on the build side, it can be specified as `HashSide.BUILD` else `HashSide.PROBE`.

<a id="use-keys-hint"></a>

### Use Keys Hint

`keys` element on the `@N1qlJoin` annotation can be used to specify unique document keys to restrict the join key space.
