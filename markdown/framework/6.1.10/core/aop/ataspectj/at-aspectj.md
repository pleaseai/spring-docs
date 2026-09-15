---
title: "Declaring an Aspect"
source: "ROOT:core/aop/ataspectj/at-aspectj.adoc"
---

<a id="aop-at-aspectj"></a>

# Declaring an Aspect

With @AspectJ support enabled, any bean defined in your application context with a
class that is an @AspectJ aspect (has the `@Aspect` annotation) is automatically
detected by Spring and used to configure Spring AOP. The next two examples show the
minimal steps required for a not-very-useful aspect.

The first of the two examples shows a regular bean definition in the application context
that points to a bean class that is annotated with `@Aspect`:

```xml
<bean id="myAspect" class="com.xyz.NotVeryUsefulAspect">
	<!-- configure properties of the aspect here -->
</bean>
```

The second of the two examples shows the `NotVeryUsefulAspect` class definition, which is
annotated with `@Aspect`:

#### Java

```java
package com.xyz;

import org.aspectj.lang.annotation.Aspect;

@Aspect
public class NotVeryUsefulAspect {
}
```

#### Kotlin

```kotlin
package com.xyz

import org.aspectj.lang.annotation.Aspect

@Aspect
class NotVeryUsefulAspect
```

Aspects (classes annotated with `@Aspect`) can have methods and fields, the same as any
other class. They can also contain pointcut, advice, and introduction (inter-type)
declarations.

> [!NOTE]
> You can register aspect classes as regular beans in your Spring XML configuration,
> via `@Bean` methods in `@Configuration` classes, or have Spring autodetect them through
> classpath scanning — the same as any other Spring-managed bean. However, note that the
> `@Aspect` annotation is not sufficient for autodetection in the classpath. For that
> purpose, you need to add a separate `@Component` annotation (or, alternatively, a custom
> stereotype annotation that qualifies, as per the rules of Spring’s component scanner).

> [!NOTE]
> In Spring AOP, aspects themselves cannot be the targets of advice from other
> aspects. The `@Aspect` annotation on a class marks it as an aspect and, hence, excludes
> it from auto-proxying.
