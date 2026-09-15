---
title: "Web"
source: "ROOT:languages/kotlin/web.adoc"
---

<a id="kotlin-web"></a>

# Web

<a id="router-dsl"></a>

## Router DSL

Spring Framework comes with a Kotlin router DSL available in 3 flavors:

- [WebMvc.fn DSL](../../web/webmvc-functional.md) with [router { }](https://docs.spring.io/spring-framework/docs/7.0.9/kdoc-api/spring-webmvc/org.springframework.web.servlet.function/router.html)
- [WebFlux.fn Reactive DSL](../../web/webflux-functional.md) with [router { }](https://docs.spring.io/spring-framework/docs/7.0.9/kdoc-api/spring-webflux/org.springframework.web.reactive.function.server/router.html)
- [WebFlux.fn Coroutines DSL](coroutines.md) with [coRouter { }](https://docs.spring.io/spring-framework/docs/7.0.9/kdoc-api/spring-webflux/org.springframework.web.reactive.function.server/co-router.html)

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

<a id="kotlin-multiplatform-serialization"></a>

## Kotlin multiplatform serialization

[Kotlin multiplatform serialization](https://github.com/Kotlin/kotlinx.serialization) is
supported in Spring MVC, Spring WebFlux and Spring Messaging (RSocket). The builtin support currently targets CBOR, JSON,
and ProtoBuf formats.

To enable it, follow [those instructions](https://github.com/Kotlin/kotlinx.serialization#setup) to add the related dependencies
and plugin. With Spring MVC and WebFlux, Kotlin serialization is configured by default if it is in the classpath and
other variants like Jackson are not. If needed, configure the converters or codecs manually.
