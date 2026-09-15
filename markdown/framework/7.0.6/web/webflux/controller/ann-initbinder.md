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

## Model Design

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-initbinder.md#mvc-ann-initbinder-model-design)

[Data binding](../../../core/validation/data-binding.md) for web requests involves
binding request parameters to a model object. By default, request parameters can be bound
to any public property of the model object, which means malicious clients can provide
extra values for properties that exist in the model object graph, but are not expected to
be set. This is why model object design requires careful consideration.

> [!TIP]
> The model object, and its nested object graph is also sometimes referred to as a
> *command object*, *form-backing object*, or *POJO* (Plain Old Java Object).

A good practice is to use a *dedicated model object* rather than exposing your domain
model such as JPA or Hibernate entities for web data binding. For example, on a form to
change an email address, create a `ChangeEmailForm` model object that declares only
the properties required for the input:

```java
public class ChangeEmailForm {

	private String oldEmailAddress;
	private String newEmailAddress;

	public void setOldEmailAddress(String oldEmailAddress) {
		this.oldEmailAddress = oldEmailAddress;
	}

	public String getOldEmailAddress() {
		return this.oldEmailAddress;
	}

	public void setNewEmailAddress(String newEmailAddress) {
		this.newEmailAddress = newEmailAddress;
	}

	public String getNewEmailAddress() {
		return this.newEmailAddress;
	}

}
```

Another good practice is to apply
[constructor binding](../../../core/validation/data-binding.md#data-binding-constructor-binding),
which uses only the request parameters it needs for constructor arguments, and any other
input is ignored. This is in contrast to property binding which by default binds every
request parameter for which there is a matching property.

If neither a dedicated model object nor constructor binding is sufficient, and you must
use property binding, we strongly recommend registering `allowedFields` patterns (case
sensitive) on `WebDataBinder` in order to prevent unexpected properties from being set.
For example:

```java
@Controller
public class ChangeEmailController {

	@InitBinder
	void initBinder(WebDataBinder binder) {
		binder.setAllowedFields("oldEmailAddress", "newEmailAddress");
	}

	// @RequestMapping methods, etc.

}
```

You can also register `disallowedFields`  patterns (case insensitive). However,
"allowed" configuration is preferred over "disallowed" as it is more explicit and less
prone to mistakes.

By default, constructor and property binding are both used. If you want to use
constructor binding only, you can set the `declarativeBinding` flag on `WebDataBinder`
through an `@InitBinder` method either locally within a controller or globally through an
`@ControllerAdvice`. Turning this flag on ensures that only constructor binding is used
and that property binding is not used unless `allowedFields` patterns are configured.
For example:

```java
@Controller
public class MyController {

	@InitBinder
	void initBinder(WebDataBinder binder) {
		binder.setDeclarativeBinding(true);
	}

	// @RequestMapping methods, etc.

}
```
