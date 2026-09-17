---
title: "Model Context Protocol (MCP)"
source: "ROOT:api/mcp/mcp-overview.adoc"
---

# Model Context Protocol (MCP)

> [!TIP]
> **New to MCP?** Start with our [Getting Started with MCP](../../guides/getting-started-mcp.md) guide for a quick introduction and hands-on examples.

The [Model Context Protocol](https://modelcontextprotocol.org/docs/concepts/architecture) (MCP) is a standardized protocol that enables AI models to interact with external tools and resources in a structured way.
Think of it as a bridge between your AI models and the real world - allowing them to access databases, APIs, file systems, and other external services through a consistent interface.
It supports multiple transport mechanisms to provide flexibility across different environments.

The [MCP Java SDK](https://modelcontextprotocol.io/sdk/java/mcp-overview) provides a Java implementation of the Model Context Protocol, enabling standardized interaction with AI models and tools through both synchronous and asynchronous communication patterns.

Spring AI embraces MCP with comprehensive support through dedicated Boot Starters and MCP Java Annotations, making it easier than ever to build sophisticated AI-powered applications that can seamlessly connect to external systems.
This means Spring developers can participate in both sides of the MCP ecosystem - building AI applications that consume MCP servers and creating MCP servers that expose Spring-based services to the wider AI community.
Bootstrap your AI applications with MCP support using [Spring Initializer](https://start.spring.io).

<a id="_mcp_java_sdk_architecture"></a>

## MCP Java SDK Architecture

> [!TIP]
> This section provides an overview for the [MCP Java SDK architecture](https://modelcontextprotocol.io/sdk/java/mcp-overview).
> For the Spring AI MCP integration, refer to the [Spring AI MCP Boot Starters](#_spring_ai_mcp_integration) documentation.

The Java MCP implementation follows a three-layer architecture that separates concerns for maintainability and flexibility:

#### MCP Stack Architecture

![MCP Stack Architecture](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.7/spring-ai-docs/src/main/antora/modules/ROOT/images/mcp/mcp-stack.svg)

<a id="_clientserver_layer_top"></a>

### Client/Server Layer (Top)

The top layer handles the main application logic and protocol operations:

- **McpClient** - Manages client-side operations and server connections
- **McpServer** - Handles server-side protocol operations and client requests
- Both components utilize the session layer below for communication management

<a id="_session_layer_middle"></a>

### Session Layer (Middle)

The middle layer manages communication patterns and maintains connection state:

- **McpSession** - Core session management interface
- **McpClientSession** - Client-specific session implementation
- **McpServerSession** - Server-specific session implementation

<a id="_transport_layer_bottom"></a>

### Transport Layer (Bottom)

The bottom layer handles the actual message transport and serialization:

- **McpTransport** - Manages JSON-RPC message serialization and deserialization
- Supports multiple transport implementations (STDIO, HTTP/SSE, Streamable-HTTP, etc.)
- Provides the foundation for all higher-level communication

| [MCP Client](https://modelcontextprotocol.io/sdk/java/mcp-client) |  |
| --- | --- |
| The MCP Client is a key component in the Model Context Protocol (MCP) architecture, responsible for establishing and managing connections with MCP servers. It implements the client-side of the protocol, handling: - Protocol version negotiation to ensure compatibility with servers - Capability negotiation to determine available features - Message transport and JSON-RPC communication - Tool discovery and execution - Resource access and management - Prompt system interactions - Optional features: - Roots management - Sampling support - Synchronous and asynchronous operations - Transport options: - Stdio-based transport for process-based communication - Java HttpClient-based SSE client transport - WebFlux SSE client transport for reactive HTTP streaming | ![Java MCP Client Architecture](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.7/spring-ai-docs/src/main/antora/modules/ROOT/images/mcp/java-mcp-client-architecture.jpg) |

| [MCP Server](https://modelcontextprotocol.io/sdk/java/mcp-server) |  |
| --- | --- |
| The MCP Server is a foundational component in the Model Context Protocol (MCP) architecture that provides tools, resources, and capabilities to clients. It implements the server-side of the protocol, responsible for: - Server-side protocol operations implementation - Tool exposure and discovery - Resource management with URI-based access - Prompt template provision and handling - Capability negotiation with clients - Structured logging and notifications - Concurrent client connection management - Synchronous and Asynchronous API support - Transport implementations: - Stdio, Streamable-HTTP, Stateless Streamable-HTTP, SSE | ![Java MCP Server Architecture](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.7/spring-ai-docs/src/main/antora/modules/ROOT/images/mcp/java-mcp-server-architecture.jpg) |

For detailed implementation guidance, using the low-level MCP Client/Server APIs, refer to the [MCP Java SDK documentation](https://modelcontextprotocol.io/sdk/java/mcp-overview).
For simplified setup using Spring Boot, use the MCP Boot Starters described below.

<a id="_spring_ai_mcp_integration"></a>

## Spring AI MCP Integration

Spring AI provides MCP integration through the following Spring Boot starters:

<a id="_client_starters"></a>

### [Client Starters](mcp-client-boot-starter-docs.html)

- `spring-ai-starter-mcp-client` - Core starter providing `STDIO`, Servlet-based `Streamable-HTTP`, `Stateless Streamable-HTTP` and `SSE` support
- `spring-ai-starter-mcp-client-webflux` - WebFlux-based  `Streamable-HTTP`, `Stateless Streamable-HTTP` and `SSE` transport implementation

<a id="_server_starters"></a>

### [Server Starters](mcp-server-boot-starter-docs.html)

<a id="_stdio"></a>

#### STDIO

| Server Type | Dependency | Property |
| --- | --- | --- |
| [Standard Input/Output (STDIO)](mcp-stdio-sse-server-boot-starter-docs.md) | `spring-ai-starter-mcp-server` | `spring.ai.mcp.server.stdio=true` |

<a id="_webmvc"></a>

#### WebMVC

|  |  |  |
| --- | --- | --- |
| Server Type | Dependency | Property |
| [SSE WebMVC](mcp-stdio-sse-server-boot-starter-docs.md#_sse_webmvc_server) | `spring-ai-starter-mcp-server-webmvc` | `spring.ai.mcp.server.protocol=SSE` or empty |
| [Streamable-HTTP WebMVC](mcp-streamable-http-server-boot-starter-docs.md#_streamable_http_webmvc_server) | `spring-ai-starter-mcp-server-webmvc` | `spring.ai.mcp.server.protocol=STREAMABLE` |
| [Stateless Streamable-HTTP WebMVC](mcp-stateless-server-boot-starter-docs.md#_stateless_webmvc_server) | `spring-ai-starter-mcp-server-webmvc` | `spring.ai.mcp.server.protocol=STATELESS` |

<a id="_webflux_reactive"></a>

#### WebFlux (Reactive)

|  |  |  |
| --- | --- | --- |
| Server Type | Dependency | Property |
| [SSE WebFlux](mcp-stdio-sse-server-boot-starter-docs.md#_sse_webflux_server) | `spring-ai-starter-mcp-server-webflux` | `spring.ai.mcp.server.protocol=SSE` or empty |
| [Streamable-HTTP WebFlux](mcp-streamable-http-server-boot-starter-docs.md#_streamable_http_webflux_server) | `spring-ai-starter-mcp-server-webflux` | `spring.ai.mcp.server.protocol=STREAMABLE` |
| [Stateless Streamable-HTTP WebFlux](mcp-stateless-server-boot-starter-docs.md#_stateless_webflux_server) | `spring-ai-starter-mcp-server-webflux` | `spring.ai.mcp.server.protocol=STATELESS` |

<a id="_spring_ai_mcp_annotations"></a>

## [Spring AI MCP Annotations](mcp-annotations-overview.md)

In addition to the programmatic MCP client & server configuration, Spring AI provides annotation-based method handling for MCP servers and clients through the [MCP Annotations](mcp-annotations-overview.md) module.
This approach simplifies the creation and registration of MCP operations using a clean, declarative programming model with Java annotations.

The MCP Annotations module enables developers to:

- Create MCP tools, resources, and prompts using simple annotations
- Handle client-side notifications and requests declaratively
- Reduce boilerplate code and improve maintainability
- Automatically generate JSON schemas for tool parameters
- Access special parameters and context information

Key features include:

- [Server Annotations](mcp-annotations-server.md): `@McpTool`, `@McpResource`, `@McpPrompt`, `@McpComplete`
- [Client Annotations](mcp-annotations-client.md): `@McpLogging`, `@McpSampling`, `@McpElicitation`, `@McpProgress`
- [Special Parameters](mcp-annotations-special-params.md): `McpSyncServerExchange`, `McpAsyncServerExchange`, `McpTransportContext`, `McpMeta`
- **Automatic Discovery**: Annotation scanning with configurable package inclusion/exclusion
- **Spring Boot Integration**: Seamless integration with MCP Boot Starters

<a id="_additional_resources"></a>

## Additional Resources

- [MCP Annotations Documentation](mcp-annotations-overview.md)
- [MCP Client Boot Starters Documentation](mcp-client-boot-starter-docs.html)
- [MCP Server Boot Starters Documentation](mcp-server-boot-starter-docs.html)
- [MCP Utilities Documentation](mcp-helpers.html)
- [Model Context Protocol Specification](https://modelcontextprotocol.github.io/specification/)
