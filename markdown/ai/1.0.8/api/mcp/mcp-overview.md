---
title: "Model Context Protocol (MCP)"
source: "ROOT:api/mcp/mcp-overview.adoc"
---

# Model Context Protocol (MCP)

The [Model Context Protocol](https://modelcontextprotocol.org/docs/concepts/architecture) (MCP) is a standardized protocol that enables AI models to interact with external tools and resources in a structured way.
It supports multiple transport mechanisms to provide flexibility across different environments.

The [MCP Java SDK](https://modelcontextprotocol.io/sdk/java) provides a Java implementation of the Model Context Protocol, enabling standardized interaction with AI models and tools through both synchronous and asynchronous communication patterns.

`Spring AI MCP` extends the MCP Java SDK with Spring Boot integration, providing both [client](mcp-client-boot-starter-docs.md) and [server](mcp-server-boot-starter-docs.md) starters.
Bootstrap your AI applications with MCP support using [Spring Initializer](https://start.spring.io).

> [!NOTE]
> Breaking Changes in MCP Java SDK 0.8.0 ⚠️
>
> MCP Java SDK version 0.8.0 introduces several breaking changes including a new session-based architecture. If you’re upgrading from Java SDK 0.7.0, please refer to the [Migration Guide](https://github.com/modelcontextprotocol/java-sdk/blob/main/migration-0.8.0.md) for detailed instructions.

<a id="_mcp_java_sdk_architecture"></a>

## MCP Java SDK Architecture

> [!TIP]
> This section provides an overview for the [MCP Java SDK architecture](https://modelcontextprotocol.io/sdk/java).
> For the Spring AI MCP integration, refer to the [Spring AI MCP Boot Starters](#_spring_ai_mcp_integration) documentation.

The Java MCP implementation follows a three-layer architecture:

|  |  |
| --- | --- |
|  |  |
| ![MCP Stack Architecture](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.0.8/spring-ai-docs/src/main/antora/modules/ROOT/images/mcp/mcp-stack.svg) | - **Client/Server Layer**: The McpClient handles client-side operations while the McpServer manages server-side protocol operations. Both utilize McpSession for communication management. - **Session Layer (McpSession)**: Manages communication patterns and state through the McpClientSession and McpServerSession implementations. - **Transport Layer (McpTransport)**: Handles JSON-RPC message serialization and deserialization with support for multiple transport implementations. |

| [MCP Client](https://modelcontextprotocol.io/sdk/java/mcp-client) |  |
| --- | --- |
| The MCP Client is a key component in the Model Context Protocol (MCP) architecture, responsible for establishing and managing connections with MCP servers. It implements the client-side of the protocol, handling: - Protocol version negotiation to ensure compatibility with servers - Capability negotiation to determine available features - Message transport and JSON-RPC communication - Tool discovery and execution - Resource access and management - Prompt system interactions - Optional features: - Roots management - Sampling support - Synchronous and asynchronous operations - Transport options: - Stdio-based transport for process-based communication - Java HttpClient-based SSE client transport - WebFlux SSE client transport for reactive HTTP streaming | ![Java MCP Client Architecture](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.0.8/spring-ai-docs/src/main/antora/modules/ROOT/images/mcp/java-mcp-client-architecture.jpg) |

| [MCP Server](https://modelcontextprotocol.io/sdk/java/mcp-server) |  |
| --- | --- |
| The MCP Server is a foundational component in the Model Context Protocol (MCP) architecture that provides tools, resources, and capabilities to clients. It implements the server-side of the protocol, responsible for: - Server-side protocol operations implementation - Tool exposure and discovery - Resource management with URI-based access - Prompt template provision and handling - Capability negotiation with clients - Structured logging and notifications - Concurrent client connection management - Synchronous and Asynchronous API support - Transport implementations: - Stdio-based transport for process-based communication - Servlet-based SSE server transport - WebFlux SSE server transport for reactive HTTP streaming - WebMVC SSE server transport for servlet-based HTTP streaming | ![Java MCP Server Architecture](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.0.8/spring-ai-docs/src/main/antora/modules/ROOT/images/mcp/java-mcp-server-architecture.jpg) |

For detailed implementation guidance, using the low-level MCP Client/Server APIs, refer to the [MCP Java SDK documentation](https://modelcontextprotocol.io/sdk/java).
For simplified setup using Spring Boot, use the MCP Boot Starters described below.

<a id="_spring_ai_mcp_integration"></a>

## Spring AI MCP Integration

Spring AI provides MCP integration through the following Spring Boot starters:

<a id="_client_starters"></a>

### [Client Starters](mcp-client-boot-starter-docs.html)

- `spring-ai-starter-mcp-client` - Core starter providing STDIO and HTTP-based SSE support
- `spring-ai-starter-mcp-client-webflux` - WebFlux-based SSE transport implementation

<a id="_server_starters"></a>

### [Server Starters](mcp-server-boot-starter-docs.html)

- `spring-ai-starter-mcp-server` - Core server with STDIO transport support
- `spring-ai-starter-mcp-server-webmvc` - Spring MVC-based SSE transport implementation
- `spring-ai-starter-mcp-server-webflux` - WebFlux-based SSE transport implementation

<a id="_additional_resources"></a>

## Additional Resources

- [MCP Client Boot Starters Documentation](mcp-client-boot-starter-docs.html)
- [MCP Server Boot Starters Documentation](mcp-server-boot-starter-docs.html)
- [MCP Utilities Documentation](mcp-helpers.html)
- [Model Context Protocol Specification](https://modelcontextprotocol.github.io/specification/)
