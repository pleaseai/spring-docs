---
title: "Mapping"
source: "ROOT:r2dbc/mapping.adoc"
---

<a id="mapping"></a>

# Mapping

Rich mapping support is provided by the `MappingR2dbcConverter`. `MappingR2dbcConverter` has a rich metadata model that allows mapping domain objects to a data row.
The mapping metadata model is populated by using annotations on your domain objects.
However, the infrastructure is not limited to using annotations as the only source of metadata information.
The `MappingR2dbcConverter` also lets you map objects to rows without providing any additional metadata, by following a set of conventions.

This section describes the features of the `MappingR2dbcConverter`, including how to use conventions for mapping objects to rows and how to override those conventions with annotation-based mapping metadata.

Read on the basics about [object-mapping.adoc](../object-mapping.md) before continuing with this chapter.

<a id="mapping.conventions"></a>

## Convention-based Mapping

`MappingR2dbcConverter` has a few conventions for mapping objects to rows when no additional mapping metadata is provided.
The conventions are:

- The short Java class name is mapped to the table name in the following manner.
The `com.bigbank.SavingsAccount` class maps to the `SAVINGS_ACCOUNT` table name.
The same name mapping is applied for mapping fields to column names.
For example, the `firstName` field maps to the `FIRST_NAME` column.
You can control this mapping by providing a custom `NamingStrategy`.
See [Mapping Configuration](#mapping.configuration) for more detail.
Table and column names that are derived from property or class names are used in SQL statements without quotes by default.
You can control this behavior by setting `RelationalMappingContext.setForceQuote(true)`.
- Nested objects are not supported.
- The converter uses any Spring Converters registered with `CustomConversions` to override the default mapping of object properties to row columns and values.
- The fields of an object are used to convert to and from columns in the row.
Public `JavaBean` properties are not used.
- If you have a single non-zero-argument constructor whose constructor argument names match top-level column names of the row, that constructor is used.
Otherwise, the zero-argument constructor is used.
If there is more than one non-zero-argument constructor, an exception is thrown.
Refer to [Object Creation](../object-mapping.md#mapping.object-creation) for further details.

<a id="mapping.configuration"></a>

## Mapping Configuration

By default, (unless explicitly configured) an instance of `MappingR2dbcConverter` is created when you create a `DatabaseClient`.
You can create your own instance of the `MappingR2dbcConverter`.
By creating your own instance, you can register Spring converters to map specific classes to and from the database.

You can configure the `MappingR2dbcConverter` as well as `DatabaseClient` and `ConnectionFactory` by using Java-based metadata.
The following example uses Spring’s Java-based configuration:

If you set `setForceQuote` of the `R2dbcMappingContext to` true, table and column names derived from classes and properties are used with database specific quotes.
This means that it is OK to use reserved SQL words (such as order) in these names.
You can do so by overriding `r2dbcMappingContext(Optional<NamingStrategy>)` of `AbstractR2dbcConfiguration`.
Spring Data converts the letter casing of such a name to that form which is also used by the configured database when no quoting is used.
Therefore, you can use unquoted names when creating tables, as long as you do not use keywords or special characters in your names.
For databases that adhere to the SQL standard, this means that names are converted to upper case.
The quoting character and the way names get capitalized is controlled by the used `Dialect`.
See [R2DBC Drivers](getting-started.md#r2dbc.dialects) for how to configure custom dialects.

#### @Configuration class to configure R2DBC mapping support

```java
@Configuration
public class MyAppConfig extends AbstractR2dbcConfiguration {

    public ConnectionFactory connectionFactory() {
        return ConnectionFactories.get("r2dbc:…");
    }

    // the following are optional

    @Override
    protected List<Object> getCustomConverters() {
        return List.of(new PersonReadConverter(), new PersonWriteConverter());
    }
}
```

`AbstractR2dbcConfiguration` requires you to implement a method that defines a `ConnectionFactory`.

You can add additional converters to the converter by overriding the `r2dbcCustomConversions` method.

You can configure a custom `NamingStrategy` by registering it as a bean.
The `NamingStrategy` controls how the names of classes and properties get converted to the names of tables and columns.

> [!NOTE]
> `AbstractR2dbcConfiguration` creates a `DatabaseClient` instance and registers it with the container under the name of `databaseClient`.

<a id="mapping.usage"></a>

## Metadata-based Mapping

To take full advantage of the object mapping functionality inside the Spring Data R2DBC support, you should annotate your mapped objects with the `@Table` annotation.
Although it is not necessary for the mapping framework to have this annotation (your POJOs are mapped correctly, even without any annotations), it lets the classpath scanner find and pre-process your domain objects to extract the necessary metadata.
If you do not use this annotation, your application takes a slight performance hit the first time you store a domain object, because the mapping framework needs to build up its internal metadata model so that it knows about the properties of your domain object and how to persist them.
The following example shows a domain object:

#### Example domain object

```java
@Table
public class Person {

    @Id
    private Long id;

    private Integer ssn;

    private String firstName;

    private String lastName;
}
```

> [!IMPORTANT]
> The `@Id` annotation tells the mapper which property you want to use as the primary key.

<a id="mapping.types"></a>

### Default Type Mapping

The following table explains how property types of an entity affect mapping:

| Source Type | Target Type | Remarks |
| --- | --- | --- |
| Primitive types and wrapper types | Passthru | Can be customized using [Explicit Converters](#mapping.explicit.converters). |
| JSR-310 Date/Time types | Passthru | Can be customized using [Explicit Converters](#mapping.explicit.converters). |
| `String`, `BigInteger`, `BigDecimal`, and `UUID` | Passthru | Can be customized using [Explicit Converters](#mapping.explicit.converters). |
| `Enum` | String | Can be customized by registering [Explicit Converters](#mapping.explicit.converters). |
| `Blob` and `Clob` | Passthru | Can be customized using [Explicit Converters](#mapping.explicit.converters). |
| `byte[]`, `ByteBuffer` | Passthru | Considered a binary payload. |
| `Collection<T>` | Array of `T` | Conversion to Array type if supported by the configured [driver](getting-started.md#requirements), not supported otherwise. |
| Arrays of primitive types, wrapper types and `String` | Array of wrapper type (e.g. `int[]` → `Integer[]`) | Conversion to Array type if supported by the configured [driver](getting-started.md#requirements), not supported otherwise. |
| Driver-specific types | Passthru | Contributed as a simple type by the used `R2dbcDialect`. |
| Complex objects | Target type depends on registered `Converter`. | Requires a [Explicit Converters](#mapping.explicit.converters), not supported otherwise. |

> [!NOTE]
> The native data type for a column depends on the R2DBC driver type mapping.
> Drivers can contribute additional simple types such as Geometry types.

<a id="mapping.usage.annotations"></a>

### Mapping Annotation Overview

The `RelationalConverter` can use metadata to drive the mapping of objects to rows.
The following annotations are available:

- `@Id`: Applied at the field level to mark the primary key.
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
See [Optimistic Locking](entity-persistence.md#r2dbc.entity-persistence.optimistic-locking) for further reference.

The mapping metadata infrastructure is defined in the separate `spring-data-commons` project that is technology-agnostic.
Specific subclasses are used in the R2DBC support to support annotation based metadata.
Other strategies can also be put in place (if there is demand).

<a id="entity-persistence.naming-strategy"></a>

## Naming Strategy

By convention, Spring Data applies a `NamingStrategy` to determine table, column, and schema names defaulting to [snake case](https://en.wikipedia.org/wiki/Snake_case).
An object property named `firstName` becomes `first_name`.
You can tweak that by providing a [`NamingStrategy`](https://docs.spring.io/spring-data/relational/docs/3.5.6/api/org/springframework/data/relational/core/mapping/NamingStrategy.html) in your application context.

<a id="entity-persistence.custom-table-name"></a>

## Override table names

When the table naming strategy does not match your database table names, you can override the table name with the [`Table`](https://docs.spring.io/spring-data/relational/docs/3.5.6/api/org/springframework/data/relational/core/mapping/Table.html) annotation.
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

When the column naming strategy does not match your database table names, you can override the table name with the [`Column`](https://docs.spring.io/spring-data/relational/docs/3.5.6/api/org/springframework/data/relational/core/mapping/Column.html) annotation.
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

You may use [Spring Data’s SpEL support](../value-expressions.md) to dynamically create column names.
Once generated the names will be cached, so it is dynamic per mapping context only.

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

When storing and querying your objects, it is often convenient to have a `R2dbcConverter` instance to handle the mapping of all Java types to `OutboundRow` instances.
However, you may sometimes want the `R2dbcConverter` instances to do most of the work but let you selectively handle the conversion for a particular type — perhaps to optimize performance.

To selectively handle the conversion yourself, register one or more one or more `org.springframework.core.convert.converter.Converter` instances with the `R2dbcConverter`.

You can use the `r2dbcCustomConversions` method in `AbstractR2dbcConfiguration` to configure converters.
The examples [at the beginning of this chapter](#mapping.configuration) show how to perform the configuration with Java.

> [!NOTE]
> Custom top-level entity conversion requires asymmetric types for conversion.
> Inbound data is extracted from R2DBC’s `Row`.
> Outbound data (to be used with `INSERT`/`UPDATE` statements) is represented as `OutboundRow` and later assembled to a statement.

The following example of a Spring Converter implementation converts from a `Row` to a `Person` POJO:

```java
@ReadingConverter
public class PersonReadConverter implements Converter<Row, Person> {

    public Person convert(Row source) {
        Person p = new Person(source.get("id", String.class),source.get("name", String.class));
        p.setAge(source.get("age", Integer.class));
        return p;
    }
}
```

Please note that converters get applied on singular properties.
Collection properties (e.g. `Collection<Person>`) are iterated and converted element-wise.
Collection converters (e.g. `Converter<List<Person>>, OutboundRow`) are not supported.

> [!NOTE]
> R2DBC uses boxed primitives (`Integer.class` instead of `int.class`) to return primitive values.

The following example converts from a `Person` to a `OutboundRow`:

```java
@WritingConverter
public class PersonWriteConverter implements Converter<Person, OutboundRow> {

    public OutboundRow convert(Person source) {
        OutboundRow row = new OutboundRow();
        row.put("id", Parameter.from(source.getId()));
        row.put("name", Parameter.from(source.getFirstName()));
        row.put("age", Parameter.from(source.getAge()));
        return row;
    }
}
```

<a id="mapping.explicit.enum.converters"></a>

### Overriding Enum Mapping with Explicit Converters

Some databases, such as [Postgres](https://github.com/pgjdbc/r2dbc-postgresql#postgres-enum-types), can natively write enum values using their database-specific enumerated column type.
Spring Data converts `Enum` values by default to `String` values for maximum portability.
To retain the actual enum value, register a `@Writing` converter whose source and target types use the actual enum type to avoid using `Enum.name()` conversion.
Additionally, you need to configure the enum type on the driver level so that the driver is aware how to represent the enum type.

The following example shows the involved components to read and write `Color` enum values natively:

```java
enum Color {
    Grey, Blue
}

class ColorConverter extends EnumWriteSupport<Color> {

}
class Product {
    @Id long id;
    Color color;

    // …
}
```
