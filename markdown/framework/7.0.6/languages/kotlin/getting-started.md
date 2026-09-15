---
title: "Getting Started"
source: "ROOT:languages/kotlin/getting-started.adoc"
---

<a id="kotlin-getting-started"></a>

# Getting Started

The easiest way to learn how to build a Spring application with Kotlin is to follow
[the dedicated tutorial](https://spring.io/guides/tutorials/spring-boot-kotlin/).

<a id="start-spring-io"></a>

## `start.spring.io`

The easiest way to start a new Spring Framework project in Kotlin is to create a new Spring
Boot project on [start.spring.io](https://start.spring.io/#!language=kotlin&type=gradle-project-kotlin).

<a id="choosing-the-web-flavor"></a>

## Choosing the Web Flavor

Spring Framework comes with two different web stacks: [Spring MVC](../../web/webmvc.md#mvc) and
[Spring WebFlux](../../testing/unit.md#mock-objects-web-reactive).

Spring WebFlux is recommended if you want to create applications that will deal with latency,
long-lived connections or streaming scenarios.

For other use cases, especially if you are using blocking technologies such as JPA, Spring
MVC is the recommended choice.
