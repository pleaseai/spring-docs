---
title: "Auditing"
source: "ROOT:mongodb/auditing.adoc"
---

<a id="mongo.auditing"></a>

# Auditing

Since Spring Data MongoDB 1.4, auditing can be enabled by annotating a configuration class with the `@EnableMongoAuditing` annotation, as the following example shows:

#### Imperative

```java
@Configuration
@EnableMongoAuditing
class Config {

  @Bean
  public AuditorAware<AuditableUser> myAuditorProvider() {
      return new AuditorAwareImpl();
  }
}
```

#### Reactive

```java
@Configuration
@EnableReactiveMongoAuditing
class Config {

  @Bean
  public ReactiveAuditorAware<AuditableUser> myAuditorProvider() {
      return new ReactiveAuditorAwareImpl();
  }
}
```

#### XML

```xml
<mongo:auditing mapping-context-ref="customMappingContext" auditor-aware-ref="yourAuditorAwareImpl"/>
```

If you expose a bean of type `AuditorAware` / `ReactiveAuditorAware` to the `ApplicationContext`, the auditing infrastructure picks it up automatically and uses it to determine the current user to be set on domain types.
If you have multiple implementations registered in the `ApplicationContext`, you can select the one to be used by explicitly setting the `auditorAwareRef` attribute of `@EnableMongoAuditing`.
