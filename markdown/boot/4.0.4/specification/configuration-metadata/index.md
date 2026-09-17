---
title: "Configuration Metadata"
source: "specification:configuration-metadata/index.adoc"
---

<a id="appendix.configuration-metadata"></a>

# Configuration Metadata

Spring Boot jars include metadata files that provide details of all supported configuration properties.
The files are designed to let IDE developers offer contextual help and “code completion” as users are working with `application.properties` or `application.yaml` files.

The majority of the metadata file is generated automatically at compile time by processing all items annotated with [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/4.0.4/api/java/org/springframework/boot/context/properties/ConfigurationProperties.html).
For corner cases or more advanced use cases, it is possible to [source the metadata of external types ](annotation-processor.md#appendix.configuration-metadata.annotation-processor.automatic-metadata-generation.source) or [write part of the metadata manually](annotation-processor.md#appendix.configuration-metadata.annotation-processor.adding-additional-metadata).
