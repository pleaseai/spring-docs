---
title: "Custom Conversions"
source: "ROOT:cassandra/converters.adoc"
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

<a id="cassandra.custom-converters"></a>

## Overriding Default Mapping with Custom Converters

To have more fine-grained control over the mapping process, you can register Spring `Converters` with
`CassandraConverter` implementations, such as `MappingCassandraConverter`.

`MappingCassandraConverter` first checks to see whether any Spring `Converters` can handle a specific class before attempting to map the object itself.
To "'hijack'" the normal mapping strategies of the `MappingCassandraConverter` (perhaps for increased performance or other custom mapping needs), you need to create an implementation of the Spring `Converter` interface and register it with the `MappingCassandraConverter`.

<a id="customconversions.writer"></a>

### Saving by Using a Registered Spring Converter

You can combine converting and saving in a single process, basically using the converter to do the saving.

The following example uses a `Converter` to convert a `Person` object to a `java.lang.String`
with Jackson 2:

```java
class PersonWriteConverter implements Converter<Person, String> {

	public String convert(Person source) {

		try {
			return new ObjectMapper().writeValueAsString(source);
		} catch (IOException e) {
			throw new IllegalStateException(e);
		}
	}
}
```

<a id="customconversions.reader"></a>

### Reading by Using a Spring Converter

Similar to how you can combine saving and converting, you can also combine reading and converting.

The following example uses a `Converter` that converts a `java.lang.String` into a `Person` object with Jackson 2:

```java
class PersonReadConverter implements Converter<String, Person> {

	public Person convert(String source) {

		if (StringUtils.hasText(source)) {
			try {
				return new ObjectMapper().readValue(source, Person.class);
			} catch (IOException e) {
				throw new IllegalStateException(e);
			}
		}

		return null;
	}
}
```

<a id="customconversions.java"></a>

### Registering Spring Converters with `CassandraConverter`

Spring Data for Apache Cassandra Java configuration provides a convenient way to register Spring `Converter` instances:
`MappingCassandraConverter`.
The following configuration snippet shows how to manually register converters as well as configure `CustomConversions`:

```java
@Configuration
public class ConverterConfiguration extends AbstractCassandraConfiguration {

	@Override
	public CassandraCustomConversions customConversions() {

		return CassandraCustomConversions.create(config -> {
			config.registerConverter(new PersonReadConverter()));
			config.registerConverter(new PersonWriteConverter()));
		});
	}

	// other methods omitted...

}
```
