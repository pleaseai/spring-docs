---
title: "Property Converters"
source: "ROOT:mongodb/mapping/property-converters.adoc"
---

<a id="mongo.property-converters"></a>

# Property Converters

While [type-based conversion](custom-conversions.md) already offers ways to influence the conversion and representation of certain types within the target store, it has limitations when only certain values or properties of a particular type should be considered for conversion.
Property-based converters allow configuring conversion rules on a per-property basis, either declaratively (via `@ValueConverter`) or programmatically (by registering a `PropertyValueConverter` for a specific property).

A `PropertyValueConverter` can transform a given value into its store representation (write) and back (read) as the following listing shows.
The additional `ValueConversionContext` provides additional information, such as mapping metadata and direct `read` and `write` methods.

```java
class ReversingValueConverter implements PropertyValueConverter<String, String, ValueConversionContext> {

  @Override
  public String read(String value, ValueConversionContext context) {
    return reverse(value);
  }

  @Override
  public String write(String value, ValueConversionContext context) {
    return reverse(value);
  }
}
```

You can obtain `PropertyValueConverter` instances from `CustomConversions#getPropertyValueConverter(…)` by delegating to `PropertyValueConversions`, typically by using a `PropertyValueConverterFactory` to provide the actual converter.
Depending on your application’s needs, you can chain or decorate multiple instances of `PropertyValueConverterFactory` — for example, to apply caching.
By default, Spring Data MongoDB uses a caching implementation that can serve types with a default constructor or enum values.
A set of predefined factories is available through the factory methods in `PropertyValueConverterFactory`.
You can use `PropertyValueConverterFactory.beanFactoryAware(…)` to obtain a `PropertyValueConverter` instance from an `ApplicationContext`.

You can change the default behavior through `ConverterConfiguration`.

<a id="mongo.property-converters.declarative"></a>

## Declarative Value Converter

The most straight forward usage of a `PropertyValueConverter` is by annotating properties with the `@ValueConverter` annotation that defines the converter type:

```java
class Person {

  @ValueConverter(ReversingValueConverter.class)
  String ssn;
}
```

<a id="mongo.property-converters.programmatic"></a>

## Programmatic Value Converter Registration

Programmatic registration registers `PropertyValueConverter` instances for properties within an entity model by using a `PropertyValueConverterRegistrar`, as the following example shows.
The difference between declarative registration and programmatic registration is that programmatic registration happens entirely outside of the entity model.
Such an approach is useful if you cannot or do not want to annotate the entity model.

```java
PropertyValueConverterRegistrar registrar = new PropertyValueConverterRegistrar();

registrar.registerConverter(Address.class, "street", new PropertyValueConverter() { … }); <1>

// type safe registration
registrar.registerConverter(Person.class, Person::getSsn())                               <2>
  .writing(value -> encrypt(value))
  .reading(value -> decrypt(value));
```

1. Register a converter for the field identified by its name.
1. Type safe variant that allows to register a converter and its conversion functions.
This method uses class proxies to determine the property.
Make sure that neither the class nor the accessors are `final` as otherwise this approach doesn’t work.

> [!WARNING]
> Dot notation (such as `registerConverter(Person.class, "address.street", …)`) for nagivating across properties into subdocuments is **not** supported when registering converters.

> [!TIP]
> `MongoValueConverter` offers a pre-typed `PropertyValueConverter` interface that uses `MongoConversionContext`.

<a id="mongocustomconversions-configuration"></a>

## MongoCustomConversions configuration

By default, `MongoCustomConversions` can handle declarative value converters, depending on the configured `PropertyValueConverterFactory`.
`MongoConverterConfigurationAdapter` helps to set up programmatic value conversions or define the `PropertyValueConverterFactory` to be used.

```java
MongoCustomConversions.create(configurationAdapter -> {

    SimplePropertyValueConversions valueConversions = new SimplePropertyValueConversions();
    valueConversions.setConverterFactory(…);
    valueConversions.setValueConverterRegistry(new PropertyValueConverterRegistrar()
        .registerConverter(…)
        .buildRegistry());

    configurationAdapter.setPropertyValueConversions(valueConversions);
});
```
