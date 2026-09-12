---
title: "Deprecated Application Properties"
source: "appendix:deprecated-application-properties/index.adoc"
---

<a id="appendix.deprecated-application-properties"></a>

# Deprecated Application Properties

The following deprecated properties can be specified inside your `application.properties` file, inside your `application.yaml` file, or as command line switches.
Support for these properties will be removed in a future release and should you should migrate away from them.

> [!TIP]
> Spring Boot includes a useful `spring-boot-properties-migrator` tool to help you migrate away from deprecated properties.
> To use the property migrator tool, add the following dependency to your project:
>
> #### Maven
>
> ```xml
> <dependency>
> 	<groupId>org.springframework.boot</groupId>
> 	<artifactId>spring-boot-properties-migrator</artifactId>
> 	<scope>runtime</scope>
> </dependency>
> ```
>
> #### Gradle
>
> ```gradle
> runtimeOnly("org.springframework.boot:spring-boot-properties-migrator")
> ```
>
> Once added as a dependency to your project, the tool will not only analyze your application’s environment and print diagnostics at startup, but also temporarily migrate properties at runtime for you.
>
> Remember to remove the dependency when your migration is complete.

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/actuator.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/cache.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/core.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/data-migration.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/data.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/devtools.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/docker-compose.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/integration.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/json.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/mail.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/rsocket.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/security.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/server.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/templating.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/testcontainers.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/testing.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/transaction.adoc\[\]

Unresolved include directive in modules/appendix/pages/deprecated-application-properties/index.adoc - include::partial$deprecated-configuration-properties/web.adoc\[\]
