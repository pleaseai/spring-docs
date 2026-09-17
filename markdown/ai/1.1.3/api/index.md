---
title: "Spring AI API"
source: "ROOT:api/index.adoc"
---

# Spring AI API

<a id="_introduction"></a>

## Introduction

The Spring AI API covers a wide range of functionalities.
Each major feature is detailed in its own dedicated section.
To provide an overview, the following key functionalities are available:

<a id="_ai_model_api"></a>

### AI Model API

Portable `Model API` across AI providers for `Chat`, `Text to Image`, `Audio Transcription`, `Text to Speech`, and `Embedding` models.
Both `synchronous` and `stream` API options are supported.
Dropping down to access model specific features is also supported.

![Model hierarchy](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.3/spring-ai-docs/src/main/antora/modules/ROOT/images/model-hierarchy.jpg)

With support for AI Models from OpenAI, Microsoft, Amazon, Google, Amazon Bedrock, Hugging Face and more.

![spring ai chat completions clients](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.3/spring-ai-docs/src/main/antora/modules/ROOT/images/spring-ai-chat-completions-clients.jpg)

<a id="_vector_store_api"></a>

### Vector Store API

Portable `Vector Store API` across multiple providers, including a novel `SQL-like metadata filter API` that is also portable. Support for 14 vector databases are available.

<a id="_tool_calling_api"></a>

### Tool Calling API

Spring AI makes it easy to have the AI model invoke your services as `@Tool`-annotated methods or POJO `java.util.Function` objects.

![The main sequence of actions for tool calling](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.3/spring-ai-docs/src/main/antora/modules/ROOT/images/tools/tool-calling-01.jpg)

Check the Spring AI [Tool Calling](tools.md) documentation.

<a id="_auto_configuration"></a>

### Auto Configuration

Spring Boot Auto Configuration and Starters for AI Models and Vector Stores.

<a id="_etl_data_engineering"></a>

### ETL Data Engineering

ETL framework for Data Engineering.  This provides the basis of loading data into a vector database, helping implement the Retrieval Augmented Generation pattern that enables you to bring your data to the AI model to incorporate into its response.

![etl pipeline](https://raw.githubusercontent.com/spring-projects/spring-ai/v1.1.3/spring-ai-docs/src/main/antora/modules/ROOT/images/etl-pipeline.jpg)

<a id="_feedback_and_contributions"></a>

## Feedback and Contributions

The project’s [GitHub discussions](https://github.com/spring-projects/spring-ai/discussions) is a great place to send feedback.
