---
title: "Method Security"
source: "ROOT:servlet/appendix/namespace/method-security.adoc"
---

# Method Security

<a id="nsa-method-security"></a>

## <method-security>

This element is the primary means of adding support for securing methods on Spring Security beans.
Methods can be secured by the use of annotations (defined at the interface or class level) or by defining a set of pointcuts.

<a id="nsa-method-security-attributes"></a>

### <method-security> attributes

<a id="nsa-method-security-pre-post-enabled"></a>

- **pre-post-enabled**
Enables Spring Security’s pre and post invocation annotations (@PreFilter, @PreAuthorize, @PostFilter, @PostAuthorize) for this application context.
Defaults to "true".

<a id="nsa-method-security-secured-enabled"></a>

- **secured-enabled**
Enables Spring Security’s @Secured annotation for this application context.
Defaults to "false".

<a id="nsa-method-security-jsr250-enabled"></a>

- **jsr250-enabled**
Enables JSR-250 authorization annotations (@RolesAllowed, @PermitAll, @DenyAll) for this application context.
Defaults to "false".

<a id="nsa-method-security-mode"></a>

- **mode**
If set to "aspectj", then uses AspectJ to intercept method invocations.

<a id="nsa-method-security-proxy-target-class"></a>

- **proxy-target-class**
If true, class based proxying will be used instead of interface based proxying.
Defaults to "false".

<a id="nsa-method-security-security-context-holder-strategy-ref"></a>

- **security-context-holder-strategy-ref**
Specifies a SecurityContextHolderStrategy to use when retrieving the SecurityContext.
Defaults to the value returned by SecurityContextHolder.getContextHolderStrategy().

<a id="nsa-method-security-observation-registry-ref"></a>

- **observation-registry-ref**
A reference to the `ObservationRegistry` used for the `FilterChain` and related components

<a id="nsa-method-security-children"></a>

### Child Elements of <method-security>

- [expression-handler](http.md#nsa-expression-handler)
- [protect-pointcut](#nsa-protect-pointcut)

<a id="nsa-global-method-security"></a>

## <global-method-security>

This element is the primary means of adding support for securing methods on Spring Security beans.
Methods can be secured by the use of annotations (defined at the interface or class level) or by defining a set of pointcuts as child elements, using AspectJ syntax.

<a id="nsa-global-method-security-attributes"></a>

### <global-method-security> Attributes

<a id="nsa-global-method-security-access-decision-manager-ref"></a>

- **access-decision-manager-ref**
Method security uses the same `AccessDecisionManager` configuration as web security, but this can be overridden using this attribute.
By default an AffirmativeBased implementation is used for with a RoleVoter and an AuthenticatedVoter.

<a id="nsa-global-method-security-authentication-manager-ref"></a>

- **authentication-manager-ref**
A reference to an `AuthenticationManager` that should be used for method security.

<a id="nsa-global-method-security-jsr250-annotations"></a>

- **jsr250-annotations**
Specifies whether JSR-250 style attributes are to be used (for example "RolesAllowed").
This will require the javax.annotation.security classes on the classpath.
Setting this to true also adds a `Jsr250Voter` to the `AccessDecisionManager`, so you need to make sure you do this if you are using a custom implementation and want to use these annotations.

<a id="nsa-global-method-security-metadata-source-ref"></a>

- **metadata-source-ref**
An external `MethodSecurityMetadataSource` instance can be supplied which will take priority over other sources (such as the default annotations).

<a id="nsa-global-method-security-mode"></a>

- **mode**
This attribute can be set to "aspectj" to specify that AspectJ should be used instead of the default Spring AOP.
Secured methods must be woven with the `AnnotationSecurityAspect` from the `spring-security-aspects` module.

It is important to note that AspectJ follows Java’s rule that annotations on interfaces are not inherited.
This means that methods that define the Security annotations on the interface will not be secured.
Instead, you must place the Security annotation on the class when using AspectJ.

<a id="nsa-global-method-security-order"></a>

- **order**
Allows the advice "order" to be set for the method security interceptor.

<a id="nsa-global-method-security-pre-post-annotations"></a>

- **pre-post-annotations**
Specifies whether the use of Spring Security’s pre and post invocation annotations (@PreFilter, @PreAuthorize, @PostFilter, @PostAuthorize) should be enabled for this application context.
Defaults to "disabled".

<a id="nsa-global-method-security-proxy-target-class"></a>

- **proxy-target-class**
If true, class based proxying will be used instead of interface based proxying.

<a id="nsa-global-method-security-run-as-manager-ref"></a>

- **run-as-manager-ref**
A reference to an optional `RunAsManager` implementation which will be used by the configured `MethodSecurityInterceptor`

<a id="nsa-global-method-security-secured-annotations"></a>

- **secured-annotations**
Specifies whether the use of Spring Security’s @Secured annotations should be enabled for this application context.
Defaults to "disabled".

<a id="nsa-global-method-security-children"></a>

### Child Elements of <global-method-security>

- [after-invocation-provider](#nsa-after-invocation-provider)
- [expression-handler](http.md#nsa-expression-handler)
- [pre-post-annotation-handling](#nsa-pre-post-annotation-handling)
- [protect-pointcut](#nsa-protect-pointcut)

<a id="nsa-after-invocation-provider"></a>

## <after-invocation-provider>

This element can be used to decorate an `AfterInvocationProvider` for use by the security interceptor maintained by the `<global-method-security>` namespace.
You can define zero or more of these within the `global-method-security` element, each with a `ref` attribute pointing to an `AfterInvocationProvider` bean instance within your application context.

<a id="nsa-after-invocation-provider-parents"></a>

### Parent Elements of <after-invocation-provider>

- [global-method-security](#nsa-global-method-security)

<a id="nsa-after-invocation-provider-attributes"></a>

### <after-invocation-provider> Attributes

<a id="nsa-after-invocation-provider-ref"></a>

- **ref**
Defines a reference to a Spring bean that implements `AfterInvocationProvider`.

<a id="nsa-pre-post-annotation-handling"></a>

## <pre-post-annotation-handling>

Allows the default expression-based mechanism for handling Spring Security’s pre and post invocation annotations (@PreFilter, @PreAuthorize, @PostFilter, @PostAuthorize) to be replaced entirely.
Only applies if these annotations are enabled.

<a id="nsa-pre-post-annotation-handling-parents"></a>

### Parent Elements of <pre-post-annotation-handling>

- [global-method-security](#nsa-global-method-security)

<a id="nsa-pre-post-annotation-handling-children"></a>

### Child Elements of <pre-post-annotation-handling>

- [invocation-attribute-factory](#nsa-invocation-attribute-factory)
- [post-invocation-advice](#nsa-post-invocation-advice)
- [pre-invocation-advice](#nsa-pre-invocation-advice)

<a id="nsa-invocation-attribute-factory"></a>

## <invocation-attribute-factory>

Defines the PrePostInvocationAttributeFactory instance which is used to generate pre and post invocation metadata from the annotated methods.

<a id="nsa-invocation-attribute-factory-parents"></a>

### Parent Elements of <invocation-attribute-factory>

- [pre-post-annotation-handling](#nsa-pre-post-annotation-handling)

<a id="nsa-invocation-attribute-factory-attributes"></a>

### <invocation-attribute-factory> Attributes

<a id="nsa-invocation-attribute-factory-ref"></a>

- **ref**
Defines a reference to a Spring bean Id.

<a id="nsa-post-invocation-advice"></a>

## <post-invocation-advice>

Customizes the `PostInvocationAdviceProvider` with the ref as the `PostInvocationAuthorizationAdvice` for the <pre-post-annotation-handling> element.

<a id="nsa-post-invocation-advice-parents"></a>

### Parent Elements of <post-invocation-advice>

- [pre-post-annotation-handling](#nsa-pre-post-annotation-handling)

<a id="nsa-post-invocation-advice-attributes"></a>

### <post-invocation-advice> Attributes

<a id="nsa-post-invocation-advice-ref"></a>

- **ref**
Defines a reference to a Spring bean Id.

<a id="nsa-pre-invocation-advice"></a>

## <pre-invocation-advice>

Customizes the `PreInvocationAuthorizationAdviceVoter` with the ref as the `PreInvocationAuthorizationAdviceVoter` for the <pre-post-annotation-handling> element.

<a id="nsa-pre-invocation-advice-parents"></a>

### Parent Elements of <pre-invocation-advice>

- [pre-post-annotation-handling](#nsa-pre-post-annotation-handling)

<a id="nsa-pre-invocation-advice-attributes"></a>

### <pre-invocation-advice> Attributes

<a id="nsa-pre-invocation-advice-ref"></a>

- **ref**
Defines a reference to a Spring bean Id.

<a id="nsa-protect-pointcut"></a>

## Securing Methods using

`<protect-pointcut>`
Rather than defining security attributes on an individual method or class basis using the `@Secured` annotation, you can define cross-cutting security constraints across whole sets of methods and interfaces in your service layer using the `<protect-pointcut>` element.
You can find an example in the [namespace introduction](../../authorization/method-security.md#ns-protect-pointcut).

<a id="nsa-protect-pointcut-parents"></a>

### Parent Elements of <protect-pointcut>

- [global-method-security](#nsa-global-method-security)
- [method-security](#nsa-method-security)

<a id="nsa-protect-pointcut-attributes"></a>

### <protect-pointcut> Attributes

<a id="nsa-protect-pointcut-access"></a>

- **access**
Access configuration attributes list that applies to all methods matching the pointcut, e.g.
"ROLE\_A,ROLE\_B"

<a id="nsa-protect-pointcut-expression"></a>

- **expression**
An AspectJ expression, including the `execution` keyword.
For example, `execution(int com.foo.TargetObject.countLength(String))`.

<a id="nsa-intercept-methods"></a>

## <intercept-methods>

Can be used inside a bean definition to add a security interceptor to the bean and set up access configuration attributes for the bean’s methods

<a id="nsa-intercept-methods-attributes"></a>

### <intercept-methods> Attributes

<a id="nsa-intercept-methods-use-authorization-manager"></a>

- **use-authorization-manager**
Use AuthorizationManager API instead of AccessDecisionManager (defaults to true)

<a id="nsa-intercept-methods-authorization-manager-ref"></a>

- **authorization-manager-ref**
Optional AuthorizationManager bean ID to be used instead of the default (supersedes use-authorization-manager)

<a id="nsa-intercept-methods-access-decision-manager-ref"></a>

- **access-decision-manager-ref**
Optional AccessDecisionManager bean ID to be used by the created method security interceptor.

<a id="nsa-intercept-methods-children"></a>

### Child Elements of <intercept-methods>

- [protect](#nsa-protect)

<a id="nsa-method-security-metadata-source"></a>

## <method-security-metadata-source>

Creates a MethodSecurityMetadataSource instance

<a id="nsa-method-security-metadata-source-attributes"></a>

### <method-security-metadata-source> Attributes

<a id="nsa-method-security-metadata-source-id"></a>

- **id**
A bean identifier, used for referring to the bean elsewhere in the context.

<a id="nsa-method-security-metadata-source-use-expressions"></a>

- **use-expressions**
Enables the use of expressions in the 'access' attributes in <intercept-url> elements rather than the traditional list of configuration attributes.
Defaults to 'false'.
If enabled, each attribute should contain a single Boolean expression.
If the expression evaluates to 'true', access will be granted.

<a id="nsa-method-security-metadata-source-children"></a>

### Child Elements of <method-security-metadata-source>

- [protect](#nsa-protect)

<a id="nsa-protect"></a>

## <protect>

Defines a protected method and the access control configuration attributes that apply to it.
We strongly advise you NOT to mix "protect" declarations with any services provided "global-method-security".

<a id="nsa-protect-parents"></a>

### Parent Elements of <protect>

- [intercept-methods](#nsa-intercept-methods)
- [method-security-metadata-source](#nsa-method-security-metadata-source)

<a id="nsa-protect-attributes"></a>

### <protect> Attributes

<a id="nsa-protect-access"></a>

- **access**
Access configuration attributes list that applies to the method, e.g.
"ROLE\_A,ROLE\_B".

<a id="nsa-protect-method"></a>

- **method**
A method name
