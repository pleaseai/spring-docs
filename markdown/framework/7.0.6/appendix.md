---
title: "Appendix"
source: "ROOT:appendix.adoc"
---

<a id="appendix"></a>

# Appendix

This part of the reference documentation covers topics that apply to multiple modules
within the core Spring Framework.

<a id="appendix-spring-properties"></a>

## Spring Properties

[`SpringProperties`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/core/SpringProperties.html) is a static holder
for properties that control certain low-level aspects of the Spring Framework. Users can
configure these properties via JVM system properties or programmatically via the
`SpringProperties.setProperty(String key, String value)` method. The latter may be
necessary if the deployment environment disallows custom JVM system properties. As an
alternative, these properties may be configured in a `spring.properties` file in the root
of the classpath — for example, deployed within the application’s JAR file.

The following table lists all currently supported Spring properties.

| Name | Description |
| --- | --- |
| `spring.aop.ajc.ignore` | Instructs Spring to ignore ajc-compiled aspects for Spring AOP proxying, restoring traditional Spring behavior for scenarios where both weaving and AspectJ auto-proxying are enabled. See [`AbstractAspectJAdvisorFactory`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/aop/aspectj/annotation/AbstractAspectJAdvisorFactory.html#IGNORE_AJC_PROPERTY_NAME) for details. |
| `spring.aot.enabled` | Indicates the application should run with AOT generated artifacts. See [Ahead of Time Optimizations](core/aot.md) and [`AotDetector`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/aot/AotDetector.html#AOT_ENABLED) for details. |
| `spring.beaninfo.ignore` | Instructs Spring to use the `Introspector.IGNORE_ALL_BEANINFO` mode when calling the JavaBeans `Introspector`. See [`StandardBeanInfoFactory`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/beans/StandardBeanInfoFactory.html#IGNORE_BEANINFO_PROPERTY_NAME) for details. |
| `spring.cache.reactivestreams.ignore` | Instructs Spring’s caching infrastructure to ignore the presence of Reactive Streams, in particular Reactor’s `Mono`/`Flux` in `@Cacheable` method return type declarations. See [`CacheAspectSupport`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/cache/interceptor/CacheAspectSupport.html#IGNORE_REACTIVESTREAMS_PROPERTY_NAME) for details. |
| `spring.classformat.ignore` | Instructs Spring to ignore class format exceptions during classpath scanning, in particular for unsupported class file versions. See [`ClassPathScanningCandidateComponentProvider`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/context/annotation/ClassPathScanningCandidateComponentProvider.html#IGNORE_CLASSFORMAT_PROPERTY_NAME) for details. |
| `spring.context.checkpoint` | Property that specifies a common context checkpoint. See [Automatic checkpoint/restore at startup](integration/checkpoint-restore.md#_automatic_checkpointrestore_at_startup) and [`DefaultLifecycleProcessor`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/context/support/DefaultLifecycleProcessor.html#CHECKPOINT_PROPERTY_NAME) for details. |
| `spring.context.exit` | Property for terminating the JVM when the context reaches a specific phase. See [Automatic checkpoint/restore at startup](integration/checkpoint-restore.md#_automatic_checkpointrestore_at_startup) and [`DefaultLifecycleProcessor`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/context/support/DefaultLifecycleProcessor.html#EXIT_PROPERTY_NAME) for details. |
| `spring.context.expression.maxLength` | The maximum length for [Spring Expression Language](core/expressions/evaluation.md#expressions-parser-configuration) expressions used in XML bean definitions, `@Value`, etc. |
| `spring.expression.compiler.mode` | The mode to use when compiling expressions for the [Spring Expression Language](core/expressions/evaluation.md#expressions-compiler-configuration). |
| `spring.getenv.ignore` | Instructs Spring to ignore operating system environment variables if a Spring `Environment` property — for example, a placeholder in a configuration String — isn’t resolvable otherwise. See [`AbstractEnvironment`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/core/env/AbstractEnvironment.html#IGNORE_GETENV_PROPERTY_NAME) for details. |
| `spring.http.response.flush.enabled` | Configures the Spring MVC `ServletServerHttpResponse` to allow flushing on the `OutputStream` returned by `ServletServerHttpResponse#getBody()`. By default, such flush calls are ignored and only `ServletServerHttpResponse#flush()` will actually flush the response to the network. |
| `spring.jdbc.getParameterType.ignore` | Instructs Spring to ignore `java.sql.ParameterMetaData.getParameterType` completely. See the note in [Batch Operations with a List of Objects](data-access/jdbc/advanced.md#jdbc-batch-list). |
| `spring.jndi.ignore` | Instructs Spring to ignore a default JNDI environment, as an optimization for scenarios where nothing is ever to be found for such JNDI fallback searches to begin with, avoiding the repeated JNDI lookup overhead. See [`JndiLocatorDelegate`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/jndi/JndiLocatorDelegate.html#IGNORE_JNDI_PROPERTY_NAME) for details. |
| `spring.locking.strict` | Instructs Spring to enforce strict locking during bean creation, rather than the mix of strict and lenient locking that 6.2 applies by default. See [`DefaultListableBeanFactory`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/beans/factory/support/DefaultListableBeanFactory.html#STRICT_LOCKING_PROPERTY_NAME) for details. |
| `spring.objenesis.ignore` | Instructs Spring to ignore Objenesis, not even attempting to use it. See [`SpringObjenesis`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/objenesis/SpringObjenesis.html#IGNORE_OBJENESIS_PROPERTY_NAME) for details. |
| `spring.placeholder.escapeCharacter.default` | The default escape character for property placeholder support. If not set, `'\'` will be used. Can be set to a custom escape character or an empty string to disable support for an escape character. The default escape character be explicitly overridden in `PropertySourcesPlaceholderConfigurer` and subclasses of `AbstractPropertyResolver`. See [`AbstractPropertyResolver`](https://docs.spring.io/spring-framework/docs/7.0.6/javadoc-api/org/springframework/core/env/AbstractPropertyResolver.html#DEFAULT_PLACEHOLDER_ESCAPE_CHARACTER_PROPERTY_NAME) for details. |
| `spring.test.aot.processing.failOnError` | A boolean flag that controls whether errors encountered during AOT processing in the *Spring TestContext Framework* should result in an exception that fails the overall process. See [Ahead of Time Support for Tests](testing/testcontext-framework/aot.md). |
| `spring.test.constructor.autowire.mode` | The default *test constructor autowire mode* to use if `@TestConstructor` is not present on a test class. See [Changing the default test constructor autowire mode](testing/annotations/integration-junit-jupiter.md#integration-testing-annotations-testconstructor). |
| `spring.test.context.cache.maxSize` | The maximum size of the context cache in the *Spring TestContext Framework*. See [Context Caching](testing/testcontext-framework/ctx-management/caching.md). |
| `spring.test.context.cache.pause` | The pause mode for the context cache in the *Spring TestContext Framework*. See [Context Pausing](testing/testcontext-framework/ctx-management/context-pausing.md). |
| `spring.test.context.failure.threshold` | The failure threshold for errors encountered while attempting to load an `ApplicationContext` in the *Spring TestContext Framework*. See [Context Failure Threshold](testing/testcontext-framework/ctx-management/failure-threshold.md). |
| `spring.test.enclosing.configuration` | The default *enclosing configuration inheritance mode* to use if `@NestedTestConfiguration` is not present on a test class. See [Changing the default enclosing configuration inheritance mode](testing/annotations/integration-junit-jupiter.md#integration-testing-annotations-nestedtestconfiguration). |
