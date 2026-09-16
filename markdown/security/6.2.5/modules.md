---
title: "Project Modules and Dependencies"
source: "ROOT:modules.adoc"
---

<a id="modules"></a>

# Project Modules and Dependencies

Even if you do not use Maven, we recommend that you consult the `pom.xml` files to get an idea of third-party dependencies and versions.
Another good idea is to examine the libraries that are included in the sample applications.

This section provides a reference of the modules in Spring Security and the additional dependencies that they require in order to function in a running application.
We do not include dependencies that are used only when building or testing Spring Security itself.
Nor do we include transitive dependencies that are required by external dependencies.

The version of Spring required is listed on the project website, so the specific versions are omitted for Spring dependencies in the examples.
Note that some of the dependencies listed as “optional” in the examples may still be required for other non-security functionality in a Spring application
Also dependencies listed as “optional” may not actually be marked as such in the project’s Maven POM files if they are used in most applications.
They are “optional” only in the sense that you do not need them unless you use the specified functionality.

Where a module depends on another Spring Security module, the non-optional dependencies of the module it depends on are also assumed to be required and are not listed separately.

<a id="spring-security-core"></a>

## Core — `spring-security-core.jar`

This module contains core authentication and access-control classes and interfaces, remoting support, and basic provisioning APIs.
It is required by any application that uses Spring Security.
It supports standalone applications, remote clients, method (service layer) security, and JDBC user provisioning.
It contains the following top-level packages:

- `org.springframework.security.core`
- `org.springframework.security.access`
- `org.springframework.security.authentication`
- `org.springframework.security.provisioning`

| Dependency | Version | Description |
| --- | --- | --- |
| ehcache | 1.6.2 | Required if the Ehcache-based user cache implementation is used (optional). |
| spring-aop |  | Method security is based on Spring AOP |
| spring-beans |  | Required for Spring configuration |
| spring-expression |  | Required for expression-based method security (optional) |
| spring-jdbc |  | Required if using a database to store user data (optional). |
| spring-tx |  | Required if using a database to store user data (optional). |
| aspectjrt | 1.6.10 | Required if using AspectJ support (optional). |
| jsr250-api | 1.0 | Required if you are using JSR-250 method-security annotations (optional). |

<a id="spring-security-remoting"></a>

## Remoting — `spring-security-remoting.jar`

This module provides integration with Spring Remoting.
You do not need this unless you are writing a remote client that uses Spring Remoting.
The main package is `org.springframework.security.remoting`.

| Dependency | Version | Description |
| --- | --- | --- |
| spring-security-core |  |  |
| spring-web |  | Required for clients which use HTTP remoting support. |

<a id="spring-security-web"></a>

## Web — `spring-security-web.jar`

This module contains filters and related web-security infrastructure code.
It contains anything with a servlet API dependency.
You need it if you require Spring Security web authentication services and URL-based access-control.
The main package is `org.springframework.security.web`.

| Dependency | Version | Description |
| --- | --- | --- |
| spring-security-core |  |  |
| spring-web |  | Required for clients that use HTTP remoting support. |
| spring-jdbc |  | Required for a JDBC-based persistent remember-me token repository (optional). |
| spring-tx |  | Required by remember-me persistent token repository implementations (optional). |

<a id="spring-security-config"></a>

## Config — `spring-security-config.jar`

This module contains the security namespace parsing code and Java configuration code.
You need it if you use the Spring Security XML namespace for configuration or Spring Security’s Java Configuration support.
The main package is `org.springframework.security.config`.
None of the classes are intended for direct use in an application.

| Dependency | Version | Description |
| --- | --- | --- |
| spring-security-core |  |  |
| spring-security-web |  | Required if you are using any web-related namespace configuration (optional). |
| spring-security-ldap |  | Required if you are using the LDAP namespace options (optional). |
| aspectjweaver | 1.6.10 | Required if using the protect-pointcut namespace syntax (optional). |

<a id="spring-security-ldap"></a>

## LDAP — `spring-security-ldap.jar`

This module provides LDAP authentication and provisioning code.
It is required if you need to use LDAP authentication or manage LDAP user entries.
The top-level package is `org.springframework.security.ldap`.

| Dependency | Version | Description |
| --- | --- | --- |
| spring-security-core |  |  |
| spring-ldap-core | 1.3.0 | LDAP support is based on Spring LDAP. |
| spring-tx |  | Data exception classes are required. |
| apache-ds | 1.5.5 | Required if you are using an embedded LDAP server (optional). If you use `apache-ds`, the `apacheds-core`, `apacheds-core-entry`, `apacheds-protocol-shared`, `apacheds-protocol-ldap` and `apacheds-server-jndi` modules are required. |
| shared-ldap | 0.9.15 | Required if you are using an embedded LDAP server (optional). |
| ldapsdk | 4.1 | Mozilla LdapSDK. Used for decoding LDAP password policy controls if you are using password-policy functionality with OpenLDAP, for example. |

<a id="spring-security-oauth2-core"></a>

## OAuth 2.0 Core — `spring-security-oauth2-core.jar`

`spring-security-oauth2-core.jar` contains core classes and interfaces that provide support for the OAuth 2.0 Authorization Framework and for OpenID Connect Core 1.0.
It is required by applications that use OAuth 2.0 or OpenID Connect Core 1.0, such as client, resource server, and authorization server.
The top-level package is `org.springframework.security.oauth2.core`.

<a id="spring-security-oauth2-client"></a>

## OAuth 2.0 Client — `spring-security-oauth2-client.jar`

`spring-security-oauth2-client.jar` contains Spring Security’s client support for OAuth 2.0 Authorization Framework and OpenID Connect Core 1.0.
It is required by applications that use OAuth 2.0 or OpenID Connect Core 1.0, such as the client, the resource server, and the authorization server.
The top-level package is `org.springframework.security.oauth2.core`.

<a id="spring-security-oauth2-jose"></a>

## OAuth 2.0 JOSE — `spring-security-oauth2-jose.jar`

`spring-security-oauth2-jose.jar` contains Spring Security’s support for the JOSE (Javascript Object Signing and Encryption) framework.
The JOSE framework is intended to provide a method to securely transfer claims between parties.
It is built from a collection of specifications:

- JSON Web Token (JWT)
- JSON Web Signature (JWS)
- JSON Web Encryption (JWE)
- JSON Web Key (JWK)

It contains the following top-level packages:

- `org.springframework.security.oauth2.jwt`
- `org.springframework.security.oauth2.jose`

<a id="spring-security-oauth2-resource-server"></a>

## OAuth 2.0 Resource Server — `spring-security-oauth2-resource-server.jar`

`spring-security-oauth2-resource-server.jar` contains Spring Security’s support for OAuth 2.0 Resource Servers.
It is used to protect APIs by using OAuth 2.0 Bearer Tokens.
The top-level package is `org.springframework.security.oauth2.server.resource`.

<a id="spring-security-acl"></a>

## ACL — `spring-security-acl.jar`

This module contains a specialized domain object ACL implementation.
It is used to apply security to specific domain object instances within your application.
The top-level package is `org.springframework.security.acls`.

| Dependency | Version | Description |
| --- | --- | --- |
| spring-security-core |  |  |
| ehcache | 1.6.2 | Required if the Ehcache-based ACL cache implementation is used (optional if you use your own implementation). |
| spring-jdbc |  | Required if you are using the default JDBC-based AclService (optional if you implement your own). |
| spring-tx |  | Required if you are using the default JDBC-based AclService (optional if you implement your own). |

<a id="spring-security-cas"></a>

## CAS — `spring-security-cas.jar`

This module contains Spring Security’s CAS client integration.
You should use it if you want to use Spring Security web authentication with a CAS single sign-on server.
The top-level package is `org.springframework.security.cas`.

| Dependency | Version | Description |
| --- | --- | --- |
| spring-security-core |  |  |
| spring-security-web |  |  |
| cas-client-core | 3.1.12 | The JA-SIG CAS Client. This is the basis of the Spring Security integration. |
| ehcache | 1.6.2 | Required if you are using the Ehcache-based ticket cache (optional). |

<a id="spring-security-test"></a>

## Test — `spring-security-test.jar`

This module contains support for testing with Spring Security.

<a id="spring-security-taglibs"></a>

## Taglibs — `spring-security-taglibs.jar`

Provides Spring Security’s JSP tag implementations.

| Dependency | Version | Description |
| --- | --- | --- |
| spring-security-core |  |  |
| spring-security-web |  |  |
| spring-security-acl |  | Required if you are using the `accesscontrollist` tag or `hasPermission()` expressions with ACLs (optional). |
| spring-expression |  | Required if you are using SPEL expressions in your tag access constraints. |
