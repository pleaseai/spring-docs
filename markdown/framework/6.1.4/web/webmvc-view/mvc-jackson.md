---
title: "Jackson"
source: "ROOT:web/webmvc-view/mvc-jackson.adoc"
---

<a id="mvc-view-jackson"></a>

# Jackson

[See equivalent in the Reactive stack](../webflux-view.md#webflux-view-httpmessagewriter)

Spring offers support for the Jackson JSON library.

<a id="mvc-view-json-mapping"></a>

## Jackson-based JSON MVC Views

[See equivalent in the Reactive stack](../webflux-view.md#webflux-view-httpmessagewriter)

The `MappingJackson2JsonView` uses the Jackson library’s `ObjectMapper` to render the response
content as JSON. By default, the entire contents of the model map (with the exception of
framework-specific classes) are encoded as JSON. For cases where the contents of the
map need to be filtered, you can specify a specific set of model attributes to encode
by using the `modelKeys` property. You can also use the `extractValueFromSingleKeyModel`
property to have the value in single-key models extracted and serialized directly rather
than as a map of model attributes.

You can customize JSON mapping as needed by using Jackson’s provided
annotations. When you need further control, you can inject a custom `ObjectMapper`
through the `ObjectMapper` property, for cases where you need to provide custom JSON
serializers and deserializers for specific types.

<a id="mvc-view-xml-mapping"></a>

## Jackson-based XML Views

[See equivalent in the Reactive stack](../webflux-view.md#webflux-view-httpmessagewriter)

`MappingJackson2XmlView` uses the
[Jackson XML extension’s](https://github.com/FasterXML/jackson-dataformat-xml) `XmlMapper`
to render the response content as XML. If the model contains multiple entries, you should
explicitly set the object to be serialized by using the `modelKey` bean property. If the
model contains a single entry, it is serialized automatically.

You can customized XML mapping as needed by using JAXB or Jackson’s provided
annotations. When you need further control, you can inject a custom `XmlMapper`
through the `ObjectMapper` property, for cases where custom XML
you need to provide serializers and deserializers for specific types.
