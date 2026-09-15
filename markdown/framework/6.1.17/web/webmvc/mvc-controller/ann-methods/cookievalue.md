---
title: "`@CookieValue`"
source: "ROOT:web/webmvc/mvc-controller/ann-methods/cookievalue.adoc"
---

<a id="mvc-ann-cookievalue"></a>

# `@CookieValue`

[See equivalent in the Reactive stack](../../../webflux/controller/ann-methods/cookievalue.md)

You can use the `@CookieValue` annotation to bind the value of an HTTP cookie to a method argument
in a controller.

Consider a request with the following cookie:

```
JSESSIONID=415A4AC178C59DACE0B2C9CA727CDD84
```

The following example shows how to get the cookie value:

#### Java

```java
@GetMapping("/demo")
public void handle(@CookieValue("JSESSIONID") String cookie) { <1>
	//...
}
```

1. Get the value of the `JSESSIONID` cookie.

#### Kotlin

```kotlin
@GetMapping("/demo")
fun handle(@CookieValue("JSESSIONID") cookie: String) { // <1>
	//...
}
```

1. Get the value of the `JSESSIONID` cookie.

If the target method parameter type is not `String`, type conversion is applied automatically.
See [Type Conversion](typeconversion.md).
