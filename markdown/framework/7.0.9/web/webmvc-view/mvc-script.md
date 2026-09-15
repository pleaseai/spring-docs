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
| [ERB](https://docs.ruby-lang.org/en/master/ERB.html) | [JRuby](https://www.jruby.org) |
| [String templates](https://docs.python.org/2/library/string.html#template-strings) | [Jython](https://www.jython.org/) |

> [!TIP]
> The basic rule for integrating any other script engine is that it must implement the
> `ScriptEngine` and `Invocable` interfaces.

<a id="mvc-view-script-dependencies"></a>

## Requirements

[See equivalent in the Reactive stack](../webflux-view.md#webflux-view-script-dependencies)

You need to have the script engine on your classpath, the details of which vary by script engine:

- [JRuby](https://www.jruby.org) should be added as a dependency for Ruby support.
- [Jython](https://www.jython.org) should be added as a dependency for Python support.

<a id="mvc-view-script-integrate"></a>

## Script Templates

[See equivalent in the Reactive stack](../webflux-view.md#webflux-view-script-integrate)

You can declare a `ScriptTemplateConfigurer` bean to specify the script engine to use,
the script files to load, what function to call to render templates, and so on.
The following example uses the Jython Python engine:

#### Java

```java
@Configuration
public class WebConfiguration implements WebMvcConfigurer {

	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		registry.scriptTemplate();
	}

	@Bean
	public ScriptTemplateConfigurer configurer() {
		ScriptTemplateConfigurer configurer = new ScriptTemplateConfigurer();
		configurer.setEngineName("jython");
		configurer.setScripts("render.py");
		configurer.setRenderFunction("render");
		return configurer;
	}
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration : WebMvcConfigurer {

	override fun configureViewResolvers(registry: ViewResolverRegistry) {
		registry.scriptTemplate()
	}

	@Bean
	fun configurer() = ScriptTemplateConfigurer().apply {
		engineName = "jython"
		setScripts("render.py")
		renderFunction = "render"
	}
}
```

#### Xml

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:mvc="http://www.springframework.org/schema/mvc"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xsi:schemaLocation="
			http://www.springframework.org/schema/beans
			https://www.springframework.org/schema/beans/spring-beans.xsd
			http://www.springframework.org/schema/mvc
			https://www.springframework.org/schema/mvc/spring-mvc.xsd">

	<mvc:view-resolvers>
		<mvc:script-template/>
	</mvc:view-resolvers>

	<mvc:script-template-configurer engine-name="jython" render-function="render">
		<mvc:script location="render.py"/>
	</mvc:script-template-configurer>

</beans>
```

The render function is called with the following parameters:

- `String template`: The template content
- `Map model`: The view model
- `RenderingContext renderingContext`: The
[`RenderingContext`](https://docs.spring.io/spring-framework/docs/7.0.9/javadoc-api/org/springframework/web/servlet/view/script/RenderingContext.html)
that gives access to the application context, the locale, the template loader, and the
URL

The controller is used to populate the model attributes and specify the view name, as the following example shows:

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

Check out the Spring Framework unit tests,
[Java](https://github.com/spring-projects/spring-framework/tree/7.0.x/spring-webmvc/src/test/java/org/springframework/web/servlet/view/script), and
[resources](https://github.com/spring-projects/spring-framework/tree/7.0.x/spring-webmvc/src/test/resources/org/springframework/web/servlet/view/script),
for more configuration examples.
