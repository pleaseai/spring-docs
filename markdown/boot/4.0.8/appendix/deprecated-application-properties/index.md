---
title: "Deprecated Application Properties"
source: "appendix:deprecated-application-properties/index.adoc"
---

<a id="appendix.deprecated-application-properties"></a>

# Deprecated Application Properties

The following deprecated properties can be specified inside your `application.properties` file, inside your `application.yaml` file, or as command line switches.
Support for these properties will be removed in a future release and you should migrate away from them.

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

<a id="appendix.deprecated-application-properties.actuator"></a>

## Deprecated Actuator Properties

| Name | Description | Default Value |
| --- | --- | --- |
| <a id="application-properties.actuator.management.endpoints.enabled-by-default"></a>[`management.endpoints.enabled-by-default`](#application-properties.actuator.management.endpoints.enabled-by-default) | Replaced by [`management.endpoints.access.default`](../application-properties/index.md#application-properties.actuator.management.endpoints.access.default) |  |
| <a id="application-properties.actuator.management.endpoints.jackson2.isolated-object-mapper"></a>[`management.endpoints.jackson2.isolated-object-mapper`](#application-properties.actuator.management.endpoints.jackson2.isolated-object-mapper) | Jackson 3 is preferred. | `true` |

<a id="appendix.deprecated-application-properties.core"></a>

## Deprecated Core Properties

| Name | Description | Default Value |
| --- | --- | --- |
| <a id="application-properties.core.logging.file.clean-history-on-start"></a>[`logging.file.clean-history-on-start`](#application-properties.core.logging.file.clean-history-on-start) | Replaced by [`logging.logback.rollingpolicy.clean-history-on-start`](../application-properties/index.md#application-properties.core.logging.logback.rollingpolicy.clean-history-on-start) | `false` |
| <a id="application-properties.core.logging.file.max-history"></a>[`logging.file.max-history`](#application-properties.core.logging.file.max-history) | Replaced by [`logging.logback.rollingpolicy.max-history`](../application-properties/index.md#application-properties.core.logging.logback.rollingpolicy.max-history) | `7` |
| <a id="application-properties.core.logging.file.max-size"></a>[`logging.file.max-size`](#application-properties.core.logging.file.max-size) | Replaced by [`logging.logback.rollingpolicy.max-file-size`](../application-properties/index.md#application-properties.core.logging.logback.rollingpolicy.max-file-size) | `10MB` |
| <a id="application-properties.core.logging.file.total-size-cap"></a>[`logging.file.total-size-cap`](#application-properties.core.logging.file.total-size-cap) | Replaced by [`logging.logback.rollingpolicy.total-size-cap`](../application-properties/index.md#application-properties.core.logging.logback.rollingpolicy.total-size-cap) | `0B` |
| <a id="application-properties.core.logging.pattern.rolling-file-name"></a>[`logging.pattern.rolling-file-name`](#application-properties.core.logging.pattern.rolling-file-name) | Replaced by [`logging.logback.rollingpolicy.file-name-pattern`](../application-properties/index.md#application-properties.core.logging.logback.rollingpolicy.file-name-pattern) | `${LOG_FILE}.%d{yyyy-MM-dd}.%i.gz` |
| <a id="application-properties.core.spring.main.show-banner"></a>[`spring.main.show-banner`](#application-properties.core.spring.main.show-banner) | Replaced by [`spring.main.banner-mode`](../application-properties/index.md#application-properties.core.spring.main.banner-mode) | `true` |
| <a id="application-properties.core.spring.main.web-environment"></a>[`spring.main.web-environment`](#application-properties.core.spring.main.web-environment) | Replaced by [`spring.main.web-application-type`](../application-properties/index.md#application-properties.core.spring.main.web-application-type) |  |
| <a id="application-properties.core.spring.reactor.stacktrace-mode.enabled"></a>[`spring.reactor.stacktrace-mode.enabled`](#application-properties.core.spring.reactor.stacktrace-mode.enabled) | Replaced by [`spring.reactor.debug-agent.enabled`](../application-properties/index.md#application-properties.core.spring.reactor.debug-agent.enabled) | `false` |

<a id="appendix.deprecated-application-properties.data-migration"></a>

## Deprecated Data Migration Properties

| Name | Description | Default Value |
| --- | --- | --- |
| <a id="application-properties.data-migration.spring.sql.init.enabled"></a>[`spring.sql.init.enabled`](#application-properties.data-migration.spring.sql.init.enabled) | Replaced by [`spring.sql.init.mode`](../application-properties/index.md#application-properties.data-migration.spring.sql.init.mode) | `true` |

<a id="appendix.deprecated-application-properties.data"></a>

## Deprecated Data Properties

| Name | Description | Default Value |
| --- | --- | --- |
| <a id="application-properties.data.spring.datasource.dbcp2"></a>[`spring.datasource.dbcp2.default-query-timeout` `spring.datasource.dbcp2.enable-auto-commit-on-return` `spring.datasource.dbcp2.max-conn-lifetime-millis` `spring.datasource.dbcp2.max-wait-millis` `spring.datasource.dbcp2.min-evictable-idle-time-millis` `spring.datasource.dbcp2.remove-abandoned-timeout` `spring.datasource.dbcp2.soft-min-evictable-idle-time-millis` `spring.datasource.dbcp2.time-between-eviction-runs-millis` `spring.datasource.dbcp2.validation-query-timeout` ](#application-properties.data.spring.datasource.dbcp2) |  |  |
| <a id="application-properties.data.spring.datasource.oracleucp"></a>[`spring.datasource.oracleucp.connection-wait-timeout` ](#application-properties.data.spring.datasource.oracleucp) |  |  |

<a id="appendix.deprecated-application-properties.integration"></a>

## Deprecated Integration Properties

| Name | Description | Default Value |
| --- | --- | --- |
| <a id="application-properties.integration.spring.activemq.pool.maximum-active-session-per-connection"></a>[`spring.activemq.pool.maximum-active-session-per-connection`](#application-properties.integration.spring.activemq.pool.maximum-active-session-per-connection) | Replaced by [`spring.activemq.pool.max-sessions-per-connection`](../application-properties/index.md#application-properties.integration.spring.activemq.pool.max-sessions-per-connection) |  |
| <a id="application-properties.integration.spring.artemis.pool.maximum-active-session-per-connection"></a>[`spring.artemis.pool.maximum-active-session-per-connection`](#application-properties.integration.spring.artemis.pool.maximum-active-session-per-connection) | Replaced by [`spring.artemis.pool.max-sessions-per-connection`](../application-properties/index.md#application-properties.integration.spring.artemis.pool.max-sessions-per-connection) |  |
| <a id="application-properties.integration.spring.jms.listener.acknowledge-mode"></a>[`spring.jms.listener.acknowledge-mode`](#application-properties.integration.spring.jms.listener.acknowledge-mode) | Replaced by [`spring.jms.listener.session.acknowledge-mode`](../application-properties/index.md#application-properties.integration.spring.jms.listener.session.acknowledge-mode) |  |
| <a id="application-properties.integration.spring.jms.listener.concurrency"></a>[`spring.jms.listener.concurrency`](#application-properties.integration.spring.jms.listener.concurrency) | Replaced by [`spring.jms.listener.min-concurrency`](../application-properties/index.md#application-properties.integration.spring.jms.listener.min-concurrency) |  |
| <a id="application-properties.integration.spring.kafka.retry.topic.delay"></a>[`spring.kafka.retry.topic.delay`](#application-properties.integration.spring.kafka.retry.topic.delay) | Replaced by [`spring.kafka.retry.topic.backoff.delay`](../application-properties/index.md#application-properties.integration.spring.kafka.retry.topic.backoff.delay) |  |
| <a id="application-properties.integration.spring.kafka.retry.topic.max-delay"></a>[`spring.kafka.retry.topic.max-delay`](#application-properties.integration.spring.kafka.retry.topic.max-delay) | Replaced by [`spring.kafka.retry.topic.backoff.max-delay`](../application-properties/index.md#application-properties.integration.spring.kafka.retry.topic.backoff.max-delay) |  |
| <a id="application-properties.integration.spring.kafka.retry.topic.multiplier"></a>[`spring.kafka.retry.topic.multiplier`](#application-properties.integration.spring.kafka.retry.topic.multiplier) | Replaced by [`spring.kafka.retry.topic.backoff.multiplier`](../application-properties/index.md#application-properties.integration.spring.kafka.retry.topic.backoff.multiplier) |  |
| <a id="application-properties.integration.spring.kafka.retry.topic.random-back-off"></a>[`spring.kafka.retry.topic.random-back-off`](#application-properties.integration.spring.kafka.retry.topic.random-back-off) | Replaced by `spring.kafka.retry.topic.backoff.random` |  |

<a id="appendix.deprecated-application-properties.json"></a>

## Deprecated JSON Properties

| Name | Description | Default Value |
| --- | --- | --- |
| <a id="application-properties.json.spring.gson.lenient"></a>[`spring.gson.lenient`](#application-properties.json.spring.gson.lenient) | Replaced by [`spring.gson.strictness`](../application-properties/index.md#application-properties.json.spring.gson.strictness) |  |
| <a id="application-properties.json.spring.jackson2.constructor-detector"></a>[`spring.jackson2.constructor-detector`](#application-properties.json.spring.jackson2.constructor-detector) | Deprecated in favor of Jackson 3 | `default` |
| <a id="application-properties.json.spring.jackson2.datatype.enum"></a>[`spring.jackson2.datatype.enum.*`](#application-properties.json.spring.jackson2.datatype.enum) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.datatype.json-node"></a>[`spring.jackson2.datatype.json-node.*`](#application-properties.json.spring.jackson2.datatype.json-node) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.date-format"></a>[`spring.jackson2.date-format`](#application-properties.json.spring.jackson2.date-format) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.default-leniency"></a>[`spring.jackson2.default-leniency`](#application-properties.json.spring.jackson2.default-leniency) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.default-property-inclusion"></a>[`spring.jackson2.default-property-inclusion`](#application-properties.json.spring.jackson2.default-property-inclusion) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.deserialization"></a>[`spring.jackson2.deserialization.*`](#application-properties.json.spring.jackson2.deserialization) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.generator"></a>[`spring.jackson2.generator.*`](#application-properties.json.spring.jackson2.generator) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.locale"></a>[`spring.jackson2.locale`](#application-properties.json.spring.jackson2.locale) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.mapper"></a>[`spring.jackson2.mapper.*`](#application-properties.json.spring.jackson2.mapper) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.parser"></a>[`spring.jackson2.parser.*`](#application-properties.json.spring.jackson2.parser) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.property-naming-strategy"></a>[`spring.jackson2.property-naming-strategy`](#application-properties.json.spring.jackson2.property-naming-strategy) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.serialization"></a>[`spring.jackson2.serialization.*`](#application-properties.json.spring.jackson2.serialization) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.time-zone"></a>[`spring.jackson2.time-zone`](#application-properties.json.spring.jackson2.time-zone) | Deprecated in favor of Jackson 3 |  |
| <a id="application-properties.json.spring.jackson2.visibility"></a>[`spring.jackson2.visibility.*`](#application-properties.json.spring.jackson2.visibility) | Deprecated in favor of Jackson 3 |  |

<a id="appendix.deprecated-application-properties.templating"></a>

## Deprecated Templating Properties

| Name | Description | Default Value |
| --- | --- | --- |
| <a id="application-properties.templating.spring.groovy.template.configuration.auto-escape"></a>[`spring.groovy.template.configuration.auto-escape`](#application-properties.templating.spring.groovy.template.configuration.auto-escape) | Replaced by [`spring.groovy.template.auto-escape`](../application-properties/index.md#application-properties.templating.spring.groovy.template.auto-escape) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.auto-indent"></a>[`spring.groovy.template.configuration.auto-indent`](#application-properties.templating.spring.groovy.template.configuration.auto-indent) | Replaced by [`spring.groovy.template.auto-indent`](../application-properties/index.md#application-properties.templating.spring.groovy.template.auto-indent) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.auto-indent-string"></a>[`spring.groovy.template.configuration.auto-indent-string`](#application-properties.templating.spring.groovy.template.configuration.auto-indent-string) | Replaced by [`spring.groovy.template.auto-indent-string`](../application-properties/index.md#application-properties.templating.spring.groovy.template.auto-indent-string) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.auto-new-line"></a>[`spring.groovy.template.configuration.auto-new-line`](#application-properties.templating.spring.groovy.template.configuration.auto-new-line) | Replaced by [`spring.groovy.template.auto-new-line`](../application-properties/index.md#application-properties.templating.spring.groovy.template.auto-new-line) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.base-template-class"></a>[`spring.groovy.template.configuration.base-template-class`](#application-properties.templating.spring.groovy.template.configuration.base-template-class) | Replaced by [`spring.groovy.template.base-template-class`](../application-properties/index.md#application-properties.templating.spring.groovy.template.base-template-class) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.cache-templates"></a>[`spring.groovy.template.configuration.cache-templates`](#application-properties.templating.spring.groovy.template.configuration.cache-templates) | Replaced by [`spring.groovy.template.cache`](../application-properties/index.md#application-properties.templating.spring.groovy.template.cache) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.declaration-encoding"></a>[`spring.groovy.template.configuration.declaration-encoding`](#application-properties.templating.spring.groovy.template.configuration.declaration-encoding) | Replaced by [`spring.groovy.template.declaration-encoding`](../application-properties/index.md#application-properties.templating.spring.groovy.template.declaration-encoding) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.expand-empty-elements"></a>[`spring.groovy.template.configuration.expand-empty-elements`](#application-properties.templating.spring.groovy.template.configuration.expand-empty-elements) | Replaced by [`spring.groovy.template.expand-empty-elements`](../application-properties/index.md#application-properties.templating.spring.groovy.template.expand-empty-elements) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.locale"></a>[`spring.groovy.template.configuration.locale`](#application-properties.templating.spring.groovy.template.configuration.locale) | Replaced by [`spring.groovy.template.locale`](../application-properties/index.md#application-properties.templating.spring.groovy.template.locale) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.new-line-string"></a>[`spring.groovy.template.configuration.new-line-string`](#application-properties.templating.spring.groovy.template.configuration.new-line-string) | Replaced by [`spring.groovy.template.new-line-string`](../application-properties/index.md#application-properties.templating.spring.groovy.template.new-line-string) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.resource-loader-path"></a>[`spring.groovy.template.configuration.resource-loader-path`](#application-properties.templating.spring.groovy.template.configuration.resource-loader-path) | Replaced by [`spring.groovy.template.resource-loader-path`](../application-properties/index.md#application-properties.templating.spring.groovy.template.resource-loader-path) |  |
| <a id="application-properties.templating.spring.groovy.template.configuration.use-double-quotes"></a>[`spring.groovy.template.configuration.use-double-quotes`](#application-properties.templating.spring.groovy.template.configuration.use-double-quotes) | Replaced by [`spring.groovy.template.use-double-quotes`](../application-properties/index.md#application-properties.templating.spring.groovy.template.use-double-quotes) |  |

<a id="appendix.deprecated-application-properties.web"></a>

## Deprecated Web Properties

| Name | Description | Default Value |
| --- | --- | --- |
| <a id="application-properties.web.spring.http.client.connect-timeout"></a>[`spring.http.client.connect-timeout`](#application-properties.web.spring.http.client.connect-timeout) | Replaced by [`spring.http.clients.connect-timeout`](../application-properties/index.md#application-properties.web.spring.http.clients.connect-timeout) |  |
| <a id="application-properties.web.spring.http.client.factory"></a>[`spring.http.client.factory`](#application-properties.web.spring.http.client.factory) | Replaced by [`spring.http.clients.imperative.factory`](../application-properties/index.md#application-properties.web.spring.http.clients.imperative.factory) |  |
| <a id="application-properties.web.spring.http.client.read-timeout"></a>[`spring.http.client.read-timeout`](#application-properties.web.spring.http.client.read-timeout) | Replaced by [`spring.http.clients.read-timeout`](../application-properties/index.md#application-properties.web.spring.http.clients.read-timeout) |  |
| <a id="application-properties.web.spring.http.client.redirects"></a>[`spring.http.client.redirects`](#application-properties.web.spring.http.client.redirects) | Replaced by [`spring.http.clients.redirects`](../application-properties/index.md#application-properties.web.spring.http.clients.redirects) |  |
| <a id="application-properties.web.spring.http.client.ssl.bundle"></a>[`spring.http.client.ssl.bundle`](#application-properties.web.spring.http.client.ssl.bundle) | Replaced by [`spring.http.clients.ssl.bundle`](../application-properties/index.md#application-properties.web.spring.http.clients.ssl.bundle) |  |
| <a id="application-properties.web.spring.http.reactiveclient.connect-timeout"></a>[`spring.http.reactiveclient.connect-timeout`](#application-properties.web.spring.http.reactiveclient.connect-timeout) | Replaced by [`spring.http.clients.connect-timeout`](../application-properties/index.md#application-properties.web.spring.http.clients.connect-timeout) |  |
| <a id="application-properties.web.spring.http.reactiveclient.connector"></a>[`spring.http.reactiveclient.connector`](#application-properties.web.spring.http.reactiveclient.connector) | Replaced by [`spring.http.clients.reactive.connector`](../application-properties/index.md#application-properties.web.spring.http.clients.reactive.connector) |  |
| <a id="application-properties.web.spring.http.reactiveclient.read-timeout"></a>[`spring.http.reactiveclient.read-timeout`](#application-properties.web.spring.http.reactiveclient.read-timeout) | Replaced by [`spring.http.clients.read-timeout`](../application-properties/index.md#application-properties.web.spring.http.clients.read-timeout) |  |
| <a id="application-properties.web.spring.http.reactiveclient.redirects"></a>[`spring.http.reactiveclient.redirects`](#application-properties.web.spring.http.reactiveclient.redirects) | Replaced by [`spring.http.clients.redirects`](../application-properties/index.md#application-properties.web.spring.http.clients.redirects) |  |
| <a id="application-properties.web.spring.http.reactiveclient.ssl.bundle"></a>[`spring.http.reactiveclient.ssl.bundle`](#application-properties.web.spring.http.reactiveclient.ssl.bundle) | Replaced by [`spring.http.clients.ssl.bundle`](../application-properties/index.md#application-properties.web.spring.http.clients.ssl.bundle) |  |
