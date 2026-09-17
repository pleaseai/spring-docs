---
title: "Accessing the Native Client"
source: "ROOT:api/vectordbs/coherence.adoc"
---

# Accessing the Native Client

<a id="_accessing_the_native_client"></a>

## Accessing the Native Client

The Coherence Vector Store implementation provides access to the underlying native Coherence client (`Session`) through the `getNativeClient()` method:

```java
CoherenceVectorStore vectorStore = context.getBean(CoherenceVectorStore.class);
Optional<Session> nativeClient = vectorStore.getNativeClient();

if (nativeClient.isPresent()) {
    Session session = nativeClient.get();
    // Use the native client for Coherence-specific operations
}
```

The native client gives you access to Coherence-specific features and operations that might not be exposed through the `VectorStore` interface.
