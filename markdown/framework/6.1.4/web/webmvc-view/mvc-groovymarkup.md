---
title: "Groovy Markup"
source: "ROOT:web/webmvc-view/mvc-groovymarkup.adoc"
---

<a id="mvc-view-groovymarkup"></a>

# Groovy Markup

The [Groovy Markup Template Engine](https://groovy-lang.org/templating.html#_the_markuptemplateengine)
is primarily aimed at generating XML-like markup (XML, XHTML, HTML5, and others), but you can
use it to generate any text-based content. The Spring Framework has a built-in
integration for using Spring MVC with Groovy Markup.

> [!NOTE]
> The Groovy Markup Template engine requires Groovy 2.3.1+.

<a id="mvc-view-groovymarkup-configuration"></a>

## Configuration

The following example shows how to configure the Groovy Markup Template Engine:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void configureViewResolvers(ViewResolverRegistry registry) {
		registry.groovy();
	}

	// Configure the Groovy Markup Template Engine...

	@Bean
	public GroovyMarkupConfigurer groovyMarkupConfigurer() {
		GroovyMarkupConfigurer configurer = new GroovyMarkupConfigurer();
		configurer.setResourceLoaderPath("/WEB-INF/");
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
		registry.groovy()
	}

	// Configure the Groovy Markup Template Engine...

	@Bean
	fun groovyMarkupConfigurer() = GroovyMarkupConfigurer().apply {
		resourceLoaderPath = "/WEB-INF/"
	}
}
```

The following example shows how to configure the same in XML:

```xml
<mvc:annotation-driven/>

<mvc:view-resolvers>
	<mvc:groovy/>
</mvc:view-resolvers>

<!-- Configure the Groovy Markup Template Engine... -->
<mvc:groovy-configurer resource-loader-path="/WEB-INF/"/>
```

<a id="mvc-view-groovymarkup-example"></a>

## Example

Unlike traditional template engines, Groovy Markup relies on a DSL that uses a builder
syntax. The following example shows a sample template for an HTML page:

```groovy
yieldUnescaped '<!DOCTYPE html>'
html(lang:'en') {
	head {
		meta('http-equiv':'"Content-Type" content="text/html; charset=utf-8"')
		title('My page')
	}
	body {
		p('This is an example of HTML contents')
	}
}
```
