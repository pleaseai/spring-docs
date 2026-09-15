---
title: "`DataBinder`"
source: "ROOT:web/webflux/controller/ann-initbinder.adoc"
---

<a id="webflux-ann-initbinder"></a>

# `DataBinder`

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-initbinder.md)

`@Controller` or `@ControllerAdvice` classes can have `@InitBinder` methods to
initialize `WebDataBinder` instances that in turn can:

- Bind request parameters to a model object.
- Convert request values from string to object property types.
- Format model object properties as strings when rendering HTML forms.

In an `@Controller`, `DataBinder` customizations apply locally within the controller,
or even to a specific model attribute referenced by name through the annotation.
In an `@ControllerAdvice` customizations can apply to all or a subset of controllers.

You can register `PropertyEditor`, `Converter`, and `Formatter` components in the
`DataBinder` for type conversion. Alternatively, you can use the
[WebFlux config](../config.md#webflux-config-conversion) to register
`Converter` and `Formatter` components  in a globally shared `FormattingConversionService`.

#### Java

```java
@Controller
public class FormController {

	@InitBinder // <1>
	public void initBinder(WebDataBinder binder) {
		SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
		dateFormat.setLenient(false);
		binder.registerCustomEditor(Date.class, new CustomDateEditor(dateFormat, false));
	}

	// ...
}
```

1. Using the `@InitBinder` annotation.

#### Kotlin

```kotlin
@Controller
class FormController {

	@InitBinder // <1>
	fun initBinder(binder: WebDataBinder) {
		val dateFormat = SimpleDateFormat("yyyy-MM-dd")
		dateFormat.isLenient = false
		binder.registerCustomEditor(Date::class.java, CustomDateEditor(dateFormat, false))
	}

	// ...
}
```

1. Using the `@InitBinder` annotation.

Alternatively, when using a `Formatter`-based setup through a shared
`FormattingConversionService`, you could re-use the same approach and register
controller-specific `Formatter` instances, as the following example shows:

#### Java

```java
@Controller
public class FormController {

	@InitBinder
	protected void initBinder(WebDataBinder binder) {
		binder.addCustomFormatter(new DateFormatter("yyyy-MM-dd")); <1>
	}

	// ...
}
```

1. Adding a custom formatter (a `DateFormatter`, in this case).

#### Kotlin

```kotlin
@Controller
class FormController {

	@InitBinder
	fun initBinder(binder: WebDataBinder) {
		binder.addCustomFormatter(DateFormatter("yyyy-MM-dd")) // <1>
	}

	// ...
}
```

1. Adding a custom formatter (a `DateFormatter`, in this case).

<a id="webflux-ann-initbinder-model-design"></a>

> [!NOTE]
> For more guidance on model design, please see [Data Binding](../data-binding.md).
