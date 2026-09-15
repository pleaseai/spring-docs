---
title: "Context"
source: "ROOT:web/webflux-webclient/client-context.adoc"
---

<a id="webflux-client-context"></a>

# Context

[Attributes](client-attributes.md) provide a convenient way to pass information to the filter
chain but they only influence the current request. If you want to pass information that
propagates to additional requests that are nested, for example, via `flatMap`, or executed after,
for example, via `concatMap`, then you’ll need to use the Reactor `Context`.

The Reactor `Context` needs to be populated at the end of a reactive chain in order to
apply to all operations. For example:

#### Java

```java
WebClient client = WebClient.builder()
		.filter((request, next) ->
				Mono.deferContextual(contextView -> {
					String value = contextView.get("foo");
					// ...
				}))
		.build();

client.get().uri("https://example.org/")
		.retrieve()
		.bodyToMono(String.class)
		.flatMap(body -> {
				// perform nested request (context propagates automatically)...
		})
		.contextWrite(context -> context.put("foo", ...));
```
