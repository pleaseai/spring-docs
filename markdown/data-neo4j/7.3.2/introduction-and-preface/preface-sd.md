---
title: "Introducing Spring Data"
source: "ROOT:introduction-and-preface/preface-sd.adoc"
---

<a id="preface.spring-data"></a>

# Introducing Spring Data

Spring Data uses Spring Framework’s [core](https://docs.spring.io/spring-framework/reference/6.1/core.html) functionality, such as the [IoC](https://docs.spring.io/spring-framework/reference/6.1/core.html#beans) container,
[type conversion system](https://docs.spring.io/spring-framework/reference/6.1/core.html#core-convert),
[expression language](https://docs.spring.io/spring-framework/reference/6.1/core.html#expressions),
[JMX integration](https://docs.spring.io/spring-framework/reference/6.1/integration.html#jmx), and portable [DAO exception hierarchy](https://docs.spring.io/spring-framework/reference/6.1/data-access.html#dao-exceptions).
While it is not necessary to know all the Spring APIs, understanding the concepts behind them is.
At a minimum, the idea behind IoC should be familiar.

To learn more about Spring, you can refer to the comprehensive documentation that explains in detail the Spring Framework.
There are a lot of articles, blog entries and books on the matter - take a look at the Spring Framework [home page ](https://spring.io/docs) for more information.

The beauty of Spring Data is that it applies the same programming model to a variety of different stores, such as JPA, JDBC
Mongo and others. For that reason, parts of the general Spring Data documentations are included in this document, especially the
general chapter about [working with Spring Data repositories](../repositories.md#repositories). Make sure to have a look at that if you haven’t
worked with a Spring Data module in the past.
