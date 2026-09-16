---
title: "Migrating to 6.2"
source: "ROOT:migration/index.adoc"
---

<a id="migration"></a>

# Migrating to 6.2

This guide provides instructions for migrating from Spring Security 6.1 to Spring Security 6.2.

<a id="_update_to_spring_security_6_2"></a>

## Update to Spring Security 6.2

When updating to a new minor version, it is important that you are already using the latest patch release of the previous minor version.
For example, if you are upgrading to Spring Security 6.2, you should already be using the latest patch release of Spring Security 6.1.
This makes it easier to identify any changes that may have been introduced in the new minor version.

Therefore, the first step is to ensure you are on the latest patch release of Spring Boot 3.1.
Next, you should ensure you are on the latest patch release of Spring Security 6.1.
Typically, the latest patch release of Spring Boot uses the latest patch release of Spring Security.

With those two steps complete, you can now update to Spring Security 6.2.

<a id="_quick_reference"></a>

## Quick Reference

The following list provide a quick reference for the changes that are described in this guide.

- [You are using method parameter names in `@PreAuthorize`, `@PostAuthorize`, or any other method security annotations](authorization.md#compile-with-parameters)
