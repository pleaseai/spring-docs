---
title: "Web"
source: "ROOT:languages/kotlin/web.adoc"
---

<a id="kotlin-web"></a>

# Web

<a id="router-dsl"></a>

## Router DSL

Spring Framework comes with a Kotlin router DSL available in 3 flavors:

- [WebMvc.fn DSL](../../web/webmvc-functional.md) with [router { }](https://docs.spring.io/spring-framework/docs/6.2.14/kdoc-api/spring-webmvc/org.springframework.web.servlet.function/router.html)
- [WebFlux.fn Reactive DSL](../../web/webflux-functional.md) with [router { }](https://docs.spring.io/spring-framework/docs/6.2.14/kdoc-api/spring-webflux/org.springframework.web.reactive.function.server/router.html)
- [WebFlux.fn Coroutines DSL](coroutines.md) with [coRouter { }](https://docs.spring.io/spring-framework/docs/6.2.14/kdoc-api/spring-webflux/org.springframework.web.reactive.function.server/co-router.html)

These DSL let you write clean and idiomatic Kotlin code to build a `RouterFunction` instance as the following example shows:

```kotlin
@Configuration
class RouterRouterConfiguration {

	@Bean
	fun mainRouter(userHandler: UserHandler) = router {
		accept(TEXT_HTML).nest {
			GET("/") { ok().render("index") }
			GET("/sse") { ok().render("sse") }
			GET("/users", userHandler::findAllView)
		}
		"/api".nest {
			accept(APPLICATION_JSON).nest {
				GET("/users", userHandler::findAll)
			}
			accept(TEXT_EVENT_STREAM).nest {
				GET("/users", userHandler::stream)
			}
		}
		resources("/**", ClassPathResource("static/"))
	}
}
```

> [!NOTE]
> This DSL is programmatic, meaning that it allows custom registration logic of beans
> through an `if` expression, a `for` loop, or any other Kotlin constructs. That can be useful
> when you need to register routes depending on dynamic data (for example, from a database).

See [MiXiT project](https://github.com/mixitconf/mixit/) for a concrete example.

<a id="mockmvc-dsl"></a>

## MockMvc DSL

A Kotlin DSL is provided via `MockMvc` Kotlin extensions in order to provide a more
idiomatic Kotlin API and to allow better discoverability (no usage of static methods).

```kotlin
val mockMvc: MockMvc = ...
mockMvc.get("/person/{name}", "Lee") {
	secure = true
	accept = APPLICATION_JSON
	headers {
		contentLanguage = Locale.FRANCE
	}
	principal = Principal { "foo" }
}.andExpect {
	status { isOk }
	content { contentType(APPLICATION_JSON) }
	jsonPath("$.name") { value("Lee") }
	content { json("""{"someBoolean": false}""", false) }
}.andDo {
	print()
}
```

<a id="kotlin-script-templates"></a>

## Kotlin Script Templates

Spring Framework provides a
[`ScriptTemplateView`](https://docs.spring.io/spring-framework/docs/6.2.14/javadoc-api/org/springframework/web/servlet/view/script/ScriptTemplateView.html)
which supports [JSR-223](https://www.jcp.org/en/jsr/detail?id=223) to render templates by using script engines.

By leveraging `scripting-jsr223` dependencies, it
is possible to use such feature to render Kotlin-based templates with
[kotlinx.html](https://github.com/Kotlin/kotlinx.html) DSL or Kotlin multiline interpolated `String`.

`build.gradle.kts`

```kotlin
dependencies {
	runtime("org.jetbrains.kotlin:kotlin-scripting-jsr223:${kotlinVersion}")
}
```

Configuration is usually done with `ScriptTemplateConfigurer` and `ScriptTemplateViewResolver` beans.

`KotlinScriptConfiguration.kt`

```kotlin
@Configuration
class KotlinScriptConfiguration {

	@Bean
	fun kotlinScriptConfigurer() = ScriptTemplateConfigurer().apply {
		engineName = "kotlin"
		setScripts("scripts/render.kts")
		renderFunction = "render"
		isSharedEngine = false
	}

	@Bean
	fun kotlinScriptViewResolver() = ScriptTemplateViewResolver().apply {
		setPrefix("templates/")
		setSuffix(".kts")
	}
}
```

See the [kotlin-script-templating](https://github.com/sdeleuze/kotlin-script-templating) example
project for more details.

<a id="kotlin-multiplatform-serialization"></a>

## Kotlin multiplatform serialization

[Kotlin multiplatform serialization](https://github.com/Kotlin/kotlinx.serialization) is
supported in Spring MVC, Spring WebFlux and Spring Messaging (RSocket). The built-in support currently targets CBOR, JSON, and ProtoBuf formats.

To enable it, follow [those instructions](https://github.com/Kotlin/kotlinx.serialization#setup) to add the related dependency and plugin.
With Spring MVC and WebFlux, both Kotlin serialization and Jackson will be configured by default if they are in the classpath since
Kotlin serialization is designed to serialize only Kotlin classes annotated with `@Serializable`.
With Spring Messaging (RSocket), make sure that neither Jackson, GSON or JSONB are in the classpath if you want automatic configuration,
if Jackson is needed configure `KotlinSerializationJsonMessageConverter` manually.
