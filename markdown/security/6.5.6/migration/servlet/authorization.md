---
title: "Authorization Migrations"
source: "ROOT:migration/servlet/authorization.adoc"
---

# Authorization Migrations

The following steps relate to how to finish migrating authorization support.

<a id="_use_authorizationmanager_for_method_security"></a>

## Use `AuthorizationManager` for Method Security

There are no further migration steps for this feature.

<a id="_use_authorizationmanager_for_message_security"></a>

## Use `AuthorizationManager` for Message Security

In 6.0, `<websocket-message-broker>` defaults `use-authorization-manager` to `true`.
So, to complete migration, remove any `websocket-message-broker@use-authorization-manager=true` attribute.

For example:

#### Xml

```xml
<websocket-message-broker use-authorization-manager="true"/>
```

changes to:

#### Xml

```xml
<websocket-message-broker/>
```

There are no further migrations steps for Java or Kotlin for this feature.

<a id="_use_authorizationmanager_for_request_security"></a>

## Use `AuthorizationManager` for Request Security

In 6.0, `<http>` defaults `once-per-request` to `false`, `filter-all-dispatcher-types` to `true`, and `use-authorization-manager` to `true`.
Also, [`authorizeHttpRequests#filterAllDispatcherTypes`](../../servlet/authorization/authorize-http-requests.md) defaults to `true`.
So, to complete migration, any defaults values can be removed.

For example, if you opted in to the 6.0 default for `filter-all-dispatcher-types` or `authorizeHttpRequests#filterAllDispatcherTypes` like so:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        .filterAllDispatcherTypes(true)
        // ...
    )
```

#### Kotlin

```java
http {
	authorizeHttpRequests {
		filterAllDispatcherTypes = true
        // ...
	}
}
```

#### Xml

```xml
<http use-authorization-manager="true" filter-all-dispatcher-types="true"/>
```

then the defaults may be removed:

#### Java

```java
http
    .authorizeHttpRequests((authorize) -> authorize
        // ...
    )
```

#### Kotlin

```java
http {
	authorizeHttpRequests {
		// ...
	}
}
```

#### Xml

```xml
<http/>
```

> [!NOTE]
> `once-per-request` applies only when `use-authorization-manager="false"` and `filter-all-dispatcher-types` only applies when `use-authorization-manager="true"`

<a id="compile-with-parameters"></a>

### Compile With `-parameters`

Spring Framework 6.1 [removes LocalVariableTableParameterNameDiscoverer](https://github.com/spring-projects/spring-framework/issues/29559).
This affects how `@PreAuthorize` and other [method security](../../servlet/authorization/method-security.md) annotations will process parameter names.
If you are using method security annotations with parameter names, for example:

#### Method security annotation using `id` parameter name

```java
@PreAuthorize("@authz.checkPermission(#id, authentication)")
public void doSomething(Long id) {
    // ...
}
```

You must compile with `-parameters` to ensure that the parameter names are available at runtime.
For more information about this, please visit the [Upgrading to Spring Framework 6.1 page](https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-6.x#core-container).
