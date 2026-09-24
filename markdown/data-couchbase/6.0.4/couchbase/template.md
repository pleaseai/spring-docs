---
title: "Template & direct operations"
source: "ROOT:couchbase/template.adoc"
---

<a id="couchbase.template"></a>

# Template & direct operations

The template provides lower level access to the underlying database and also serves as the foundation for repositories.
Any time a repository is too high-level for you needs chances are good that the templates will serve you well. Note that
you can always drop into the SDK directly through the beans exposed on the `AbstractCouchbaseConfiguration`.

<a id="template.ops"></a>

## Supported operations

The template can be accessed through the `couchbaseTemplate`  and `reactiveCouchbaseTemplate` beans out of your context.
Once you’ve got a reference to it, you can run all kinds of operations against it.
Other than through a repository, in a template you need to always specify the target entity type which you want to get converted.

The templates use a fluent-style API which allows you to chain in optional operators as needed. As an example, here is
how you store a user and then find it again by its ID:

```java
// Create an Entity
User user = new User(UUID.randomUUID().toString(), "firstname", "lastname");

// Upsert it
couchbaseTemplate.upsertById(User.class).one(user);

// Retrieve it again
User found = couchbaseTemplate.findById(User.class).one(user.getId());
```

If you wanted to use a custom (by default durability options from the `@Document` annotation will be used) durability requirement for the `upsert` operation you can chain it in:

```java
User modified = couchbaseTemplate
  .upsertById(User.class)
  .withDurability(DurabilityLevel.MAJORITY)
  .one(user);
```

In a similar fashion, you can perform a N1QL operation:

```java
final List<User> foundUsers = couchbaseTemplate
  .findByQuery(User.class)
  .consistentWith(QueryScanConsistency.REQUEST_PLUS)
  .all();
```

<a id="template.sub-document-ops"></a>

## Sub-Document Operations

Couchbase supports [Sub-Document Operations](https://docs.couchbase.com/java-sdk/current/howtos/subdocument-operations.html). This section documents how to use it with Spring Data Couchbase.

Sub-Document operations may be quicker and more network-efficient than full-document operations such as upsert or replace because they only transmit the accessed sections of the document over the network.

Sub-Document operations are also atomic, in that if one Sub-Document mutation fails then all will, allowing safe modifications to documents with built-in concurrency control.

Currently Spring Data Couchbase supports only sub document mutations (remove, upsert, replace and insert).

Mutation operations modify one or more paths in the document. The simplest of these operations is upsert, which, similar to the fulldoc-level upsert, will either modify the value of an existing path or create it if it does not exist:

Following example will upsert the city field on the address of the user, without trasfering any additional user document data.

```java
User user = new User();
// id field on the base document id required
user.setId(ID);
user.setAddress(address);
couchbaseTemplate.mutateInById(User.class)
    .withUpsertPaths("address.city")
    .one(user);
```

<a id="template.sub-document-ops-multi"></a>

### Executing Multiple Sub-Document Operations

Multiple Sub-Document operations can be executed at once on the same document, allowing you to modify several Sub-Documents at once. When multiple operations are submitted within the context of a single mutateIn command, the server will execute all the operations with the same version of the document.

To execute several mutation operations the method chaining can be used.

```java
couchbaseTemplate.mutateInById(User.class)
    .withInsertPaths("roles", "subuser.firstname")
    .withRemovePaths("address.city")
    .withUpsertPaths("firstname")
    .withReplacePaths("address.street")
    .one(user);
```

<a id="template.sub-document-cas"></a>

### Concurrent Modifications

Concurrent Sub-Document operations on different parts of a document will not conflict so by default the CAS value will be not be supplied when executing the mutations.
If CAS is required then it can be provided like this:

```java
User user = new User();
// id field on the base document id required
user.setId(ID);
// @Version field should have a value for CAS to be supplied
user.setVersion(cas);
user.setAddress(address);
couchbaseTemplate.mutateInById(User.class)
    .withUpsertPaths("address.city")
    .withCasProvided()
    .one(user);
```

<a id="exception-translation"></a>

## Exception Translation

The Spring Framework provides exception translation for a wide variety of database and mapping technologies.
This has traditionally been for JDBC and JPA.
Spring Data Couchbase extends this feature to Couchbase by providing an implementation of the `org.springframework.dao.support.PersistenceExceptionTranslator` interface.

The motivation behind mapping to Spring’s [consistent data access exception hierarchy](https://docs.spring.io/spring-framework/reference/7.0/data-access/dao.html#dao-exceptions)
is to let you write portable and descriptive exception handling code without resorting to coding against and handling specific Couchbase exceptions.
All of Spring’s data access exceptions are inherited from the
`DataAccessException` class, so you can be sure that you can catch all database-related exceptions within a single try-catch block.

`ReactiveCouchbase` propagates exceptions as early as possible.
Exceptions that occur during the processing of the reactive sequence are emitted as error signals.
