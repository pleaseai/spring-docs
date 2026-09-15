---
title: "Defining New Advice Types"
source: "ROOT:core/aop-api/extensibility.adoc"
---

<a id="aop-extensibility"></a>

# Defining New Advice Types

Spring AOP is designed to be extensible. While the interception implementation strategy
is presently used internally, it is possible to support arbitrary advice types in
addition to the interception around advice, before, throws advice, and
after returning advice.

The `org.springframework.aop.framework.adapter` package is an SPI package that lets
support for new custom advice types be added without changing the core framework.
The only constraint on a custom `Advice` type is that it must implement the
`org.aopalliance.aop.Advice` marker interface.

See the [`org.springframework.aop.framework.adapter`](https://docs.spring.io/spring-framework/docs/6.2.9/javadoc-api/org/springframework/aop/framework/adapter/package-summary.html)
javadoc for further information.
