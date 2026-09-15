---
title: "HTML Fragments"
source: "ROOT:web/webmvc-view/mvc-fragments.adoc"
---

<a id="mvc-view-fragments"></a>

# HTML Fragments

[See equivalent in the Reactive stack](../webflux-view.md#webflux-view-fragments)

[HTMX](https://htmx.org/) and [Hotwire Turbo](https://turbo.hotwired.dev/) emphasize an
HTML-over-the-wire approach where clients receive server updates in HTML rather than in JSON.
This allows the benefits of an SPA (single page app) without having to write much or even
any JavaScript. For a good overview and to learn more, please visit their respective
websites.

In Spring MVC, view rendering typically involves specifying one view and one model.
However, in HTML-over-the-wire a common capability is to send multiple HTML fragments that
the browser can use to update different parts of the page. For this, controller methods
can return `Collection<ModelAndView>`. For example:

#### Java

```java
@GetMapping
List<ModelAndView> handle() {
	return List.of(new ModelAndView("posts"), new ModelAndView("comments"));
}
```

#### Kotlin

```kotlin
@GetMapping
fun handle(): List<ModelAndView> {
	return listOf(ModelAndView("posts"), ModelAndView("comments"))
}
```

The same can be done also by returning the dedicated type `FragmentsRendering`:

#### Java

```java
@GetMapping
FragmentsRendering handle() {
	return FragmentsRendering.fragment("posts").fragment("comments").build();
}
```

#### Kotlin

```kotlin
@GetMapping
fun handle(): FragmentsRendering {
	return FragmentsRendering.fragment("posts").fragment("comments").build()
}
```

Each fragment can have an independent model, and that model inherits attributes from the
shared model for the request.

HTMX and Hotwire Turbo support streaming updates over SSE (server-sent events).
A controller can use `SseEmitter` to send `ModelAndView` to render a fragment per event:

#### Java

```java
@GetMapping
SseEmitter handle() {
	SseEmitter emitter = new SseEmitter();
	startWorkerThread(() -> {
		try {
			emitter.send(SseEmitter.event().data(new ModelAndView("posts")));
			emitter.send(SseEmitter.event().data(new ModelAndView("comments")));
			// ...
		}
		catch (IOException ex) {
			// Cancel sending
		}
	});
	return emitter;
}
```

#### Kotlin

```kotlin
@GetMapping
fun handle(): SseEmitter {
	val emitter = SseEmitter()
	startWorkerThread{
		try {
			emitter.send(SseEmitter.event().data(ModelAndView("posts")))
			emitter.send(SseEmitter.event().data(ModelAndView("comments")))
			// ...
		}
		catch (ex: IOException) {
			// Cancel sending
		}
	}
	return emitter
}
```

The same can also be done by returning `Flux<ModelAndView>`, or any other type adaptable
to a Reactive Streams `Publisher` through the `ReactiveAdapterRegistry`.
