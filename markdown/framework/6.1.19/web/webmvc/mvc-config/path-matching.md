---
title: "Path Matching"
source: "ROOT:web/webmvc/mvc-config/path-matching.adoc"
---

<a id="mvc-config-path-matching"></a>

# Path Matching

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-path-matching)

You can customize options related to path matching and treatment of the URL.
For details on the individual options, see the
[`PathMatchConfigurer`](https://docs.spring.io/spring-framework/docs/6.1.19/javadoc-api/org/springframework/web/servlet/config/annotation/PathMatchConfigurer.html) javadoc.

The following example shows how to customize path matching in Java configuration:

#### Java

```java
@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

	@Override
	public void configurePathMatch(PathMatchConfigurer configurer) {
		configurer.addPathPrefix("/api", HandlerTypePredicate.forAnnotation(RestController.class));
	}

	private PathPatternParser patternParser() {
		// ...
	}
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebMvc
class WebConfig : WebMvcConfigurer {

	override fun configurePathMatch(configurer: PathMatchConfigurer) {
		configurer.addPathPrefix("/api", HandlerTypePredicate.forAnnotation(RestController::class.java))
	}

	fun patternParser(): PathPatternParser {
		//...
	}
}
```

The following example shows how to customize path matching in XML configuration:

```xml
<mvc:annotation-driven>
	<mvc:path-matching
		path-helper="pathHelper"
		path-matcher="pathMatcher"/>
</mvc:annotation-driven>

<bean id="pathHelper" class="org.example.app.MyPathHelper"/>
<bean id="pathMatcher" class="org.example.app.MyPathMatcher"/>
```
