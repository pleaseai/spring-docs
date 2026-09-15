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

[`SpringProperties`](https://docs.spring.io/spring-framework/docs/6.1.0/javadoc-api/org/springframework/core/SpringProperties.html) is a static holder
for properties that control certain low-level aspects of the Spring Framework. Users can
configure these properties via JVM system properties or programmatically via the
`SpringProperties.setProperty(String key, String value)` method. The latter may be
necessary if the deployment environment disallows custom JVM system properties. As an
alternative, these properties may be configured in a `spring.properties` file in the root
of the classpath — for example, deployed within the application’s JAR file.

The following table lists all currently supported Spring properties.

| Name | Description |
| --- | --- |
| `spring.beaninfo.ignore` | Instructs Spring to use the `Introspector.IGNORE_ALL_BEANINFO` mode when calling the JavaBeans `Introspector`. See [`CachedIntrospectionResults`](https://docs.spring.io/spring-framework/docs/6.1.0/javadoc-api/org/springframework/beans/StandardBeanInfoFactory.html#IGNORE_BEANINFO_PROPERTY_NAME) for details. |
| `spring.expression.compiler.mode` | The mode to use when compiling expressions for the [Spring Expression Language](core/expressions/evaluation.md#expressions-compiler-configuration). |
| `spring.getenv.ignore` | Instructs Spring to ignore operating system environment variables if a Spring `Environment` property — for example, a placeholder in a configuration String — isn’t resolvable otherwise. See [`AbstractEnvironment`](https://docs.spring.io/spring-framework/docs/6.1.0/javadoc-api/org/springframework/core/env/AbstractEnvironment.html#IGNORE_GETENV_PROPERTY_NAME) for details. |
| `spring.jdbc.getParameterType.ignore` | Instructs Spring to ignore `java.sql.ParameterMetaData.getParameterType` completely. See the note in [Batch Operations with a List of Objects](data-access/jdbc/advanced.md#jdbc-batch-list). |
| `spring.jndi.ignore` | Instructs Spring to ignore a default JNDI environment, as an optimization for scenarios where nothing is ever to be found for such JNDI fallback searches to begin with, avoiding the repeated JNDI lookup overhead. See [`JndiLocatorDelegate`](https://docs.spring.io/spring-framework/docs/6.1.0/javadoc-api/org/springframework/jndi/JndiLocatorDelegate.html#IGNORE_JNDI_PROPERTY_NAME) for details. |
| `spring.objenesis.ignore` | Instructs Spring to ignore Objenesis, not even attempting to use it. See [`SpringObjenesis`](https://docs.spring.io/spring-framework/docs/6.1.0/javadoc-api/org/springframework/objenesis/SpringObjenesis.html#IGNORE_OBJENESIS_PROPERTY_NAME) for details. |
| `spring.test.aot.processing.failOnError` | A boolean flag that controls whether errors encountered during AOT processing in the *Spring TestContext Framework* should result in an exception that fails the overall process. See [Ahead of Time Support for Tests](testing/testcontext-framework/aot.md). |
| `spring.test.constructor.autowire.mode` | The default *test constructor autowire mode* to use if `@TestConstructor` is not present on a test class. See [Changing the default test constructor autowire mode](testing/annotations/integration-junit-jupiter.md#integration-testing-annotations-testconstructor). |
| `spring.test.context.cache.maxSize` | The maximum size of the context cache in the *Spring TestContext Framework*. See [Context Caching](testing/testcontext-framework/ctx-management/caching.md). |
| `spring.test.context.failure.threshold` | The failure threshold for errors encountered while attempting to load an `ApplicationContext` in the *Spring TestContext Framework*. See [Context Failure Threshold](testing/testcontext-framework/ctx-management/failure-threshold.md). |
| `spring.test.enclosing.configuration` | The default *enclosing configuration inheritance mode* to use if `@NestedTestConfiguration` is not present on a test class. See [Changing the default enclosing configuration inheritance mode](testing/annotations/integration-junit-jupiter.md#integration-testing-annotations-nestedtestconfiguration). |
