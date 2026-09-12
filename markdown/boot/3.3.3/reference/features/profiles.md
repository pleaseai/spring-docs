---
title: "Profiles"
source: "reference:features/profiles.adoc"
---

<a id="features.profiles"></a>

# Profiles

Spring Profiles provide a way to segregate parts of your application configuration and make it be available only in certain environments.
Any `@Component`, `@Configuration` or `@ConfigurationProperties` can be marked with `@Profile` to limit when it is loaded, as shown in the following example:

#### Java

```java
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration(proxyBeanMethods = false)
@Profile("production")
public class ProductionConfiguration {

	// ...

}
```

#### Kotlin

```kotlin
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Profile

@Configuration(proxyBeanMethods = false)
@Profile("production")
class ProductionConfiguration {

	// ...

}
```

> [!NOTE]
> If `@ConfigurationProperties` beans are registered through `@EnableConfigurationProperties` instead of automatic scanning, the `@Profile` annotation needs to be specified on the `@Configuration` class that has the `@EnableConfigurationProperties` annotation.
> In the case where `@ConfigurationProperties` are scanned, `@Profile` can be specified on the `@ConfigurationProperties` class itself.

You can use a `spring.profiles.active` `Environment` property to specify which profiles are active.
You can specify the property in any of the ways described earlier in this chapter.
For example, you could include it in your `application.properties`, as shown in the following example:

#### Properties

```properties
spring.profiles.active=dev,hsqldb
```

#### YAML

```yaml
spring:
  profiles:
    active: "dev,hsqldb"
```

You could also specify it on the command line by using the following switch: `--spring.profiles.active=dev,hsqldb`.

If no profile is active, a default profile is enabled.
The name of the default profile is `default` and it can be tuned using the `spring.profiles.default` `Environment` property, as shown in the following example:

#### Properties

```properties
spring.profiles.default=none
```

#### YAML

```yaml
spring:
  profiles:
    default: "none"
```

`spring.profiles.active` and `spring.profiles.default` can only be used in non-profile-specific documents.
This means they cannot be included in [profile specific files](external-config.md#features.external-config.files.profile-specific) or [documents activated](external-config.md#features.external-config.files.activation-properties) by `spring.config.activate.on-profile`.

For example, the second document configuration is invalid:

#### Properties

```properties
spring.profiles.active=prod
#---
spring.config.activate.on-profile=prod
spring.profiles.active=metrics
```

#### YAML

```yaml
# this document is valid
spring:
  profiles:
    active: "prod"
---
# this document is invalid
spring:
  config:
    activate:
      on-profile: "prod"
  profiles:
    active: "metrics"
```

<a id="features.profiles.adding-active-profiles"></a>

## Adding Active Profiles

The `spring.profiles.active` property follows the same ordering rules as other properties: The highest `PropertySource` wins.
This means that you can specify active profiles in `application.properties` and then **replace** them by using the command line switch.

Sometimes, it is useful to have properties that **add** to the active profiles rather than replace them.
The `spring.profiles.include` property can be used to add active profiles on top of those activated by the `spring.profiles.active` property.
The `SpringApplication` entry point also has a Java API for setting additional profiles.
See the `setAdditionalProfiles()` method in [`SpringApplication`](https://docs.spring.io/spring-boot/3.3.3/api/java/org/springframework/boot/SpringApplication.html).

For example, when an application with the following properties is run, the common and local profiles will be activated even when it runs using the `--spring.profiles.active` switch:

#### Properties

```properties
spring.profiles.include[0]=common
spring.profiles.include[1]=local
```

#### YAML

```yaml
spring:
  profiles:
    include:
      - "common"
      - "local"
```

> [!WARNING]
> Similar to `spring.profiles.active`, `spring.profiles.include` can only be used in non-profile-specific documents.
> This means it cannot be included in [profile specific files](external-config.md#features.external-config.files.profile-specific) or [documents activated](external-config.md#features.external-config.files.activation-properties) by `spring.config.activate.on-profile`.

Profile groups, which are described in the [next section](#features.profiles.groups) can also be used to add active profiles if a given profile is active.

<a id="features.profiles.groups"></a>

## Profile Groups

Occasionally the profiles that you define and use in your application are too fine-grained and become cumbersome to use.
For example, you might have `proddb` and `prodmq` profiles that you use to enable database and messaging features independently.

To help with this, Spring Boot lets you define profile groups.
A profile group allows you to define a logical name for a related group of profiles.

For example, we can create a `production` group that consists of our `proddb` and `prodmq` profiles.

#### Properties

```properties
spring.profiles.group.production[0]=proddb
spring.profiles.group.production[1]=prodmq
```

#### YAML

```yaml
spring:
  profiles:
    group:
      production:
      - "proddb"
      - "prodmq"
```

Our application can now be started using `--spring.profiles.active=production` to activate the `production`, `proddb` and `prodmq` profiles in one hit.

> [!WARNING]
> Similar to `spring.profiles.active` and `spring.profiles.include`, `spring.profiles.group` can only be used in non-profile-specific documents.
> This means it cannot be included in [profile specific files](external-config.md#features.external-config.files.profile-specific) or [documents activated](external-config.md#features.external-config.files.activation-properties) by `spring.config.activate.on-profile`.

<a id="features.profiles.programmatically-setting-profiles"></a>

## Programmatically Setting Profiles

You can programmatically set active profiles by calling `SpringApplication.setAdditionalProfiles(…​)` before your application runs.
It is also possible to activate profiles by using Spring’s `ConfigurableEnvironment` interface.

<a id="features.profiles.profile-specific-configuration-files"></a>

## Profile-specific Configuration Files

Profile-specific variants of both `application.properties` (or `application.yaml`) and files referenced through `@ConfigurationProperties` are considered as files and loaded.
See [features/external-config.adoc#features.external-config.files.profile-specific](external-config.md#features.external-config.files.profile-specific) for details.
