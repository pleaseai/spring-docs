---
title: "Migrating to 7.0"
source: "ROOT:migration/index.adoc"
---

<a id="migration"></a>

# Migrating to 7.0

Spring Security 6.5 is the last release in the 6.x generation of Spring Security.
It provides strategies for configuring breaking changes to use the 7.0 way before updating.
We recommend you use 6.5 and {site-url}/6.5/migration-7/index.html\[its preparation steps\] to simplify updating to 7.0.

After updating to 6.5, follow this guide to perform any remaining migration or cleanup steps.

And recall that if you run into trouble, the preparation guide includes opt-out steps to revert to 5.x behaviors.

<a id="_update_to_spring_security_7"></a>

## Update to Spring Security 7

The first step is to ensure you are the latest patch release of Spring Boot 4.0.
Next, you should ensure you are on the latest patch release of Spring Security 7.
For directions, on how to update to Spring Security 7 visit the [getting-spring-security.adoc](../getting-spring-security.md) section of the reference guide.

<a id="_migrate_from_jackson_2_to_jackson_3"></a>

### Migrate from Jackson 2 to Jackson 3

The configuration of Jackson 2 `ObjectMapper` with `SecurityJackson2Modules` should be replaced by the configuration of
Jackson 3 `JsonMapper.Builder` with `SecurityJacksonModules`. See the
[Jackson 3 Migration Guide](https://github.com/FasterXML/jackson/blob/main/jackson3/MIGRATING_TO_JACKSON_3.md) for more details.

It is recommended to replace the configuration of
individual modules like `CoreJacksonModule` by the module detection from `SecurityJacksonModules` as it enables
automatic inclusion of type information and configure a `PolymorphicTypeValidator` that handles the validation of class
names.

The Jackson 3 support uses a format compatible with the now deprecated Jackson 2 one, so class instances serialized with
Jackson 2 should be deserializable with the Jackson 3 support.

`spring-security-oauth2-authorization-server` now uses Jackson 3 by default. If you want to continue
to use the deprecated Jackson 2 support, the transitive dependency on Jackson 3 (`tools.jackson.core:jackson-databind`)
should be excluded and a dependency on Jackson 2 (`com.fasterxml.jackson.core:jackson-databind`) should be added.

<a id="_perform_application_specific_steps"></a>

## Perform Application-Specific Steps

Next, there are steps you need to perform based on whether it is a [Servlet](servlet/index.md) or [Reactive](reactive.md) application.
