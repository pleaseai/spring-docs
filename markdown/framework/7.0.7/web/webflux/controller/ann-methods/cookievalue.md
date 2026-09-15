---
title: "`@CookieValue`"
source: "ROOT:web/webflux/controller/ann-methods/cookievalue.adoc"
---

<a id="webflux-ann-cookievalue"></a>

# `@CookieValue`

[See equivalent in the Servlet stack](../../../webmvc/mvc-controller/ann-methods/cookievalue.md)

You can use the `@CookieValue` annotation to bind the value of an HTTP cookie to a method argument
in a controller.

The following example shows a request with a cookie:

```
JSESSIONID=415A4AC178C59DACE0B2C9CA727CDD84
```

The following code sample demonstrates how to get the cookie value:

#### Java

```java
@GetMapping("/demo")
public void handle(@CookieValue("JSESSIONID") String cookie) { // <1>
	//...
}
```

1. Get the cookie value.

#### Kotlin

```kotlin
@GetMapping("/demo")
fun handle(@CookieValue("JSESSIONID") cookie: String) { // <1>
	//...
}
```

1. Get the cookie value.

Type conversion is applied automatically if the target method parameter type is not
`String`. See [Type Conversion](typeconversion.md).
