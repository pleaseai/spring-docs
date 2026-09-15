---
title: "Type Conversion"
source: "ROOT:web/webflux/controller/ann-methods/typeconversion.adoc"
---

<a id="webflux-ann-typeconversion"></a>

# Type Conversion

[See equivalent in the Servlet stack](../../../webmvc/mvc-controller/ann-methods/typeconversion.md)

Some annotated controller method arguments that represent String-based request input (for example,
`@RequestParam`, `@RequestHeader`, `@PathVariable`, `@MatrixVariable`, and `@CookieValue`)
can require type conversion if the argument is declared as something other than `String`.

For such cases, type conversion is automatically applied based on the configured converters.
By default, simple types (such as `int`, `long`, `Date`, and others) are supported. Type conversion
can be customized through a `WebDataBinder` (see [`DataBinder`](../ann-initbinder.md))
or by registering `Formatters` with the `FormattingConversionService` (see
[Spring Field Formatting](../../../../core/validation/format.md)).

A practical issue in type conversion is the treatment of an empty String source value.
Such a value is treated as missing if it becomes `null` as a result of type conversion.
This can be the case for `Long`, `UUID`, and other target types. If you want to allow `null`
to be injected, either use the `required` flag on the argument annotation, or declare the
argument as `@Nullable`.
