---
title: "Introduction"
source: "ROOT:intro.adoc"
---

<a id="intro-chapter"></a>

# Introduction

REST web services have become the number one means for application integration on the web. In its core, REST defines that a system that consists of resources with which clients interact. These resources are implemented in a hypermedia-driven way. [Spring MVC](https://docs.spring.io/spring-framework/reference/6.2/web.html#spring-web) and [Spring WebFlux](https://docs.spring.io/spring-framework/reference/6.2/web-reactive.html#spring-webflux) each offer a solid foundation to build these kinds of services. However, implementing even the simplest tenet of REST web services for a multi-domain object system can be quite tedious and result in a lot of boilerplate code.

Spring Data REST builds on top of the Spring Data repositories and automatically exports those as REST resources. It leverages hypermedia to let clients automatically find functionality exposed by the repositories and integrate these resources into related hypermedia-based functionality.
