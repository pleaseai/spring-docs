---
title: "Packaging Your Application for Production"
source: "reference:using/packaging-for-production.adoc"
---

<a id="using.packaging-for-production"></a>

# Packaging Your Application for Production

Executable jars can be used for production deployment.
As they are self-contained, they are also ideally suited for cloud-based deployment.

For additional “production ready” features, such as health, auditing, and metric REST or JMX end-points, consider adding `spring-boot-actuator`.
See *[Actuator](../../how-to/actuator.md)* for details.
