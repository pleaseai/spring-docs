---
title: "`@RequestHeader`"
source: "ROOT:web/webmvc/mvc-controller/ann-methods/requestheader.adoc"
---

<a id="mvc-ann-requestheader"></a>

# `@RequestHeader`

[See equivalent in the Reactive stack](../../../webflux/controller/ann-methods/requestheader.md)

You can use the `@RequestHeader` annotation to bind a request header to a method argument in a
controller.

Consider the following request, with headers:

```
Host                    localhost:8080
Accept                  text/html,application/xhtml+xml,application/xml;q=0.9
Accept-Language         fr,en-gb;q=0.7,en;q=0.3
Accept-Encoding         gzip,deflate
Accept-Charset          ISO-8859-1,utf-8;q=0.7,*;q=0.7
Keep-Alive              300
```

The following example gets the value of the `Accept-Encoding` and `Keep-Alive` headers:

#### Java

```java
@GetMapping("/demo")
public void handle(
		@RequestHeader("Accept-Encoding") String encoding, // <1>
		@RequestHeader("Keep-Alive") long keepAlive) { // <2>
	//...
}
```

1. Get the value of the `Accept-Encoding` header.
1. Get the value of the `Keep-Alive` header.

#### Kotlin

```kotlin
@GetMapping("/demo")
fun handle(
		@RequestHeader("Accept-Encoding") encoding: String, // <1>
		@RequestHeader("Keep-Alive") keepAlive: Long) { // <2>
	//...
}
```

1. Get the value of the `Accept-Encoding` header.
1. Get the value of the `Keep-Alive` header.

If the target method parameter type is not `String`, type conversion is automatically applied.
See [Type Conversion](typeconversion.md).

When an `@RequestHeader` annotation is used on a `Map<String, String>`,
`MultiValueMap<String, String>`, or `HttpHeaders` argument, the map is populated
with all header values.

> [!TIP]
> Built-in support is available for converting a comma-separated string into an
> array or collection of strings or other types known to the type conversion system. For
> example, a method parameter annotated with `@RequestHeader("Accept")` can be of type
> `String` but also `String[]` or `List<String>`.
