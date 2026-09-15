---
title: "Advanced Java Config"
source: "ROOT:web/webmvc/mvc-config/advanced-java.adoc"
---

<a id="mvc-config-advanced-java"></a>

# Advanced Java Config

[See equivalent in the Reactive stack](../../webflux/config.md#webflux-config-advanced-java)

`@EnableWebMvc` imports `DelegatingWebMvcConfiguration`, which:

- Provides default Spring configuration for Spring MVC applications
- Detects and delegates to `WebMvcConfigurer` implementations to customize that configuration.

For advanced mode, you can remove `@EnableWebMvc` and extend directly from
`DelegatingWebMvcConfiguration` instead of implementing `WebMvcConfigurer`,
as the following example shows:

#### Java

```java
@Configuration
public class WebConfiguration extends DelegatingWebMvcConfiguration {

	// ...
}
```

#### Kotlin

```kotlin
@Configuration
class WebConfiguration : DelegatingWebMvcConfiguration() {

	// ...
}
```

You can keep existing methods in `WebConfig`, but you can now also override bean declarations
from the base class, and you can still have any number of other `WebMvcConfigurer` implementations on
the classpath.
