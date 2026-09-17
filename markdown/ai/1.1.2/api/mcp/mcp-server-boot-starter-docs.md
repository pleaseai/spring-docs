---
title: "MCP Server Boot Starter"
source: "ROOT:api/mcp/mcp-server-boot-starter-docs.adoc"
---

# MCP Server Boot Starter

[Model Context Protocol (MCP) Servers](https://modelcontextprotocol.io/docs/learn/server-concepts) are programs that expose specific capabilities to AI applications through standardized protocol interfaces.
Each server provides focused functionality for a particular domain.

The Spring AI MCP Server Boot Starters provide auto-configuration for setting up [MCP Servers](https://modelcontextprotocol.io/docs/learn/server-concepts) in Spring Boot applications.
They enable seamless integration of MCP server capabilities with Spring Boot’s auto-configuration system.

The MCP Server Boot Starters offer:

- Automatic configuration of MCP server components, including tools, resources, and prompts
- Support for different MCP protocol versions, including STDIO, SSE, Streamable-HTTP, and stateless servers
- Support for both synchronous and asynchronous operation modes
- Multiple transport layer options
- Flexible tool, resource, and prompt specification
- Change notification capabilities
- [Annotation-based server development](mcp-annotations-server.md) with automatic bean scanning and registration

<a id="_mcp_server_boot_starters"></a>

## MCP Server Boot Starters

MCP Servers support multiple protocol and transport mechanisms.
Use the dedicated starter and the correct `spring.ai.mcp.server.protocol` property to configure your server:

<a id="_stdio"></a>

### STDIO

| Server Type | Dependency | Property |
| --- | --- | --- |
| [Standard Input/Output (STDIO)](mcp-stdio-sse-server-boot-starter-docs.md) | `spring-ai-starter-mcp-server` | `spring.ai.mcp.server.stdio=true` |

<a id="_webmvc"></a>

### WebMVC

|  |  |  |
| --- | --- | --- |
| Server Type | Dependency | Property |
| [SSE WebMVC](mcp-stdio-sse-server-boot-starter-docs.md#_sse_webmvc_serve) | `spring-ai-starter-mcp-server-webmvc` | `spring.ai.mcp.server.protocol=SSE` or empty |
| [Streamable-HTTP WebMVC](mcp-streamable-http-server-boot-starter-docs.md#_streamable_http_webmvc_server) | `spring-ai-starter-mcp-server-webmvc` | `spring.ai.mcp.server.protocol=STREAMABLE` |
| [Stateless WebMVC](mcp-stateless-server-boot-starter-docs.md#_stateless_webmvc_server) | `spring-ai-starter-mcp-server-webmvc` | `spring.ai.mcp.server.protocol=STATELESS` |

<a id="_webmvc_reactive"></a>

### WebMVC (Reactive)

|  |  |  |
| --- | --- | --- |
| Server Type | Dependency | Property |
| [SSE WebFlux](mcp-stdio-sse-server-boot-starter-docs.md#_sse_webflux_serve) | `spring-ai-starter-mcp-server-webflux` | `spring.ai.mcp.server.protocol=SSE` or empty |
| [Streamable-HTTP WebFlux](mcp-streamable-http-server-boot-starter-docs.md#_streamable_http_webflux_server) | `spring-ai-starter-mcp-server-webflux` | `spring.ai.mcp.server.protocol=STREAMABLE` |
| [Stateless WebFlux](mcp-stateless-server-boot-starter-docs.md#_stateless_webflux_server) | `spring-ai-starter-mcp-server-webflux` | `spring.ai.mcp.server.protocol=STATELESS` |

<a id="_server_capabilities"></a>

## Server Capabilities

Depending on the server and transport types, MCP Servers can support various capabilities, such as:

- **Tools** - Allows servers to expose tools that can be invoked by language models
- **Resources** - Provides a standardized way for servers to expose resources to clients
- **Prompts** - Provides a standardized way for servers to expose prompt templates to clients
- **Utility/Completions** - Provides a standardized way for servers to offer argument autocompletion suggestions for prompts and resource URIs
- **Utility/Logging** - Provides a standardized way for servers to send structured log messages to clients
- **Utility/Progress** - Optional progress tracking for long-running operations through notification messages
- **Utility/Ping** - Optional health check mechanism for the server to report its status

All capabilities are enabled by default. Disabling a capability will prevent the server from registering and exposing the corresponding features to clients.

<a id="_server_protocols"></a>

## Server Protocols

MCP provides several protocol types including:

- [**STDIO**](mcp-stdio-sse-server-boot-starter-docs.md) - In process (e.g. server runs inside the host application) protocol. Communication is over standard in and standard out. To enable the `STDIO` set `spring.ai.mcp.server.stdio=true`.
- [**SSE**](mcp-stdio-sse-server-boot-starter-docs.md#_sse_webmvc_server) - Server-sent events protocol for real-time updates. The server operates as an independent process that can handle multiple client connections.
- [**Streamable-HTTP**](mcp-streamable-http-server-boot-starter-docs.md) - The [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http) allows MCP servers to operate as independent processes that can handle multiple client connections using HTTP POST and GET requests, with optional Server-Sent Events (SSE) streaming for multiple server messages. It replaces the SSE transport. To enable the `STREAMABLE` protocol, set `spring.ai.mcp.server.protocol=STREAMABLE`.
- [**Stateless**](mcp-stateless-server-boot-starter-docs.md) - Stateless MCP servers are designed for simplified deployments where session state is not maintained between requests.
They are ideal for microservices architectures and cloud-native deployments. To enable the `STATELESS` protocol, set `spring.ai.mcp.server.protocol=STATELESS`.

<a id="_syncasync_server_api_options"></a>

## Sync/Async Server API Options

The MCP Server API supports imperative (i.e. synchronous) and reactive (e.g. asynchronous) programming models.

- **Synchronous Server** - The default server type implemented using `McpSyncServer`.
It is designed for straightforward request-response patterns in your applications.
To enable this server type, set `spring.ai.mcp.server.type=SYNC` in your configuration.
When activated, it automatically handles the configuration of synchronous tool specifications.

**NOTE:** The SYNC server will register only synchronous MCP annotated methods. Asynchronous methods will be ignored.

- **Asynchronous Server** - The asynchronous server implementation uses `McpAsyncServer` and is optimized for non-blocking operations.
To enable this server type, configure your application with `spring.ai.mcp.server.type=ASYNC`.
This server type automatically sets up asynchronous tool specifications with built-in Project Reactor support.

**NOTE:** The ASYNC server will register only asynchronous MCP annotated methods. Synchronous methods will be ignored.

<a id="_mcp_server_annotations"></a>

## MCP Server Annotations

The MCP Server Boot Starters provide comprehensive support for annotation-based server development, allowing you to create MCP servers using declarative Java annotations instead of manual configuration.

<a id="_key_annotations"></a>

### Key Annotations

- **[@McpTool](mcp-annotations-server.md#_mcptool)** - Mark methods as MCP tools with automatic JSON schema generation
- **[@McpResource](mcp-annotations-server.md#_mcpresource)** - Provide access to resources via URI templates
- **[@McpPrompt](mcp-annotations-server.md#_mcpprompt)** - Generate prompt messages for AI interactions
- **[@McpComplete](mcp-annotations-server.md#_mcpcomplete)** - Provide auto-completion functionality for prompts

<a id="_special_parameters"></a>

### Special Parameters

The annotation system supports [special parameter types](mcp-annotations-special-params.md) that provide additional context:

- **`McpMeta`** - Access metadata from MCP requests
- **`@McpProgressToken`** - Receive progress tokens for long-running operations
- **`McpSyncServerExchange`/`McpAsyncServerExchange`** - Full server context for advanced operations
- **`McpTransportContext`** - Lightweight context for stateless operations
- **`CallToolRequest`** - Dynamic schema support for flexible tools

<a id="_simple_example"></a>

### Simple Example

```java
@Component
public class CalculatorTools {

    @McpTool(name = "add", description = "Add two numbers together")
    public int add(
            @McpToolParam(description = "First number", required = true) int a,
            @McpToolParam(description = "Second number", required = true) int b) {
        return a + b;
    }

    @McpResource(uri = "config://{key}", name = "Configuration")
    public String getConfig(String key) {
        return configData.get(key);
    }
}
```

<a id="_auto_configuration"></a>

### Auto-Configuration

With Spring Boot auto-configuration, annotated beans are automatically detected and registered:

```java
@SpringBootApplication
public class McpServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(McpServerApplication.class, args);
    }
}
```

The auto-configuration will:

1. Scan for beans with MCP annotations
1. Create appropriate specifications
1. Register them with the MCP server
1. Handle both sync and async implementations based on configuration

<a id="_configuration_properties"></a>

### Configuration Properties

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

### Additional Resources

- [Server Annotations Reference](mcp-annotations-server.md) - Complete guide to server annotations
- [Special Parameters](mcp-annotations-special-params.md) - Advanced parameter injection
- [Examples](mcp-annotations-examples.md) - Comprehensive examples and use cases

<a id="_example_applications"></a>

## Example Applications

- [Weather Server (SSE WebFlux)](https://github.com/spring-projects/spring-ai-examples/tree/main/model-context-protocol/weather/starter-webflux-server) - Spring AI MCP Server Boot Starter with WebFlux transport
- [Weather Server (STDIO)](https://github.com/spring-projects/spring-ai-examples/tree/main/model-context-protocol/weather/starter-stdio-server) - Spring AI MCP Server Boot Starter with STDIO transport
- [Weather Server Manual Configuration](https://github.com/spring-projects/spring-ai-examples/tree/main/model-context-protocol/weather/manual-webflux-server) - Spring AI MCP Server Boot Starter that doesn’t use auto-configuration but uses the Java SDK to configure the server manually
- Streamable-HTTP WebFlux/WebMVC Example - TODO
- Stateless WebFlux/WebMVC Example - TODO

<a id="_additional_resources_2"></a>

## Additional Resources

- [MCP Server Annotations](mcp-annotations-server.md) - Declarative server development with annotations
- [Special Parameters](mcp-annotations-special-params.md) - Advanced parameter injection and context access
- [MCP Annotations Examples](mcp-annotations-examples.md) - Comprehensive examples and use cases
- [Spring AI Documentation](https://docs.spring.io/spring-ai/reference/)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/specification)
- [Spring Boot Auto-configuration](https://docs.spring.io/spring-boot/docs/current/reference/html/features.html#features.developing-auto-configuration)
