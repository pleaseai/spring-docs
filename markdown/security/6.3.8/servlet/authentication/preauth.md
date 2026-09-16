---
title: "Pre-Authentication Scenarios"
source: "ROOT:servlet/authentication/preauth.adoc"
---

<a id="servlet-preauth"></a>

# Pre-Authentication Scenarios

Examples include X.509, Siteminder, and authentication by the Java EE container in which the application runs.
When using pre-authentication, Spring Security has to:

- Identify the user making the request.
- Obtain the authorities for the user.

The details depend on the external authentication mechanism.
A user might be identified by their certificate information in the case of X.509, or by an HTTP request header in the case of Siteminder.
If relying on container authentication, the user is identified by calling the `getUserPrincipal()` method on the incoming HTTP request.
In some cases, the external mechanism may supply role and authority information for the user. However, in other cases, you must obtain the authorities from a separate source, such as a `UserDetailsService`.

<a id="_pre_authentication_framework_classes"></a>

## Pre-Authentication Framework Classes

Because most pre-authentication mechanisms follow the same pattern, Spring Security has a set of classes that provide an internal framework for implementing pre-authenticated authentication providers.
This removes duplication and lets new implementations be added in a structured fashion, without having to write everything from scratch.
You need not know about these classes if you want to use something like [X.509 authentication](x509.md#servlet-x509), as it already has a namespace configuration option which is simpler to use and get started with.
If you need to use explicit bean configuration or are planning on writing your own implementation, you need an understanding of how the provided implementations work.
You can find the classes under the `org.springframework.security.web.authentication.preauth`.
We provide only an outline here, so you should consult the Javadoc and source where appropriate.

<a id="_abstractpreauthenticatedprocessingfilter"></a>

### AbstractPreAuthenticatedProcessingFilter

This class checks the current contents of the security context and, if it is empty, tries to extract user information from the HTTP request and submit it to the `AuthenticationManager`.
Subclasses override the following methods to obtain this information.

#### Java

```java
protected abstract Object getPreAuthenticatedPrincipal(HttpServletRequest request);

protected abstract Object getPreAuthenticatedCredentials(HttpServletRequest request);
```

#### Kotlin

```kotlin
protected abstract fun getPreAuthenticatedPrincipal(request: HttpServletRequest): Any?

protected abstract fun getPreAuthenticatedCredentials(request: HttpServletRequest): Any?
```

After calling these, the filter creates a `PreAuthenticatedAuthenticationToken` that contains the returned data and submits it for authentication.
By “authentication” here, we really just mean further processing to perhaps load the user’s authorities, but the standard Spring Security authentication architecture is followed.

As other Spring Security authentication filters, the pre-authentication filter has an `authenticationDetailsSource` property, which, by default, creates a `WebAuthenticationDetails` object to store additional information, such as the session identifier and the originating IP address in the `details` property of the `Authentication` object.
In cases where user role information can be obtained from the pre-authentication mechanism, the data is also stored in this property, with the details implementing the `GrantedAuthoritiesContainer` interface.
This enables the authentication provider to read the authorities which were externally allocated to the user.
We look at a concrete example next.

<a id="j2ee-preauth-details"></a>

#### J2eeBasedPreAuthenticatedWebAuthenticationDetailsSource

If the filter is configured with an `authenticationDetailsSource`, which is an instance of this class, the authority information is obtained by calling the `isUserInRole(String role)` method for each of a pre-determined set of “mappable roles”.
The class gets these from a configured `MappableAttributesRetriever`.
Possible implementations include hard-coding a list in the application context and reading the role information from the `<security-role>` information in a `web.xml` file.
The pre-authentication sample application uses the latter approach.

There is an additional stage where the roles (or attributes) are mapped to Spring Security `GrantedAuthority` objects by using a configured `Attributes2GrantedAuthoritiesMapper`.
The default just adds the usual `ROLE_` prefix to the names, but it gives you full control over the behavior.

<a id="_preauthenticatedauthenticationprovider"></a>

### PreAuthenticatedAuthenticationProvider

The pre-authenticated provider has little more to do than load the `UserDetails` object for the user.
It does this by delegating to an `AuthenticationUserDetailsService`.
The latter is similar to the standard `UserDetailsService` but takes an `Authentication` object rather than just user name:

```java
public interface AuthenticationUserDetailsService {
	UserDetails loadUserDetails(Authentication token) throws UsernameNotFoundException;
}
```

This interface may also have other uses, but, with pre-authentication, it allows access to the authorities that were packaged in the `Authentication` object, as we saw in the previous section.
The `PreAuthenticatedGrantedAuthoritiesUserDetailsService` class does this.
Alternatively, it may delegate to a standard `UserDetailsService` through the `UserDetailsByNameServiceWrapper` implementation.

<a id="_http403forbiddenentrypoint"></a>

### Http403ForbiddenEntryPoint

The [`AuthenticationEntryPoint`](architecture.md#servlet-authentication-authenticationentrypoint) is responsible for kick-starting the authentication process for an unauthenticated user (when they try to access a protected resource). However, in the pre-authenticated case, this does not apply.
You would only configure the `ExceptionTranslationFilter` with an instance of this class if you do not use pre-authentication in combination with other authentication mechanisms.
It is called if the user is rejected by the `AbstractPreAuthenticatedProcessingFilter`, resulting in a null authentication.
It always returns a `403`-forbidden response code if called.

<a id="_concrete_implementations"></a>

## Concrete Implementations

X.509 authentication is covered in its [own chapter](x509.md#servlet-x509).
Here, we look at some classes which provide support for other pre-authenticated scenarios.

<a id="_request_header_authentication_siteminder"></a>

### Request-Header Authentication (Siteminder)

An external authentication system may supply information to the application by setting specific headers on the HTTP request.
A well-known example of this is Siteminder, which passes the username in a header called `SM_USER`.
This mechanism is supported by the `RequestHeaderAuthenticationFilter` class, which only extracts the username from the header.
It defaults to using a name of `SM_USER` as the header name.
See the Javadoc for more details.

> [!TIP]
> When using a system like this, the framework performs no authentication checks at all, and it is *extremely* important that the external system is configured properly and protects all access to the application.
> If an attacker is able to forge the headers in their original request without this being detected, they could potentially choose any username they wished.

<a id="_siteminder_example_configuration"></a>

#### Siteminder Example Configuration

The following example shows a typical configuration that uses this filter:

```xml
<security:http>
<!-- Additional http configuration omitted -->
<security:custom-filter position="PRE_AUTH_FILTER" ref="siteminderFilter" />
</security:http>

<bean id="siteminderFilter" class="org.springframework.security.web.authentication.preauth.RequestHeaderAuthenticationFilter">
<property name="principalRequestHeader" value="SM_USER"/>
<property name="authenticationManager" ref="authenticationManager" />
</bean>

<bean id="preauthAuthProvider" class="org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationProvider">
<property name="preAuthenticatedUserDetailsService">
	<bean id="userDetailsServiceWrapper"
		class="org.springframework.security.core.userdetails.UserDetailsByNameServiceWrapper">
	<property name="userDetailsService" ref="userDetailsService"/>
	</bean>
</property>
</bean>

<security:authentication-manager alias="authenticationManager">
<security:authentication-provider ref="preauthAuthProvider" />
</security:authentication-manager>
```

We’ve assumed here that the [security namespace](../configuration/xml-namespace.md#ns-config) is being used for configuration.
It’s also assumed that you have added a `UserDetailsService` (called "userDetailsService") to your configuration to load the user’s roles.

<a id="_java_ee_container_authentication"></a>

### Java EE Container Authentication

The `J2eePreAuthenticatedProcessingFilter` class extracts the username from the `userPrincipal` property of the `HttpServletRequest`.
Use of this filter would usually be combined with the use of Java EE roles, as described earlier in [J2eeBasedPreAuthenticatedWebAuthenticationDetailsSource](#j2ee-preauth-details).

There is a [sample application](https://github.com/spring-projects/spring-security/tree/5.4.x/samples/xml/preauth) that uses this approach in the codebase, so get hold of the code from Github and have a look at the application context file if you are interested.
