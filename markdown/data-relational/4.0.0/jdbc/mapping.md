---
title: "Mapping"
source: "ROOT:jdbc/mapping.adoc"
---

<a id="mapping"></a>

# Mapping

Rich mapping support is provided by the `MappingJdbcConverter`. `MappingJdbcConverter` has a rich metadata model that allows mapping domain objects to a data row.
The mapping metadata model is populated by using annotations on your domain objects.
However, the infrastructure is not limited to using annotations as the only source of metadata information.
The `MappingJdbcConverter` also lets you map objects to rows without providing any additional metadata, by following a set of conventions.

This section describes the features of the `MappingJdbcConverter`, including how to use conventions for mapping objects to rows and how to override those conventions with annotation-based mapping metadata.

Read on the basics about [object-mapping.adoc](../object-mapping.md) before continuing with this chapter.

<a id="mapping.conventions"></a>

## Convention-based Mapping

`MappingJdbcConverter` has a few conventions for mapping objects to rows when no additional mapping metadata is provided.
The conventions are:

- The short Java class name is mapped to the table name in the following manner.
The `com.bigbank.SavingsAccount` class maps to the `SAVINGS_ACCOUNT` table name.
The same name mapping is applied for mapping fields to column names.
For example, the `firstName` field maps to the `FIRST_NAME` column.
You can control this mapping by providing a custom `NamingStrategy`.
See [Mapping Configuration](#mapping.configuration) for more detail.
Table and column names that are derived from property or class names are used in SQL statements without quotes by default.
You can control this behavior by setting `RelationalMappingContext.setForceQuote(true)`.
- The converter uses any Spring Converters registered with `CustomConversions` to override the default mapping of object properties to row columns and values.
- The fields of an object are used to convert to and from columns in the row.
Public `JavaBean` properties are not used.
- If you have a single non-zero-argument constructor whose constructor argument names match top-level column names of the row, that constructor is used.
Otherwise, the zero-argument constructor is used.
If there is more than one non-zero-argument constructor, an exception is thrown.
Refer to [Object Creation](../object-mapping.md#mapping.object-creation) for further details.

<a id="jdbc.entity-persistence.types"></a>

## Supported Types in Your Entity

The properties of the following types are currently supported:

- All primitive types and their boxed types (`int`, `float`, `Integer`, `Float`, and so on)
- Enums get mapped to their names.
- `String`
- `java.util.Date`, `java.time.LocalDate`, `java.time.LocalDateTime`, and `java.time.LocalTime`
- Arrays and Collections of the types mentioned above can be mapped to columns of array type if your database supports that.
- Anything your database driver accepts.
- References to other entities.
They are considered a one-to-one relationship, or an embedded type.
It is optional for one-to-one relationship entities to have an `id` attribute.
The table of the referenced entity is expected to have an additional column with a name based on the referencing entity see [Back References](#jdbc.entity-persistence.types.backrefs).
Embedded entities do not need an `id`.
If one is present it gets mapped as a normal attribute without any special meaning.
- `Set<some entity>` is considered a one-to-many relationship.
The table of the referenced entity is expected to have an additional column with a name based on the referencing entity see [Back References](#jdbc.entity-persistence.types.backrefs).
- `Map<simple type, some entity>` is considered a qualified one-to-many relationship.
The table of the referenced entity is expected to have two additional columns: One named based on the referencing entity for the foreign key (see [Back References](#jdbc.entity-persistence.types.backrefs)) and one with the same name and an additional `_key` suffix for the map key.
- `List<some entity>` is mapped as a  `Map<Integer, some entity>`.
The same additional columns are expected and the names used can be customized in the same way.

  For `List`, `Set`, and `Map` naming of the back reference can be controlled by implementing `NamingStrategy.getReverseColumnName(RelationalPersistentEntity<?> owner)` and `NamingStrategy.getKeyColumn(RelationalPersistentProperty property)`, respectively.
  Alternatively you may annotate the attribute with `@MappedCollection(idColumn="your_column_name", keyColumn="your_key_column_name")`.
  Specifying a key column for a `Set` has no effect.
- Types for which you registered suitable [custom converters](#mapping.explicit.converters).

<a id="mapping.usage.annotations"></a>

### Mapping Annotation Overview

The `RelationalConverter` can use metadata to drive the mapping of objects to rows.
The following annotations are available:

- `@Embedded`: a property with this annotation will be mapped to the table of the parent entity, instead of a separate table.
Allows to specify if the resulting columns should have a common prefix.
If all columns resulting from such an entity are `null` either the annotated entity will be `null` or *empty*, i.e. all of its properties will be `null`, depending on the value of `@Embedded.onEmpty()`
May be combined with `@Id` to form a composite id.
- `@Id`: Applied at the field level to mark the primary key.
It may be combined with `@Embedded` to form a composite id.
- `@InsertOnlyProperty`: Marks a property as only to be written during insert.
Such a property on an aggregate root will only be written once and never updated.
Note that on a nested entity, all save operations result in an insert therefore this annotation has no effect on properties of nested entities.
- `@MappedCollection`: Allows for configuration how a collection, or a single nested entity gets mapped. `idColumn` specifies the column used for referencing the parent entities primary key. `keyColumn` specifies the column used to store the index of a `List` or the key of a `Map`.
- `@Sequence`: specify a database sequence for generating values for the annotated property.
- `@Table`: Applied at the class level to indicate this class is a candidate for mapping to the database.
You can specify the name of the table where the database is stored.
- `@Transient`: By default, all fields are mapped to the row.
This annotation excludes the field where it is applied from being stored in the database.
Transient properties cannot be used within a persistence constructor as the converter cannot materialize a value for the constructor argument.
- `@PersistenceCreator`: Marks a given constructor or static factory method — even a package protected one — to use when instantiating the object from the database.
Constructor arguments are mapped by name to the values in the retrieved row.
- `@Value`: This annotation is part of the Spring Framework.
Within the mapping framework it can be applied to constructor arguments.
This lets you use a Spring Expression Language statement to transform a key’s value retrieved in the database before it is used to construct a domain object.
In order to reference a column of a given row one has to use expressions like: `@Value("#root.myProperty")` where root refers to the root of the given `Row`.
- `@Column`: Applied at the field level to describe the name of the column as it is represented in the row, letting the name be different from the field name of the class.
Names specified with a `@Column` annotation are always quoted when used in SQL statements.
For most databases, this means that these names are case-sensitive.
It also means that you can use special characters in these names.
However, this is not recommended, since it may cause problems with other tools.
- `@Version`: Applied at field level is used for optimistic locking and checked for modification on save operations.
The value is `null` (`zero` for primitive types) is considered as marker for entities to be new.
The initially stored value is `zero` (`one` for primitive types).
The version gets incremented automatically on every update.

See [Optimistic Locking](entity-persistence.md#jdbc.entity-persistence.optimistic-locking) for further reference.

The mapping metadata infrastructure is defined in the separate `spring-data-commons` project that is technology-agnostic.
Specific subclasses are used in the JDBC support to support annotation based metadata.
Other strategies can also be put in place (if there is demand).

<a id="jdbc.entity-persistence.types.referenced-entities"></a>

### Referenced Entities

The handling of referenced entities is limited.
This is based on the idea of aggregate roots as described above.
If you reference another entity, that entity is, by definition, part of your aggregate.
So, if you remove the reference, the previously referenced entity gets deleted.
This also means references are 1-1 or 1-n, but not n-1 or n-m.

If you have n-1 or n-m references, you are, by definition, dealing with two separate aggregates.
References between those may be encoded as simple `id` values, which map properly with Spring Data JDBC.
A better way to encode these, is to make them instances of `AggregateReference`.
An `AggregateReference` is a wrapper around an id value which marks that value as a reference to a different aggregate.
Also, the type of that aggregate is encoded in a type parameter.

<a id="jdbc.entity-persistence.types.backrefs"></a>

### Back References

All references in an aggregate result in a foreign key relationship in the opposite direction in the database.
By default, the name of the foreign key column is the table name of the referencing entity.

If the referenced id is an `@Embedded` id, the back reference consists of multiple columns, each named by a concatenation of <table-name> + `_` + <column-name>.
E.g. the back reference to a `Person` entity, with a composite id with the properties `firstName` and `lastName` will consist of the two columns `PERSON_FIRST_NAME` and `PERSON_LAST_NAME`.

Alternatively you may choose to have them named by the entity name of the referencing entity ignoring `@Table` annotations.
You activate this behaviour by calling `setForeignKeyNaming(ForeignKeyNaming.IGNORE_RENAMING)` on the `RelationalMappingContext`.

For `List` and `Map` references an additional column is required for holding the list index or map key.
It is based on the foreign key column with an additional `_KEY` suffix.

If you want a completely different way of naming these back references you may implement `NamingStrategy.getReverseColumnName(RelationalPersistentEntity<?> owner)` in a way that fits your needs.

#### Declaring and setting an `AggregateReference`

```java
class Person {
    @Id long id;
    AggregateReference<Person, Long> bestFriend;
}

// ...

Person p1, p2 = // some initialization

p1.bestFriend = AggregateReference.to(p2.id);

```

You should not include attributes in your entities to hold the actual value of a back reference, nor of the key column of maps or lists.
If you want these values to be available in your domain model we recommend to do this in an `AfterConvertCallback` and store the values in transient values.

<a id="entity-persistence.naming-strategy"></a>

## Naming Strategy

By convention, Spring Data applies a `NamingStrategy` to determine table, column, and schema names defaulting to [snake case](https://en.wikipedia.org/wiki/Snake_case).
An object property named `firstName` becomes `first_name`.
You can tweak that by providing a [`NamingStrategy`](https://docs.spring.io/spring-data/relational/docs/4.0.0/api/org/springframework/data/relational/core/mapping/NamingStrategy.html) in your application context.

<a id="entity-persistence.custom-table-name"></a>

## Override table names

When the table naming strategy does not match your database table names, you can override the table name with the [`Table`](https://docs.spring.io/spring-data/relational/docs/4.0.0/api/org/springframework/data/relational/core/mapping/Table.html) annotation.
The element `value` of this annotation provides the custom table name.
The following example maps the `MyEntity` class to the `CUSTOM_TABLE_NAME` table in the database:

```java
@Table("CUSTOM_TABLE_NAME")
class MyEntity {
    @Id
    Integer id;

    String name;
}
```

You may use [Spring Data’s SpEL support](../value-expressions.md) to dynamically create the table name.
Once generated the table name will be cached, so it is dynamic per mapping context only.

<a id="entity-persistence.custom-column-name"></a>

## Override column names

When the column naming strategy does not match your database table names, you can override the table name with the [`Column`](https://docs.spring.io/spring-data/relational/docs/4.0.0/api/org/springframework/data/relational/core/mapping/Column.html) annotation.
The element `value` of this annotation provides the custom column name.
The following example maps the `name` property of the `MyEntity` class to the `CUSTOM_COLUMN_NAME` column in the database:

```java
class MyEntity {
    @Id
    Integer id;

    @Column("CUSTOM_COLUMN_NAME")
    String name;
}
```

The [`MappedCollection`](https://docs.spring.io/spring-data/relational/docs/4.0.0/api/org/springframework/data/relational/core/mapping/MappedCollection.html)
annotation can be used on a reference type (one-to-one relationship) or on Sets, Lists, and Maps (one-to-many relationship).
`idColumn` element of the annotation provides a custom name for the foreign key column referencing the id column in the other table.
In the following example the corresponding table for the `MySubEntity` class has a `NAME` column, and the `CUSTOM_MY_ENTITY_ID_COLUMN_NAME` column of the `MyEntity` id for relationship reasons:

```java
class MyEntity {
    @Id
    Integer id;

    @MappedCollection(idColumn = "CUSTOM_MY_ENTITY_ID_COLUMN_NAME")
    Set<MySubEntity> subEntities;
}

class MySubEntity {
    String name;
}
```

When using `List` and `Map` you must have an additional column for the position of a dataset in the `List` or the key value of the entity in the `Map`.
This additional column name may be customized with the `keyColumn` Element of the [`MappedCollection`](https://docs.spring.io/spring-data/relational/docs/4.0.0/api/org/springframework/data/relational/core/mapping/MappedCollection.html) annotation:

```java
class MyEntity {
    @Id
    Integer id;

    @MappedCollection(idColumn = "CUSTOM_COLUMN_NAME", keyColumn = "CUSTOM_KEY_COLUMN_NAME")
    List<MySubEntity> name;
}

class MySubEntity {
    String name;
}
```

You may use [Spring Data’s SpEL support](../value-expressions.md) to dynamically create column names.
Once generated the names will be cached, so it is dynamic per mapping context only.

<a id="entity-persistence.embedded-entities"></a>

## Embedded entities

Embedded entities are used to have value objects in your java data model, even if there is only one table in your database.
In the following example you see, that `MyEntity` is mapped with the `@Embedded` annotation.
The consequence of this is, that in the database a table `my_entity` with the two columns `id` and `name` (from the `EmbeddedEntity` class) is expected.

However, if the `name` column is actually `null` within the result set, the entire property `embeddedEntity` will be set to null according to the `onEmpty` of `@Embedded`, which `null`s objects when all nested properties are `null`.

Opposite to this behavior `USE_EMPTY` tries to create a new instance using either a default constructor or one that accepts nullable parameter values from the result set.

```java
class MyEntity {

    @Id
    Integer id;

    @Embedded(onEmpty = USE_NULL) <1>
    EmbeddedEntity embeddedEntity;
}

class EmbeddedEntity {
    String name;
}
```

1. `Null`s `embeddedEntity` if `name` in `null`.
Use `USE_EMPTY` to instantiate `embeddedEntity` with a potential `null` value for the `name` property.

If you need a value object multiple times in an entity, this can be achieved with the optional `prefix` element of the `@Embedded` annotation.
This element represents a prefix and is prepend for each column name in the embedded object.

> [!TIP]
> Make use of the shortcuts `@Embedded.Nullable` & `@Embedded.Empty` for `@Embedded(onEmpty = USE_NULL)` and `@Embedded(onEmpty = USE_EMPTY)` to reduce verbosity and simultaneously set JSR-305 `@javax.annotation.Nonnull` accordingly.
>
> ```java
> class MyEntity {
>
>     @Id
>     Integer id;
>
>     @Embedded.Nullable <1>
>     EmbeddedEntity embeddedEntity;
> }
> ```
>
> 1. Shortcut for `@Embedded(onEmpty = USE_NULL)`.

Embedded entities containing a `Collection` or a `Map` will always be considered non-empty since they will at least contain the empty collection or map.
Such an entity will therefore never be `null` even when using @Embedded(onEmpty = USE\_NULL).

<a id="entity-persistence.embedded-ids"></a>

### Embedded Ids

The identifier property can be annotated with `@Embedded` allowing to use composite ids.
The full embedded entity is considered the id, and therefore the check for determining if an aggregate is considered a new aggregate requiring an insert or an existing one, asking for an update is based on that entity, not its elements.
Most use cases will require a custom `BeforeConvertCallback` to set the id for new aggregate.

#### Simple entity with composite id

```java
@Table("PERSON_WITH_COMPOSITE_ID")
record Person( <1>
    @Id @Embedded.Nullable Name pk, <2>
    String nickName,
    Integer age
) {
}

record Name(String first, String last) {
}
```

#### Matching table for simple entity with composite id

```sql
CREATE TABLE PERSON_WITH_COMPOSITE_ID (
    FIRST VARCHAR(100),
    LAST VARCHAR(100),
    NICK_NAME VARCHAR(100),
    AGE INT,
    PRIMARY KEY (FIRST, LAST) <3>
);


```

1. Entities may be represented as records without any special consideration.
1. `pk` is marked as id and embedded
1. The two columns from the embedded `Name` entity make up the primary key in the database.

Details of table creation depend on the used database.

<a id="entity-persistence.read-only-properties"></a>

## Read Only Properties

Attributes annotated with `@ReadOnlyProperty` will not be written to the database by Spring Data, but they will be read when an entity gets loaded.

Spring Data will not automatically reload an entity after writing it.
Therefore, you have to reload it explicitly if you want to see data that was generated in the database for such columns.

If the annotated attribute is an entity or collection of entities, it is represented by one or more separate rows in separate tables.
Spring Data will not perform any insert, delete or update for these rows.

<a id="entity-persistence.insert-only-properties"></a>

## Insert Only Properties

Attributes annotated with `@InsertOnlyProperty` will only be written to the database by Spring Data during insert operations.
For updates these properties will be ignored.

`@InsertOnlyProperty` is only supported for the aggregate root.

<a id="mapping.custom.object.construction"></a>

## Customized Object Construction

The mapping subsystem allows the customization of the object construction by annotating a constructor with the `@PersistenceConstructor` annotation.The values to be used for the constructor parameters are resolved in the following way:

- If a parameter is annotated with the `@Value` annotation, the given expression is evaluated, and the result is used as the parameter value.
- If the Java type has a property whose name matches the given field of the input row, then its property information is used to select the appropriate constructor parameter to which to pass the input field value.
This works only if the parameter name information is present in the Java `.class` files, which you can achieve by compiling the source with debug information or using the `-parameters` command-line switch for `javac` in Java 8.
- Otherwise, a `MappingException` is thrown to indicate that the given constructor parameter could not be bound.

```java
class OrderItem {

    private @Id final String id;
    private final int quantity;
    private final double unitPrice;

    OrderItem(String id, int quantity, double unitPrice) {
        this.id = id;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
    }

    // getters/setters omitted
}
```

<a id="mapping.explicit.converters"></a>

## Overriding Mapping with Explicit Converters

Spring Data allows registration of custom converters to influence how values are mapped in the database.
Currently, converters are only applied on property-level, i.e. you can only convert single values in your domain to single values in the database and back.
Conversion between complex objects and multiple columns isn’t supported.

<a id="custom-converters.writer"></a>

### Writing a Property by Using a Registered Spring Converter

The following example shows an implementation of a `Converter` that converts from a `Boolean` object to a `String` value:

```java
import org.springframework.core.convert.converter.Converter;

@WritingConverter
public class BooleanToStringConverter implements Converter<Boolean, String> {

    @Override
    public String convert(Boolean source) {
        return source != null && source ? "T" : "F";
    }
}
```

There are a couple of things to notice here: `Boolean` and `String` are both simple types hence Spring Data requires a hint in which direction this converter should apply (reading or writing).
By annotating this converter with `@WritingConverter` you instruct Spring Data to write every `Boolean` property as `String` in the database.

<a id="custom-converters.reader"></a>

### Reading by Using a Spring Converter

The following example shows an implementation of a `Converter` that converts from a `String` to a `Boolean` value:

```java
@ReadingConverter
public class StringToBooleanConverter implements Converter<String, Boolean> {

    @Override
    public Boolean convert(String source) {
        return source != null && source.equalsIgnoreCase("T") ? Boolean.TRUE : Boolean.FALSE;
    }
}
```

There are a couple of things to notice here: `String` and `Boolean` are both simple types hence Spring Data requires a hint in which direction this converter should apply (reading or writing).
By annotating this converter with `@ReadingConverter` you instruct Spring Data to convert every `String` value from the database that should be assigned to a `Boolean` property.

<a id="jdbc.custom-converters.configuration"></a>

### Registering Spring Converters with the `JdbcConverter`

```java
class MyJdbcConfiguration extends AbstractJdbcConfiguration {

    // …

    @Override
    protected List<?> userConverters() {
        return Arrays.asList(new BooleanToStringConverter(), new StringToBooleanConverter());
    }

}
```

> [!NOTE]
> In previous versions of Spring Data JDBC it was recommended to directly overwrite `AbstractJdbcConfiguration.jdbcCustomConversions()`.
> This is no longer necessary or even recommended, since that method assembles conversions intended for all databases, conversions registered by the `JdbcDialect` used and conversions registered by the user.
> If you are migrating from an older version of Spring Data JDBC and have `AbstractJdbcConfiguration.jdbcCustomConversions()` overwritten conversions from your `JdbcDialect` will not get registered.

> [!TIP]
> If you want to rely on [Spring Boot](https://spring.io/projects/spring-boot) to bootstrap Spring Data JDBC, but still want to override certain aspects of the configuration, you may want to expose beans of that type.
> For custom conversions you may e.g. choose to register a bean of type `JdbcCustomConversions` that will be picked up by the Boot infrastructure.
> To learn more about this please make sure to read the Spring Boot [Reference Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#data.sql.jdbc).

<a id="jdbc.custom-converters.jdbc-value"></a>

### JdbcValue

Value conversion uses `JdbcValue` to enrich values propagated to JDBC operations with a `java.sql.Types` type.
Register a custom write converter if you need to specify a JDBC-specific type instead of using type derivation.
This converter should convert the value to `JdbcValue` which has a field for the value and for the actual `JDBCType`.
