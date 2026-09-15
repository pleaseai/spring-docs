---
title: "Data Binding"
source: "ROOT:web/webflux/data-binding.adoc"
---

<a id="webflux-data-binding"></a>

# Data Binding

[See equivalent in the Servlet stack](../webmvc/mvc-data-binding.md)

Data binding is a mechanism that binds string parameters onto an object graph with type conversion.
It is a core mechanism of the Spring Framework that helps with application configuration.
In web applications it makes it easy to access query parameters and form data through richly typed objects rather than through maps of string values.

To learn more about the data binding mechanism, including constructor and setter binding, property name syntax, type conversion,
and more, see [Data binding](../../core/validation/data-binding.md) in the Core Technologies section.

For annotated controllers, data binding applies to a
[@ModelAttribute](controller/ann-methods/modelattrib-method-args.md) method argument.
For functional endpoints, use the `bind` method of [ServerRequest](../webflux-functional.md#webflux-fn-request).

> [!TIP]
> For browser applications with annotated controllers, you can use
> [@ModelAttribute methods](controller/ann-modelattrib-methods.md)
> to initialize additional model attributes for use in rendered views.

Each request uses a separate `WebDataBinder` instance.
For annotated controllers, this instance can be customized through
[@InitBinder methods](controller/ann-initbinder.md) within a controller, or
across controllers through [Controller Advice](../webmvc/mvc-controller/ann-advice.md).
For functional endpoints, use overloaded `ServerRequest.bind` methods.

<a id="webflux-data-binding-design"></a>

## Model Design

[See equivalent in the Servlet stack](../webmvc/mvc-data-binding.md#mvc-data-binding-design)

Data binding involves binding untrusted input onto application objects.
For security reasons, it’s crucial to ensure that input is properly constrained to expected fields only.
This section provides guidance for safe binding.

First, prefer **immutable object design** for web binding purposes.
It is safe because a constructor naturally constrains binding to expected inputs.
You can use a Java record or a class with a primary constructor, and either can have further nested objects.
See [Constructor Binding](../../core/validation/data-binding.md#data-binding-constructor-binding) for details.

Another option for safe binding is to use **dedicated objects** designed for the expected input.
Such objects, even if mutable, are safe because they constrain binding to the expected inputs.

Domain objects such as JPA or Hibernate entities are generally not safe for web binding
as they likely contain more properties than the expected inputs.
For such cases, it’s crucial to declare the properties to expose for binding.
For example:

```java
@Controller
public class PersonController {

	@InitBinder
	void initBinder(WebDataBinder binder) {
		// See Javadoc for supported pattern syntax
		binder.setAllowedFields("firstName", "lastName", "*Address");
	}
}
```

> [!NOTE]
> It is also possible to configure `disallowedFields`, but that’s fragile, and
> due to be [deprecated](https://github.com/spring-projects/spring-framework/issues/36802) in Spring Framework 7.1.
> It is easy to overlook fields or introduce additional fields over time that should also be excluded.

By default, `DataBinder` applies both constructor and setter binding.
This is fine with immutable objects and dedicated objects, but for domain objects, you must
remember to set `allowedFields`. To ensure data binding is only used in declarative style where
expected inputs are explicitly declared, you can set  `declarativeBinding` on `DataBinder`.
That applies constructor binding always, and setter binding conditionally if `allowedFields` is set.
The following shows how to set this flag globally, or
you can also narrow it through attributes on `ControllerAdvice`:

```java
@ControllerAdvice
public class ControllerConfig {

	@InitBinder
	void initBinder(WebDataBinder binder) {
		binder.setDeclarativeBinding(true);
	}
}
```
