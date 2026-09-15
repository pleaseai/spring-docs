---
title: "Special Bean Types"
source: "ROOT:web/webmvc/mvc-servlet/special-bean-types.adoc"
---

<a id="mvc-servlet-special-bean-types"></a>

# Special Bean Types

[See equivalent in the Reactive stack](../../webflux/dispatcher-handler.md#webflux-special-bean-types)

The `DispatcherServlet` delegates to special beans to process requests and render the
appropriate responses. By “special beans” we mean Spring-managed `Object` instances that
implement framework contracts. Those usually come with built-in contracts, but
you can customize their properties and extend or replace them.

The following table lists the special beans detected by the `DispatcherServlet`:

<a id="mvc-webappctx-special-beans-tbl"></a>

| Bean type | Explanation |
| --- | --- |
| `HandlerMapping` | Map a request to a handler along with a list of [interceptors](handlermapping-interceptor.md) for pre- and post-processing. The mapping is based on some criteria, the details of which vary by `HandlerMapping` implementation. The two main `HandlerMapping` implementations are `RequestMappingHandlerMapping` (which supports `@RequestMapping` annotated methods) and `SimpleUrlHandlerMapping` (which maintains explicit registrations of URI path patterns to handlers). |
| `HandlerAdapter` | Help the `DispatcherServlet` to invoke a handler mapped to a request, regardless of how the handler is actually invoked. For example, invoking an annotated controller requires resolving annotations. The main purpose of a `HandlerAdapter` is to shield the `DispatcherServlet` from such details. |
| [`HandlerExceptionResolver`](exceptionhandlers.md) | Strategy to resolve exceptions, possibly mapping them to handlers, to HTML error views, or other targets. See [Exceptions](exceptionhandlers.md). |
| [`ViewResolver`](viewresolver.md) | Resolve logical `String`-based view names returned from a handler to an actual `View` with which to render to the response. See [View Resolution](viewresolver.md) and [View Technologies](../../webmvc-view.md). |
| [`LocaleResolver`](localeresolver.md), [LocaleContextResolver](localeresolver.md#mvc-timezone) | Resolve the `Locale` a client is using and possibly their time zone, in order to be able to offer internationalized views. See [Locale](localeresolver.md). |
| [`MultipartResolver`](multipart.md) | Abstraction for parsing a multi-part request (for example, browser form file upload) with the help of some multipart parsing library. See [Multipart Resolver](multipart.md). |
| [`FlashMapManager`](../mvc-controller/ann-methods/flash-attributes.md) | Store and retrieve the “input” and the “output” `FlashMap` that can be used to pass attributes from one request to another, usually across a redirect. See [Flash Attributes](../mvc-controller/ann-methods/flash-attributes.md). |
