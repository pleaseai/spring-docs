---
title: "Web MVC Config"
source: "ROOT:web/webmvc/mvc-servlet/config.adoc"
---

<a id="mvc-servlet-config"></a>

# Web MVC Config

[See equivalent in the Reactive stack](../../webflux/dispatcher-handler.md#webflux-framework-config)

Applications can declare the infrastructure beans listed in [Special Bean Types](special-bean-types.md)
that are required to process requests. The `DispatcherServlet` checks the
`WebApplicationContext` for each special bean. If there are no matching bean types,
it falls back on the default types listed in
[`DispatcherServlet.properties`](https://github.com/spring-projects/spring-framework/tree/7.0.x/spring-webmvc/src/main/resources/org/springframework/web/servlet/DispatcherServlet.properties).

In most cases, the [MVC Config](../mvc-config.md) is the best starting point. It declares the required
beans in either Java or XML and provides a higher-level configuration callback API to
customize it.

> [!NOTE]
> Spring Boot relies on the MVC Java configuration to configure Spring MVC and
> provides many extra convenient options.
