---
title: "Enabling @AspectJ Support"
source: "ROOT:core/aop/ataspectj/aspectj-support.adoc"
---

<a id="aop-aspectj-support"></a>

# Enabling @AspectJ Support

To use @AspectJ aspects in a Spring configuration, you need to enable Spring support for
configuring Spring AOP based on @AspectJ aspects and auto-proxying beans based on
whether or not they are advised by those aspects. By auto-proxying, we mean that, if Spring
determines that a bean is advised by one or more aspects, it automatically generates
a proxy for that bean to intercept method invocations and ensures that advice is run
as needed.

The @AspectJ support can be enabled with XML- or Java-style configuration. In either
case, you also need to ensure that AspectJ’s `aspectjweaver.jar` library is on the
classpath of your application (version 1.9 or later). This library is available in the
`lib` directory of an AspectJ distribution or from the Maven Central repository.

<a id="aop-enable-aspectj-java"></a>

## Enabling @AspectJ Support with Java Configuration

To enable @AspectJ support with Java `@Configuration`, add the `@EnableAspectJAutoProxy`
annotation, as the following example shows:

#### Java

```java
@Configuration
@EnableAspectJAutoProxy
public class AppConfig {
}
```

#### Kotlin

```kotlin
@Configuration
@EnableAspectJAutoProxy
class AppConfig
```

<a id="aop-enable-aspectj-xml"></a>

## Enabling @AspectJ Support with XML Configuration

To enable @AspectJ support with XML-based configuration, use the `aop:aspectj-autoproxy`
element, as the following example shows:

```xml
<aop:aspectj-autoproxy/>
```

This assumes that you use schema support as described in
[XML Schema-based configuration](../../appendix/xsd-schemas.md).
See [the AOP schema](../../appendix/xsd-schemas.md#aop) for how to
import the tags in the `aop` namespace.
