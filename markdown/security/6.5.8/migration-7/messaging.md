---
title: "Messaging Migrations"
source: "ROOT:migration-7/messaging.adoc"
---

# Messaging Migrations

<a id="_messaging_migrations"></a>

## Messaging Migrations

<a id="use-path-pattern"></a>

## Use PathPatternMessageMatcher by Default

In Spring Security 7, `SimpDestMessageMatcher` is no longer supported and will use `PathPatternMessageMatcher` by default.

To check how prepared you are for this change, you can publish this bean:

#### Java

```java
@Bean
PathPatternMessageMatcherBuilderFactoryBean messageMatcherBuilder() {
	return new PathPatternMessageMatcherBuilderFactoryBean();
}
```

#### Kotlin

```kotlin
@Bean
fun messageMatcherBuilder(): PathPatternMessageMatcherBuilderFactoryBean {
    return PathPatternMessageMatcherBuilderFactoryBean()
}
```

#### Xml

```xml
<b:bean class="org.springframework.security.config.web.messaging.PathPatternMessageMatcherBuilderFactoryBean"/>
```

This will tell the Spring Security DSL to use `PathPatternMessageMatcher` for all message matchers that it constructs.

Use of `PathMatcher` is no longer supported in 7.
If you are using `PathMatcher` to change the path separator or to change case sensitivity for message matching, you can configure the `PathPatternParser` to do this instead like so:

#### Java

```java
@Bean
PathPatternMessageMatcherBuilderFactoryBean messageMatcherBuilder() {
	PathPatternParser pathPatternParser = new PathPatternParser();
	pathPatternParser.setCaseSensitive(false);
	// use . as path separator
	pathPatternParser.setPathOptions(PathContainer.Options.MESSAGE_ROUTE);
	return new PathPatternMessageMatcherBuilderFactoryBean(pathPatternParser);
}
```

#### Kotlin

```kotlin
@Bean
fun messageMatcherBuilder(): PathPatternMessageMatcherBuilderFactoryBean {
    val pathPatternParser = PathPatternParser()
	pathPatternParser.setCaseSensitive(false)
    // use . as path separator
	pathPatternParser.setPathOptions(PathContainer.Options.MESSAGE_ROUTE)
    return PathPatternMessageMatcherBuilderFactoryBean(pathPatternParser)
}
```

#### Xml

```xml
<b:bean class="org.springframework.web.util.pattern.PathPatternParser">
    <b:property name="caseSensitive" value="false"/>
    <!-- use . as path separator -->
    <b:property name="pathOptions" value="#{T(org.springframework.http.server.PathContainer.Options).MESSAGE_ROUTE"/>
</b:bean>
<b:bean class="org.springframework.security.config.web.messaging.PathPatternMessageMatcherBuilderFactoryBean"/>
```
