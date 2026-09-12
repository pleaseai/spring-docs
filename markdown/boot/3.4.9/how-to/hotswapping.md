---
title: "Hot Swapping"
source: "how-to:hotswapping.adoc"
---

<a id="howto.hotswapping"></a>

# Hot Swapping

Spring Boot supports hot swapping.
This section answers questions about how it works.

<a id="howto.hotswapping.reload-static-content"></a>

## Reload Static Content

There are several options for hot reloading.
The recommended approach is to use [`spring-boot-devtools`](../reference/using/devtools.md), as it provides additional development-time features, such as support for fast application restarts and LiveReload as well as sensible development-time configuration (such as template caching).
Devtools works by monitoring the classpath for changes.
This means that static resource changes must be "built" for the change to take effect.
By default, this happens automatically in Eclipse when you save your changes.
In IntelliJ IDEA, the Make Project command triggers the necessary build.
Due to the [default restart exclusions](../reference/using/devtools.md#using.devtools.restart.excluding-resources), changes to static resources do not trigger a restart of your application.
They do, however, trigger a live reload.

Alternatively, running in an IDE (especially with debugging on) is a good way to do development (all modern IDEs allow reloading of static resources and usually also allow hot-swapping of Java class changes).

Finally, the [Maven and Gradle plugins](../build-tool-plugin/index.md) can be configured (see the `addResources` property) to support running from the command line with reloading of static files directly from source.
You can use that with an external css/js compiler process if you are writing that code with higher-level tools.

<a id="howto.hotswapping.reload-templates"></a>

## Reload Templates without Restarting the Container

Most of the templating technologies supported by Spring Boot include a configuration option to disable caching (described later in this document).
If you use the `spring-boot-devtools` module, these properties are [automatically configured](../reference/using/devtools.md#using.devtools.property-defaults) for you at development time.

<a id="howto.hotswapping.reload-templates.thymeleaf"></a>

### Thymeleaf Templates

If you use Thymeleaf, set `spring.thymeleaf.cache` to `false`.
See [`ThymeleafAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.9/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/thymeleaf/ThymeleafAutoConfiguration.java) for other Thymeleaf customization options.

<a id="howto.hotswapping.reload-templates.freemarker"></a>

### FreeMarker Templates

If you use FreeMarker, set `spring.freemarker.cache` to `false`.
See [`FreeMarkerAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.9/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/freemarker/FreeMarkerAutoConfiguration.java) for other FreeMarker customization options.

> [!NOTE]
> Template caching for FreeMarker is not supported with WebFlux.

<a id="howto.hotswapping.reload-templates.groovy"></a>

### Groovy Templates

If you use Groovy templates, set `spring.groovy.template.cache` to `false`.
See [`GroovyTemplateAutoConfiguration`](https://github.com/spring-projects/spring-boot/tree/v3.4.9/spring-boot-project/spring-boot-autoconfigure/src/main/java/org/springframework/boot/autoconfigure/groovy/template/GroovyTemplateAutoConfiguration.java) for other Groovy customization options.

<a id="howto.hotswapping.fast-application-restarts"></a>

## Fast Application Restarts

The `spring-boot-devtools` module includes support for automatic application restarts.
While not as fast as technologies such as [JRebel](https://www.jrebel.com/products/jrebel) it is usually significantly faster than a “cold start”.
You should probably give it a try before investigating some of the more complex reload options discussed later in this document.

For more details, see the [reference:using/devtools.adoc](../reference/using/devtools.md) section.

<a id="howto.hotswapping.reload-java-classes-without-restarting"></a>

## Reload Java Classes without Restarting the Container

Many modern IDEs (Eclipse, IDEA, and others) support hot swapping of bytecode.
Consequently, if you make a change that does not affect class or method signatures, it should reload cleanly with no side effects.
