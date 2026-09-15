---
title: "API Versioning"
source: "ROOT:web/webflux-versioning.adoc"
---

<a id="webflux-versioning"></a>

# API Versioning

[See equivalent in the Servlet stack](webmvc-versioning.md)

Spring WebFlux supports API versioning. This section provides an overview of the support
and underlying strategies.

Please, see also related content in:

- Configure [API versioning](webflux/config.md#webflux-config-api-version)
in the WebFlux Config
- [Map requests](webflux/controller/ann-requestmapping.md#webflux-ann-requestmapping-version)
to annotated controller methods with an API version
- [Route requests](webflux-functional.md#api-version)
to functional endpoints with an API version

Client support for API versioning is available also in `RestClient`, `WebClient`, and
[HTTP Service](../integration/rest-clients.md#rest-http-service-client) clients, as well as
for testing in `WebTestClient`.

<a id="webflux-versioning-strategy"></a>

## ApiVersionStrategy

[See equivalent in the Servlet stack](webmvc-versioning.md#mvc-versioning-strategy)

This is the central strategy for API versioning that holds all configured preferences
related to versioning. It does the following:

- Resolves versions from the requests via [ApiVersionResolver](#webflux-versioning-resolver)
- Parses raw version values into `Comparable<?>` with [ApiVersionParser](#webflux-versioning-parser)
- [Validates](#webflux-versioning-validation) request versions

`ApiVersionStrategy` helps to map requests to `@RequestMapping` controller methods,
and is initialized by the WebFlux config. Typically, applications do not interact
directly with it.

<a id="webflux-versioning-resolver"></a>

## ApiVersionResolver

[See equivalent in the Servlet stack](webmvc-versioning.md#mvc-versioning-resolver)

This strategy resolves the API version from a request. The WebFlux config provides built-in
options to resolve from a header, query parameter, media type parameter,
or from the URL path. You can also use a custom `ApiVersionResolver`.

> [!NOTE]
> The path resolver always resolves the version from the specified path segment, or
> raises `InvalidApiVersionException` otherwise, and therefore it cannot yield to other
> resolvers.

<a id="webflux-versioning-parser"></a>

## ApiVersionParser

[See equivalent in the Servlet stack](webmvc-versioning.md#mvc-versioning-parser)

This strategy helps to parse raw version values into `Comparable<?>`, which helps to
compare, sort, and select versions. By default, the built-in `SemanticApiVersionParser`
parses a version into `major`, `minor`, and `patWebFluxch` integer values. Minor and patch
values are set to 0 if not present.

<a id="webflux-versioning-validation"></a>

## Validation

[See equivalent in the Servlet stack](webmvc-versioning.md#mvc-versioning-validation)

If a request version is not supported, `InvalidApiVersionException` is raised resulting
in a 400 response. By default, the list of supported versions is initialized from declared
versions in annotated controller mappings, but you can turn that off through a flag in the
WebFlux config, and use only the versions configured explicitly in the config.

By default, a version is required when API versioning is enabled, and
`MissingApiVersionException` is raised resulting in a 400 response if not present.
You can make it optional in which case the most recent version is used.
You can also specify a default version to use.

<a id="webflux-versioning-deprecation-handler"></a>

## ApiVersionDeprecationHandler

[See equivalent in the Reactive stack](webmvc-versioning.md#mvc-versioning-deprecation-handler)

This strategy can be configured to send hints and information about deprecated versions to
clients via response headers. The built-in `StandardApiVersionDeprecationHandler`
can set the "Deprecation" "Sunset" headers and "Link" headers as defined in
[RFC 9745](https://datatracker.ietf.org/doc/html/rfc9745) and
[RFC 8594](https://datatracker.ietf.org/doc/html/rfc8594). You can also configure a custom
handler for different headers.

<a id="webflux-versioning-mapping"></a>

## Request Mapping

[See equivalent in the Servlet stack](webmvc-versioning.md#mvc-versioning-mapping)

`ApiVersionStrategy` supports the mapping of requests to annotated controller methods.
See [API Versions](webflux/controller/ann-requestmapping.md#webflux-ann-requestmapping-version)
for more details.
