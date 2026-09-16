---
title: "Migrating to 6.0"
source: "ROOT:migration/index.adoc"
---

<a id="migration"></a>

# Migrating to 6.0

The Spring Security team has prepared the 5.8 release to simplify upgrading to Spring Security 6.0.
Use 5.8 and
[its preparation steps](https://docs.spring.io/spring-security/reference/5.8/migration/index.html)
to simplify updating to 6.0.

After updating to 5.8, follow this guide to perform any remaining migration or cleanup steps.

And recall that if you run into trouble, the preparation guide includes opt-out steps to revert to 5.x behaviors.

<a id="_update_to_spring_security_6"></a>

## Update to Spring Security 6

The first step is to ensure you are the latest patch release of Spring Boot 3.0.
Next, you should ensure you are on the latest patch release of Spring Security 6.
For directions, on how to update to Spring Security 6 visit the [getting-spring-security.adoc](../getting-spring-security.md) section of the reference guide.

<a id="_update_package_names"></a>

## Update Package Names

Now that you are updated, you need to change your `javax` imports to `jakarta` imports.

<a id="_compile_with_parameters"></a>

## Compile With `--parameters`

If you are using method parameter names in `@PreAuthorize`, `@PostAuthorize`, or any other method security annotations, you may need to [compile with `-parameters`](servlet/authorization.md#compile-with-parameters).

<a id="_perform_application_specific_steps"></a>

## Perform Application-Specific Steps

Next, there are steps you need to perform based on whether it is a [Servlet](servlet/index.md) or [Reactive](reactive.md) application.
