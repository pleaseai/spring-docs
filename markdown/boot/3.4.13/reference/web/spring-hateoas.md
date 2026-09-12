---
title: "Spring HATEOAS"
source: "reference:web/spring-hateoas.adoc"
---

<a id="web.spring-hateoas"></a>

# Spring HATEOAS

If you develop a RESTful API that makes use of hypermedia, Spring Boot provides auto-configuration for Spring HATEOAS that works well with most applications.
The auto-configuration replaces the need to use [`@EnableHypermediaSupport`](https://docs.spring.io/spring-hateoas/docs/2.4.x/api/org/springframework/hateoas/config/EnableHypermediaSupport.html) and registers a number of beans to ease building hypermedia-based applications, including a [`LinkDiscoverers`](https://docs.spring.io/spring-hateoas/docs/2.4.x/api/org/springframework/hateoas/client/LinkDiscoverers.html) (for client side support) and an [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.5/com/fasterxml/jackson/databind/ObjectMapper.html) configured to correctly marshal responses into the desired representation.
The [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.5/com/fasterxml/jackson/databind/ObjectMapper.html) is customized by setting the various `spring.jackson.*` properties or, if one exists, by a [`Jackson2ObjectMapperBuilder`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/http/converter/json/Jackson2ObjectMapperBuilder.html) bean.

You can take control of Spring HATEOAS’s configuration by using [`@EnableHypermediaSupport`](https://docs.spring.io/spring-hateoas/docs/2.4.x/api/org/springframework/hateoas/config/EnableHypermediaSupport.html).
Note that doing so disables the [`ObjectMapper`](https://javadoc.io/doc/com.fasterxml.jackson.core/jackson-databind/2.18.5/com/fasterxml/jackson/databind/ObjectMapper.html) customization described earlier.

> [!WARNING]
> `spring-boot-starter-hateoas` is specific to Spring MVC and should not be combined with Spring WebFlux.
> In order to use Spring HATEOAS with Spring WebFlux, you can add a direct dependency on `org.springframework.hateoas:spring-hateoas` along with `spring-boot-starter-webflux`.

By default, requests that accept `application/json` will receive an `application/hal+json` response.
To disable this behavior set `spring.hateoas.use-hal-as-default-json-media-type` to `false` and define a [`HypermediaMappingInformation`](https://docs.spring.io/spring-hateoas/docs/2.4.x/api/org/springframework/hateoas/config/HypermediaMappingInformation.html) or [`HalConfiguration`](https://docs.spring.io/spring-hateoas/docs/2.4.x/api/org/springframework/hateoas/mediatype/hal/HalConfiguration.html) to configure Spring HATEOAS to meet the needs of your application and its clients.
