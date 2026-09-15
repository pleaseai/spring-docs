---
title: "View Technologies"
source: "ROOT:web/webflux-view.adoc"
---

<a id="webflux-view"></a>

# View Technologies

The use of view technologies in Spring WebFlux is pluggable. Whether you decide to
use Thymeleaf, FreeMarker, or some other view technology is primarily a matter of a
configuration change. This chapter covers the view technologies integrated with Spring
WebFlux. We assume you are already familiar with [View Resolution](webflux/dispatcher-handler.md#webflux-viewresolution).

<a id="webflux-view-thymeleaf"></a>

## Thymeleaf

[See equivalent in the Servlet stack](webmvc-view/mvc-thymeleaf.md)

Thymeleaf is a modern server-side Java template engine that emphasizes natural HTML
templates that can be previewed in a browser by double-clicking, which is very
helpful for independent work on UI templates (for example, by a designer) without the need for a
running server. Thymeleaf offers an extensive set of features, and it is actively developed
and maintained. For a more complete introduction, see the
[Thymeleaf](https://www.thymeleaf.org/) project home page.

The Thymeleaf integration with Spring WebFlux is managed by the Thymeleaf project. The
configuration involves a few bean declarations, such as
`SpringResourceTemplateResolver`, `SpringWebFluxTemplateEngine`, and
`ThymeleafReactiveViewResolver`. For more details, see
[Thymeleaf+Spring](https://www.thymeleaf.org/documentation.html) and the WebFlux integration
[announcement](https://web.archive.org/web/20210623051330/http%3A//forum.thymeleaf.org/Thymeleaf-3-0-8-JUST-PUBLISHED-td4030687.html).

<a id="webflux-view-freemarker"></a>

## FreeMarker

[See equivalent in the Servlet stack](webmvc-view/mvc-freemarker.md)

[Apache FreeMarker](https://freemarker.apache.org/) is a template engine for generating any
kind of text output from HTML to email and others. The Spring Framework has built-in
integration for using Spring WebFlux with FreeMarker templates.

<a id="webflux-view-freemarker-contextconfig"></a>

### View Configuration

[See equivalent in the Servlet stack](webmvc-view/mvc-freemarker.md#mvc-view-freemarker-contextconfig)

The following example shows how to configure FreeMarker as a view technology:

#### Java

```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		registry.freeMarker();
	}

	// Configure FreeMarker...

	@Bean
	public FreeMarkerConfigurer freeMarkerConfigurer() {
		FreeMarkerConfigurer configurer = new FreeMarkerConfigurer();
		configurer.setTemplateLoaderPath("classpath:/templates/freemarker");
		return configurer;
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		registry.freeMarker()
	}

	// Configure FreeMarker...

	@Bean
	fun freeMarkerConfigurer() = FreeMarkerConfigurer().apply {
		setTemplateLoaderPath("classpath:/templates/freemarker")
	}
}
```

Your templates need to be stored in the directory specified by the `FreeMarkerConfigurer`,
shown in the preceding example. Given the preceding configuration, if your controller
returns the view name, `welcome`, the resolver looks for the
`classpath:/templates/freemarker/welcome.ftl` template.

<a id="webflux-views-freemarker"></a>

### FreeMarker Configuration

[See equivalent in the Servlet stack](webmvc-view/mvc-freemarker.md#mvc-views-freemarker)

You can pass FreeMarker 'Settings' and 'SharedVariables' directly to the FreeMarker
`Configuration` object (which is managed by Spring) by setting the appropriate bean
properties on the `FreeMarkerConfigurer` bean. The `freemarkerSettings` property requires
a `java.util.Properties` object, and the `freemarkerVariables` property requires a
`java.util.Map`. The following example shows how to use a `FreeMarkerConfigurer`:

#### Java

```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

	// ...

	@Bean
	public FreeMarkerConfigurer freeMarkerConfigurer() {
		Map<String, Object> variables = new HashMap<>();
		variables.put("xml_escape", new XmlEscape());

		FreeMarkerConfigurer configurer = new FreeMarkerConfigurer();
		configurer.setTemplateLoaderPath("classpath:/templates");
		configurer.setFreemarkerVariables(variables);
		return configurer;
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

	// ...

	@Bean
	fun freeMarkerConfigurer() = FreeMarkerConfigurer().apply {
		setTemplateLoaderPath("classpath:/templates")
		setFreemarkerVariables(mapOf("xml_escape" to XmlEscape()))
	}
}
```

See the FreeMarker documentation for details of settings and variables as they apply to
the `Configuration` object.

<a id="webflux-view-freemarker-forms"></a>

### Form Handling

[See equivalent in the Servlet stack](webmvc-view/mvc-freemarker.md#mvc-view-freemarker-forms)

Spring provides a tag library for use in JSPs that contains, among others, a
`<spring:bind/>` element. This element primarily lets forms display values from
form-backing objects and show the results of failed validations from a `Validator` in the
web or business tier. Spring also has support for the same functionality in FreeMarker,
with additional convenience macros for generating form input elements themselves.

<a id="webflux-view-bind-macros"></a>

#### The Bind Macros

[See equivalent in the Servlet stack](webmvc-view/mvc-freemarker.md#mvc-view-bind-macros)

A standard set of macros are maintained within the `spring-webflux.jar` file for
FreeMarker, so they are always available to a suitably configured application.

Some of the macros defined in the Spring templating libraries are considered internal
(private), but no such scoping exists in the macro definitions, making all macros visible
to calling code and user templates. The following sections concentrate only on the macros
you need to directly call from within your templates. If you wish to view the macro code
directly, the file is called `spring.ftl` and is in the
`org.springframework.web.reactive.result.view.freemarker` package.

For additional details on binding support, see [Simple Binding](webmvc-view/mvc-freemarker.md#mvc-view-simple-binding)
 for Spring MVC.

<a id="webflux-views-form-macros"></a>

#### Form Macros

For details on Spring’s form macro support for FreeMarker templates, consult the following
sections of the Spring MVC documentation.

- [Input Macros](webmvc-view/mvc-freemarker.md#mvc-views-form-macros)
- [Input Fields](webmvc-view/mvc-freemarker.md#mvc-views-form-macros-input)
- [Selection Fields](webmvc-view/mvc-freemarker.md#mvc-views-form-macros-select)
- [HTML Escaping](webmvc-view/mvc-freemarker.md#mvc-views-form-macros-html-escaping)

<a id="webflux-view-script"></a>

## Script Views

[See equivalent in the Servlet stack](webmvc-view/mvc-script.md)

The Spring Framework has a built-in integration for using Spring WebFlux with any
templating library that can run on top of the
[JSR-223](https://www.jcp.org/en/jsr/detail?id=223) Java scripting engine.
The following table shows the templating libraries that we have tested on different script engines:

| Scripting Library | Scripting Engine |
| --- | --- |
| [Handlebars](https://handlebarsjs.com/) | [Nashorn](https://openjdk.java.net/projects/nashorn/) |
| [Mustache](https://mustache.github.io/) | [Nashorn](https://openjdk.java.net/projects/nashorn/) |
| [React](https://facebook.github.io/react/) | [Nashorn](https://openjdk.java.net/projects/nashorn/) |
| [EJS](https://www.embeddedjs.com/) | [Nashorn](https://openjdk.java.net/projects/nashorn/) |
| [ERB](https://www.stuartellis.name/articles/erb/) | [JRuby](https://www.jruby.org) |
| [String templates](https://docs.python.org/2/library/string.html#template-strings) | [Jython](https://www.jython.org/) |
| [Kotlin Script templating](https://github.com/sdeleuze/kotlin-script-templating) | [Kotlin](https://kotlinlang.org) |

> [!TIP]
> The basic rule for integrating any other script engine is that it must implement the
> `ScriptEngine` and `Invocable` interfaces.

<a id="webflux-view-script-dependencies"></a>

### Requirements

[See equivalent in the Servlet stack](webmvc-view/mvc-script.md#mvc-view-script-dependencies)

You need to have the script engine on your classpath, the details of which vary by script engine:

- The [Nashorn](https://openjdk.java.net/projects/nashorn/) JavaScript engine is provided with
Java 8+. Using the latest update release available is highly recommended.
- [JRuby](https://www.jruby.org) should be added as a dependency for Ruby support.
- [Jython](https://www.jython.org) should be added as a dependency for Python support.
- `org.jetbrains.kotlin:kotlin-script-util` dependency and a `META-INF/services/javax.script.ScriptEngineFactory`
file containing a `org.jetbrains.kotlin.script.jsr223.KotlinJsr223JvmLocalScriptEngineFactory`
line should be added for Kotlin script support. See
[this example](https://github.com/sdeleuze/kotlin-script-templating) for more detail.

You need to have the script templating library. One way to do that for JavaScript is
through [WebJars](https://www.webjars.org/).

<a id="webflux-view-script-integrate"></a>

### Script Templates

[See equivalent in the Servlet stack](webmvc-view/mvc-script.md#mvc-view-script-integrate)

You can declare a `ScriptTemplateConfigurer` bean to specify the script engine to use,
the script files to load, what function to call to render templates, and so on.
The following example uses Mustache templates and the Nashorn JavaScript engine:

#### Java

```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		registry.scriptTemplate();
	}

	@Bean
	public ScriptTemplateConfigurer configurer() {
		ScriptTemplateConfigurer configurer = new ScriptTemplateConfigurer();
		configurer.setEngineName("nashorn");
		configurer.setScripts("mustache.js");
		configurer.setRenderObject("Mustache");
		configurer.setRenderFunction("render");
		return configurer;
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		registry.scriptTemplate()
	}

	@Bean
	fun configurer() = ScriptTemplateConfigurer().apply {
		engineName = "nashorn"
		setScripts("mustache.js")
		renderObject = "Mustache"
		renderFunction = "render"
	}
}
```

The `render` function is called with the following parameters:

- `String template`: The template content
- `Map model`: The view model
- `RenderingContext renderingContext`: The
[`RenderingContext`](https://docs.spring.io/spring-framework/docs/6.1.11/javadoc-api/org/springframework/web/servlet/view/script/RenderingContext.html)
that gives access to the application context, the locale, the template loader, and the
URL (since 5.0)

`Mustache.render()` is natively compatible with this signature, so you can call it directly.

If your templating technology requires some customization, you can provide a script that
implements a custom render function. For example, [Handlerbars](https://handlebarsjs.com)
needs to compile templates before using them and requires a
[polyfill](https://en.wikipedia.org/wiki/Polyfill) in order to emulate some
browser facilities not available in the server-side script engine.
The following example shows how to set a custom render function:

#### Java

```java
@Configuration
@EnableWebFlux
public class WebConfig implements WebFluxConfigurer {

	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		registry.scriptTemplate();
	}

	@Bean
	public ScriptTemplateConfigurer configurer() {
		ScriptTemplateConfigurer configurer = new ScriptTemplateConfigurer();
		configurer.setEngineName("nashorn");
		configurer.setScripts("polyfill.js", "handlebars.js", "render.js");
		configurer.setRenderFunction("render");
		configurer.setSharedEngine(false);
		return configurer;
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebFlux
class WebConfig : WebFluxConfigurer {

	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		registry.scriptTemplate()
	}

	@Bean
	fun configurer() = ScriptTemplateConfigurer().apply {
		engineName = "nashorn"
		setScripts("polyfill.js", "handlebars.js", "render.js")
		renderFunction = "render"
		isSharedEngine = false
	}
}
```

> [!NOTE]
> Setting the `sharedEngine` property to `false` is required when using non-thread-safe
> script engines with templating libraries not designed for concurrency, such as Handlebars or
> React running on Nashorn. In that case, Java SE 8 update 60 is required, due to
> [this bug](https://bugs.openjdk.java.net/browse/JDK-8076099), but it is generally
> recommended to use a recent Java SE patch release in any case.

`polyfill.js` defines only the `window` object needed by Handlebars to run properly,
as the following snippet shows:

```javascript
var window = {};
```

This basic `render.js` implementation compiles the template before using it. A production
ready implementation should also store and reused cached templates or pre-compiled templates.
This can be done on the script side, as well as any customization you need (managing
template engine configuration for example).
The following example shows how compile a template:

```javascript
function render(template, model) {
	var compiledTemplate = Handlebars.compile(template);
	return compiledTemplate(model);
}
```

Check out the Spring Framework unit tests,
[Java](https://github.com/spring-projects/spring-framework/tree/main/spring-webflux/src/test/java/org/springframework/web/reactive/result/view/script), and
[resources](https://github.com/spring-projects/spring-framework/tree/main/spring-webflux/src/test/resources/org/springframework/web/reactive/result/view/script),
for more configuration examples.

<a id="webflux-view-httpmessagewriter"></a>

## JSON and XML

[See equivalent in the Servlet stack](webmvc-view/mvc-jackson.md)

For [Content Negotiation](webflux/dispatcher-handler.md#webflux-multiple-representations) purposes, it is useful to be able to alternate
between rendering a model with an HTML template or as other formats (such as JSON or XML),
depending on the content type requested by the client. To support doing so, Spring WebFlux
provides the `HttpMessageWriterView`, which you can use to plug in any of the available
[Codecs](webflux/reactive-spring.md#webflux-codecs) from `spring-web`, such as `Jackson2JsonEncoder`, `Jackson2SmileEncoder`,
or `Jaxb2XmlEncoder`.

Unlike other view technologies, `HttpMessageWriterView` does not require a `ViewResolver`
but is instead [configured](webflux/config.md#webflux-config-view-resolvers) as a default view. You can
configure one or more such default views, wrapping different `HttpMessageWriter` instances
or `Encoder` instances. The one that matches the requested content type is used at runtime.

In most cases, a model contains multiple attributes. To determine which one to serialize,
you can configure `HttpMessageWriterView` with the name of the model attribute to use for
rendering. If the model contains only one attribute, that one is used.
