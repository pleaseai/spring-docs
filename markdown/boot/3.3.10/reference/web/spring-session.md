---
title: "Spring Session"
source: "reference:web/spring-session.adoc"
---

<a id="web.spring-session"></a>

# Spring Session

Spring Boot provides [Spring Session](https://spring.io/projects/spring-session) auto-configuration for a wide range of data stores.
When building a servlet web application, the following stores can be auto-configured:

- Redis
- JDBC
- Hazelcast
- MongoDB

Additionally, [Spring Boot for Apache Geode](https://github.com/spring-projects/spring-boot-data-geode) provides [auto-configuration for using Apache Geode as a session store](https://docs.spring.io/spring-boot-data-geode-build/2.0.x/reference/html5#geode-session).

The servlet auto-configuration replaces the need to use `@Enable*HttpSession`.

If a single Spring Session module is present on the classpath, Spring Boot uses that store implementation automatically.
If you have more than one implementation, Spring Boot uses the following order for choosing a specific implementation:

1. Redis
1. JDBC
1. Hazelcast
1. MongoDB
1. If none of Redis, JDBC, Hazelcast and MongoDB are available, we do not configure a [`SessionRepository`](https://docs.spring.io/spring-session/docs/3.3.x/api/org/springframework/session/SessionRepository.html).

When building a reactive web application, the following stores can be auto-configured:

- Redis
- MongoDB

The reactive auto-configuration replaces the need to use `@Enable*WebSession`.

Similar to the servlet configuration, if you have more than one implementation, Spring Boot uses the following order for choosing a specific implementation:

1. Redis
1. MongoDB
1. If neither Redis nor MongoDB are available, we do not configure a [`ReactiveSessionRepository`](https://docs.spring.io/spring-session/docs/3.3.x/api/org/springframework/session/ReactiveSessionRepository.html).

Each store has specific additional settings.
For instance, it is possible to customize the name of the table for the JDBC store, as shown in the following example:

#### Properties

```properties
spring.session.jdbc.table-name=SESSIONS
```

#### YAML

```yaml
spring:
  session:
    jdbc:
      table-name: "SESSIONS"
```

For setting the timeout of the session you can use the `spring.session.timeout` property.
If that property is not set with a servlet web application, the auto-configuration falls back to the value of `server.servlet.session.timeout`.

You can take control over Spring Session’s configuration using `@Enable*HttpSession` (servlet) or `@Enable*WebSession` (reactive).
This will cause the auto-configuration to back off.
Spring Session can then be configured using the annotation’s attributes rather than the previously described configuration properties.
