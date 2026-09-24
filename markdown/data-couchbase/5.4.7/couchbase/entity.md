---
title: "Modeling Entities"
source: "ROOT:couchbase/entity.adoc"
---

<a id="couchbase.entity"></a>

# Modeling Entities

This chapter describes how to model Entities and explains their counterpart representation in Couchbase Server itself.

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
> In all other cases you can exclude synthetic fields for delegated properties by annotating the property with [`@Transient`](https://docs.spring.io/spring-data/commons/docs/3.4.7/api//org/springframework/data/annotation/Transient.html).

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

<a id="basics"></a>

## Documents and Fields

All entities should be annotated with the `@Document` annotation, but it is not a requirement.

Also, every field in the entity should be annotated with the `@Field` annotation. While this is - strictly speaking -
optional, it helps to reduce edge cases and clearly shows the intent and design of the entity. It can also be used to
store the field under a different name.

There is also a special `@Id` annotation which needs to be always in place. Best practice is to also name the property
`id`.

Here is a very simple `User` entity:

```java
import org.springframework.data.annotation.Id;
import org.springframework.data.couchbase.core.mapping.Field;
import org.springframework.data.couchbase.core.mapping.Document;

@Document
public class User {

    @Id
    private String id;

    @Field
    private String firstname;

    @Field
    private String lastname;

    public User(String id, String firstname, String lastname) {
        this.id = id;
        this.firstname = firstname;
        this.lastname = lastname;
    }

    public String getId() {
        return id;
    }

    public String getFirstname() {
        return firstname;
    }

    public String getLastname() {
        return lastname;
    }
}

```

Couchbase Server supports automatic expiration for documents.
The library implements support for it through the `@Document` annotation.
You can set a `expiry` value which translates to the number of seconds until the document gets removed automatically.
If you want to make it expire in 10 seconds after mutation, set it like `@Document(expiry = 10)`.
Alternatively, you can configure the expiry using Spring’s property support and the `expiryExpression` parameter, to allow for dynamically changing the expiry value.
For example: `@Document(expiryExpression = "${valid.document.expiry}")`.
The property must be resolvable to an int value and the two approaches cannot be mixed.

If you want a different representation of the field name inside the document in contrast to the field name used in your entity, you can set a different name on the `@Field` annotation.
For example if you want to keep your documents small you can set the firstname field to `@Field("fname")`.
In the JSON document, you’ll see `{"fname": ".."}` instead of `{"firstname": ".."}`.

The `@Id` annotation needs to be present because every document in Couchbase needs a unique key.
This key needs to be any string with a length of maximum 250 characters.
Feel free to use whatever fits your use case, be it a UUID, an email address or anything else.

Writes to Couchbase-Server buckets can optionally be assigned durability requirements; which instruct Couchbase Server to update the specified document on multiple nodes in memory and/or disk locations across the cluster; before considering the write to be committed.
Default durability requirements can also be configured through the `@Document` or `@Durability` annotations.
For example: `@Document(durabilityLevel = DurabilityLevel.MAJORITY)` will force mutations to be replicated to a majority of the Data Service nodes. Both of the annotations support expression based durability level assignment via `durabilityExpression` attribute (Note SPEL is not supported).

<a id="datatypes"></a>

## Datatypes and Converters

The storage format of choice is JSON. It is great, but like many data representations it allows less datatypes than you could express in Java directly.
Therefore, for all non-primitive types some form of conversion to and from supported types needs to happen.

For the following entity field types, you don’t need to add special handling:

| Java Type | JSON Representation |
| --- | --- |
| string | string |
| boolean | boolean |
| byte | number |
| short | number |
| int | number |
| long | number |
| float | number |
| double | number |
| null | Ignored on write |

Since JSON supports objects ("maps") and lists, `Map` and `List` types can be converted naturally.
If they only contain primitive field types from the last paragraph, you don’t need to add special handling too.
Here is an example:

```java
@Document
public class User {

    @Id
    private String id;

    @Field
    private List<String> firstnames;

    @Field
    private Map<String, Integer> childrenAges;

    public User(String id, List<String> firstnames, Map<String, Integer> childrenAges) {
        this.id = id;
        this.firstnames = firstnames;
        this.childrenAges = childrenAges;
    }

}
```

Storing a user with some sample data could look like this as a JSON representation:

```json

{
    "_class": "foo.User",
    "childrenAges": {
        "Alice": 10,
        "Bob": 5
    },
    "firstnames": [
        "Foo",
        "Bar",
        "Baz"
    ]
}
```

You don’t need to break everything down to primitive types and Lists/Maps all the time.
Of course, you can also compose other objects out of those primitive values.
Let’s modify the last example so that we want to store a `List` of `Children`:

```java
@Document
public class User {

    @Id
    private String id;

    @Field
    private List<String> firstnames;

    @Field
    private List<Child> children;

    public User(String id, List<String> firstnames, List<Child> children) {
        this.id = id;
        this.firstnames = firstnames;
        this.children = children;
    }

    static class Child {
        private String name;
        private int age;

        Child(String name, int age) {
            this.name = name;
            this.age = age;
        }

    }

}
```

A populated object can look like:

```json

{
  "_class": "foo.User",
  "children": [
    {
      "age": 4,
      "name": "Alice"
    },
    {
      "age": 3,
      "name": "Bob"
    }
  ],
  "firstnames": [
    "Foo",
    "Bar",
    "Baz"
  ]
}
```

Most of the time, you also need to store a temporal value like a `Date`.
Since it can’t be stored directly in JSON, a conversion needs to happen.
The library implements default converters for `Date`, `Calendar` and JodaTime types (if on the classpath).
All of those are represented by default in the document as a unix timestamp (number).
You can always override the default behavior with custom converters as shown later.
Here is an example:

```java
@Document
public class BlogPost {

    @Id
    private String id;

    @Field
    private Date created;

    @Field
    private Calendar updated;

    @Field
    private String title;

    public BlogPost(String id, Date created, Calendar updated, String title) {
        this.id = id;
        this.created = created;
        this.updated = updated;
        this.title = title;
    }

}
```

A populated object can look like:

```json
{
  "title": "a blog post title",
  "_class": "foo.BlogPost",
  "updated": 1394610843,
  "created": 1394610843897
}
```

Optionally, Date can be converted to and from ISO-8601 compliant strings by setting system property `org.springframework.data.couchbase.useISOStringConverterForDate` to true.
If you want to override a converter or implement your own one, this is also possible.
The library implements the general Spring Converter pattern.
You can plug in custom converters on bean creation time in your configuration.
Here’s how you can configure it (in your overridden `AbstractCouchbaseConfiguration`):

```java
@Override
public CustomConversions customConversions() {
    return new CustomConversions(Arrays.asList(FooToBarConverter.INSTANCE, BarToFooConverter.INSTANCE));
}

@WritingConverter
public static enum FooToBarConverter implements Converter<Foo, Bar> {
    INSTANCE;

    @Override
    public Bar convert(Foo source) {
        return /* do your conversion here */;
    }

}

@ReadingConverter
public static enum BarToFooConverter implements Converter<Bar, Foo> {
    INSTANCE;

    @Override
    public Foo convert(Bar source) {
        return /* do your conversion here */;
    }

}
```

There are a few things to keep in mind with custom conversions:

- To make it unambiguous, always use the `@WritingConverter` and `@ReadingConverter` annotations on your converters.
Especially if you are dealing with primitive type conversions, this will help to reduce possible wrong conversions.
- If you implement a writing converter, make sure to decode into primitive types, maps and lists only.
If you need more complex object types, use the `CouchbaseDocument` and `CouchbaseList` types, which are also understood by the underlying translation engine.
Your best bet is to stick with as simple as possible conversions.
- Always put more special converters before generic converters to avoid the case where the wrong converter gets executed.
- For dates, reading converters should be able to read from any `Number` (not just `Long`).
This is required for N1QL support.

<a id="version"></a>

## Optimistic Locking

In certain situations you may want to ensure that you are not overwriting another users changes when you perform a mutation operation on a document. For this you have three choices: Transactions (since Couchbase 6.5), pessimistic concurrency (locking) or optimistic concurrency.

Optimistic concurrency tends to provide better performance than pessimistic concurrency or transactions, because no actual locks are held on the data and no extra information is stored about the operation (no transaction log).

To implement optimistic locking, Couchbase uses a CAS (compare and swap) approach. When a document is mutated, the CAS value also changes.
The CAS is opaque to the client, the only thing you need to know is that it changes when the content or a meta information changes too.

In other datastores, similar behavior can be achieved through an arbitrary version field with a incrementing counter.
Since Couchbase supports this in a much better fashion, it is easy to implement.
If you want automatic optimistic locking support, all you need to do is add a `@Version` annotation on a long field like this:

```java
@Document
public class User {

        @Version
        private long version;

        // constructor, getters, setters...
}
```

If you load a document through the template or repository, the version field will be automatically populated with the current CAS value.
It is important to note that you shouldn’t access the field or even change it on your own.
Once you save the document back, it will either succeed or fail with a `OptimisticLockingFailureException`.
If you get such an exception, the further approach depends on what you want to achieve application wise.
You should either retry the complete load-update-write cycle or propagate the error to the upper layers for proper handling.

<a id="validation"></a>

## Validation

The library supports JSR 303 validation, which is based on annotations directly in your entities.
Of course you can add all kinds of validation in your service layer, but this way its nicely coupled to your actual entities.

To make it work, you need to include two additional dependencies.
JSR 303 and a library that implements it, like the one supported by hibernate:

```xml
<dependency>
  <groupId>javax.validation</groupId>
  <artifactId>validation-api</artifactId>
</dependency>
<dependency>
  <groupId>org.hibernate</groupId>
  <artifactId>hibernate-validator</artifactId>
</dependency>
```

Now you need to add two beans to your configuration:

```java
@Bean
public LocalValidatorFactoryBean validator() {
    return new LocalValidatorFactoryBean();
}

@Bean
public ValidatingCouchbaseEventListener validationEventListener() {
    return new ValidatingCouchbaseEventListener(validator());
}
```

Now you can annotate your fields with JSR303 annotations.
If a validation on `save()` fails, a `ConstraintViolationException` is thrown.

```java
@Size(min = 10)
@Field
private String name;
```

<a id="auditing"></a>

## Auditing

Entities can be automatically audited (tracing which user created the object, updated the object, and at what times) through Spring Data auditing mechanisms.

First, note that only entities that have a `@Version` annotated field can be audited for creation (otherwise the framework will interpret a creation as an update).

Auditing works by annotating fields with `@CreatedBy`, `@CreatedDate`, `@LastModifiedBy` and `@LastModifiedDate`.
The framework will automatically inject the correct values on those fields when persisting the entity.
The xxxDate annotations must be put on a `Date` field (or compatible, eg. jodatime classes) while the xxxBy annotations can be put on fields of any class `T` (albeit both fields must be of the same type).

To configure auditing, first you need to have an auditor aware bean in the context.
Said bean must be of type `AuditorAware<T>` (allowing to produce a value that can be stored in the xxxBy fields of type `T` we saw earlier).
Secondly, you must activate auditing in your `@Configuration` class by using the `@EnableCouchbaseAuditing` annotation.

Here is an example:

```java
@Document
public class AuditedItem {

  @Id
  private final String id;

  private String value;

  @CreatedBy
  private String creator;

  @LastModifiedBy
  private String lastModifiedBy;

  @LastModifiedDate
  private Date lastModification;

  @CreatedDate
  private Date creationDate;

  @Version
  private long version;

  //..omitted constructor/getters/setters/...
}
```

Notice both `@CreatedBy` and `@LastModifiedBy` are both put on a `String` field, so our `AuditorAware` must work with `String`.

```java
public class NaiveAuditorAware implements AuditorAware<String> {

  private String auditor = "auditor";

  @Override
  public String getCurrentAuditor() {
    return auditor;
  }

  public void setAuditor(String auditor) {
    this.auditor = auditor;
  }
}
```

To tie all that together, we use the java configuration both to declare an AuditorAware bean and to activate auditing:

```java
@Configuration
@EnableCouchbaseAuditing //this activates auditing
public class AuditConfiguration extends AbstractCouchbaseConfiguration {

    //... a few abstract methods omitted here

    // this creates the auditor aware bean that will feed the annotations
    @Bean
    public NaiveAuditorAware testAuditorAware() {
      return new NaiveAuditorAware();
    }
```
