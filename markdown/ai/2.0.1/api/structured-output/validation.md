---
title: "Schema Validation & Self-Correction"
source: "ROOT:api/structured-output/validation.adoc"
---

<a id="StructuredOutputValidation"></a>

# Schema Validation & Self-Correction

The default [`.entity(…​)`](../structured-output.md) call *asks* the model to produce JSON matching the schema but cannot *force* it.
When the model returns an extra field, omits a required one, or wraps the JSON in prose, the parser throws.

The simplest way to handle malformed output is to detect it and retry.
Spring AI does this automatically with a single switch on the `EntityParamSpec` consumer:

```java
ActorsFilms films = chatClient.prompt()
    .user("Generate the filmography for a random actor.")
    .call()
    .entity(ActorsFilms.class, spec -> spec.validateSchema());
```

<a id="_how_the_self_correcting_loop_works"></a>

## How the Self-Correcting Loop Works

The `spec → spec.validateSchema()` consumer turns on a self-correcting retry loop:

1. The model responds.
1. Spring AI validates the response against the JSON schema for the target type.
1. If validation passes, you get your typed record back.
1. If it fails, the validation error (for example, "missing required field ``actor`", "expected `array``, got `string`") is appended to the user prompt, and the call is re-issued — up to 3 attempts by default.

The model sees the *specific* error on each retry, so the second attempt is not a blind re-try: the model knows what was wrong and can correct it.

![Structured Output Self-Correction Loop](https://raw.githubusercontent.com/spring-projects/spring-ai/v2.0.1/spring-ai-docs/src/main/antora/modules/ROOT/images/structured-output-self-correction.png)

This is powered by `StructuredOutputValidationAdvisor`, a [recursive advisor](../advisors-recursive.md) that is auto-registered when you call `validateSchema()`.
You do not have to wire anything; the switch is the entire configuration.

> [!NOTE]
> Streaming is not supported when `validateSchema()` is active.
> The advisor needs the complete response to validate it.

<a id="_customizing_the_advisor"></a>

## Customizing the Advisor

`StructuredOutputValidationAdvisor` defaults to **3 retry attempts** and uses Spring AI’s default `JsonMapper`.
To customize — for example, more attempts, a pre-supplied schema, or a different mapper — build your own instance and register it on the `ChatClient`.
An explicitly registered advisor replaces the auto-registered one:

```java
var validationAdvisor = StructuredOutputValidationAdvisor.builder()
    .outputType(ActorsFilms.class)
    .maxRepeatAttempts(5)
    .build();

ChatClient chatClient = ChatClient.builder(chatModel)
    .defaultAdvisors(validationAdvisor)
    .build();
```

The advisor can be configured via `outputType` (schema derived automatically) or `outputJsonSchema` (a pre-supplied schema string); the two options are mutually exclusive.

```java
var validationAdvisor = StructuredOutputValidationAdvisor.builder()
    .outputJsonSchema(myConverter.getJsonSchema())
    .build();
```

Key behaviors:

- Derives a JSON schema from the expected output type, or accepts a pre-supplied schema string.
- Validates the LLM response against the schema using JSON Schema `DRAFT_2020_12`.
- Retries the call when validation fails (default: up to 3 attempts).
- Augments the prompt with the validation error message on retry attempts to help the model self-correct.
- Accumulates token usage across every validation attempt, so the returned `ChatResponse` reports the cumulative usage of all retries rather than only the final attempt (see [Cumulative Usage Across Multi-Step Flows](../usage-handling.md#_cumulative_usage_across_multi_step_flows)).
- Optionally supports a custom `JsonMapper`.

For details on the recursive-advisor mechanics behind this advisor, see [`StructuredOutputValidationAdvisor`](../advisors-recursive.md#structured-output-validation-advisor).

<a id="_combining_with_provider_native_output"></a>

## Combining with Provider-Native Output

`validateSchema()` is a *response-side* safety net — it catches bad output after the fact and retries.
[`useProviderStructuredOutput()`](native.md) is a complementary *request-side* constraint.
The two compose naturally:

```java
ActorsFilms films = chatClient.prompt()
    .user("Generate the filmography for a random actor.")
    .call()
    .entity(ActorsFilms.class, spec -> spec
        .useProviderStructuredOutput()
        .validateSchema());
```

This is especially useful for provider edge cases where native enforcement is only partial — for example, Ollama reasoning models that may emit a plain-text reasoning trace instead of JSON.
See [Known Limitations](native.md#_known_limitations).
