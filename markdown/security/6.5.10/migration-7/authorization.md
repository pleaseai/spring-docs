---
title: "Authorization Changes"
source: "ROOT:migration-7/authorization.adoc"
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

<a id="_favor_annotationtemplateexpressiondefaults_over_preposttemplatedefaults"></a>

### Favor `AnnotationTemplateExpressionDefaults` over `PrePostTemplateDefaults`

In Spring Security 7, `AnnotationTemplateExpressionDefaults` will be included by default.

If you are customizing `PrePostTemplateDefaults` or simply want to see how your application responds to `AnnotationTemplateExpressionDefaults`, you can publish an `AnnotationTemplateExpressionDefaults` bean instead of a `PrePostTemplateDefaults` method:

#### Java

```java
@Bean
static AnnotationTemplateExpressionDefaults templateExpressionDefaults() {
	return new AnnotationTemplateExpressionDefaults();
}
```

#### Kotlin

```kotlin
companion object {
    @Bean
    fun templateExpressionDefaults() = AnnotationTemplateExpressionDefaults()
}
```

#### Xml

```xml
<b:bean id="templateExpressionDefaults" class="org.springframework.security.core.annotation.AnnotationTemplateExpressionDefaults"/>
```

<a id="_i_am_publishing_an_authorizationadvisor_bean"></a>

#### I Am Publishing an AuthorizationAdvisor Bean

If you are publishing an `AuthorizationAdvisor` bean, like `AuthorizationManagerBeforeMethodInterceptor`, `AuthorizationManagerAfterMethodInterceptor`, `PreFilterAuthorizationMethodInterceptor`, or `PostFilterAuthorizationMethodInterceptor`, you can do the same by calling `setTemplateDefaults` with an `AnnotationTemplateExpressionDefaults` instance instead:

#### Java

```java
@Bean
@Role(BeanDescription.ROLE_INFRASTRUCTURE)
static Advisor preFilter() {
	PreFilterAuthorizationMethodInterceptor interceptor = new PreFilterAuthorizationMethodInterceptor();
	interceptor.setTemplateDefaults(new AnnotationTemplateExpressionDefaults());
	return interceptor;
}
```

#### Kotlin

```kotlin
companion object {
    @Bean
    @Role(BeanDescription.ROLE_INFRASTRUCTURE)
    fun preFilter(): Advisor {
        val interceptor = PreFilterAuthorizationMethodInterceptor()
        interceptor.setTemplateDefaults(AnnotationTemplateExpressionDefaults)
        return interceptor
    }
}
```

<a id="_publish_authorizationadvisor_instances_instead_of_adding_them_in_a_customizerauthorizationadvisorproxyfactory"></a>

### Publish `AuthorizationAdvisor` instances instead of adding them in a `Customizer<AuthorizationAdvisorProxyFactory>`

While the ability to customize the `AuthorizationAdvisorProxyFactory` instance will remain in Spring Security 7, the ability to add advisors will be removed in favor of picking up published `AuthorizationAdvisor` beans.

If you are not calling `AuthorizationAdvisorProxyFactory#setAdvisors` or `AuthorizationAdvisorProxyFactory#addAdvisor`, you need do nothing.

If you are, publish the `AuthorizationAdvisor` bean instead and Spring Security will pick it up and apply it automatically.
