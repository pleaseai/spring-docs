---
title: "Validation"
source: "ROOT:web/webflux/controller/ann-validation.adoc"
---

<a id="mvc-ann-validation"></a>

# Validation

[See equivalent in the Servlet stack](../../webmvc/mvc-controller/ann-validation.md)

Spring WebFlux has built-in [Validation](../../../core/validation/validator.md) support for
`@RequestMapping` methods, including the option to use
[Java Bean Validation](../../../core/validation/beanvalidation.md).
The validation support works on two levels.

First, method parameters such as
[@ModelAttribute](ann-methods/modelattrib-method-args.md),
[@RequestBody](ann-methods/requestbody.md), and
[@RequestPart](ann-methods/multipart-forms.md) do perform
validation if annotated with Jakarta’s `@Valid` or Spring’s `@Validated` annotation, and
raise `MethodArgumentNotValidException` in case of validation errors. If you want to handle
the errors in the controller method instead, you can declare an `Errors` or `BindingResult`
method parameter immediately after the validated parameter.

Second, if [Java Bean Validation](https://beanvalidation.org) is present *AND* other method
parameters, e.g. `@RequestHeader`, `@RequestParam`, `@PathVariable` have `@Constraint`
annotations, then method validation is applied to all method arguments, raising
`HandlerMethodValidationException` in case of validation errors. You can still declare an
`Errors` or `BindingResult` after an `@Valid` method parameter, and handle validation
errors within the controller method, as long as there are no validation errors on other
method arguments.

You can configure a `Validator` globally through the
[WebMvc config](../config.md#webflux-config-validation), or locally
through an [@InitBinder](ann-initbinder.md) method in an
`@Controller` or `@ControllerAdvice`. You can also use multiple validators.

> [!NOTE]
> If a controller has a class level `@Validated`, then
> [method validation is applied](../../../core/validation/beanvalidation.md#validation-beanvalidation-spring-method)
> through an AOP proxy. In order to take advantage of the Spring MVC built-in support for
> method validation added in Spring Framework 6.1, you need to remove the class level
> `@Validated` annotation from the controller.

The [Error Responses](../../webmvc/mvc-ann-rest-exceptions.md) section provides further
details on how `MethodArgumentNotValidException` and `HandlerMethodValidationException`
are handled, and also how their rendering can be customized through a `MessageSource` and
locale and language specific resource bundles.

For further custom handling of method validation errors, you can extend
`ResponseEntityExceptionHandler` or use an `@ExceptionHandler` method in a controller
or in a `@ControllerAdvice`, and handle `HandlerMethodValidationException` directly.
The exception contains a list of`ParameterValidationResult`s that group validation errors
by method parameter. You can either iterate over those, or provide a visitor with callback
methods by controller method parameter type:

#### Java

```java
HandlerMethodValidationException ex = ... ;

ex.visitResults(new HandlerMethodValidationException.Visitor() {

	@Override
	public void requestHeader(RequestHeader requestHeader, ParameterValidationResult result) {
			// ...
	}

	@Override
	public void requestParam(@Nullable RequestParam requestParam, ParameterValidationResult result) {
			// ...
	}

	@Override
	public void modelAttribute(@Nullable ModelAttribute modelAttribute, ParameterErrors errors) {

	// ...

	@Override
	public void other(ParameterValidationResult result) {
			// ...
	}
});
```

#### Kotlin

```kotlin
// HandlerMethodValidationException
val ex

ex.visitResults(object : HandlerMethodValidationException.Visitor {

	override fun requestHeader(requestHeader: RequestHeader, result: ParameterValidationResult) {
			// ...
       }

	override fun requestParam(requestParam: RequestParam?, result: ParameterValidationResult) {
			// ...
       }

	override fun modelAttribute(modelAttribute: ModelAttribute?, errors: ParameterErrors) {
			// ...
       }

	// ...

	override fun other(result: ParameterValidationResult) {
			// ...
       }
})
```
