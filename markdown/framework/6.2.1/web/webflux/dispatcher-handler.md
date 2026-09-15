---
title: "`DispatcherHandler`"
source: "ROOT:web/webflux/dispatcher-handler.adoc"
---

<a id="webflux-dispatcher-handler"></a>

# `DispatcherHandler`

[See equivalent in the Servlet stack](../webmvc/mvc-servlet.md)

Spring WebFlux, similarly to Spring MVC, is designed around the front controller pattern,
where a central `WebHandler`, the `DispatcherHandler`, provides a shared algorithm for
request processing, while actual work is performed by configurable, delegate components.
This model is flexible and supports diverse workflows.

`DispatcherHandler` discovers the delegate components it needs from Spring configuration.
It is also designed to be a Spring bean itself and implements `ApplicationContextAware`
for access to the context in which it runs. If `DispatcherHandler` is declared with a bean
name of `webHandler`, it is, in turn, discovered by
[`WebHttpHandlerBuilder`](https://docs.spring.io/spring-framework/docs/6.2.1/javadoc-api/org/springframework/web/server/adapter/WebHttpHandlerBuilder.html),
which puts together a request-processing chain, as described in [`WebHandler` API](reactive-spring.md#webflux-web-handler-api).

Spring configuration in a WebFlux application typically contains:

- `DispatcherHandler` with the bean name `webHandler`
- `WebFilter` and `WebExceptionHandler` beans
- [`DispatcherHandler` special beans](#webflux-special-bean-types)
- Others

The configuration is given to `WebHttpHandlerBuilder` to build the processing chain,
as the following example shows:

#### Java

```java
ApplicationContext context = ...
HttpHandler handler = WebHttpHandlerBuilder.applicationContext(context).build();
```

#### Kotlin

```kotlin
val context: ApplicationContext = ...
val handler = WebHttpHandlerBuilder.applicationContext(context).build()
```

The resulting `HttpHandler` is ready for use with a [server adapter](reactive-spring.md#webflux-httphandler).

<a id="webflux-special-bean-types"></a>

## Special Bean Types

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/special-bean-types.md)

The `DispatcherHandler` delegates to special beans to process requests and render the
appropriate responses. By “special beans,” we mean Spring-managed `Object` instances that
implement WebFlux framework contracts. Those usually come with built-in contracts, but
you can customize their properties, extend them, or replace them.

The following table lists the special beans detected by the `DispatcherHandler`. Note that
there are also some other beans detected at a lower level (see
[Special bean types](reactive-spring.md#webflux-web-handler-api-special-beans) in the Web Handler API).

<a id="webflux-special-beans-table"></a>

| Bean type | Explanation |
| --- | --- |
| `HandlerMapping` | Map a request to a handler. The mapping is based on some criteria, the details of which vary by `HandlerMapping` implementation — annotated controllers, simple URL pattern mappings, and others. The main `HandlerMapping` implementations are `RequestMappingHandlerMapping` for `@RequestMapping` annotated methods, `RouterFunctionMapping` for functional endpoint routes, and `SimpleUrlHandlerMapping` for explicit registrations of URI path patterns and `WebHandler` instances. |
| `HandlerAdapter` | Help the `DispatcherHandler` to invoke a handler mapped to a request regardless of how the handler is actually invoked. For example, invoking an annotated controller requires resolving annotations. The main purpose of a `HandlerAdapter` is to shield the `DispatcherHandler` from such details. |
| `HandlerResultHandler` | Process the result from the handler invocation and finalize the response. See [Result Handling](#webflux-resulthandling). |

<a id="webflux-framework-config"></a>

## WebFlux Config

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/config.md)

Applications can declare the infrastructure beans (listed under
[Web Handler API](reactive-spring.md#webflux-web-handler-api-special-beans) and
[`DispatcherHandler`](#webflux-special-bean-types)) that are required to process requests.
However, in most cases, the [WebFlux Config](#webflux-framework-config) is the best starting point. It declares the
required beans and provides a higher-level configuration callback API to customize it.

> [!NOTE]
> Spring Boot relies on the WebFlux config to configure Spring WebFlux and also provides
> many extra convenient options.

<a id="webflux-dispatcher-handler-sequence"></a>

## Processing

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/sequence.md)

`DispatcherHandler` processes requests as follows:

- Each `HandlerMapping` is asked to find a matching handler, and the first match is used.
- If a handler is found, it is run through an appropriate `HandlerAdapter`, which
exposes the return value from the execution as `HandlerResult`.
- The `HandlerResult` is given to an appropriate `HandlerResultHandler` to complete
processing by writing to the response directly or by using a view to render.

<a id="webflux-resulthandling"></a>

## Result Handling

The return value from the invocation of a handler, through a `HandlerAdapter`, is wrapped
as a `HandlerResult`, along with some additional context, and passed to the first
`HandlerResultHandler` that claims support for it. The following table shows the available
`HandlerResultHandler` implementations, all of which are declared in the [WebFlux Config](#webflux-framework-config):

| Result Handler Type | Return Values | Default Order |
| --- | --- | --- |
| `ResponseEntityResultHandler` | `ResponseEntity`, typically from `@Controller` instances. | 0 |
| `ServerResponseResultHandler` | `ServerResponse`, typically from functional endpoints. | 0 |
| `ResponseBodyResultHandler` | Handle return values from `@ResponseBody` methods or `@RestController` classes. | 100 |
| `ViewResolutionResultHandler` | `CharSequence`, [`View`](https://docs.spring.io/spring-framework/docs/6.2.1/javadoc-api/org/springframework/web/reactive/result/view/View.html), [Model](https://docs.spring.io/spring-framework/docs/6.2.1/javadoc-api/org/springframework/ui/Model.html), `Map`, [Rendering](https://docs.spring.io/spring-framework/docs/6.2.1/javadoc-api/org/springframework/web/reactive/result/view/Rendering.html), or any other `Object` is treated as a model attribute. See also [View Resolution](#webflux-viewresolution). | `Integer.MAX_VALUE` |

<a id="webflux-dispatcher-exceptions"></a>

## Exceptions

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/exceptionhandlers.md)

`HandlerAdapter` implementations can handle internally exceptions from invoking a request
handler, such as a controller method. However, an exception may be deferred if the request
handler returns an asynchronous value.

A `HandlerAdapter` may expose its exception handling mechanism as a
`DispatchExceptionHandler` set on the `HandlerResult` it returns. When that’s set,
`DispatcherHandler` will also apply it to the handling of the result.

A `HandlerAdapter` may also choose to implement `DispatchExceptionHandler`. In that case
`DispatcherHandler` will apply it to exceptions that arise before a handler is mapped,
for example, during handler mapping, or earlier, for example, in a `WebFilter`.

See also [Exceptions](controller/ann-exceptions.md) in the “Annotated Controller” section or
[Exceptions](reactive-spring.md#webflux-exception-handler) in the WebHandler API section.

<a id="webflux-viewresolution"></a>

## View Resolution

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/viewresolver.md)

View resolution enables rendering to a browser with an HTML template and a model without
tying you to a specific view technology. In Spring WebFlux, view resolution is
supported through a dedicated [HandlerResultHandler](#webflux-resulthandling) that uses
`ViewResolver` instances to map a String (representing a logical view name) to a `View`
instance. The `View` is then used to render the response.

Web applications need to use a [View rendering library](../webflux-view.md) to support this use case.

<a id="webflux-viewresolution-handling"></a>

### Handling

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/viewresolver.md#mvc-viewresolver-handling)

The `HandlerResult` passed into `ViewResolutionResultHandler` contains the return value
from the handler and the model that contains attributes added during request
handling. The return value is processed as one of the following:

- `String`, `CharSequence`: A logical view name to be resolved to a `View` through
the list of configured `ViewResolver` implementations.
- `void`: Select a default view name based on the request path, minus the leading and
trailing slash, and resolve it to a `View`. The same also happens when a view name
was not provided (for example, model attribute was returned) or an async return value
(for example, `Mono` completed empty).
- [Rendering](https://docs.spring.io/spring-framework/docs/6.2.1/javadoc-api/org/springframework/web/reactive/result/view/Rendering.html): API for
view resolution scenarios. Explore the options in your IDE with code completion.
- `Model`, `Map`: Extra model attributes to be added to the model for the request.
- Any other: Any other return value (except for simple types, as determined by
[BeanUtils#isSimpleProperty](https://docs.spring.io/spring-framework/docs/6.2.1/javadoc-api/org/springframework/beans/BeanUtils.html#isSimpleProperty-java.lang.Class-))
is treated as a model attribute to be added to the model. The attribute name is derived
from the class name by using [conventions](https://docs.spring.io/spring-framework/docs/6.2.1/javadoc-api/org/springframework/core/Conventions.html),
unless a handler method `@ModelAttribute` annotation is present.

The model can contain asynchronous, reactive types (for example, from Reactor or RxJava). Prior
to rendering, `AbstractView` resolves such model attributes into concrete values
and updates the model. Single-value reactive types are resolved to a single
value or no value (if empty), while multi-value reactive types (for example, `Flux<T>`) are
collected and resolved to `List<T>`.

To configure view resolution is as simple as adding a `ViewResolutionResultHandler` bean
to your Spring configuration. [WebFlux Config](config.md#webflux-config-view-resolvers) provides a
dedicated configuration API for view resolution.

See [View Technologies](../webflux-view.md) for more on the view technologies integrated with Spring WebFlux.

<a id="webflux-redirecting-redirect-prefix"></a>

### Redirecting

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/viewresolver.md#mvc-redirecting-redirect-prefix)

The special `redirect:` prefix in a view name lets you perform a redirect. The
`UrlBasedViewResolver` (and sub-classes) recognize this as an instruction that a
redirect is needed. The rest of the view name is the redirect URL.

The net effect is the same as if the controller had returned a `RedirectView` or
`Rendering.redirectTo("abc").build()`, but now the controller itself can
operate in terms of logical view names. A view name such as
`redirect:/some/resource` is relative to the current application, while a view name such as
`redirect:https://example.com/arbitrary/path` redirects to an absolute URL.

> [!NOTE]
> [Unlike the Servlet stack](../webmvc/mvc-servlet/viewresolver.md#mvc-redirecting-forward-prefix),
> Spring WebFlux does not support "FORWARD" dispatches, so `forward:` prefixes are not supported as a result.

<a id="webflux-multiple-representations"></a>

### Content Negotiation

[See equivalent in the Servlet stack](../webmvc/mvc-servlet/viewresolver.md#mvc-multiple-representations)

`ViewResolutionResultHandler` supports content negotiation. It compares the request
media types with the media types supported by each selected `View`. The first `View`
that supports the requested media type(s) is used.

In order to support media types such as JSON and XML, Spring WebFlux provides
`HttpMessageWriterView`, which is a special `View` that renders through an
[HttpMessageWriter](reactive-spring.md#webflux-codecs). Typically, you would configure these as default
views through the [WebFlux Configuration](config.md#webflux-config-view-resolvers). Default views are
always selected and used if they match the requested media type.
