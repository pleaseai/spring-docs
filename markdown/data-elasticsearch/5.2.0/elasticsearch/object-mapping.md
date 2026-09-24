---
title: "Elasticsearch Object Mapping"
source: "ROOT:elasticsearch/object-mapping.adoc"
---

<a id="elasticsearch.mapping"></a>

# Elasticsearch Object Mapping

Spring Data Elasticsearch Object Mapping is the process that maps a Java object - the domain entity - into the JSON representation that is stored in Elasticsearch and back.
The class that is internally used for this mapping is the
`MappingElasticsearchConverter`.

<a id="elasticsearch.mapping.meta-model"></a>

## Meta Model Object Mapping

The Metamodel based approach uses domain type information for reading/writing from/to Elasticsearch.
This allows to register `Converter` instances for specific domain type mapping.

<a id="elasticsearch.mapping.meta-model.annotations"></a>

### Mapping Annotation Overview

The `MappingElasticsearchConverter` uses metadata to drive the mapping of objects to documents.
The metadata is taken from the entity’s properties which can be annotated.

The following annotations are available:

- `@Document`: Applied at the class level to indicate this class is a candidate for mapping to the database.
The most important attributes are (check the API documentation for the complete list of attributes):

  - `indexName`: the name of the index to store this entity in.
  This can contain a SpEL template expression like `"log-#{T(java.time.LocalDate).now().toString()}"`
  - `createIndex`: flag whether to create an index on repository bootstrapping.
  Default value is *true*.
  See [Automatic creation of indices with the corresponding mapping](repositories/elasticsearch-repositories.md#elasticsearch.repositories.autocreation)
- `@Id`: Applied at the field level to mark the field used for identity purpose.
- `@Transient`, `@ReadOnlyProperty`, `@WriteOnlyProperty`: see the following section [Controlling which properties are written to and read from Elasticsearch](#elasticsearch.mapping.meta-model.annotations.read-write) for detailed information.
- `@PersistenceConstructor`: Marks a given constructor - even a package protected one - to use when instantiating the object from the database.
Constructor arguments are mapped by name to the key values in the retrieved Document.
- `@Field`: Applied at the field level and defines properties of the field, most of the attributes map to the respective [Elasticsearch Mapping](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html) definitions (the following list is not complete, check the annotation Javadoc for a complete reference):

  - `name`: The name of the field as it will be represented in the Elasticsearch document, if not set, the Java field name is used.
  - `type`: The field type, can be one of *Text, Keyword, Long, Integer, Short, Byte, Double, Float, Half\_Float, Scaled\_Float, Date, Date\_Nanos, Boolean, Binary, Integer\_Range, Float\_Range, Long\_Range, Double\_Range, Date\_Range, Ip\_Range, Object, Nested, Ip, TokenCount, Percolator, Flattened, Search\_As\_You\_Type*.
  See [Elasticsearch Mapping Types](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html).
  If the field type is not specified, it defaults to `FieldType.Auto`.
  This means, that no mapping entry is written for the property and that Elasticsearch will add a mapping entry dynamically when the first data for this property is stored (check the Elasticsearch documentation for dynamic mapping rules).
  - `format`: One or more built-in date formats, see the next section [Date format mapping](#elasticsearch.mapping.meta-model.annotations.date-formats).
  - `pattern`: One or more custom date formats, see the next section [Date format mapping](#elasticsearch.mapping.meta-model.annotations.date-formats).
  - `store`: Flag whether the original field value should be store in Elasticsearch, default value is *false*.
  - `analyzer`, `searchAnalyzer`, `normalizer` for specifying custom analyzers and normalizer.
- `@GeoPoint`: Marks a field as *geo\_point* datatype.
Can be omitted if the field is an instance of the `GeoPoint` class.
- `@ValueConverter` defines a class to be used to convert the given property.
In difference to a registered Spring `Converter` this only converts the annotated property and not every property of the given type.

The mapping metadata infrastructure is defined in a separate spring-data-commons project that is technology agnostic.

<a id="elasticsearch.mapping.meta-model.annotations.read-write"></a>

#### Controlling which properties are written to and read from Elasticsearch

This section details the annotations that define if the value of a property is written to or read from Elasticsearch.

`@Transient`: A property annotated with this annotation will not be written to the mapping, it’s value will not be sent to Elasticsearch and when documents are returned from Elasticsearch, this property will not be set in the resulting entity.

`@ReadOnlyProperty`: A property with this annotation will not have its value written to Elasticsearch, but when returning data, the property will be filled with the value returned in the document from Elasticsearch.
One use case for this are runtime fields defined in the index mapping.

`@WriteOnlyProperty`: A property with this annotation will have its value stored in Elasticsearch but will not be set with any value when reading document.
This can be used for example for synthesized fields which should go into the Elasticsearch index but are not used elsewhere.

<a id="elasticsearch.mapping.meta-model.annotations.date-formats"></a>

#### Date format mapping

Properties that derive from `TemporalAccessor` or are of type `java.util.Date` must either have a `@Field` annotation of type `FieldType.Date` or a custom converter must be registered for this type.
This paragraph describes the use of
`FieldType.Date`.

There are two attributes of the `@Field` annotation that define which date format information is written to the mapping (also see [Elasticsearch Built In Formats](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-date-format.html#built-in-date-formats) and [Elasticsearch Custom Date Formats](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-date-format.html#custom-date-formats))

The `format` attribute is used to define at least one of the predefined formats.
If it is not defined, then a default value of *\_date\_optional\_time* and *epoch\_millis* is used.

The `pattern` attribute can be used to add additional custom format strings.
If you want to use only custom date formats, you must set the `format` property to empty `{}`.

The following table shows the different attributes and the mapping created from their values:

| annotation | format string in Elasticsearch mapping |
| --- | --- |
| @Field(type=FieldType.Date) | "date\_optional\_time\|\|epoch\_millis", |
| @Field(type=FieldType.Date, format=DateFormat.basic\_date) | "basic\_date" |
| @Field(type=FieldType.Date, format={DateFormat.basic\_date, DateFormat.basic\_time}) | "basic\_date\|\|basic\_time" |
| @Field(type=FieldType.Date, pattern="dd.MM.uuuu") | "date\_optional\_time\|\|epoch\_millis\|\|dd.MM.uuuu", |
| @Field(type=FieldType.Date, format={}, pattern="dd.MM.uuuu") | "dd.MM.uuuu" |

> [!NOTE]
> If you are using a custom date format, you need to use *uuuu* for the year instead of *yyyy*.
> This is due to a [change in Elasticsearch 7](https://www.elastic.co/guide/en/elasticsearch/reference/current/migrate-to-java-time.html#java-time-migration-incompatible-date-formats).

Check the code of the `org.springframework.data.elasticsearch.annotations.DateFormat` enum for a complete list of predefined values and their patterns.

<a id="elasticsearch.mapping.meta-model.annotations.range"></a>

#### Range types

When a field is annotated with a type of one of *Integer\_Range, Float\_Range, Long\_Range, Double\_Range, Date\_Range,* or *Ip\_Range* the field must be an instance of a class that will be mapped to an Elasticsearch range, for example:

```java
class SomePersonData {

    @Field(type = FieldType.Integer_Range)
    private ValidAge validAge;

    // getter and setter
}

class ValidAge {
    @Field(name="gte")
    private Integer from;

    @Field(name="lte")
    private Integer to;

    // getter and setter
}
```

As an alternative Spring Data Elasticsearch provides a `Range<T>` class so that the previous example can be written as:

```java
class SomePersonData {

    @Field(type = FieldType.Integer_Range)
    private Range<Integer> validAge;

    // getter and setter
}
```

Supported classes for the type `<T>` are `Integer`, `Long`, `Float`, `Double`, `Date` and classes that implement the
`TemporalAccessor` interface.

<a id="elasticsearch.mapping.meta-model.annotations.mapped-names"></a>

#### Mapped field names

Without further configuration, Spring Data Elasticsearch will use the property name of an object as field name in Elasticsearch.
This can be changed for individual field by using the `@Field` annotation on that property.

It is also possible to define a `FieldNamingStrategy` in the configuration of the client ([Elasticsearch Clients](clients.md)).
If for example a `SnakeCaseFieldNamingStrategy` is configured, the property *sampleProperty* of the object would be mapped to *sample\_property* in Elasticsearch.
A `FieldNamingStrategy` applies to all entities; it can be overwritten by setting a specific name with `@Field` on a property.

<a id="elasticsearch.mapping.meta-model.annotations.non-field-backed-properties"></a>

#### Non-field-backed properties

Normally the properties used in an entity are fields of the entity class.
There might be cases, when a property value is calculated in the entity and should be stored in Elasticsearch.
In this case, the getter method (`getProperty()`) can be annotated with the `@Field` annotation, in addition to that the method must be annotated with `@AccessType(AccessType.Type
.PROPERTY)`.
The third annotation that is needed in such a case is `@WriteOnlyProperty`, as such a value is only written to Elasticsearch.
A full example:

```java
@Field(type = Keyword)
@WriteOnlyProperty
@AccessType(AccessType.Type.PROPERTY)
public String getProperty() {
	return "some value that is calculated here";
}
```

<a id="elasticsearch.mapping.meta-model.annotations.misc"></a>

#### Other property annotations

<a id="indexedindexname"></a>

##### @IndexedIndexName

This annotation can be set on a String property of an entity.
This property will not be written to the mapping, it will not be stored in Elasticsearch and its value will not be read from an Elasticsearch document.
After an entity is persisted, for example with a call to `ElasticsearchOperations.save(T entity)`, the entity
returned from that call will contain the name of the index that an entity was saved to in that property.
This is useful when the index name is dynamically set by a bean, or when writing to a write alias.

Putting some value into such a property does not set the index into which an entity is stored!

<a id="elasticsearch.mapping.meta-model.rules"></a>

### Mapping Rules

<a id="elasticsearch.mapping.meta-model.rules.typehints"></a>

#### Type Hints

Mapping uses *type hints* embedded in the document sent to the server to allow generic type mapping.
Those type hints are represented as `_class` attributes within the document and are written for each aggregate root.

```java
public class Person {              <1>
  @Id String id;
  String firstname;
  String lastname;
}
```

```json
{
  "_class" : "com.example.Person", <1>
  "id" : "cb7bef",
  "firstname" : "Sarah",
  "lastname" : "Connor"
}
```

1. By default the domain types class name is used for the type hint.

Type hints can be configured to hold custom information.
Use the `@TypeAlias` annotation to do so.

> [!NOTE]
> Make sure to add types with `@TypeAlias` to the initial entity set (`AbstractElasticsearchConfiguration#getInitialEntitySet`) to already have entity information available when first reading data from the store.

```java
@TypeAlias("human")                <1>
public class Person {

  @Id String id;
  // ...
}
```

```json
{
  "_class" : "human",              <1>
  "id" : ...
}
```

1. The configured alias is used when writing the entity.

> [!NOTE]
> Type hints will not be written for nested Objects unless the properties type is `Object`, an interface or the actual value type does not match the properties declaration.

<a id="disabling-type-hints"></a>

##### Disabling Type Hints

It may be necessary to disable writing of type hints when the index that should be used already exists without having the type hints defined in its mapping and with the mapping mode set to strict.
In this case, writing the type hint will produce an error, as the field cannot be added automatically.

Type hints can be disabled for the whole application by overriding the method `writeTypeHints()` in a configuration class derived from `AbstractElasticsearchConfiguration` (see [Elasticsearch Clients](clients.md)).

As an alternative they can be disabled for a single index with the `@Document` annotation:

```java
@Document(indexName = "index", writeTypeHint = WriteTypeHint.FALSE)
```

> [!WARNING]
> We strongly advise against disabling Type Hints.
> Only do this if you are forced to.
> Disabling type hints can lead to documents not being retrieved correctly from Elasticsearch in case of polymorphic data or document retrieval may fail completely.

<a id="elasticsearch.mapping.meta-model.rules.geospatial"></a>

#### Geospatial Types

Geospatial types like `Point` & `GeoPoint` are converted into *lat/lon* pairs.

```java
public class Address {
  String city, street;
  Point location;
}
```

```json
{
  "city" : "Los Angeles",
  "street" : "2800 East Observatory Road",
  "location" : { "lat" : 34.118347, "lon" : -118.3026284 }
}
```

<a id="elasticsearch.mapping.meta-model.rules.geojson"></a>

#### GeoJson Types

Spring Data Elasticsearch supports the GeoJson types by providing an interface `GeoJson` and implementations for the different geometries.
They are mapped to Elasticsearch documents according to the GeoJson specification.
The corresponding properties of the entity are specified in the index mappings as `geo_shape` when the index mappings is written. (check the [Elasticsearch documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/geo-shape.html) as well)

```java
public class Address {

  String city, street;
  GeoJsonPoint location;
}
```

```json
{
  "city": "Los Angeles",
  "street": "2800 East Observatory Road",
  "location": {
    "type": "Point",
    "coordinates": [-118.3026284, 34.118347]
  }
}
```

The following GeoJson types are implemented:

- `GeoJsonPoint`
- `GeoJsonMultiPoint`
- `GeoJsonLineString`
- `GeoJsonMultiLineString`
- `GeoJsonPolygon`
- `GeoJsonMultiPolygon`
- `GeoJsonGeometryCollection`

<a id="elasticsearch.mapping.meta-model.rules.collections"></a>

#### Collections

For values inside Collections apply the same mapping rules as for aggregate roots when it comes to *type hints* and [Custom Conversions](#elasticsearch.mapping.meta-model.conversions).

```java
public class Person {

  // ...

  List<Person> friends;

}
```

```json
{
  // ...

  "friends" : [ { "firstname" : "Kyle", "lastname" : "Reese" } ]
}
```

<a id="elasticsearch.mapping.meta-model.rules.maps"></a>

#### Maps

For values inside Maps apply the same mapping rules as for aggregate roots when it comes to *type hints* and [Custom Conversions](#elasticsearch.mapping.meta-model.conversions).
However the Map key needs to a String to be processed by Elasticsearch.

```java
public class Person {

  // ...

  Map<String, Address> knownLocations;

}
```

```json
{
  // ...

  "knownLocations" : {
    "arrivedAt" : {
       "city" : "Los Angeles",
       "street" : "2800 East Observatory Road",
       "location" : { "lat" : 34.118347, "lon" : -118.3026284 }
     }
  }
}
```

<a id="elasticsearch.mapping.meta-model.conversions"></a>

### Custom Conversions

Looking at the `Configuration` from the [previous section](#elasticsearch.mapping.meta-model) `ElasticsearchCustomConversions` allows registering specific rules for mapping domain and simple types.

```java
@Configuration
public class Config extends ElasticsearchConfiguration  {

	@NonNull
	@Override
	public ClientConfiguration clientConfiguration() {
		return ClientConfiguration.builder() //
				.connectedTo("localhost:9200") //
				.build();
	}

  @Bean
  @Override
  public ElasticsearchCustomConversions elasticsearchCustomConversions() {
    return new ElasticsearchCustomConversions(
      Arrays.asList(new AddressToMap(), new MapToAddress()));       <1>
  }

  @WritingConverter                                                 <2>
  static class AddressToMap implements Converter<Address, Map<String, Object>> {

    @Override
    public Map<String, Object> convert(Address source) {

      LinkedHashMap<String, Object> target = new LinkedHashMap<>();
      target.put("ciudad", source.getCity());
      // ...

      return target;
    }
  }

  @ReadingConverter                                                 <3>
  static class MapToAddress implements Converter<Map<String, Object>, Address> {

    @Override
    public Address convert(Map<String, Object> source) {

      // ...
      return address;
    }
  }
}
```

```json
{
  "ciudad" : "Los Angeles",
  "calle" : "2800 East Observatory Road",
  "localidad" : { "lat" : 34.118347, "lon" : -118.3026284 }
}
```

1. Add `Converter` implementations.
1. Set up the `Converter` used for writing `DomainType` to Elasticsearch.
1. Set up the `Converter` used for reading `DomainType` from search result.
