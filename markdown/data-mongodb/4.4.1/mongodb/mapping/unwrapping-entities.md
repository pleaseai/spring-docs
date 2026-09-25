---
title: "Unwrapping Types"
source: "ROOT:mongodb/mapping/unwrapping-entities.adoc"
---

<a id="unwrapped-entities"></a>

# Unwrapping Types

Unwrapped entities are used to design value objects in your Java domain model whose properties are flattened out into the parent’s MongoDB Document.

<a id="unwrapped-entities.mapping"></a>

## Unwrapped Types Mapping

Consider the following domain model where `User.name` is annotated with `@Unwrapped`.
The `@Unwrapped` annotation signals that all properties of `UserName` should be flattened out into the `user` document that owns the `name` property.

```java
class User {

    @Id
    String userId;

    @Unwrapped(onEmpty = USE_NULL) <1>
    UserName name;
}

class UserName {

    String firstname;

    String lastname;

}
```

```json
{
  "_id" : "1da2ba06-3ba7",
  "firstname" : "Emma",
  "lastname" : "Frost"
}
```

1. When loading the `name` property its value is set to `null` if both `firstname` and `lastname` are either `null` or not present.
By using `onEmpty=USE_EMPTY` an empty `UserName`, with potential `null` value for its properties, will be created.

For less verbose embeddable type declarations use `@Unwrapped.Nullable` and `@Unwrapped.Empty` instead `@Unwrapped(onEmpty = USE_NULL)` and `@Unwrapped(onEmpty = USE_EMPTY)`.
Both annotations are meta-annotated with JSR-305 `@javax.annotation.Nonnull` to aid with nullability inspections.

> [!WARNING]
> It is possible to use complex types within an unwrapped object.
> However, those must not be, nor contain unwrapped fields themselves.

<a id="unwrapped-entities.mapping.field-names"></a>

## Unwrapped Types field names

A value object can be unwrapped multiple times by using the optional `prefix` attribute of the `@Unwrapped` annotation.
By dosing so the chosen prefix is prepended to each property or `@Field("…")` name in the unwrapped object.
Please note that values will overwrite each other if multiple properties render to the same field name.

```java
class User {

    @Id
    String userId;

    @Unwrapped.Nullable(prefix = "u_") <1>
    UserName name;

    @Unwrapped.Nullable(prefix = "a_") <2>
    UserName name;
}

class UserName {

    String firstname;

    String lastname;
}
```

```json
{
  "_id" : "a6a805bd-f95f",
  "u_firstname" : "Jean",             <1>
  "u_lastname" : "Grey",
  "a_firstname" : "Something",        <2>
  "a_lastname" : "Else"
}
```

1. All properties of `UserName` are prefixed with `u_`.
1. All properties of `UserName` are prefixed with `a_`.

While combining the `@Field` annotation with `@Unwrapped` on the very same property does not make sense and therefore leads to an error.
It is a totally valid approach to use `@Field` on any of the unwrapped types properties.

```java
public class User {

	@Id
    private String userId;

    @Unwrapped.Nullable(prefix = "u-") <1>
    UserName name;
}

public class UserName {

	@Field("first-name")              <2>
    private String firstname;

	@Field("last-name")
    private String lastname;
}
```

```json
{
  "_id" : "2647f7b9-89da",
  "u-first-name" : "Barbara",         <2>
  "u-last-name" : "Gordon"
}
```

1. All properties of `UserName` are prefixed with `u-`.
1. Final field names are a result of concatenating `@Unwrapped(prefix)` and `@Field(name)`.

<a id="unwrapped-entities.queries"></a>

## Query on Unwrapped Objects

Defining queries on unwrapped properties is possible on type- as well as field-level as the provided `Criteria` is matched against the domain type.
Prefixes and potential custom field names will be considered when rendering the actual query.
Use the property name of the unwrapped object to match against all contained fields as shown in the sample below.

```java
UserName userName = new UserName("Carol", "Danvers")
Query findByUserName = query(where("name").is(userName));
User user = template.findOne(findByUserName, User.class);
```

```json
db.collection.find({
  "firstname" : "Carol",
  "lastname" : "Danvers"
})
```

It is also possible to address any field of the unwrapped object directly using its property name as shown in the snippet below.

```java
Query findByUserFirstName = query(where("name.firstname").is("Shuri"));
List<User> users = template.findAll(findByUserFirstName, User.class);
```

```json
db.collection.find({
  "firstname" : "Shuri"
})
```

<a id="unwrapped-entities.queries.sort"></a>

### Sort by unwrapped field.

Fields of unwrapped objects can be used for sorting via their property path as shown in the sample below.

```java
Query findByUserLastName = query(where("name.lastname").is("Romanoff"));
List<User> user = template.findAll(findByUserName.withSort(Sort.by("name.firstname")), User.class);
```

```json
db.collection.find({
  "lastname" : "Romanoff"
}).sort({ "firstname" : 1 })
```

> [!NOTE]
> Though possible, using the unwrapped object itself as sort criteria includes all of its fields in unpredictable order and may result in inaccurate ordering.

<a id="unwrapped-entities.queries.project"></a>

### Field projection on unwrapped objects

Fields of unwrapped objects can be subject for projection either as a whole or via single fields as shown in the samples below.

```java
Query findByUserLastName = query(where("name.firstname").is("Gamora"));
findByUserLastName.fields().include("name");                             <1>
List<User> user = template.findAll(findByUserName, User.class);
```

```json
db.collection.find({
  "lastname" : "Gamora"
},
{
  "firstname" : 1,
  "lastname" : 1
})
```

1. A field projection on an unwrapped object includes all of its properties.

```java
Query findByUserLastName = query(where("name.lastname").is("Smoak"));
findByUserLastName.fields().include("name.firstname");                   <1>
List<User> user = template.findAll(findByUserName, User.class);
```

```json
db.collection.find({
  "lastname" : "Smoak"
},
{
  "firstname" : 1
})
```

1. A field projection on an unwrapped object includes all of its properties.

<a id="unwrapped-entities.queries.by-example"></a>

### Query By Example on unwrapped object.

Unwrapped objects can be used within an `Example` probe just as any other type.
Please review the [Query By Example](../template-query-operations.md#mongo.query-by-example) section, to learn more about this feature.

<a id="unwrapped-entities.queries.repository"></a>

### Repository Queries on unwrapped objects.

The `Repository` abstraction allows deriving queries on fields of unwrapped objects as well as the entire object.

```java
interface UserRepository extends CrudRepository<User, String> {

	List<User> findByName(UserName username);         <1>

	List<User> findByNameFirstname(String firstname); <2>
}
```

1. Matches against all fields of the unwrapped object.
1. Matches against the `firstname`.

> [!NOTE]
> Index creation for unwrapped objects is suspended even if the repository `create-query-indexes` namespace attribute is set to `true`.

<a id="unwrapped-entities.update"></a>

## Update on Unwrapped Objects

Unwrapped objects can be updated as any other object that is part of the domain model.
The mapping layer takes care of flattening structures into their surroundings.
It is possible to update single attributes of the unwrapped object as well as the entire value as shown in the examples below.

```java
Update update = new Update().set("name.firstname", "Janet");
template.update(User.class).matching(where("id").is("Wasp"))
   .apply(update).first()
```

```json
db.collection.update({
  "_id" : "Wasp"
},
{
  "$set" { "firstname" : "Janet" }
},
{ ... }
)
```

```java
Update update = new Update().set("name", new Name("Janet", "van Dyne"));
template.update(User.class).matching(where("id").is("Wasp"))
   .apply(update).first()
```

```json
db.collection.update({
  "_id" : "Wasp"
},
{
  "$set" {
    "firstname" : "Janet",
    "lastname" : "van Dyne",
  }
},
{ ... }
)
```

<a id="unwrapped-entities.aggregations"></a>

## Aggregations on Unwrapped Objects

The [Aggregation Framework](../aggregation-framework.md) will attempt to map unwrapped values of typed aggregations.
Please make sure to work with the property path including the wrapper object when referencing one of its values.
Other than that no special action is required.

<a id="unwrapped-entities.indexes"></a>

## Index on Unwrapped Objects

It is possible to attach the `@Indexed` annotation to properties of an unwrapped type just as it is done with regular objects.
It is not possible to use `@Indexed` along with the `@Unwrapped` annotation on the owning property.

```java
public class User {

	@Id
    private String userId;

    @Unwrapped(onEmpty = USE_NULL)
    UserName name;                    <1>

    // Invalid -> InvalidDataAccessApiUsageException
    @Indexed                          <2>
    @Unwrapped(onEmpty = USE_Empty)
    Address address;
}

public class UserName {

    private String firstname;

    @Indexed
    private String lastname;           <1>
}
```

1. Index created for `lastname` in `users` collection.
1. Invalid `@Indexed` usage along with `@Unwrapped`
