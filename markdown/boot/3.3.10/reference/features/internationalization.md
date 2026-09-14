---
title: "Internationalization"
source: "reference:features/internationalization.adoc"
---

<a id="features.internationalization"></a>

# Internationalization

Spring Boot supports localized messages so that your application can cater to users of different language preferences.
By default, Spring Boot looks for the presence of a `messages` resource bundle at the root of the classpath.

> [!NOTE]
> The auto-configuration applies when the default properties file for the configured resource bundle is available (`messages.properties` by default).
> If your resource bundle contains only language-specific properties files, you are required to add the default.
> If no properties file is found that matches any of the configured base names, there will be no auto-configured [`MessageSource`](https://docs.spring.io/spring-framework/docs/6.1.x/javadoc-api/org/springframework/context/MessageSource.html).

The basename of the resource bundle as well as several other attributes can be configured using the `spring.messages` namespace, as shown in the following example:

#### Properties

```properties
spring.messages.basename=messages,config.i18n.messages
spring.messages.fallback-to-system-locale=false
```

#### YAML

```yaml
spring:
  messages:
    basename: "messages,config.i18n.messages"
    fallback-to-system-locale: false
```

> [!TIP]
> `spring.messages.basename` supports comma-separated list of locations, either a package qualifier or a resource resolved from the classpath root.

See [`MessageSourceProperties`](https://docs.spring.io/spring-boot/3.3.10/api/java/org/springframework/boot/autoconfigure/context/MessageSourceProperties.html) for more supported options.
