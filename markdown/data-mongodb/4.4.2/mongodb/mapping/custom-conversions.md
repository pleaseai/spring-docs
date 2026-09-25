---
title: "Custom Conversions"
source: "ROOT:mongodb/mapping/custom-conversions.adoc"
---

# Custom Conversions

The following example of a Spring `Converter` implementation converts from a `String` to a custom `Email` value object:

```java
@ReadingConverter
public class EmailReadConverter implements Converter<String, Email> {

  public Email convert(String source) {
    return Email.valueOf(source);
  }
}
```

If you write a `Converter` whose source and target type are native types, we cannot determine whether we should consider it as a reading or a writing converter.
Registering the converter instance as both might lead to unwanted results.
For example, a `Converter<String, Long>` is ambiguous, although it probably does not make sense to try to convert all `String` instances into `Long` instances when writing.
To let you force the infrastructure to register a converter for only one way, we provide `@ReadingConverter` and `@WritingConverter` annotations to be used in the converter implementation.

Converters are subject to explicit registration as instances are not picked up from a classpath or container scan to avoid unwanted registration with a conversion service and the side effects resulting from such a registration. Converters are registered with `CustomConversions` as the central facility that allows registration and querying for registered converters based on source- and target type.

`CustomConversions` ships with a pre-defined set of converter registrations:

- JSR-310 Converters for conversion between `java.time`, `java.util.Date` and `String` types.

> [!NOTE]
> Default converters for local temporal types (e.g. `LocalDateTime` to `java.util.Date`) rely on system-default timezone settings to convert between those types. You can override the default converter, by registering your own converter.

<a id="customconversions.converter-disambiguation"></a>

## Converter Disambiguation

Generally, we inspect the `Converter` implementations for the source and target types they convert from and to.
Depending on whether one of those is a type the underlying data access API can handle natively, we register the converter instance as a reading or a writing converter.
The following examples show a writing-  and a read converter (note the difference is in the order of the qualifiers on `Converter`):

```java
// Write converter as only the target type is one that can be handled natively
class MyConverter implements Converter<Person, String> { … }

// Read converter as only the source type is one that can be handled natively
class MyConverter implements Converter<String, Person> { … }
```

<a id="mongo.custom-converters"></a>

## Type based Converter

The most trivial way of influencing the mapping result is by specifying the desired native MongoDB target type via the `@Field` annotation.
This allows to work with non MongoDB types like `BigDecimal` in the domain model while persisting values in native `org.bson.types.Decimal128` format.

```java
public class Payment {

  @Id String id; <1>

  @Field(targetType = FieldType.DECIMAL128) <2>
  BigDecimal value;

  Date date; <3>

}
```

```java
{
  "_id"   : ObjectId("5ca4a34fa264a01503b36af8"), <1>
  "value" : NumberDecimal(2.099), <2>
  "date"   : ISODate("2019-04-03T12:11:01.870Z") <3>
}
```

1. String *id* values that represent a valid `ObjectId` are converted automatically. See [How the `_id` Field is Handled in the Mapping Layer](../template-crud-operations.md#mongo-template.id-handling)
for details.
1. The desired target type is explicitly defined as `Decimal128` which translates to `NumberDecimal`. Otherwise the
`BigDecimal` value would have been truned into a `String`.
1. `Date` values are handled by the MongoDB driver itself an are stored as `ISODate`.

The snippet above is handy for providing simple type hints. To gain more fine-grained control over the mapping process,
 you can register Spring converters with the `MongoConverter` implementations, such as the `MappingMongoConverter`.

The `MappingMongoConverter` checks to see if any Spring converters can handle a specific class before attempting to map the object itself. To 'hijack' the normal mapping strategies of the `MappingMongoConverter`, perhaps for increased performance or other custom mapping needs, you first need to create an implementation of the Spring `Converter` interface and then register it with the `MappingConverter`.

> [!NOTE]
> For more information on the Spring type conversion service, see the reference docs [here](https://docs.spring.io/spring-framework/reference/6.2/core.html#validation).

<a id="mongo.custom-converters.writer"></a>

### Writing Converter

The following example shows an implementation of the `Converter` that converts from a `Person` object to a `org.bson.Document`:

```java
import org.springframework.core.convert.converter.Converter;

import org.bson.Document;

public class PersonWriteConverter implements Converter<Person, Document> {

  public Document convert(Person source) {
    Document document = new Document();
    document.put("_id", source.getId());
    document.put("name", source.getFirstName());
    document.put("age", source.getAge());
    return document;
  }
}
```

<a id="mongo.custom-converters.reader"></a>

### Reading Converter

The following example shows an implementation of a `Converter` that converts from a `Document` to a `Person` object:

```java
public class PersonReadConverter implements Converter<Document, Person> {

  public Person convert(Document source) {
    Person p = new Person((ObjectId) source.get("_id"), (String) source.get("name"));
    p.setAge((Integer) source.get("age"));
    return p;
  }
}
```

<a id="mongo.custom-converters.xml"></a>

### Registering Converters

```java
class MyMongoConfiguration extends AbstractMongoClientConfiguration {

	@Override
	public String getDatabaseName() {
		return "database";
	}

	@Override
	protected void configureConverters(MongoConverterConfigurationAdapter adapter) {
		adapter.registerConverter(new com.example.PersonReadConverter());
		adapter.registerConverter(new com.example.PersonWriteConverter());
	}
}
```
