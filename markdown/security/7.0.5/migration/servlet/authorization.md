---
title: "Authorization Changes"
source: "ROOT:migration/servlet/authorization.adoc"
---

# Authorization Changes

<a id="_if_using_access_api_add_spring_security_access"></a>

## If Using Access API, Add `spring-security-access`

Spring Security 7 moves `AccessDecisionManager`, `AccessDecisionVoter`, and the related Access API to a legacy module, `spring-security-access`.
The Access API is deprecated in favor of the Authorization API as of Spring Security 5.

You can add the dependency like other Spring Security dependencies like so:

#### Maven

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-access</artifactId>
</dependency>
```

#### Gradle

```groovy
implementation('org.springframework.security:spring-security-access')
```
