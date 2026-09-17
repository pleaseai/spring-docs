---
title: "Structured Output"
source: "ROOT:api/structured-output.adoc"
---

<a id="StructuredOutput"></a>

# Structured Output

Large language models are text-in, text-out systems.
The moment downstream code needs to route on a field, persist a value, or branch on a result, that text has to become a typed record.
**Structured output** bridges that gap: the model is steered to produce text conforming to a schema, and the application parses it back into a typed object the rest of the codebase can treat like any other domain type.

Spring AI exposes structured output directly on the [`ChatClient`](chatclient.md) fluent API through `.entity(…​)`.
You define a Java type for the shape you want back, and Spring AI takes care of the rest: a JSON schema is generated from your type, the model is instructed to honor it, and the response is deserialized into your type.

This page covers the high-level `ChatClient` path.
For reliability switches and lower-level APIs, see:

- [Schema Validation & Self-Correction](structured-output/validation.md) — detect malformed output and retry automatically with `validateSchema()`.
- [Provider-Native Structured Output](structured-output/native.md) — enforce the schema at the provider API level with `useProviderStructuredOutput()`.
- [Output Converters](structured-output/converters.md) — the lower-level `StructuredOutputConverter` API, the built-in converters, and custom/non-JSON converters.

<a id="_typed_response"></a>

## Typed Response

Define a Java record for the shape you want back:

```java
record ActorsFilms(String actor, List<String> movies) {}
```

Ask `ChatClient` to populate it.
Instead of finishing the call with `.content()` — which returns the raw text reply — finish with `.entity(…​)` and pass your target type:

```java
ActorsFilms films = chatClient.prompt()
    .user("Generate the filmography for a random actor.")
    .call()
    .entity(ActorsFilms.class);
```

The result is a typed `ActorsFilms` you can pass to the rest of your code:

```java
films.actor();     // "Tom Hanks"
films.movies();    // ["Forrest Gump", "Cast Away", ...]
```

Behind the scenes, Spring AI did three things: a schema generator turned your `ActorsFilms` record into a JSON schema, that schema was appended to the prompt’s system context, and the model’s JSON answer was handed to a type converter that parsed it back into your record.

![Structured Output Basic Flow](https://raw.githubusercontent.com/spring-projects/spring-ai/v2.0.1/spring-ai-docs/src/main/antora/modules/ROOT/images/structured-output-basic.png)

This works on every model Spring AI supports — there is nothing provider-specific about it.

> [!NOTE]
> `.entity(…​)` is `.call()`-only.
> Typed parsing requires the complete response, so it is not available on the streaming path (`.stream()` returns text chunks, not typed objects).
> This applies to every variant on this page — `Class`, `ParameterizedTypeReference`, custom converter, with or without the reliability switches.

The default `.entity(…​)` call has no guarantees.
The model is *asked* to produce JSON matching the schema, not *forced* to.
Most of the time it complies; sometimes it returns an extra field, omits a required one, or wraps the JSON in prose, and the parser throws.
The two switches below address this.

<a id="_generic_types_lists_maps_and_beyond"></a>

## Generic Types: Lists, Maps, and Beyond

`.entity(Class)` is for concrete classes.
For generic types — `List<ActorsFilms>`, `Map<String, ActorsFilms>` — use `ParameterizedTypeReference`:

```java
List<ActorsFilms> films = chatClient.prompt()
    .user("Generate filmographies for three random actors.")
    .call()
    .entity(new ParameterizedTypeReference<List<ActorsFilms>>() {});
```

<a id="_reliability_switches_entityparamspec"></a>

## Reliability Switches: `EntityParamSpec`

All `.entity(…​)` (and `.responseEntity(…​)`) overloads accept an optional `Consumer<EntityParamSpec>` that enables two independent, composable behaviors.

<a id="_dont_fail_on_malformed_output_validateschema"></a>

### Don’t Fail on Malformed Output: `validateSchema()`

`validateSchema()` turns on a self-correcting retry loop: Spring AI validates the response against the entity’s schema, and if validation fails, the specific error is appended to the prompt and the call is re-issued — up to 3 attempts by default.

```java
ActorsFilms films = chatClient.prompt()
    .user("Generate the filmography for a random actor.")
    .call()
    .entity(ActorsFilms.class, spec -> spec.validateSchema());
```

See [Schema Validation & Self-Correction](structured-output/validation.md) for how the retry loop works and how to customize it.

<a id="_stronger_upstream_guarantees_useproviderstructuredoutput"></a>

### Stronger Upstream Guarantees: `useProviderStructuredOutput()`

`useProviderStructuredOutput()` sends the schema to the provider as an API-level constraint, so the provider’s runtime enforces conformance rather than relying on prompt instructions.

```java
ActorsFilms films = chatClient.prompt()
    .user("Generate the filmography for a random actor.")
    .call()
    .entity(ActorsFilms.class, spec -> spec.useProviderStructuredOutput());
```

This requires the underlying model to support native structured output.
See [Provider-Native Structured Output](structured-output/native.md) for supported providers and limitations.

<a id="_combining_both"></a>

### Combining Both

The two switches solve different problems and compose naturally:

```java
ActorsFilms films = chatClient.prompt()
    .user("Generate the filmography for a random actor.")
    .call()
    .entity(ActorsFilms.class, spec -> spec
        .useProviderStructuredOutput()
        .validateSchema());
```

`useProviderStructuredOutput()` minimizes the chance of malformed output by constraining the model at the API level.
`validateSchema()` catches the residual cases — provider edge cases, reasoning-model quirks — and corrects them automatically.
Reach for both when downstream code cannot tolerate shape drift.

<a id="_getting_the_full_response"></a>

## Getting the Full Response

`.entity(…​)` returns only the parsed object.
If you also need the underlying `ChatResponse` — for token usage, observability metadata, or anything beyond the entity — use `.responseEntity(…​)`:

```java
ResponseEntity<ChatResponse, ActorsFilms> result = chatClient.prompt()
    .user("Generate the filmography for a random actor.")
    .call()
    .responseEntity(ActorsFilms.class);

ActorsFilms films = result.entity();
ChatResponse raw = result.response();
long totalTokens = raw.getMetadata().getUsage().getTotalTokens();
```

It has the same overload set as `.entity(…​)` — `Class`, `ParameterizedTypeReference`, custom `StructuredOutputConverter`, and the `EntityParamSpec` consumer all apply.

<a id="_custom_and_non_json_output"></a>

## Custom and Non-JSON Output

When the built-in JSON parsing is not enough — the model wraps JSON in markdown fences, or you need a non-JSON format such as YAML or CSV — pass your own `StructuredOutputConverter<T>` to `.entity(…​)`.
See [Output Converters](structured-output/converters.md).

<a id="_cheat_sheet"></a>

## Cheat Sheet

| You need | Use |
| --- | --- |
| Default — works on every provider | `.entity(Type.class)` |
| Generic types like `List<T>`, `Map<K,V>` | `.entity(new ParameterizedTypeReference<…​>() {})` |
| Don’t fail on malformed output | `.entity(Type.class, spec → spec.validateSchema())` |
| Stronger upstream guarantees from the provider | `.entity(Type.class, spec → spec.useProviderStructuredOutput())` |
| Both — request constraint + response retry | `.entity(Type.class, spec → spec.useProviderStructuredOutput().validateSchema())` |
| Token usage / metadata alongside the entity | `.responseEntity(…​)` (same overloads) |
| Model wraps JSON in markdown fences, or non-JSON format | Implement [`StructuredOutputConverter<T>`](structured-output/converters.md) and pass it to `.entity(…​)` |
| Streaming responses | Not supported — `.entity(…​)` is `.call()`-only; `.stream()` returns text chunks, not typed objects |

> [!TIP]
> Structured output is a best effort to convert the model output into a structured type.
> The model is not guaranteed to return the requested structure.
> Use `validateSchema()` and/or `useProviderStructuredOutput()` when correctness matters.

> [!NOTE]
> The `StructuredOutputConverter` is not used for LLM [Tool Calling](tools.md), as this feature inherently provides structured outputs by default.
