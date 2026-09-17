---
title: "Migrating from FunctionCallback to ToolCallback API"
source: "ROOT:api/tools-migration.adoc"
---

# Migrating from FunctionCallback to ToolCallback API

This guide helps you migrate from the deprecated `FunctionCallback` API to the new `ToolCallback` API in Spring AI. For more information about the new APIs, check out the [Tools Calling](tools.md) documentation.

<a id="_overview_of_changes"></a>

## Overview of Changes

These changes are part of a broader effort to improve and extend the tool calling capabilities in Spring AI. Among the other things, the new API moves from "functions" to "tools" terminology to better align with industry conventions. This involves several API changes while maintaining backward compatibility through deprecated methods.

<a id="_key_changes"></a>

## Key Changes

1. `FunctionCallback` → `ToolCallback`
1. `FunctionCallback.builder().function()` → `FunctionToolCallback.builder()`
1. `FunctionCallback.builder().method()` → `MethodToolCallback.builder()`
1. `FunctionCallingOptions` → `ToolCallingChatOptions`
1. `ChatClient.builder().defaultFunctions()` → `ChatClient.builder().defaultTools()`
1. `ChatClient.functions()` → `ChatClient.tools()`
1. `FunctionCallingOptions.builder().functions()` → `ToolCallingChatOptions.builder().toolNames()`
1. `FunctionCallingOptions.builder().functionCallbacks()` → `ToolCallingChatOptions.builder().toolCallbacks()`

<a id="_migration_examples"></a>

## Migration Examples

<a id="_1_basic_function_callback"></a>

### 1. Basic Function Callback

Before:

```java
FunctionCallback.builder()
    .function("getCurrentWeather", new MockWeatherService())
    .description("Get the weather in location")
    .inputType(MockWeatherService.Request.class)
    .build()
```

After:

```java
FunctionToolCallback.builder("getCurrentWeather", new MockWeatherService())
    .description("Get the weather in location")
    .inputType(MockWeatherService.Request.class)
    .build()
```

<a id="_2_chatclient_usage"></a>

### 2. ChatClient Usage

Before:

```java
String response = ChatClient.create(chatModel)
    .prompt()
    .user("What's the weather like in San Francisco?")
    .functions(FunctionCallback.builder()
        .function("getCurrentWeather", new MockWeatherService())
        .description("Get the weather in location")
        .inputType(MockWeatherService.Request.class)
        .build())
    .call()
    .content();
```

After:

```java
String response = ChatClient.create(chatModel)
    .prompt()
    .user("What's the weather like in San Francisco?")
    .tools(FunctionToolCallback.builder("getCurrentWeather", new MockWeatherService())
        .description("Get the weather in location")
        .inputType(MockWeatherService.Request.class)
        .build())
    .call()
    .content();
```

<a id="_3_method_based_function_callbacks"></a>

### 3. Method-Based Function Callbacks

Before:

```java
FunctionCallback.builder()
    .method("getWeatherInLocation", String.class, Unit.class)
    .description("Get the weather in location")
    .targetClass(TestFunctionClass.class)
    .build()
```

After:

```java
var toolMethod = ReflectionUtils.findMethod(TestFunctionClass.class, "getWeatherInLocation");

MethodToolCallback.builder()
    .toolDefinition(ToolDefinition.builder(toolMethod)
        .description("Get the weather in location")
        .build())
    .toolMethod(toolMethod)
    .build()
```

Or with the declarative approach:

```java
class WeatherTools {

    @Tool(description = "Get the weather in location")
    public void getWeatherInLocation(String location, Unit unit) {
        // ...
    }

}
```

And you can use the same `ChatClient#tools()` API to register method-based tool callbackes:

```java
String response = ChatClient.create(chatModel)
    .prompt()
    .user("What's the weather like in San Francisco?")
    .tools(MethodToolCallback.builder()
        .toolDefinition(ToolDefinition.builder(toolMethod)
            .description("Get the weather in location")
            .build())
        .toolMethod(toolMethod)
        .build())
    .call()
    .content();
```

Or with the declarative approach:

```java
String response = ChatClient.create(chatModel)
    .prompt()
    .user("What's the weather like in San Francisco?")
    .tools(new WeatherTools())
    .call()
    .content();
```

<a id="_4_options_configuration"></a>

### 4. Options Configuration

Before:

```java
FunctionCallingOptions.builder()
    .model(modelName)
    .function("weatherFunction")
    .build()
```

After:

```java
ToolCallingChatOptions.builder()
    .model(modelName)
    .toolNames("weatherFunction")
    .build()
```

<a id="_5_default_functions_in_chatclient_builder"></a>

### 5. Default Functions in ChatClient Builder

Before:

```java
ChatClient.builder(chatModel)
    .defaultFunctions(FunctionCallback.builder()
        .function("getCurrentWeather", new MockWeatherService())
        .description("Get the weather in location")
        .inputType(MockWeatherService.Request.class)
        .build())
    .build()
```

After:

```java
ChatClient.builder(chatModel)
    .defaultTools(FunctionToolCallback.builder("getCurrentWeather", new MockWeatherService())
        .description("Get the weather in location")
        .inputType(MockWeatherService.Request.class)
        .build())
    .build()
```

<a id="_6_spring_bean_configuration"></a>

### 6. Spring Bean Configuration

Before:

```java
@Bean
public FunctionCallback weatherFunctionInfo() {
    return FunctionCallback.builder()
        .function("WeatherInfo", new MockWeatherService())
        .description("Get the current weather")
        .inputType(MockWeatherService.Request.class)
        .build();
}
```

After:

```java
@Bean
public ToolCallback weatherFunctionInfo() {
    return FunctionToolCallback.builder("WeatherInfo", new MockWeatherService())
        .description("Get the current weather")
        .inputType(MockWeatherService.Request.class)
        .build();
}
```

<a id="_breaking_changes"></a>

## Breaking Changes

1. The `method()` configuration in function callbacks has been replaced with a more explicit method tool configuration using `ToolDefinition` and `MethodToolCallback`.
1. When using method-based callbacks, you now need to explicitly find the method using `ReflectionUtils` and provide it to the builder. Alternatively, you can use the declarative approach with the `@Tool` annotation.
1. For non-static methods, you must now provide both the method and the target object:

```
MethodToolCallback.builder()
    .toolDefinition(ToolDefinition.builder(toolMethod)
        .description("Description")
        .build())
    .toolMethod(toolMethod)
    .toolObject(targetObject)
    .build()
```

<a id="_deprecated_methods"></a>

## Deprecated Methods

The following methods are deprecated and will be removed in a future release:

- `ChatClient.Builder.defaultFunctions(String…​)`
- `ChatClient.Builder.defaultFunctions(FunctionCallback…​)`
- `ChatClient.RequestSpec.functions()`

Use their `tools` counterparts instead.

<a id="_declarative_specification_with_tool"></a>

## Declarative Specification with @Tool

Now you can use the method-level annotation (`@Tool`) to register tools with Spring AI:

```java
class Home {

    @Tool(description = "Turn light On or Off in a room.")
    void turnLight(String roomName, boolean on) {
        // ...
        logger.info("Turn light in room: {} to: {}", roomName, on);
    }
}

String response = ChatClient.create(this.chatModel).prompt()
        .user("Turn the light in the living room On.")
        .tools(new Home())
        .call()
        .content();
```

<a id="_additional_notes"></a>

## Additional Notes

1. The new API provides better separation between tool definition and implementation.
1. Tool definitions can be reused across different implementations.
1. The builder pattern has been simplified for common use cases.
1. Better support for method-based tools with improved error handling.

<a id="_timeline"></a>

## Timeline

The deprecated methods will be maintained for backward compatibility in the current milestone version but will be removed in the next milestone release. It’s recommended to migrate to the new API as soon as possible.
