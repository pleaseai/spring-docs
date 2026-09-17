---
title: "MCP Annotations"
source: "ROOT:api/mcp/mcp-annotations-overview.adoc"
---

# MCP Annotations

The Spring AI MCP Annotations module provides annotation-based method handling for [Model Context Protocol (MCP)](https://github.com/modelcontextprotocol/spec) servers and clients in Java.
It simplifies the creation and registration of MCP server methods and client handlers through a clean, declarative approach using Java annotations.

```
 The MCP Annotations enable developers to create and register MCP operation handlers using declarative annotations.
This approach simplifies implementing MCP server and client functionality by reducing boilerplate code and improving maintainability.
```

This library builds on top of the [MCP Java SDK](https://github.com/modelcontextprotocol/java-sdk) to provide a higher-level, annotation-based programming model for implementing MCP servers and clients.

<a id="_architecture"></a>

## Architecture

The MCP Annotations module consists of:

<a id="_server_annotations"></a>

### Server Annotations

For MCP Servers, the following annotations are provided:

- `@McpTool` - Implements MCP tools with automatic JSON schema generation
- `@McpResource` - Provides access to resources via URI templates
- `@McpPrompt` - Generates prompt messages
- `@McpComplete` - Provides auto-completion functionality

<a id="_client_annotations"></a>

### Client Annotations

For MCP Clients, the following annotations are provided:

- `@McpLogging` - Handles logging message notifications
- `@McpSampling` - Handles sampling requests
- `@McpElicitation` - Handles elicitation requests for gathering additional information
- `@McpProgress` - Handles progress notifications during long-running operations
- `@McpToolListChanged` - Handles tool list change notifications
- `@McpResourceListChanged` - Handles resource list change notifications
- `@McpPromptListChanged` - Handles prompt list change notifications

<a id="_special_parameters_and_annotations"></a>

### Special Parameters and Annotations

- `McpSyncRequestContext` - Special parameter type for synchronous operations that provides a unified interface for accessing MCP request context, including the original request, server exchange (for stateful operations), transport context (for stateless operations), and convenient methods for logging, progress, sampling, and elicitation. This parameter is automatically injected and excluded from JSON schema generation. **Supported in Complete, Prompt, Resource, and Tool methods.**
- `McpAsyncRequestContext` - Special parameter type for asynchronous operations that provides the same unified interface as `McpSyncRequestContext` but with reactive (Mono-based) return types. This parameter is automatically injected and excluded from JSON schema generation. **Supported in Complete, Prompt, Resource, and Tool methods.**
- `McpTransportContext` - Special parameter type for stateless operations that provides lightweight access to transport-level context without full server exchange functionality. This parameter is automatically injected and excluded from JSON schema generation
- `@McpProgressToken` - Marks a method parameter to receive the progress token from the request. This parameter is automatically injected and excluded from the generated JSON schema. **Note:** When using `McpSyncRequestContext` or `McpAsyncRequestContext`, the progress token can be accessed via `ctx.request().progressToken()` instead of using this annotation.
- `McpMeta` - Special parameter type that provides access to metadata from MCP requests, notifications, and results. This parameter is automatically injected and excluded from parameter count limits and JSON schema generation. **Note:** When using `McpSyncRequestContext` or `McpAsyncRequestContext`, metadata can be obtained via `ctx.requestMeta()` instead.

<a id="_getting_started"></a>

## Getting Started

<a id="_dependencies"></a>

### Dependencies

Add the MCP annotations dependency to your project:

```xml
<dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-mcp-annotations</artifactId>
</dependency>
```

The MCP annotations are automatically included when you use any of the MCP Boot Starters:

- `spring-ai-starter-mcp-client`
- `spring-ai-starter-mcp-client-webflux`
- `spring-ai-starter-mcp-server`
- `spring-ai-starter-mcp-server-webflux`
- `spring-ai-starter-mcp-server-webmvc`

<a id="_configuration"></a>

### Configuration

The annotation scanning is enabled by default when using the MCP Boot Starters. You can configure the scanning behavior using the following properties:

<a id="_client_annotation_scanner"></a>

#### Client Annotation Scanner

```yaml
spring:
  ai:
    mcp:
      client:
        annotation-scanner:
          enabled: true  # Enable/disable annotation scanning
```

<a id="_server_annotation_scanner"></a>

#### Server Annotation Scanner

```yaml
spring:
  ai:
    mcp:
      server:
        annotation-scanner:
          enabled: true  # Enable/disable annotation scanning
```

<a id="_quick_example"></a>

## Quick Example

Here’s a simple example of using MCP annotations to create a calculator tool:

```java
@Component
public class CalculatorTools {

    @McpTool(name = "add", description = "Add two numbers together")
    public int add(
            @McpToolParam(description = "First number", required = true) int a,
            @McpToolParam(description = "Second number", required = true) int b) {
        return a + b;
    }

    @McpTool(name = "multiply", description = "Multiply two numbers")
    public double multiply(
            @McpToolParam(description = "First number", required = true) double x,
            @McpToolParam(description = "Second number", required = true) double y) {
        return x * y;
    }
}
```

And a simple client handler for logging:

```java
@Component
public class LoggingHandler {

    @McpLogging(clients = "my-server")
    public void handleLoggingMessage(LoggingMessageNotification notification) {
        System.out.println("Received log: " + notification.level() +
                          " - " + notification.data());
    }
}
```

With Spring Boot auto-configuration, these annotated beans are automatically detected and registered with the MCP server or client.

<a id="_documentation"></a>

## Documentation

- [Client Annotations](mcp-annotations-client.md) - Detailed guide for client-side annotations
- [Server Annotations](mcp-annotations-server.md) - Detailed guide for server-side annotations
- [Special Parameters](mcp-annotations-special-params.md) - Guide for special parameter types
- [Examples](mcp-annotations-examples.md) - Comprehensive examples and use cases

<a id="_additional_resources"></a>

## Additional Resources

- [MCP Overview](mcp-overview.md)
- [MCP Client Boot Starter](mcp-client-boot-starter-docs.md)
- [MCP Server Boot Starter](mcp-server-boot-starter-docs.md)
- [Model Context Protocol Specification](https://modelcontextprotocol.github.io/specification/)
