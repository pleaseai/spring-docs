---
title: "Authorization Changes"
source: "ROOT:migration/authorization.adoc"
---

# Authorization Changes

The following sections relate to how to adapt to changes in the authorization support.

<a id="_method_security"></a>

## Method Security

<a id="compile-with-parameters"></a>

### Compile With `-parameters`

Spring Framework 6.1 [removes LocalVariableTableParameterNameDiscoverer](https://github.com/spring-projects/spring-framework/issues/29559).
This affects how `@PreAuthorize` and other [method security](../servlet/authorization/method-security.md) annotations will process parameter names.
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
