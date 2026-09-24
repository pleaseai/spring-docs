---
title: "Mapping"
source: "ROOT:object-mapping.adoc"
---

<a id="mapping.chapter"></a>

# Mapping

Rich object mapping support is provided by the `MappingCassandraConverter`. `MappingCassandraConverter` has a rich metadata model that provides a complete feature set of functionality to map domain objects to CQL tables.

The mapping metadata model is populated by using annotations on your domain objects.
However, the infrastructure is not limited to using annotations as the only source of metadata.
The `MappingCassandraConverter` also lets you map domain objects to tables without providing any additional metadata, by following a set of conventions.

In this chapter, we describe the features of the `MappingCassandraConverter`, how to use conventions for mapping domain objects to tables, and how to override those conventions with annotation-based mapping metadata.

<a id="mapping.fundamentals"></a>

## Object Mapping Fundamentals

This section covers the fundamentals of Spring Data object mapping, object creation, field and property access, mutability and immutability.
Note, that this section only applies to Spring Data modules that do not use the object mapping of the underlying data store (like JPA).
Also be sure to consult the store-specific sections for store-specific object mapping, like indexes, customizing column or field names or the like.

Core responsibility of the Spring Data object mapping is to create instances of domain objects and map the store-native data structures onto those.
This means we need two fundamental steps:

1. Instance creation by using one of the constructors exposed.
1. Instance population to materialize all exposed properties.

<a id="mapping.object-creation"></a>

### Object creation

Spring Data automatically tries to detect a persistent entity’s constructor to be used to materialize objects of that type.
The resolution algorithm works as follows:

1. If there is a single static factory method annotated with `@PersistenceCreator` then it is used.
1. If there is a single constructor, it is used.
1. If there are multiple constructors and exactly one is annotated with `@PersistenceCreator`, it is used.
1. If the type is a Java `Record` the canonical constructor is used.
1. If there’s a no-argument constructor, it is used.
Other constructors will be ignored.

The value resolution assumes constructor/factory method argument names to match the property names of the entity, i.e. the resolution will be performed as if the property was to be populated, including all customizations in mapping (different datastore column or field name etc.).
This also requires either parameter names information available in the class file or an `@ConstructorProperties` annotation being present on the constructor.

The value resolution can be customized by using Spring Framework’s `@Value` value annotation using a store-specific SpEL expression.
Please consult the section on store specific mappings for further details.

<a id="mapping.object-creation.details"></a>

#### Object creation internals

> To avoid the overhead of reflection, Spring Data object creation uses a factory class generated at runtime by default, which will call the domain classes constructor directly.
> I.e. for this example type:
>
> ```java
> class Person {
>   Person(String firstname, String lastname) { … }
> }
> ```
>
> we will create a factory class semantically equivalent to this one at runtime:
>
> ```java
> class PersonObjectInstantiator implements ObjectInstantiator {
>
>   Object newInstance(Object... args) {
>     return new Person((String) args[0], (String) args[1]);
>   }
> }
> ```
>
> This gives us a roundabout 10% performance boost over reflection.
> For the domain class to be eligible for such optimization, it needs to adhere to a set of constraints:
>
> - it must not be a private class
> - it must not be a non-static inner class
> - it must not be a CGLib proxy class
> - the constructor to be used by Spring Data must not be private
>
> If any of these criteria match, Spring Data will fall back to entity instantiation via reflection.

<a id="mapping.property-population"></a>

### Property population

Once an instance of the entity has been created, Spring Data populates all remaining persistent properties of that class.
Unless already populated by the entity’s constructor (i.e. consumed through its constructor argument list), the identifier property will be populated first to allow the resolution of cyclic object references.
After that, all non-transient properties that have not already been populated by the constructor are set on the entity instance.
For that we use the following algorithm:

1. If the property is immutable but exposes a `with…` method (see below), we use the `with…` method to create a new entity instance with the new property value.
1. If property access (i.e. access through getters and setters) is defined, we’re invoking the setter method.
1. If the property is mutable we set the field directly.
1. If the property is immutable we’re using the constructor to be used by persistence operations (see [Object creation](#mapping.object-creation)) to create a copy of the instance.
1. By default, we set the field value directly.

<a id="mapping.property-population.details"></a>

#### Property population internals

> Similarly to our [optimizations in object construction](#mapping.object-creation.details) we also use Spring Data runtime generated accessor classes to interact with the entity instance.
>
> ```java
> class Person {
>
>   private final Long id;
>   private String firstname;
>   private @AccessType(Type.PROPERTY) String lastname;
>
>   Person() {
>     this.id = null;
>   }
>
>   Person(Long id, String firstname, String lastname) {
>     // Field assignments
>   }
>
>   Person withId(Long id) {
>     return new Person(id, this.firstname, this.lastame);
>   }
>
>   void setLastname(String lastname) {
>     this.lastname = lastname;
>   }
> }
> ```
>
> #### A generated Property Accessor
>
> ```java
> class PersonPropertyAccessor implements PersistentPropertyAccessor {
>
>   private static final MethodHandle firstname;              <2>
>
>   private Person person;                                    <1>
>
>   public void setProperty(PersistentProperty property, Object value) {
>
>     String name = property.getName();
>
>     if ("firstname".equals(name)) {
>       firstname.invoke(person, (String) value);             <2>
>     } else if ("id".equals(name)) {
>       this.person = person.withId((Long) value);            <3>
>     } else if ("lastname".equals(name)) {
>       this.person.setLastname((String) value);              <4>
>     }
>   }
> }
> ```
>
> 1. PropertyAccessor’s hold a mutable instance of the underlying object. This is, to enable mutations of otherwise immutable properties.
> 1. By default, Spring Data uses field-access to read and write property values. As per visibility rules of `private` fields, `MethodHandles` are used to interact with fields.
> 1. The class exposes a `withId(…)` method that’s used to set the identifier, e.g. when an instance is inserted into the datastore and an identifier has been generated. Calling `withId(…)` creates a new `Person` object. All subsequent mutations will take place in the new instance leaving the previous untouched.
> 1. Using property-access allows direct method invocations without using `MethodHandles`.
>
> This gives us a roundabout 25% performance boost over reflection.
> For the domain class to be eligible for such optimization, it needs to adhere to a set of constraints:
>
> - Types must not reside in the default or under the `java` package.
> - Types and their constructors must be `public`
> - Types that are inner classes must be `static`.
> - The used Java Runtime must allow for declaring classes in the originating `ClassLoader`. Java 9 and newer impose certain limitations.
>
> By default, Spring Data attempts to use generated property accessors and falls back to reflection-based ones if a limitation is detected.

Let’s have a look at the following entity:

#### A sample entity

```java
class Person {

  private final @Id Long id;                                                <1>
  private final String firstname, lastname;                                 <2>
  private final LocalDate birthday;
  private final int age;                                                    <3>

  private String comment;                                                   <4>
  private @AccessType(Type.PROPERTY) String remarks;                        <5>

  static Person of(String firstname, String lastname, LocalDate birthday) { <6>

    return new Person(null, firstname, lastname, birthday,
      Period.between(birthday, LocalDate.now()).getYears());
  }

  Person(Long id, String firstname, String lastname, LocalDate birthday, int age) { <6>

    this.id = id;
    this.firstname = firstname;
    this.lastname = lastname;
    this.birthday = birthday;
    this.age = age;
  }

  Person withId(Long id) {                                                  <1>
    return new Person(id, this.firstname, this.lastname, this.birthday, this.age);
  }

  void setRemarks(String remarks) {                                         <5>
    this.remarks = remarks;
  }
}
```

1. The identifier property is final but set to `null` in the constructor.
The class exposes a `withId(…)` method that’s used to set the identifier, e.g. when an instance is inserted into the datastore and an identifier has been generated.
The original `Person` instance stays unchanged as a new one is created.
The same pattern is usually applied for other properties that are store managed but might have to be changed for persistence operations.
The wither method is optional as the persistence constructor (see 6) is effectively a copy constructor and setting the property will be translated into creating a fresh instance with the new identifier value applied.
1. The `firstname` and `lastname` properties are ordinary immutable properties potentially exposed through getters.
1. The `age` property is an immutable but derived one from the `birthday` property.
With the design shown, the database value will trump the defaulting as Spring Data uses the only declared constructor.
Even if the intent is that the calculation should be preferred, it’s important that this constructor also takes `age` as parameter (to potentially ignore it) as otherwise the property population step will attempt to set the age field and fail due to it being immutable and no `with…` method being present.
1. The `comment` property is mutable and is populated by setting its field directly.
1. The `remarks` property is mutable and is populated by invoking the setter method.
1. The class exposes a factory method and a constructor for object creation.
The core idea here is to use factory methods instead of additional constructors to avoid the need for constructor disambiguation through `@PersistenceCreator`.
Instead, defaulting of properties is handled within the factory method.
If you want Spring Data to use the factory method for object instantiation, annotate it with `@PersistenceCreator`.

<a id="mapping.general-recommendations"></a>

### General recommendations

- *Try to stick to immutable objects* — Immutable objects are straightforward to create as materializing an object is then a matter of calling its constructor only.
Also, this avoids your domain objects to be littered with setter methods that allow client code to manipulate the objects state.
If you need those, prefer to make them package protected so that they can only be invoked by a limited amount of co-located types.
Constructor-only materialization is up to 30% faster than properties population.
- *Provide an all-args constructor* — Even if you cannot or don’t want to model your entities as immutable values, there’s still value in providing a constructor that takes all properties of the entity as arguments, including the mutable ones, as this allows the object mapping to skip the property population for optimal performance.
- *Use factory methods instead of overloaded constructors to avoid `@PersistenceCreator`* — With an all-argument constructor needed for optimal performance, we usually want to expose more application use case specific constructors that omit things like auto-generated identifiers etc.
It’s an established pattern to rather use static factory methods to expose these variants of the all-args constructor.
- *Make sure you adhere to the constraints that allow the generated instantiator and property accessor classes to be used* — 
- *For identifiers to be generated, still use a final field in combination with an all-arguments persistence constructor (preferred) or a `with…` method* — 
- *Use Lombok to avoid boilerplate code* — As persistence operations usually require a constructor taking all arguments, their declaration becomes a tedious repetition of boilerplate parameter to field assignments that can best be avoided by using Lombok’s `@AllArgsConstructor`.

<a id="mapping.general-recommendations.override.properties"></a>

#### Overriding Properties

Java allows a flexible design of domain classes where a subclass could define a property that is already declared with the same name in its superclass.
Consider the following example:

```java
public class SuperType {

   private CharSequence field;

   public SuperType(CharSequence field) {
      this.field = field;
   }

   public CharSequence getField() {
      return this.field;
   }

   public void setField(CharSequence field) {
      this.field = field;
   }
}

public class SubType extends SuperType {

   private String field;

   public SubType(String field) {
      super(field);
      this.field = field;
   }

   @Override
   public String getField() {
      return this.field;
   }

   public void setField(String field) {
      this.field = field;

      // optional
      super.setField(field);
   }
}
```

Both classes define a `field` using assignable types. `SubType` however shadows `SuperType.field`.
Depending on the class design, using the constructor could be the only default approach to set `SuperType.field`.
Alternatively, calling `super.setField(…)` in the setter could set the `field` in `SuperType`.
All these mechanisms create conflicts to some degree because the properties share the same name yet might represent two distinct values.
Spring Data skips super-type properties if types are not assignable.
That is, the type of the overridden property must be assignable to its super-type property type to be registered as override, otherwise the super-type property is considered transient.
We generally recommend using distinct property names.

Spring Data modules generally support overridden properties holding different values.
From a programming model perspective there are a few things to consider:

1. Which property should be persisted (default to all declared properties)?
You can exclude properties by annotating these with `@Transient`.
1. How to represent properties in your data store?
Using the same field/column name for different values typically leads to corrupt data so you should annotate least one of the properties using an explicit field/column name.
1. Using `@AccessType(PROPERTY)` cannot be used as the super-property cannot be generally set without making any further assumptions of the setter implementation.

<a id="mapping.kotlin"></a>

### Kotlin support

Spring Data adapts specifics of Kotlin to allow object creation and mutation.

<a id="mapping.kotlin.creation"></a>

#### Kotlin object creation

Kotlin classes are supported to be instantiated, all classes are immutable by default and require explicit property declarations to define mutable properties.

Spring Data automatically tries to detect a persistent entity’s constructor to be used to materialize objects of that type.
The resolution algorithm works as follows:

1. If there is a constructor that is annotated with `@PersistenceCreator`, it is used.
1. If the type is a [Kotlin data class](#mapping.kotlin) the primary constructor is used.
1. If there is a single static factory method annotated with `@PersistenceCreator` then it is used.
1. If there is a single constructor, it is used.
1. If there are multiple constructors and exactly one is annotated with `@PersistenceCreator`, it is used.
1. If the type is a Java `Record` the canonical constructor is used.
1. If there’s a no-argument constructor, it is used.
Other constructors will be ignored.

Consider the following `data` class `Person`:

```kotlin
data class Person(val id: String, val name: String)
```

The class above compiles to a typical class with an explicit constructor. We can customize this class by adding another constructor and annotate it with `@PersistenceCreator` to indicate a constructor preference:

```kotlin
data class Person(var id: String, val name: String) {

    @PersistenceCreator
    constructor(id: String) : this(id, "unknown")
}
```

Kotlin supports parameter optionality by allowing default values to be used if a parameter is not provided.
When Spring Data detects a constructor with parameter defaulting, then it leaves these parameters absent if the data store does not provide a value (or simply returns `null`) so Kotlin can apply parameter defaulting. Consider the following class that applies parameter defaulting for `name`

```kotlin
data class Person(var id: String, val name: String = "unknown")
```

Every time the `name` parameter is either not part of the result or its value is `null`, then the `name` defaults to `unknown`.

> [!NOTE]
> Delegated properties are not supported with Spring Data. The mapping metadata filters delegated properties for Kotlin Data classes.
> In all other cases you can exclude synthetic fields for delegated properties by annotating the property with `@delegate:org.springframework.data.annotation.Transient`.

<a id="property-population-of-kotlin-data-classes"></a>

#### Property population of Kotlin data classes

In Kotlin, all classes are immutable by default and require explicit property declarations to define mutable properties.
Consider the following `data` class `Person`:

```kotlin
data class Person(val id: String, val name: String)
```

This class is effectively immutable.
It allows creating new instances as Kotlin generates a `copy(…)` method that creates new object instances copying all property values from the existing object and applying property values provided as arguments to the method.

<a id="mapping.kotlin.override.properties"></a>

#### Kotlin Overriding Properties

Kotlin allows declaring [property overrides](https://kotlinlang.org/docs/inheritance.html#overriding-properties) to alter properties in subclasses.

```kotlin
open class SuperType(open var field: Int)

class SubType(override var field: Int = 1) :
	SuperType(field) {
}
```

Such an arrangement renders two properties with the name `field`.
Kotlin generates property accessors (getters and setters) for each property in each class.
Effectively, the code looks like as follows:

```java
public class SuperType {

   private int field;

   public SuperType(int field) {
      this.field = field;
   }

   public int getField() {
      return this.field;
   }

   public void setField(int field) {
      this.field = field;
   }
}

public final class SubType extends SuperType {

   private int field;

   public SubType(int field) {
      super(field);
      this.field = field;
   }

   public int getField() {
      return this.field;
   }

   public void setField(int field) {
      this.field = field;
   }
}
```

Getters and setters on `SubType` set only `SubType.field` and not `SuperType.field`.
In such an arrangement, using the constructor is the only default approach to set `SuperType.field`.
Adding a method to `SubType` to set `SuperType.field` via `this.SuperType.field = …` is possible but falls outside of supported conventions.
Property overrides create conflicts to some degree because the properties share the same name yet might represent two distinct values.
We generally recommend using distinct property names.

Spring Data modules generally support overridden properties holding different values.
From a programming model perspective there are a few things to consider:

1. Which property should be persisted (default to all declared properties)?
You can exclude properties by annotating these with `@Transient`.
1. How to represent properties in your data store?
Using the same field/column name for different values typically leads to corrupt data so you should annotate least one of the properties using an explicit field/column name.
1. Using `@AccessType(PROPERTY)` cannot be used as the super-property cannot be set.

<a id="mapping.kotlin.value.classes"></a>

#### Kotlin Value Classes

Kotlin Value Classes are designed for a more expressive domain model to make underlying concepts explicit.
Spring Data can read and write types that define properties using Value Classes.

Consider the following domain model:

```kotlin
@JvmInline
value class EmailAddress(val theAddress: String)                                    <1>

data class Contact(val id: String, val name:String, val emailAddress: EmailAddress) <2>
```

1. A simple value class with a non-nullable value type.
1. Data class defining a property using the `EmailAddress` value class.

> [!NOTE]
> Non-nullable properties using non-primitive value types are flattened in the compiled class to the value type.
> Nullable primitive value types or nullable value-in-value types are represented with their wrapper type and that affects how value types are represented in the database.

<a id="mapping-conversion"></a>

## Data Mapping and Type Conversion

This section explains how types are mapped to and from an Apache Cassandra representation.

Spring Data for Apache Cassandra supports several types that are provided by Apache Cassandra.
In addition to these types, Spring Data for Apache Cassandra provides a set of built-in converters to map additional types.
You can provide your own custom converters to adjust type conversion.
See “[Overriding Default Mapping with Custom Converters](cassandra/converters.md)” for further details.
The following table maps Spring Data types to Cassandra types:

| Type | Cassandra types |
| --- | --- |
| `String` | `text` (default), `varchar`, `ascii` |
| `double`, `Double` | `double` |
| `float`, `Float` | `float` |
| `long`, `Long` | `bigint` (default), `counter` |
| `int`, `Integer` | `int` |
| `short`, `Short` | `smallint` |
| `byte`, `Byte` | `tinyint` |
| `boolean`, `Boolean` | `boolean` |
| `BigInteger` | `varint` |
| `BigDecimal` | `decimal` |
| `java.util.Date` | `timestamp` |
| `com.datastax.driver.core.LocalDate` | `date` |
| `InetAddress` | `inet` |
| `ByteBuffer` | `blob` |
| `java.util.UUID` | `uuid` |
| `TupleValue`,  mapped Tuple Types | `tuple<…>` |
| `UDTValue`, mapped User-Defined Types | user type |
| `java.util.Map<K, V>` | `map` |
| `java.util.List<E>` | `list` |
| `java.util.Set<E>` | `set` |
| `Enum` | `text` (default), `bigint`, `varint`, `int`, `smallint`, `tinyint` |
| `LocalDate` (Joda, Java 8, JSR310-BackPort) | `date` |
| `LocalTime`+ (Joda, Java 8, JSR310-BackPort) | `time` |
| `LocalDateTime`, `LocalTime`, `Instant` (Joda, Java 8, JSR310-BackPort) | `timestamp` |
| `ZoneId` (Java 8, JSR310-BackPort) | `text` |

Each supported type maps to a default
[Cassandra data type](https://docs.datastax.com/en/cql-oss/3.x/cql/cql_reference/cql_data_types_c.html).
Java types can be mapped to other Cassandra types by using `@CassandraType`, as the following example shows:

```java
@Table
public class EnumToOrdinalMapping {

  @PrimaryKey String id;

  @CassandraType(type = Name.INT) Condition asOrdinal;
}

public enum Condition {
  NEW, USED
}
```

<a id="mapping-conventions"></a>

## Convention-based Mapping

`MappingCassandraConverter` uses a few conventions for mapping domain objects to CQL tables when no additional mapping metadata is provided.
The conventions are:

- The simple (short) Java class name is mapped to the table name by being changed to lower case.
For example, `com.bigbank.SavingsAccount` maps to a table named `savingsaccount`.
- The converter uses any registered Spring `Converter` instances to override the default mapping of object properties to tables columns.
- The properties of an object are used to convert to and from columns in the table.

You can adjust conventions by configuring a `NamingStrategy` on `CassandraMappingContext`.
Naming strategy objects implement the convention by which a table, column or user-defined type is derived from an entity class and from an actual property.

The following example shows how to configure a `NamingStrategy`:

```java
		CassandraMappingContext context = new CassandraMappingContext();

		// default naming strategy
		context.setNamingStrategy(NamingStrategy.INSTANCE);

		// snake_case converted to upper case (SNAKE_CASE)
		context.setNamingStrategy(NamingStrategy.SNAKE_CASE.transform(String::toUpperCase));

```

<a id="mapping-configuration"></a>

### Mapping Configuration

Unless explicitly configured, an instance of `MappingCassandraConverter` is created by default when creating a `CassandraTemplate`.
You can create your own instance of the `MappingCassandraConverter` to tell it where to scan the classpath at startup for your domain classes to extract metadata and construct indexes.

Also, by creating your own instance, you can register Spring `Converter` instances to use for mapping specific classes to and from the database.
The following example configuration class sets up Cassandra mapping support:

```java
@Configuration
public class SchemaConfiguration extends AbstractCassandraConfiguration {

	@Override
	protected String getKeyspaceName() {
		return "bigbank";
	}

	// the following are optional

	@Override
	public CassandraCustomConversions customConversions() {

		return CassandraCustomConversions.create(config -> {
			config.registerConverter(new PersonReadConverter()));
			config.registerConverter(new PersonWriteConverter()));
		});
	}

	@Override
	public SchemaAction getSchemaAction() {
		return SchemaAction.RECREATE;
	}

	// other methods omitted...
}
```

`AbstractCassandraConfiguration` requires you to implement methods that define a keyspace.
`AbstractCassandraConfiguration` also has a method named  `getEntityBasePackages(…)`.
You can override it to tell the converter where to scan for classes annotated with the `@Table` annotation.

You can add additional converters to the `MappingCassandraConverter` by overriding the `customConversions` method.

> [!NOTE]
> `AbstractCassandraConfiguration` creates a `CassandraTemplate` instance and registers it with the container under the name of `cassandraTemplate`.

<a id="mapping.usage"></a>

## Metadata-based Mapping

To take full advantage of the object mapping functionality inside the Spring Data for Apache Cassandra support, you should annotate your mapped domain objects with the `@Table` annotation.
Doing so lets the classpath scanner find and pre-process your domain objects to extract the necessary metadata.
Only annotated entities are used to perform schema actions.
In the worst case, a `SchemaAction.RECREATE_DROP_UNUSED` operation drops your tables and you lose your data.
The following example shows a simple domain object:

```java
@Table
public class Person {

  @Id
  private String id;

  @CassandraType(type = Name.VARINT)
  private Integer ssn;

  private String firstName;

  private String lastName;
}
```

> [!IMPORTANT]
> The `@Id` annotation tells the mapper which property you want to use for the Cassandra primary key.
> Composite primary keys can require a slightly different data model.

<a id="cassandra-template.id-handling"></a>

### Working with Primary Keys

Cassandra requires at least one partition key field for a CQL table.
A table can additionally declare one or more clustering key fields.
When your CQL table has a composite primary key, you must create a `@PrimaryKeyClass` to define the structure of the composite primary key.
In this context, “composite primary key” means one or more partition columns optionally combined with one or more clustering columns.

Primary keys can make use of any singular simple Cassandra type or mapped user-defined Type.
Collection-typed primary keys are not supported.

<a id="cassandra-template.id-handling.simple"></a>

#### Simple Primary Keys

A simple primary key consists of one partition key field within an entity class.
Since it is one field only, we safely can assume it is a partition key.
The following listing shows a CQL table defined in Cassandra with a primary key of `user_id`:

```
CREATE TABLE user (
  user_id text,
  firstname text,
  lastname text,
  PRIMARY KEY (user_id))
;
```

The following example shows a Java class annotated such that it corresponds to the Cassandra defined in the previous listing:

```java
@Table(value = "login_event")
public class LoginEvent {

  @PrimaryKey("user_id")
  private String userId;

  private String firstname;
  private String lastname;

  // getters and setters omitted

}
```

<a id="cassandra-template.id-handling.composite"></a>

#### Composite Keys

Composite primary keys (or compound keys) consist of more than one primary key field.
That said, a composite primary key can consist of multiple partition keys, a partition key and a clustering key, or a multitude of primary key fields.

Composite keys can be represented in two ways with Spring Data for Apache Cassandra:

- Embedded in an entity.
- By using `@PrimaryKeyClass`.

The simplest form of a composite key is a key with one partition key and one clustering key.

The following example shows a CQL statement to represent the table and its composite key:

```
CREATE TABLE login_event(
  person_id text,
  event_code int,
  event_time timestamp,
  ip_address text,
  PRIMARY KEY (person_id, event_code, event_time))
  WITH CLUSTERING ORDER BY (event_time DESC)
;
```

<a id="cassandra-template.id-handling.flat"></a>

#### Flat Composite Primary Keys

Flat composite primary keys are embedded inside the entity as flat fields.
Primary key fields are annotated with
`@PrimaryKeyColumn`.
Selection requires either a query to contain predicates for the individual fields or the use of `MapId`.
The following example shows a class with a flat composite primary key:

```java
@Table(value = "login_event")
class LoginEvent {

  @PrimaryKeyColumn(name = "person_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
  private String personId;

  @PrimaryKeyColumn(name = "event_code", ordinal = 1, type = PrimaryKeyType.PARTITIONED)
  private int eventCode;

  @PrimaryKeyColumn(name = "event_time", ordinal = 2, type = PrimaryKeyType.CLUSTERED, ordering = Ordering.DESCENDING)
  private LocalDateTime eventTime;

  @Column("ip_address")
  private String ipAddress;

  // getters and setters omitted
}
```

<a id="cassandra-template.id-handling.pk-class"></a>

#### Primary Key Class

A primary key class is a composite primary key class that is mapped to multiple fields or properties of the entity.
It is annotated with `@PrimaryKeyClass` and should define `equals` and `hashCode` methods.
The semantics of value equality for these methods should be consistent with the database equality for the database types to which the key is mapped.
Primary key classes can be used with repositories (as the `Id` type) and to represent an entity’s identity in a single complex object.
The following example shows a composite primary key class:

```java
@PrimaryKeyClass
class LoginEventKey implements Serializable {

  @PrimaryKeyColumn(name = "person_id", ordinal = 0, type = PrimaryKeyType.PARTITIONED)
  private String personId;

  @PrimaryKeyColumn(name = "event_code", ordinal = 1, type = PrimaryKeyType.PARTITIONED)
  private int eventCode;

  @PrimaryKeyColumn(name = "event_time", ordinal = 2, type = PrimaryKeyType.CLUSTERED, ordering = Ordering.DESCENDING)
  private LocalDateTime eventTime;

  // other methods omitted
}
```

The following example shows how to use a composite primary key:

```java
@Table(value = "login_event")
public class LoginEvent {

  @PrimaryKey
  private LoginEventKey key;

  @Column("ip_address")
  private String ipAddress;

  // getters and setters omitted
}
```

<a id="mapping.embedded-entities"></a>

### Embedded Entity Support

Embedded entities are used to design value objects in your Java domain model whose properties are flattened out into the table.
In the following example you see, that `User.name` is annotated with `@Embedded`.
The consequence of this is that all properties of `UserName` are folded into the `user` table which consists of 3 columns (`user_id`, `firstname`, `lastname`).

> [!NOTE]
> Embedded entities may only contain simple property types.
> It is not possible to nest an embedded entity into another embedded one.

However, if the `firstname` and `lastname` column values are actually `null` within the result set, the entire property `name` will be set to `null` according to the `onEmpty` of `@Embedded`, which `null`s objects when all nested properties are `null`.

Opposite to this behavior `USE_EMPTY` tries to create a new instance using either a default constructor or one that accepts nullable parameter values from the result set.

```java
public class User {

	@PrimaryKey("user_id")
    private String userId;

    @Embedded(onEmpty = USE_NULL) <1>
    UserName name;
}

public class UserName {
    private String firstname;
    private String lastname;
}
```

1. Property is `null` if `firstname` and `lastname` are `null`.
Use `onEmpty=USE_EMPTY` to instantiate `UserName` with a potential `null` value for its properties.

You can embed a value object multiple times in an entity by using the optional `prefix` element of the `@Embedded` annotation.
This element represents a prefix and is prepended to each column name in the embedded object.
Note that properties will overwrite each other if multiple properties render to the same column name.

> [!TIP]
> Make use of the shortcuts `@Embedded.Nullable` and `@Embedded.Empty` for `@Embedded(onEmpty = USE_NULL)` and `@Embedded(onEmpty = USE_EMPTY)` to reduce verbosity and simultaneously set JSR-305 `@javax.annotation.Nonnull` accordingly.
>
> ```java
> public class MyEntity {
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

<a id="mapping.usage-annotations"></a>

### Mapping Annotation Overview

The `MappingCassandraConverter` can use metadata to drive the mapping of objects to rows in a Cassandra table.
An overview of the annotations follows:

- `@Id`: Applied at the field or property level to mark the property used for identity purposes.
- `@Table`: Applied at the class level to indicate that this class is a candidate for mapping to the database.
You can specify the name of the table where the object is stored.
- `@PrimaryKey`: Similar to `@Id` but lets you specify the column name.
- `@PrimaryKeyColumn`: Cassandra-specific annotation for primary key columns that lets you specify primary key column attributes, such as for clustered or partitioned.
Can be used on single and multiple attributes to indicate either a single or a composite (compound) primary key.
If used on a property within the entity, make sure to apply the `@Id` annotation as well.
- `@PrimaryKeyClass`: Applied at the class level to indicate that this class is a compound primary key class.
Must be referenced with `@PrimaryKey` in the entity class.
- `@Transient`: By default, all private fields are mapped to the row.
This annotation excludes the field where it is applied from being stored in the database.
Transient properties cannot be used within a persistence constructor as the converter cannot materialize a value for the constructor argument.
- `@PersistenceConstructor`: Marks a given constructor — even a package protected one — to use when instantiating the object from the database.
Constructor arguments are mapped by name to the key values in the retrieved row.
- `@Value`: This annotation is part of the Spring Framework . Within the mapping framework it can be applied to constructor arguments.
This lets you use a Spring Expression Language statement to transform a key’s value retrieved in the database before it is used to construct a domain object.
In order to reference a property of a given `Row`/`UdtValue`/`TupleValue` one has to use expressions like: `@Value("#root.getString(0)")` where `root` refers to the root of the given document.
- `@ReadOnlyProperty`: Applies at the field level to mark a property as read-only.
Entity-bound insert and update statements do not include this property.
- `@Column`: Applied at the field level.
Describes the column name as it is represented in the Cassandra table, thus letting the name differ from the field name of the class.
Can be used on constructor arguments to customize the column name during constructor creation.
- `@Embedded`: Applied at the field level.
Enables embedded object usage for types mapped to a table or a user-defined type.
Properties of the embedded object are flattened into the structure of its parent.
- `@Indexed`: Applied at the field level.
Describes the index to be created at session initialization.
- `@SASI`: Applied at the field level.
Allows SASI index creation during session initialization.
- `@CassandraType`: Applied at the field level to specify a Cassandra data type.
Types are derived from the property declaration by default.
- `@Frozen`: Applied at the field level to class-types and parametrized types.
Declares a frozen UDT column or frozen collection like `List<@Frozen UserDefinedPersonType>`.
- `@UserDefinedType`: Applied at the type level to specify a Cassandra User-defined Data Type (UDT).
Types are derived from the declaration by default.
- `@Tuple`: Applied at the type level to use a type as a mapped tuple.
- `@Element`: Applied at the field level to specify element or field ordinals within a mapped tuple.
Types are derived from the property declaration by default.
Can be used on constructor arguments to customize tuple element ordinals during constructor creation.
- `@Version`: Applied at field level is used for optimistic locking and checked for modification on save operations.
The initial value is `zero` which is bumped automatically on every update.

The mapping metadata infrastructure is defined in the separate, spring-data-commons project that is both technology- and data store-agnostic.

The following example shows a more complex mapping:

```java
@Table("my_person")
public class Person {

	@PrimaryKeyClass
	public static class Key implements Serializable {

		@PrimaryKeyColumn(ordinal = 0, type = PrimaryKeyType.PARTITIONED)
		private String type;

		@PrimaryKeyColumn(ordinal = 1, type = PrimaryKeyType.PARTITIONED)
		private String value;

		@PrimaryKeyColumn(name = "correlated_type", ordinal = 2, type = PrimaryKeyType.CLUSTERED)
		private String correlatedType;

		// other getters/setters omitted
	}

	@PrimaryKey
	private Person.Key key;

	@CassandraType(type = CassandraType.Name.VARINT)
	private Integer ssn;

	@Column("f_name")
	private String firstName;

	@Column
	@Indexed
	private String lastName;

	private Address address;

	@CassandraType(type = CassandraType.Name.UDT, userTypeName = "myusertype")
	private UdtValue usertype;

	private Coordinates coordinates;

	@Transient
	private Integer accountTotal;

	@CassandraType(type = CassandraType.Name.SET, typeArguments = CassandraType.Name.BIGINT)
	private Set<Long> timestamps;

	private Map<@Indexed String, InetAddress> sessions;

	public Person(Integer ssn) {
		this.ssn = ssn;
	}

	public Person.Key getKey() {
		return key;
	}

	// no setter for Id.  (getter is only exposed for some unit testing)

	public Integer getSsn() {
		return ssn;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	// other getters/setters omitted
}
```

The following example shows how to map a UDT `Address`:

```java
@UserDefinedType("address")
public class Address {

  @CassandraType(type = CassandraType.Name.VARCHAR)
  private String street;

  private String city;

  private Set<String> zipcodes;

  @CassandraType(type = CassandraType.Name.SET, typeArguments = CassandraType.Name.BIGINT)
  private List<Long> timestamps;

  // other getters/setters omitted
}
```

> [!NOTE]
> Working with User-Defined Types requires a `UserTypeResolver` that is configured with the mapping context.
> See the [configuration chapter](cassandra/configuration.md) for how to configure a `UserTypeResolver`.

The following example shows how map a tuple:

```java
@Tuple
class Coordinates {

  @Element(0)
  @CassandraType(type = CassandraType.Name.VARCHAR)
  private String description;

  @Element(1)
  private long longitude;

  @Element(2)
  private long latitude;

  // other getters/setters omitted
}
```

<a id="mapping.index-creation"></a>

#### Index Creation

You can annotate particular entity properties with `@Indexed` or `@SASI` if you wish to create secondary indexes on application startup.
Index creation creates simple secondary indexes for scalar types, user-defined types, and collection types.

You can configure a SASI Index to apply an analyzer, such as `StandardAnalyzer` or `NonTokenizingAnalyzer` (by using
`@StandardAnalyzed` and `@NonTokenizingAnalyzed`, respectively).

Map types distinguish between `ENTRY`, `KEYS`, and `VALUES` indexes.
Index creation derives the index type from the annotated element.
The following example shows a number of ways to create an index:

```java
@Table
class PersonWithIndexes {

  @Id
  private String key;

  @SASI
  @StandardAnalyzed
  private String names;

  @Indexed("indexed_map")
  private Map<String, String> entries;

  private Map<@Indexed String, String> keys;

  private Map<String, @Indexed String> values;

  // …
}
```

> [!NOTE]
> The `@Indexed` annotation can be applied to single properties of embedded entities or along side with the `@Embedded` annotation, in which case all properties of the embedded are indexed.

> [!CAUTION]
> Index creation on session initialization may have a severe performance impact on application startup.
