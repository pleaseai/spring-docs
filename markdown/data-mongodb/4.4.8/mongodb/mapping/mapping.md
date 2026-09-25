---
title: "Object Mapping"
source: "ROOT:mongodb/mapping/mapping.adoc"
---

<a id="mapping-chapter"></a>

# Object Mapping

Rich mapping support is provided by the `MappingMongoConverter`.
The converter holds a metadata model that provides a full feature set to map domain objects to MongoDB documents.
The mapping metadata model is populated by using annotations on your domain objects.
However, the infrastructure is not limited to using annotations as the only source of metadata information.
The `MappingMongoConverter` also lets you map objects to documents without providing any additional metadata, by following a set of conventions.

This section describes the features of the `MappingMongoConverter`, including fundamentals, how to use conventions for mapping objects to documents and how to override those conventions with annotation-based mapping metadata.

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
>     return new Person(id, this.firstname, this.lastname);
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
> In all other cases you can exclude synthetic fields for delegated properties by annotating the property with [`@Transient`](https://docs.spring.io/spring-data/commons/docs/3.4.8/api//org/springframework/data/annotation/Transient.html).

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

<a id="mapping-conventions"></a>

## Convention-based Mapping

`MappingMongoConverter` has a few conventions for mapping objects to documents when no additional mapping metadata is provided.
The conventions are:

- The short Java class name is mapped to the collection name in the following manner.
The class `com.bigbank.SavingsAccount` maps to the `savingsAccount` collection name.
- All nested objects are stored as nested objects in the document and **not** as DBRefs.
- The converter uses any Spring Converters registered with it to override the default mapping of object properties to document fields and values.
- The fields of an object are used to convert to and from fields in the document.
Public `JavaBean` properties are not used.
- If you have a single non-zero-argument constructor whose constructor argument names match top-level field names of document, that constructor is used.Otherwise, the zero-argument constructor is used.If there is more than one non-zero-argument constructor, an exception will be thrown.

<a id="mapping.conventions.id-field"></a>

### How the `_id` field is handled in the mapping layer.

MongoDB requires that you have an `_id` field for all documents.If you don’t provide one the driver will assign a ObjectId with a generated value.The `_id` field can be of any type, other than arrays, so long as it is unique.The driver naturally supports all primitive types and Dates.When using the `MappingMongoConverter` there are certain rules that govern how properties from the Java class are mapped to the `_id` field.

The following outlines what field will be mapped to the `_id` document field:

- A field annotated with `@Id` (`org.springframework.data.annotation.Id`) will be mapped to the `_id` field.

Additionally, the name of the document field can be customized via the `@Field` annotation, in which case the document will not contain a field `_id`.
- A field without an annotation but named `id` will be mapped to the `_id` field.

| Field definition | Resulting Id-Fieldname in MongoDB |
| --- | --- |
| `String` id | `_id` |
| `@Field` `String` id | `_id` |
| `@Field("x")` `String` id | `x` |
| `@Id` `String` x | `_id` |
| `@Field("x")` `@Id` `String` y | `_id` (`@Field(name)` is ignored, `@Id` takes precedence) |

The following outlines what type conversion, if any, will be done on the property mapped to the \_id document field.

- If a field named `id` is declared as a String or BigInteger in the Java class it will be converted to and stored as an ObjectId if possible.
ObjectId as a field type is also valid.
If you specify a value for `id` in your application, the conversion to an ObjectId is done by the MongoDB driver.
If the specified `id` value cannot be converted to an ObjectId, then the value will be stored as is in the document’s `_id` field.
This also applies if the field is annotated with `@Id`.
- If a field is annotated with `@MongoId` in the Java class it will be converted to and stored as using its actual type.
No further conversion happens unless `@MongoId` declares a desired field type.
If no value is provided for the `id` field, a new `ObjectId` will be created and converted to the properties type.
- If a field is annotated with `@MongoId(FieldType.…)` in the Java class it will be attempted to convert the value to the declared `FieldType`.
If no value is provided for the `id` field, a new `ObjectId` will be created and converted to the declared type.
- If a field named `id` is not declared as a String, BigInteger, or ObjectID in the Java class then you should assign it a value in your application so it can be stored 'as-is' in the document’s `_id` field.
- If no field named `id` is present in the Java class then an implicit `_id` file will be generated by the driver but not mapped to a property or field of the Java class.

When querying and updating `MongoTemplate` will use the converter to handle conversions of the `Query` and `Update` objects that correspond to the above rules for saving documents so field names and types used in your queries will be able to match what is in your domain classes.

<a id="mapping-conversion"></a>

## Data Mapping and Type Conversion

Spring Data MongoDB supports all types that can be represented as BSON, MongoDB’s internal document format.
In addition to these types, Spring Data MongoDB provides a set of built-in converters to map additional types.
You can provide your own converters to adjust type conversion.
See [Custom Conversions - Overriding Default Mapping](custom-conversions.md) for further details.

| Type | Type conversion | Sample |
| --- | --- | --- |
| `String` | native | `{"firstname" : "Dave"}` |
| `double`, `Double`, `float`, `Float` | native | `{"weight" : 42.5}` |
| `int`, `Integer`, `short`, `Short` | native 32-bit integer | `{"height" : 42}` |
| `long`, `Long` | native 64-bit integer | `{"height" : 42}` |
| `Date`, `Timestamp` | native | `{"date" : ISODate("2019-11-12T23:00:00.809Z")}` |
| `byte[]` | native | `{"bin" : { "$binary" : "AQIDBA==", "$type" : "00" }}` |
| `java.util.UUID` (Legacy UUID) | native | `{"uuid" : { "$binary" : "MEaf1CFQ6lSphaa3b9AtlA==", "$type" : "03" }}` |
| `Date` | native | `{"date" : ISODate("2019-11-12T23:00:00.809Z")}` |
| `ObjectId` | native | `{"_id" : ObjectId("5707a2690364aba3136ab870")}` |
| Array, `List`, `BasicDBList` | native | `{"cookies" : [ … ]}` |
| `boolean`, `Boolean` | native | `{"active" : true}` |
| `null` | native | `{"value" : null}` |
| `Document` | native | `{"value" : { … }}` |
| `Decimal128` | native | `{"value" : NumberDecimal(…)}` |
| `AtomicInteger` calling `get()` before the actual conversion | converter 32-bit integer | `{"value" : "741" }` |
| `AtomicLong` calling `get()` before the actual conversion | converter 64-bit integer | `{"value" : "741" }` |
| `BigInteger` | converter `String` | `{"value" : "741" }` |
| `BigDecimal` | converter `String` | `{"value" : "741.99" }` |
| `URL` | converter | `{"website" : "https://spring.io/projects/spring-data-mongodb/" }` |
| `Locale` | converter | `{"locale : "en_US" }` |
| `char`, `Character` | converter | `{"char" : "a" }` |
| `NamedMongoScript` | converter `Code` | `{"_id" : "script name", value: (some javascript code)`} |
| `java.util.Currency` | converter | `{"currencyCode" : "EUR"}` |
| `Instant` (Java 8) | native | `{"date" : ISODate("2019-11-12T23:00:00.809Z")}` |
| `Instant` (Joda, JSR310-BackPort) | converter | `{"date" : ISODate("2019-11-12T23:00:00.809Z")}` |
| `LocalDate` (Joda, Java 8, JSR310-BackPort) | converter / native (Java8)<sup>\[[1](#_footnotedef_1)\]</sup> | `{"date" : ISODate("2019-11-12T00:00:00.000Z")}` |
| `LocalDateTime`, `LocalTime` (Joda, Java 8, JSR310-BackPort) | converter / native (Java8)<sup>\[[2](#_footnotedef_2)\]</sup> | `{"date" : ISODate("2019-11-12T23:00:00.809Z")}` |
| `DateTime` (Joda) | converter | `{"date" : ISODate("2019-11-12T23:00:00.809Z")}` |
| `ZoneId` (Java 8, JSR310-BackPort) | converter | `{"zoneId" : "ECT - Europe/Paris"}` |
| `Box` | converter | `{"box" : { "first" : { "x" : 1.0 , "y" : 2.0} , "second" : { "x" : 3.0 , "y" : 4.0}}` |
| `Polygon` | converter | `{"polygon" : { "points" : [ { "x" : 1.0 , "y" : 2.0} , { "x" : 3.0 , "y" : 4.0} , { "x" : 4.0 , "y" : 5.0}]}}` |
| `Circle` | converter | `{"circle" : { "center" : { "x" : 1.0 , "y" : 2.0} , "radius" : 3.0 , "metric" : "NEUTRAL"}}` |
| `Point` | converter | `{"point" : { "x" : 1.0 , "y" : 2.0}}` |
| `GeoJsonPoint` | converter | `{"point" : { "type" : "Point" , "coordinates" : [3.0 , 4.0] }}` |
| `GeoJsonMultiPoint` | converter | `{"geoJsonLineString" : {"type":"MultiPoint", "coordinates": [ [ 0 , 0 ], [ 0 , 1 ], [ 1 , 1 ] ] }}` |
| `Sphere` | converter | `{"sphere" : { "center" : { "x" : 1.0 , "y" : 2.0} , "radius" : 3.0 , "metric" : "NEUTRAL"}}` |
| `GeoJsonPolygon` | converter | `{"polygon" : { "type" : "Polygon", "coordinates" : [[ [ 0 , 0 ], [ 3 , 6 ], [ 6 , 1 ], [ 0 , 0  ] ]] }}` |
| `GeoJsonMultiPolygon` | converter | `{"geoJsonMultiPolygon" : { "type" : "MultiPolygon", "coordinates" : [ [ [ [ -73.958 , 40.8003 ] , [ -73.9498 , 40.7968 ] ] ], [ [ [ -73.973 , 40.7648 ] , [ -73.9588 , 40.8003 ] ] ] ] }}` |
| `GeoJsonLineString` | converter | `{ "geoJsonLineString" : { "type" : "LineString", "coordinates" : [ [ 40 , 5 ], [ 41 , 6 ] ] }}` |
| `GeoJsonMultiLineString` | converter | `{"geoJsonLineString" : { "type" : "MultiLineString", coordinates: [ [ [ -73.97162 , 40.78205 ], [ -73.96374 , 40.77715 ] ], [ [ -73.97880 , 40.77247 ], [ -73.97036 , 40.76811 ] ] ] }}` |

> [!NOTE]
> Collection handling depends on the actual values returned by MongoDB.
>
> - If a document does **not** contain a field mapped to a collection, the mapping will not update the property.
> Which means the value will remain `null`, a java default or any value set during object creation.
> - If a document contains a field to be mapped, but the field holds a `null` value (like: `{ 'list' : null }`), the property value is set to `null`.
> - If a document contains a field to be mapped to a collection which is **not** `null` (like: `{ 'list' : [ …​ ] }`), the collection is populated with the mapped values.
>
> Generally, if you use constructor creation, then you can get hold of the value to be set.
> Property population can make use of default initialization values if a property value is not being provided by a query response.

<a id="mapping-configuration"></a>

## Mapping Configuration

Unless explicitly configured, an instance of `MappingMongoConverter` is created by default when you create a `MongoTemplate`.
You can create your own instance of the `MappingMongoConverter`.
Doing so lets you dictate where in the classpath your domain classes can be found, so that Spring Data MongoDB can extract metadata and construct indexes.
Also, by creating your own instance, you can register Spring converters to map specific classes to and from the database.

You can configure the `MappingMongoConverter` as well as `com.mongodb.client.MongoClient` and MongoTemplate by using either Java-based or XML-based metadata.
The following example shows the configuration:

#### Java

```java
@Configuration
public class MongoConfig extends AbstractMongoClientConfiguration {

  @Override
  public String getDatabaseName() {
    return "database";
  }

  // the following are optional

  @Override
  public String getMappingBasePackage() { <1>
    return "com.bigbank.domain";
  }

  @Override
  void configureConverters(MongoConverterConfigurationAdapter adapter) { <2>

  	adapter.registerConverter(new org.springframework.data.mongodb.test.PersonReadConverter());
  	adapter.registerConverter(new org.springframework.data.mongodb.test.PersonWriteConverter());
  }

  @Bean
  public LoggingEventListener<MongoMappingEvent> mappingEventsListener() {
    return new LoggingEventListener<MongoMappingEvent>();
  }
}
```

1. The mapping base package defines the root path used to scan for entities used to pre initialize the `MappingContext`.
By default the configuration classes package is used.
1. Configure additional custom converters for specific domain types that replace the default mapping procedure for those types with your custom implementation.

#### XML

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:mongo="http://www.springframework.org/schema/data/mongo"
  xsi:schemaLocation="
    http://www.springframework.org/schema/data/mongo https://www.springframework.org/schema/data/mongo/spring-mongo.xsd
    http://www.springframework.org/schema/beans https://www.springframework.org/schema/beans/spring-beans-3.0.xsd">

  <!-- Default bean name is 'mongo' -->
  <mongo:mongo-client host="localhost" port="27017"/>

  <mongo:db-factory dbname="database" mongo-ref="mongoClient"/>

  <!-- by default look for a Mongo object named 'mongo' - default name used for the converter is 'mappingConverter' -->
  <mongo:mapping-converter base-package="com.bigbank.domain">
    <mongo:custom-converters>
      <mongo:converter ref="readConverter"/>
      <mongo:converter>
        <bean class="org.springframework.data.mongodb.test.PersonWriteConverter"/>
      </mongo:converter>
    </mongo:custom-converters>
  </mongo:mapping-converter>

  <bean id="readConverter" class="org.springframework.data.mongodb.test.PersonReadConverter"/>

  <!-- set the mapping converter to be used by the MongoTemplate -->
  <bean id="mongoTemplate" class="org.springframework.data.mongodb.core.MongoTemplate">
    <constructor-arg name="mongoDbFactory" ref="mongoDbFactory"/>
    <constructor-arg name="mongoConverter" ref="mappingConverter"/>
  </bean>

  <bean class="org.springframework.data.mongodb.core.mapping.event.LoggingEventListener"/>

</beans>
```

`AbstractMongoClientConfiguration` requires you to implement methods that define a `com.mongodb.client.MongoClient` as well as provide a database name.
`AbstractMongoClientConfiguration` also has a method named  `getMappingBasePackage(…)` that you can override to tell the converter where to scan for classes annotated with the `@Document` annotation.

You can add additional converters to the converter by overriding the `customConversionsConfiguration` method.
MongoDB’s native JSR-310 support can be enabled through `MongoConverterConfigurationAdapter.useNativeDriverJavaTimeCodecs()`.
Also shown in the preceding example is a `LoggingEventListener`, which logs `MongoMappingEvent` instances that are posted onto Spring’s `ApplicationContextEvent` infrastructure.

> [!TIP]
> We recommend using MongoDB’s native JSR-310 support via `MongoConverterConfigurationAdapter.useNativeDriverJavaTimeCodecs()` as described above as it is using an `UTC` based approach.
> The default JSR-310 support for `java.time` types inherited from Spring Data Commons uses the local machine timezone as reference and should only be used for backwards compatibility.

> [!NOTE]
> `AbstractMongoClientConfiguration` creates a `MongoTemplate` instance and registers it with the container under the name `mongoTemplate`.

The `base-package` property tells it where to scan for classes annotated with the `@org.springframework.data.mongodb.core.mapping.Document` annotation.

> [!TIP]
> If you want to rely on [Spring Boot](https://spring.io/projects/spring-boot) to bootstrap Data MongoDB, but still want to override certain aspects of the configuration, you may want to expose beans of that type.
> For custom conversions you may eg. choose to register a bean of type `MongoCustomConversions` that will be picked up the by the Boot infrastructure.
> To learn more about this please make sure to read the Spring Boot [Reference Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#data.nosql.mongodb).

<a id="mapping-usage"></a>

## Metadata-based Mapping

To take full advantage of the object mapping functionality inside the Spring Data MongoDB support, you should annotate your mapped objects with the `@Document` annotation.
Although it is not necessary for the mapping framework to have this annotation (your POJOs are mapped correctly, even without any annotations), it lets the classpath scanner find and pre-process your domain objects to extract the necessary metadata.
If you do not use this annotation, your application takes a slight performance hit the first time you store a domain object, because the mapping framework needs to build up its internal metadata model so that it knows about the properties of your domain object and how to persist them.
The following example shows a domain object:

```java
@Document
public class Person {

  @Id
  private ObjectId id;

  @Indexed
  private Integer ssn;

  private String firstName;

  @Indexed
  private String lastName;
}
```

> [!IMPORTANT]
> The `@Id` annotation tells the mapper which property you want to use for the MongoDB `_id` property, and the `@Indexed` annotation tells the mapping framework to call `createIndex(…)` on that property of your document, making searches faster.
> Automatic index creation is only done for types annotated with `@Document`.

> [!WARNING]
> Auto index creation is **disabled** by default and needs to be enabled through the configuration (see [Index Creation](#mapping.index-creation)).

<a id="mapping-usage-annotations"></a>

### Mapping Annotation Overview

The MappingMongoConverter can use metadata to drive the mapping of objects to documents.
The following annotations are available:

- `@Id`: Applied at the field level to mark the field used for identity purpose.
- `@MongoId`: Applied at the field level to mark the field used for identity purpose.
Accepts an optional `FieldType` to customize id conversion.
- `@Document`: Applied at the class level to indicate this class is a candidate for mapping to the database.
You can specify the name of the collection where the data will be stored.
- `@DBRef`: Applied at the field to indicate it is to be stored using a com.mongodb.DBRef.
- `@DocumentReference`: Applied at the field to indicate it is to be stored as a pointer to another document.
This can be a single value (the *id* by default), or a `Document` provided via a converter.
- `@Indexed`: Applied at the field level to describe how to index the field.
- `@CompoundIndex` (repeatable): Applied at the type level to declare Compound Indexes.
- `@GeoSpatialIndexed`: Applied at the field level to describe how to geoindex the field.
- `@TextIndexed`: Applied at the field level to mark the field to be included in the text index.
- `@HashIndexed`: Applied at the field level for usage within a hashed index to partition data across a sharded cluster.
- `@Language`: Applied at the field level to set the language override property for text index.
- `@Transient`: By default, all fields are mapped to the document.
This annotation excludes the field where it is applied from being stored in the database.
Transient properties cannot be used within a persistence constructor as the converter cannot materialize a value for the constructor argument.
- `@PersistenceConstructor`: Marks a given constructor - even a package protected one - to use when instantiating the object from the database.
Constructor arguments are mapped by name to the key values in the retrieved Document.
- `@Value`: This annotation is part of the Spring Framework . Within the mapping framework it can be applied to constructor arguments.
This lets you use a Spring Expression Language statement to transform a key’s value retrieved in the database before it is used to construct a domain object.
In order to reference a property of a given document one has to use expressions like: `@Value("#root.myProperty")` where `root` refers to the root of the given document.
- `@Field`: Applied at the field level it allows to describe the name and type of the field as it will be represented in the MongoDB BSON document thus allowing the name and type to be different than the fieldname of the class as well as the property type.
- `@Version`: Applied at field level is used for optimistic locking and checked for modification on save operations.
The initial value is `zero` (`one` for primitive types) which is bumped automatically on every update.

The mapping metadata infrastructure is defined in a separate spring-data-commons project that is technology agnostic.
Specific subclasses are using in the MongoDB support to support annotation based metadata.
Other strategies are also possible to put in place if there is demand.

```java
@Document
@CompoundIndex(name = "age_idx", def = "{'lastName': 1, 'age': -1}")
public class Person<T extends Address> {

  @Id
  private String id;

  @Indexed(unique = true)
  private Integer ssn;

  @Field("fName")
  private String firstName;

  @Indexed
  private String lastName;

  private Integer age;

  @Transient
  private Integer accountTotal;

  @DBRef
  private List<Account> accounts;

  private T address;

  public Person(Integer ssn) {
    this.ssn = ssn;
  }

  @PersistenceConstructor
  public Person(Integer ssn, String firstName, String lastName, Integer age, T address) {
    this.ssn = ssn;
    this.firstName = firstName;
    this.lastName = lastName;
    this.age = age;
    this.address = address;
  }

  public String getId() {
    return id;
  }

  // no setter for Id.  (getter is only exposed for some unit testing)

  public Integer getSsn() {
    return ssn;
  }

// other getters/setters omitted
}
```

> [!TIP]
> `@Field(targetType=…​)` can come in handy when the native MongoDB type inferred by the mapping infrastructure does not match the expected one.
> Like for `BigDecimal`, which is represented as `String` instead of `Decimal128`, just because earlier versions of MongoDB Server did not have support for it.
>
> ```java
> public class Balance {
>
>   @Field(targetType = DECIMAL128)
>   private BigDecimal value;
>
>   // ...
> }
> ```
>
> You may even consider your own, custom annotation.
>
> ```java
> @Target(ElementType.FIELD)
> @Retention(RetentionPolicy.RUNTIME)
> @Field(targetType = FieldType.DECIMAL128)
> public @interface Decimal128 { }
>
> // ...
>
> public class Balance {
>
>   @Decimal128
>   private BigDecimal value;
>
>   // ...
> }
> ```

<a id="_special_field_names"></a>

### Special Field Names

Generally speaking MongoDB uses the dot (`.`) character as a path separator for nested documents or arrays.
This means that in a query (or update statement) a key like `a.b.c` targets an object structure as outlined below:

```json
{
    'a' : {
        'b' : {
            'c' : …
        }
    }
}
```

Therefore, up until MongoDB 5.0 field names must not contain dots (`.`).

Using a `MappingMongoConverter#setMapKeyDotReplacement` allowed circumvent some of the limitations when storing `Map` structures by substituting dots on write with another character.

```java
converter.setMapKeyDotReplacement("-");
// ...

source.map = Map.of("key.with.dot", "value")
converter.write(source,...) // -> map : { 'key-with-dot', 'value' }
```

With the release of MongoDB 5.0 this restriction on `Document` field names containing special characters was lifted.
We highly recommend reading more about limitations on using dots in field names in the [MongoDB Reference](https://www.mongodb.com/docs/manual/core/dot-dollar-considerations/).

To allow dots in `Map` structures please set `preserveMapKeys` on the `MappingMongoConverter`.

Using `@Field` allows customizing the field name to consider dots in two ways.

1. `@Field(name = "a.b")`: The name is considered to be a path.
Operations expect a structure of nested objects such as `{ a : { b : … } }`.
1. `@Field(name = "a.b", fieldNameType = KEY)`: The names is considered a name as-is.
Operations expect a field with the given value as `{ 'a.b' : ….. }`

> [!WARNING]
> Due to the special nature of the dot character in both MongoDB query and update statements field names containing dots cannot be targeted directly and therefore are excluded from being used in derived query methods.
> Consider the following `Item` having a `categoryId` property that is mapped to the field named `cat.id`.
>
> ```java
> public class Item {
>
> 	@Field(name = "cat.id", fieldNameType = KEY)
> 	String categoryId;
>
> 	// ...
> }
> ```
>
> Its raw representation will look like
>
> ```json
> {
>     'cat.id' : "5b28b5e7-52c2",
>     ...
> }
> ```
>
> Since we cannot target the `cat.id` field directly (as this would be interpreted as a path) we need the help of the [Aggregation Framework](../aggregation-framework.md#mongo.aggregation).
>
> #### Query fields with a dot in its name
>
> ```java
> template.query(Item.class)
>     // $expr : { $eq : [ { $getField : { input : '$$CURRENT', 'cat.id' }, '5b28b5e7-52c2' ] }
>     .matching(expr(ComparisonOperators.valueOf(ObjectOperators.getValueOf("value")).equalToValue("5b28b5e7-52c2"))) <1>
>     .all();
> ```
>
> 1. The mapping layer takes care of translating the property name `value` into the actual field name.
> It is absolutely valid to use the target field name here as well.
>
> #### Update fields with a dot in its name
>
> ```java
> template.update(Item.class)
>     .matching(where("id").is("r2d2"))
>     // $replaceWith: { $setField : { input: '$$CURRENT', field : 'cat.id', value : 'af29-f87f4e933f97' } }
>     .apply(AggregationUpdate.newUpdate(ReplaceWithOperation.replaceWithValue(ObjectOperators.setValueTo("value", "af29-f87f4e933f97")))) <1>
>     .first();
> ```
>
> 1. The mapping layer takes care of translating the property name `value` into the actual field name.
> It is absolutely valid to use the target field name here as well.
>
> The above shows a simple example where the special field is present on the top document level.
> Increased levels of nesting increase the complexity of the aggregation expression required to interact with the field.

<a id="mapping-custom-object-construction"></a>

### Customized Object Construction

The mapping subsystem allows the customization of the object construction by annotating a constructor with the `@PersistenceConstructor` annotation.
The values to be used for the constructor parameters are resolved in the following way:

- If a parameter is annotated with the `@Value` annotation, the given expression is evaluated and the result is used as the parameter value.
- If the Java type has a property whose name matches the given field of the input document, then it’s property information is used to select the appropriate constructor parameter to pass the input field value to.
This works only if the parameter name information is present in the java `.class` files which can be achieved by compiling the source with debug information or using the new `-parameters` command-line switch for javac in Java 8.
- Otherwise, a `MappingException` will be thrown indicating that the given constructor parameter could not be bound.

```java
class OrderItem {

  private @Id String id;
  private int quantity;
  private double unitPrice;

  OrderItem(String id, @Value("#root.qty ?: 0") int quantity, double unitPrice) {
    this.id = id;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
  }

  // getters/setters ommitted
}

Document input = new Document("id", "4711");
input.put("unitPrice", 2.5);
input.put("qty",5);
OrderItem item = converter.read(OrderItem.class, input);
```

> [!NOTE]
> The SpEL expression in the `@Value` annotation of the `quantity` parameter falls back to the value `0` if the given property path cannot be resolved.

Additional examples for using the `@PersistenceConstructor` annotation can be found in the [MappingMongoConverterUnitTests](https://github.com/spring-projects/spring-data-mongodb/blob/master/spring-data-mongodb/src/test/java/org/springframework/data/mongodb/core/convert/MappingMongoConverterUnitTests.java) test suite.

<a id="mapping-usage-events"></a>

### Mapping Framework Events

Events are fired throughout the lifecycle of the mapping process.
This is described in the [Lifecycle Events](../lifecycle-events.md) section.

Declaring these beans in your Spring ApplicationContext causes them to be invoked whenever the event is dispatched.
