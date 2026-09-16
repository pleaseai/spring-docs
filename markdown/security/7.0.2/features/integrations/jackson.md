---
title: "Jackson Support"
source: "ROOT:features/integrations/jackson.adoc"
---

<a id="jackson"></a>

# Jackson Support

Spring Security provides Jackson 3 support for persisting Spring Security related classes.
This can improve the performance of serializing Spring Security related classes when working with distributed sessions (i.e. session replication, Spring Session, etc).

> [!NOTE]
> Jackson 2 support is still available but deprecated for removal, so you are encouraged to migrate to Jackson 3.

To use it, register `SecurityJacksonModules.getModules(ClassLoader)` with `JsonMapper.Builder` ([jackson-databind](https://github.com/FasterXML/jackson-databind)):

#### Java

```java
ClassLoader loader = getClass().getClassLoader();
JsonMapper mapper = JsonMapper.builder()
        .addModules(SecurityJacksonModules.getModules(loader))
        .build();

// ... use JsonMapper as normally ...
SecurityContext context = new SecurityContextImpl();
// ...
String json = mapper.writeValueAsString(context);
```

#### Kotlin

```kotlin
val loader = javaClass.classLoader
val mapper = JsonMapper.builder()
    .addModules(SecurityJacksonModules.getModules(loader))
    .build()

// ... use JsonMapper as normally ...
val context: SecurityContext = SecurityContextImpl()
// ...
val json: String = mapper.writeValueAsString(context)
```

> [!NOTE]
> Using `SecurityJacksonModules` as above enables automatic inclusion of type information and configure a
> `PolymorphicTypeValidator` that handles the validation of class names.

If needed, you can add custom classes to the validation handling.

#### Java

```java
ClassLoader loader = getClass().getClassLoader();
BasicPolymorphicTypeValidator.Builder builder = BasicPolymorphicTypeValidator.builder()
        .allowIfSubType(MyCustomType.class);
JsonMapper mapper = JsonMapper.builder()
        .addModules(SecurityJacksonModules.getModules(loader, builder))
        .build();
```

#### Kotlin

```kotlin
val loader = javaClass.classLoader
val builder = BasicPolymorphicTypeValidator.builder()
        .allowIfSubType(MyCustomType::class)
val mapper = JsonMapper.builder()
    .addModules(SecurityJacksonModules.getModules(loader, builder))
    .build()
```

> [!NOTE]
> The following Spring Security modules provide Jackson support:
>
> - spring-security-core ([`CoreJacksonModule`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/jackson/CoreJacksonModule.html))
> - spring-security-web ([`WebJacksonModule`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/web/jackson/WebJacksonModule.html), [`WebServletJacksonModule`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/web/jackson/WebServletJacksonModule.html), [`WebServerJacksonModule`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/web/server/jackson/WebServerJacksonModule.html))
> - spring-security-oauth2-client ([`OAuth2ClientJacksonModule`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/oauth2/client/jackson/OAuth2ClientJacksonModule.html))
> - spring-security-oauth2-authorization-server ([`OAuth2AuthorizationServerJacksonModule`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/oauth2/server/authorization/jackson/OAuth2AuthorizationServerJacksonModule.html))
> - spring-security-cas ([`CasJacksonModule`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/cas/jackson/CasJacksonModule.html))
> - spring-security-ldap ([`LdapJacksonModule`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/ldap/jackson/LdapJacksonModule.html))
> - spring-security-saml2 ([`Saml2JacksonModule`](https://docs.spring.io/spring-security/site/docs/7.0.2/api/org/springframework/security/saml2/jackson/Saml2JacksonModule.html))
