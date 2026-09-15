---
title: "Script Views"
source: "ROOT:web/webmvc-view/mvc-script.adoc"
---

<a id="mvc-view-script"></a>

# Script Views

[See equivalent in the Reactive stack](../webflux-view.md#webflux-view-script)

The Spring Framework has a built-in integration for using Spring MVC with any
templating library that can run on top of the
[JSR-223](https://www.jcp.org/en/jsr/detail?id=223) Java scripting engine. We have tested the following
templating libraries on different script engines:

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

<a id="mvc-view-script-dependencies"></a>

## Requirements

[See equivalent in the Reactive stack](../webflux-view.md#webflux-view-script-dependencies)

You need to have the script engine on your classpath, the details of which vary by script engine:

- The [Nashorn](https://openjdk.java.net/projects/nashorn/) JavaScript engine is provided with
Java 8+. Using the latest update release available is highly recommended.
- [JRuby](https://www.jruby.org) should be added as a dependency for Ruby support.
- [Jython](https://www.jython.org) should be added as a dependency for Python support.
- `org.jetbrains.kotlin:kotlin-script-util` dependency and a `META-INF/services/javax.script.ScriptEngineFactory`
file containing a `org.jetbrains.kotlin.script.jsr223.KotlinJsr223JvmLocalScriptEngineFactory`
line should be added for Kotlin script support. See
[this example](https://github.com/sdeleuze/kotlin-script-templating) for more details.

You need to have the script templating library. One way to do that for JavaScript is
through [WebJars](https://www.webjars.org/).

<a id="mvc-view-script-integrate"></a>

## Script Templates

[See equivalent in the Reactive stack](../webflux-view.md#webflux-view-script)

You can declare a `ScriptTemplateConfigurer` bean to specify the script engine to use,
the script files to load, what function to call to render templates, and so on.
The following example uses Mustache templates and the Nashorn JavaScript engine:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

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
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

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

The following example shows the same arrangement in XML:

```xml
<mvc:annotation-driven/>

<mvc:view-resolvers>
	<mvc:script-template/>
</mvc:view-resolvers>

<mvc:script-template-configurer engine-name="nashorn" render-object="Mustache" render-function="render">
	<mvc:script location="mustache.js"/>
</mvc:script-template-configurer>
```

The controller would look no different for the Java and XML configurations, as the following example shows:

#### Java

```java
@Controller
public class SampleController {

	@GetMapping("/sample")
	public String test(Model model) {
		model.addAttribute("title", "Sample title");
		model.addAttribute("body", "Sample body");
		return "template";
	}
}
```

#### Kotlin

```kotlin
@Controller
class SampleController {

	@GetMapping("/sample")
	fun test(model: Model): String {
		model["title"] = "Sample title"
		model["body"] = "Sample body"
		return "template"
	}
}
```

The following example shows the Mustache template:

```html
<html>
	<head>
		<title>{{title}}</title>
	</head>
	<body>
		<p>{{body}}</p>
	</body>
</html>
```

The render function is called with the following parameters:

- `String template`: The template content
- `Map model`: The view model
- `RenderingContext renderingContext`: The
[`RenderingContext`](https://docs.spring.io/spring-framework/docs/6.1.5/javadoc-api/org/springframework/web/servlet/view/script/RenderingContext.html)
that gives access to the application context, the locale, the template loader, and the
URL (since 5.0)

`Mustache.render()` is natively compatible with this signature, so you can call it directly.

If your templating technology requires some customization, you can provide a script that
implements a custom render function. For example, [Handlerbars](https://handlebarsjs.com)
needs to compile templates before using them and requires a
[polyfill](https://en.wikipedia.org/wiki/Polyfill) to emulate some
browser facilities that are not available in the server-side script engine.

The following example shows how to do so:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

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
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

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

`polyfill.js` defines only the `window` object needed by Handlebars to run properly, as follows:

```javascript
var window = {};
```

This basic `render.js` implementation compiles the template before using it. A production-ready
implementation should also store any reused cached templates or pre-compiled templates.
You can do so on the script side (and handle any customization you need — managing
template engine configuration, for example). The following example shows how to do so:

```javascript
function render(template, model) {
	var compiledTemplate = Handlebars.compile(template);
	return compiledTemplate(model);
}
```

Check out the Spring Framework unit tests,
[Java](https://github.com/spring-projects/spring-framework/tree/main/spring-webmvc/src/test/java/org/springframework/web/servlet/view/script), and
[resources](https://github.com/spring-projects/spring-framework/tree/main/spring-webmvc/src/test/resources/org/springframework/web/servlet/view/script),
for more configuration examples.
