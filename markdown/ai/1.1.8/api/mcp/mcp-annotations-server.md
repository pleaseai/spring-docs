---
title: "MCP Server Annotations"
source: "ROOT:api/mcp/mcp-annotations-server.adoc"
---

# MCP Server Annotations

The MCP Server Annotations provide a declarative way to implement MCP server functionality using Java annotations.
These annotations simplify the creation of tools, resources, prompts, and completion handlers.

<a id="_server_annotations"></a>

## Server Annotations

<a id="_mcptool"></a>

### @McpTool

The `@McpTool` annotation marks a method as an MCP tool implementation with automatic JSON schema generation.

<a id="_basic_usage"></a>

#### Basic Usage

```java
@Component
public class CalculatorTools {

    @McpTool(name = "add", description = "Add two numbers together")
    public int add(
            @McpToolParam(description = "First number", required = true) int a,
            @McpToolParam(description = "Second number", required = true) int b) {
        return a + b;
    }
}
```

<a id="_advanced_features"></a>

#### Advanced Features

```java
@McpTool(name = "calculate-area",
         description = "Calculate the area of a rectangle",
         annotations = McpTool.McpAnnotations(
             title = "Rectangle Area Calculator",
             readOnlyHint = true,
             destructiveHint = false,
             idempotentHint = true
         ))
public AreaResult calculateRectangleArea(
        @McpToolParam(description = "Width", required = true) double width,
        @McpToolParam(description = "Height", required = true) double height) {

    return new AreaResult(width * height, "square units");
}
```

<a id="_with_request_context"></a>

#### With Request Context

Tools can access the request context for advanced operations:

```java
@McpTool(name = "process-data", description = "Process data with request context")
public String processData(
        McpSyncRequestContext context,
        @McpToolParam(description = "Data to process", required = true) String data) {

    // Send logging notification
    context.info("Processing data: " + data);

    // Send progress notification (using convenient method)
    context.progress(p -> p.progress(0.5).total(1.0).message("Processing..."));

    // Ping the client
    context.ping();

    return "Processed: " + data.toUpperCase();
}
```

<a id="_dynamic_schema_support"></a>

#### Dynamic Schema Support

Tools can accept `CallToolRequest` for runtime schema handling:

```java
@McpTool(name = "flexible-tool", description = "Process dynamic schema")
public CallToolResult processDynamic(CallToolRequest request) {
    Map<String, Object> args = request.arguments();

    // Process based on runtime schema
    String result = "Processed " + args.size() + " arguments dynamically";

    return CallToolResult.builder()
        .addTextContent(result)
        .build();
}
```

<a id="_progress_tracking"></a>

#### Progress Tracking

Tools can receive progress tokens for tracking long-running operations:

```java
@McpTool(name = "long-task", description = "Long-running task with progress")
public String performLongTask(
        McpSyncRequestContext context,
        @McpToolParam(description = "Task name", required = true) String taskName) {

    // Access progress token from context
    String progressToken = context.request().progressToken();

    if (progressToken != null) {
        context.progress(p -> p.progress(0.0).total(1.0).message("Starting task"));

        // Perform work...

        context.progress(p -> p.progress(1.0).total(1.0).message("Task completed"));
    }

    return "Task " + taskName + " completed";
}
```

<a id="_mcpresource"></a>

### @McpResource

The `@McpResource` annotation provides access to resources via URI templates.

<a id="_basic_usage_2"></a>

#### Basic Usage

```java
@Component
public class ResourceProvider {

    @McpResource(
        uri = "config://{key}",
        name = "Configuration",
        description = "Provides configuration data")
    public String getConfig(String key) {
        return configData.get(key);
    }
}
```

<a id="_with_readresourceresult"></a>

#### With ReadResourceResult

```java
@McpResource(
    uri = "user-profile://{username}",
    name = "User Profile",
    description = "Provides user profile information")
public ReadResourceResult getUserProfile(String username) {
    String profileData = loadUserProfile(username);

    return new ReadResourceResult(List.of(
        new TextResourceContents(
            "user-profile://" + username,
            "application/json",
            profileData)
    ));
}
```

<a id="_with_request_context_2"></a>

#### With Request Context

```java
@McpResource(
    uri = "data://{id}",
    name = "Data Resource",
    description = "Resource with request context")
public ReadResourceResult getData(
        McpSyncRequestContext context,
        String id) {

    // Send logging notification using convenient method
    context.info("Accessing resource: " + id);

    // Ping the client
    context.ping();

    String data = fetchData(id);

    return new ReadResourceResult(List.of(
        new TextResourceContents("data://" + id, "text/plain", data)
    ));
}
```

<a id="_mcpprompt"></a>

### @McpPrompt

The `@McpPrompt` annotation generates prompt messages for AI interactions.

<a id="_basic_usage_3"></a>

#### Basic Usage

```java
@Component
public class PromptProvider {

    @McpPrompt(
        name = "greeting",
        description = "Generate a greeting message")
    public GetPromptResult greeting(
            @McpArg(name = "name", description = "User's name", required = true)
            String name) {

        String message = "Hello, " + name + "! How can I help you today?";

        return new GetPromptResult(
            "Greeting",
            List.of(new PromptMessage(Role.ASSISTANT, new TextContent(message)))
        );
    }
}
```

<a id="_with_optional_arguments"></a>

#### With Optional Arguments

```java
@McpPrompt(
    name = "personalized-message",
    description = "Generate a personalized message")
public GetPromptResult personalizedMessage(
        @McpArg(name = "name", required = true) String name,
        @McpArg(name = "age", required = false) Integer age,
        @McpArg(name = "interests", required = false) String interests) {

    StringBuilder message = new StringBuilder();
    message.append("Hello, ").append(name).append("!\n\n");

    if (age != null) {
        message.append("At ").append(age).append(" years old, ");
        // Add age-specific content
    }

    if (interests != null && !interests.isEmpty()) {
        message.append("Your interest in ").append(interests);
        // Add interest-specific content
    }

    return new GetPromptResult(
        "Personalized Message",
        List.of(new PromptMessage(Role.ASSISTANT, new TextContent(message.toString())))
    );
}
```

<a id="_mcpcomplete"></a>

### @McpComplete

The `@McpComplete` annotation provides auto-completion functionality for prompts.

<a id="_basic_usage_4"></a>

#### Basic Usage

```java
@Component
public class CompletionProvider {

    @McpComplete(prompt = "city-search")
    public List<String> completeCityName(String prefix) {
        return cities.stream()
            .filter(city -> city.toLowerCase().startsWith(prefix.toLowerCase()))
            .limit(10)
            .toList();
    }
}
```

<a id="_with_completerequest_completeargument"></a>

#### With CompleteRequest.CompleteArgument

```java
@McpComplete(prompt = "travel-planner")
public List<String> completeTravelDestination(CompleteRequest.CompleteArgument argument) {
    String prefix = argument.value().toLowerCase();
    String argumentName = argument.name();

    // Different completions based on argument name
    if ("city".equals(argumentName)) {
        return completeCities(prefix);
    } else if ("country".equals(argumentName)) {
        return completeCountries(prefix);
    }

    return List.of();
}
```

<a id="_with_completeresult"></a>

#### With CompleteResult

```java
@McpComplete(prompt = "code-completion")
public CompleteResult completeCode(String prefix) {
    List<String> completions = generateCodeCompletions(prefix);

    return new CompleteResult(
        new CompleteResult.CompleteCompletion(
            completions,
            completions.size(),  // total
            hasMoreCompletions   // hasMore flag
        )
    );
}
```

<a id="_stateless_vs_stateful_implementations"></a>

## Stateless vs Stateful Implementations

<a id="_unified_request_context_recommended"></a>

### Unified Request Context (Recommended)

Use `McpSyncRequestContext` or `McpAsyncRequestContext` for a unified interface that works with both stateful and stateless operations:

```java
public record UserInfo(String name, String email, int age) {}

@McpTool(name = "unified-tool", description = "Tool with unified request context")
public String unifiedTool(
        McpSyncRequestContext context,
        @McpToolParam(description = "Input", required = true) String input) {

    // Access request and metadata
    String progressToken = context.request().progressToken();

    // Logging with convenient methods
    context.info("Processing: " + input);

    // Progress notifications (Note client should set a progress token
    // with its request to be able to receive progress updates)
    context.progress(50); // Simple percentage

    // Ping client
    context.ping();

    // Check capabilities before using
    if (context.elicitEnabled()) {
        // Request user input (only in stateful mode)
        StructuredElicitResult<UserInfo> elicitResult = context.elicit(UserInfo.class);
        if (elicitResult.action() == ElicitResult.Action.ACCEPT) {
            // Use elicited data
        }
    }

    if (context.sampleEnabled()) {
        // Request LLM sampling (only in stateful mode)
        CreateMessageResult samplingResult = context.sample("Generate response");
        // Use sampling result
    }

    return "Processed with unified context";
}
```

<a id="_simple_operations_no_context"></a>

### Simple Operations (No Context)

For simple operations, you can omit context parameters entirely:

```java
@McpTool(name = "simple-add", description = "Simple addition")
public int simpleAdd(
        @McpToolParam(description = "First number", required = true) int a,
        @McpToolParam(description = "Second number", required = true) int b) {
    return a + b;
}
```

<a id="_lightweight_stateless_with_mcptransportcontext"></a>

### Lightweight Stateless (with McpTransportContext)

For stateless operations where you need minimal transport context:

```java
@McpTool(name = "stateless-tool", description = "Stateless with transport context")
public String statelessTool(
        McpTransportContext context,
        @McpToolParam(description = "Input", required = true) String input) {
    // Access transport-level context only
    // No bidirectional operations (roots, elicitation, sampling)
    return "Processed: " + input;
}
```

> [!IMPORTANT]
> **Stateless servers do not support bidirectional operations:**

Therefore methods using `McpSyncRequestContext` or `McpAsyncRequestContext` in stateless mode are ignored.

<a id="_method_filtering_by_server_type"></a>

## Method Filtering by Server Type

The MCP annotations framework automatically filters annotated methods based on the server type and method characteristics. This ensures that only appropriate methods are registered for each server configuration.
A warning is logged for each filtered method to help with debugging.

<a id="_synchronous_vs_asynchronous_filtering"></a>

### Synchronous vs Asynchronous Filtering

<a id="_synchronous_servers"></a>

#### Synchronous Servers

Synchronous servers (configured with `spring.ai.mcp.server.type=SYNC`) use synchronous providers that:

- **Accept** methods with non-reactive return types:

  - Primitive types (`int`, `double`, `boolean`)
  - Object types (`String`, `Integer`, custom POJOs)
  - MCP types (`CallToolResult`, `ReadResourceResult`, `GetPromptResult`, `CompleteResult`)
  - Collections (`List<String>`, `Map<String, Object>`)
- **Filter out** methods with reactive return types:

  - `Mono<T>`
  - `Flux<T>`
  - `Publisher<T>`

```java
@Component
public class SyncTools {

    @McpTool(name = "sync-tool", description = "Synchronous tool")
    public String syncTool(String input) {
        // This method WILL be registered on sync servers
        return "Processed: " + input;
    }

    @McpTool(name = "async-tool", description = "Async tool")
    public Mono<String> asyncTool(String input) {
        // This method will be FILTERED OUT on sync servers
        // A warning will be logged
        return Mono.just("Processed: " + input);
    }
}
```

<a id="_asynchronous_servers"></a>

#### Asynchronous Servers

Asynchronous servers (configured with `spring.ai.mcp.server.type=ASYNC`) use asynchronous providers that:

- **Accept** methods with reactive return types:

  - `Mono<T>` (for single results)
  - `Flux<T>` (for streaming results)
  - `Publisher<T>` (generic reactive type)
- **Filter out** methods with non-reactive return types:

  - Primitive types
  - Object types
  - Collections
  - MCP result types

```java
@Component
public class AsyncTools {

    @McpTool(name = "async-tool", description = "Async tool")
    public Mono<String> asyncTool(String input) {
        // This method WILL be registered on async servers
        return Mono.just("Processed: " + input);
    }

    @McpTool(name = "sync-tool", description = "Sync tool")
    public String syncTool(String input) {
        // This method will be FILTERED OUT on async servers
        // A warning will be logged
        return "Processed: " + input;
    }
}
```

<a id="_stateful_vs_stateless_filtering"></a>

### Stateful vs Stateless Filtering

<a id="_stateful_servers"></a>

#### Stateful Servers

Stateful servers support bidirectional communication and accept methods with:

- **Bidirectional context parameters**:

  - `McpSyncRequestContext` (for sync operations)
  - `McpAsyncRequestContext` (for async operations)
  - `McpSyncServerExchange` (legacy, for sync operations)
  - `McpAsyncServerExchange` (legacy, for async operations)
- Support for bidirectional operations:

  - `roots()` - Access root directories
  - `elicit()` - Request user input
  - `sample()` - Request LLM sampling

```java
@Component
public class StatefulTools {

    @McpTool(name = "interactive-tool", description = "Tool with bidirectional operations")
    public String interactiveTool(
            McpSyncRequestContext context,
            @McpToolParam(description = "Input", required = true) String input) {

        // This method WILL be registered on stateful servers
        // Can use elicitation, sampling, roots
        if (context.sampleEnabled()) {
            var samplingResult = context.sample("Generate response");
            // Process sampling result...
        }

        return "Processed with context";
    }
}
```

<a id="_stateless_servers"></a>

#### Stateless Servers

Stateless servers are optimized for simple request-response patterns and:

- **Filter out** methods with bidirectional context parameters:

  - Methods with `McpSyncRequestContext` are skipped
  - Methods with `McpAsyncRequestContext` are skipped
  - Methods with `McpSyncServerExchange` are skipped
  - Methods with `McpAsyncServerExchange` are skipped
  - A warning is logged for each filtered method
- **Accept** methods with:

  - `McpTransportContext` (lightweight stateless context)
  - No context parameter at all
  - Only regular `@McpToolParam` parameters
- Do **not** support bidirectional operations:

  - `roots()` - Not available
  - `elicit()` - Not available
  - `sample()` - Not available

```java
@Component
public class StatelessTools {

    @McpTool(name = "simple-tool", description = "Simple stateless tool")
    public String simpleTool(@McpToolParam(description = "Input") String input) {
        // This method WILL be registered on stateless servers
        return "Processed: " + input;
    }

    @McpTool(name = "context-tool", description = "Tool with transport context")
    public String contextTool(
            McpTransportContext context,
            @McpToolParam(description = "Input") String input) {
        // This method WILL be registered on stateless servers
        return "Processed: " + input;
    }

    @McpTool(name = "bidirectional-tool", description = "Tool with bidirectional context")
    public String bidirectionalTool(
            McpSyncRequestContext context,
            @McpToolParam(description = "Input") String input) {
        // This method will be FILTERED OUT on stateless servers
        // A warning will be logged
        return "Processed with sampling";
    }
}
```

<a id="_filtering_summary"></a>

### Filtering Summary

| Server Type | Accepted Methods | Filtered Methods |
| --- | --- | --- |
| **Sync Stateful** | Non-reactive returns + bidirectional context | Reactive returns (Mono/Flux) |
| **Async Stateful** | Reactive returns (Mono/Flux) + bidirectional context | Non-reactive returns |
| **Sync Stateless** | Non-reactive returns + no bidirectional context | Reactive returns OR bidirectional context parameters |
| **Async Stateless** | Reactive returns (Mono/Flux) + no bidirectional context | Non-reactive returns OR bidirectional context parameters |

> [!TIP]
> **Best Practices for Method Filtering:**

1. **Keep methods aligned** with your server type - use sync methods for sync servers, async for async servers
1. **Separate stateful and stateless** implementations into different classes for clarity
1. **Check logs** during startup for filtered method warnings
1. **Use the right context** - `McpSyncRequestContext`/`McpAsyncRequestContext` for stateful, `McpTransportContext` for stateless
1. **Test both modes** if you support both stateful and stateless deployments

<a id="_async_support"></a>

## Async Support

All server annotations support asynchronous implementations using Reactor:

```java
@Component
public class AsyncTools {

    @McpTool(name = "async-fetch", description = "Fetch data asynchronously")
    public Mono<String> asyncFetch(
            @McpToolParam(description = "URL", required = true) String url) {

        return Mono.fromCallable(() -> {
            // Simulate async operation
            return fetchFromUrl(url);
        }).subscribeOn(Schedulers.boundedElastic());
    }

    @McpResource(uri = "async-data://{id}", name = "Async Data")
    public Mono<ReadResourceResult> asyncResource(String id) {
        return Mono.fromCallable(() -> {
            String data = loadData(id);
            return new ReadResourceResult(List.of(
                new TextResourceContents("async-data://" + id, "text/plain", data)
            ));
        }).delayElements(Duration.ofMillis(100));
    }
}
```

<a id="_spring_boot_integration"></a>

## Spring Boot Integration

With Spring Boot auto-configuration, annotated beans are automatically detected and registered:

```java
@SpringBootApplication
public class McpServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(McpServerApplication.class, args);
    }
}

@Component
public class MyMcpTools {
    // Your @McpTool annotated methods
}

@Component
public class MyMcpResources {
    // Your @McpResource annotated methods
}
```

The auto-configuration will:

1. Scan for beans with MCP annotations
1. Create appropriate specifications
1. Register them with the MCP server
1. Handle both sync and async implementations based on configuration

<a id="_configuration_properties"></a>

## Configuration Properties

Configure the server annotation scanner:

```yaml
spring:
  ai:
    mcp:
      server:
        type: SYNC  # or ASYNC
        annotation-scanner:
          enabled: true
```

<a id="_additional_resources"></a>

## Additional Resources

- [MCP Annotations Overview](mcp-annotations-overview.md)
- [Client Annotations](mcp-annotations-client.md)
- [Special Parameters](mcp-annotations-special-params.md)
- [MCP Server Boot Starter](mcp-server-boot-starter-docs.md)
