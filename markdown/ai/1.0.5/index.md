---
title: "Introduction"
source: "ROOT:index.adoc"
---

<a id="introduction"></a>

# Introduction

![Integration Problem](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.0.5/spring-ai-docs/src/main/antora/modules/ROOT/images/spring_ai_logo_with_text.svg)

The `Spring AI` project aims to streamline the development of applications that incorporate artificial intelligence functionality without unnecessary complexity.

The project draws inspiration from notable Python projects, such as LangChain and LlamaIndex, but Spring AI is not a direct port of those projects.
The project was founded with the belief that the next wave of Generative AI applications will not be only for Python developers but will be ubiquitous across many programming languages.

> [!NOTE]
> Spring AI addresses the fundamental challenge of AI integration: `Connecting your enterprise Data and APIs with AI Models`.

![Interactive](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.0.5/spring-ai-docs/src/main/antora/modules/ROOT/images/spring-ai-integration-diagram-3.svg)

Spring AI provides abstractions that serve as the foundation for developing AI applications.
These abstractions have multiple implementations, enabling easy component swapping with minimal code changes.

Spring AI provides the following features:

- Portable API support across AI providers for Chat, text-to-image, and Embedding models. Both synchronous and streaming API options are supported. Access to model-specific features is also available.
- Support for all major [AI Model providers](api/index.md) such as Anthropic, OpenAI, Microsoft, Amazon, Google, and Ollama. Supported model types include:

  - [Chat Completion](api/chatmodel.md)
  - [Embedding](api/embeddings.md)
  - [Text to Image](api/imageclient.md)
  - [Audio Transcription](api/audio/transcriptions.md)
  - [Text to Speech](api/audio/speech.md)
  - [Moderation](#api/moderation)
- [Structured Outputs](api/structured-output-converter.md) - Mapping of AI Model output to POJOs.
- Support for all major [Vector Database providers](api/vectordbs.md) such as Apache Cassandra, Azure Cosmos DB, Azure Vector Search, Chroma, Elasticsearch, GemFire, MariaDB, Milvus, MongoDB Atlas, Neo4j, OpenSearch, Oracle, PostgreSQL/PGVector, PineCone, Qdrant, Redis, SAP Hana, Typesense and Weaviate.
- Portable API across Vector Store providers, including a novel SQL-like metadata filter API.
- [Tools/Function Calling](api/tools.md) - Permits the model to request the execution of client-side tools and functions, thereby accessing necessary real-time information as required and taking action.
- [Observability](observability/index.md) - Provides insights into AI-related operations.
- Document ingestion [ETL framework](api/etl-pipeline.md) for Data Engineering.
- [AI Model Evaluation](api/testing.md) - Utilities to help evaluate generated content and protect against hallucinated response.
- Spring Boot Auto Configuration and Starters for AI Models and Vector Stores.
- [ChatClient API](api/chatclient.md) - Fluent API for communicating with AI Chat Models, idiomatically similar to the WebClient and RestClient APIs.
- [Advisors API](api/advisors.md) - Encapsulates recurring Generative AI patterns, transforms data sent to and from Language Models (LLMs), and provides portability across various models and use cases.
- Support for [Chat Conversation Memory](api/chatclient.md#_chat_memory) and [Retrieval Augmented Generation (RAG)](api/chatclient.md#_retrieval_augmented_generation).

This feature set lets you implement common use cases, such as “Q&A over your documentation” or “Chat with your documentation.”

The [concepts section](concepts.md) provides a high-level overview of AI concepts and their representation in Spring AI.

The [Getting Started](getting-started.md) section shows you how to create your first AI application.
Subsequent sections delve into each component and common use cases with a code-focused approach.
