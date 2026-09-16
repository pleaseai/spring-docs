---
title: "Jackson Support"
source: "ROOT:features/integrations/jackson.adoc"
---

<a id="jackson"></a>

# Jackson Support

Spring Security provides Jackson support for persisting Spring Security related classes.
This can improve the performance of serializing Spring Security related classes when working with distributed sessions (i.e. session replication, Spring Session, etc).

To use it, register the `SecurityJackson2Modules.getModules(ClassLoader)` with `ObjectMapper` ([jackson-databind](https://github.com/FasterXML/jackson-databind)):

#### Java

```java
ObjectMapper mapper = new ObjectMapper();
ClassLoader loader = getClass().getClassLoader();
List<Module> modules = SecurityJackson2Modules.getModules(loader);
mapper.registerModules(modules);

// ... use ObjectMapper as normally ...
SecurityContext context = new SecurityContextImpl();
// ...
String json = mapper.writeValueAsString(context);
```

#### Kotlin

```kotlin
val mapper = ObjectMapper()
val loader = javaClass.classLoader
val modules: MutableList<Module> = SecurityJackson2Modules.getModules(loader)
mapper.registerModules(modules)

// ... use ObjectMapper as normally ...
val context: SecurityContext = SecurityContextImpl()
// ...
val json: String = mapper.writeValueAsString(context)
```

> [!NOTE]
> The following Spring Security modules provide Jackson support:
>
> - spring-security-core (`CoreJackson2Module`)
> - spring-security-web (`WebJackson2Module`, `WebServletJackson2Module`, `WebServerJackson2Module`)
> - [ spring-security-oauth2-client](../../servlet/oauth2/client/index.md#oauth2client) (`OAuth2ClientJackson2Module`)
> - spring-security-cas (`CasJackson2Module`)
