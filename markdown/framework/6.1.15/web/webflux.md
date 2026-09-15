---
title: "Spring WebFlux"
source: "ROOT:web/webflux.adoc"
---

<a id="spring-webflux"></a>

# Spring WebFlux

The original web framework included in the Spring Framework, Spring Web MVC, was
purpose-built for the Servlet API and Servlet containers. The reactive-stack web framework,
Spring WebFlux, was added later in version 5.0. It is fully non-blocking, supports
[Reactive Streams](https://www.reactive-streams.org/) back pressure, and runs on such servers as
Netty, Undertow, and Servlet containers.

Both web frameworks mirror the names of their source modules
([spring-webmvc](https://github.com/spring-projects/spring-framework/tree/main/spring-webmvc) and
[spring-webflux](https://github.com/spring-projects/spring-framework/tree/main/spring-webflux)) and co-exist side by side in the
Spring Framework. Each module is optional. Applications can use one or the other module or,
in some cases, both — for example, Spring MVC controllers with the reactive `WebClient`.
