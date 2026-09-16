---
title: "LDAP Migrations"
source: "ROOT:migration-7/ldap.adoc"
---

# LDAP Migrations

The following steps relate to changes around how to configure the LDAP components and how to use an embedded LDAP server.

<a id="_use_unboundid_instead_of_apacheds"></a>

## Use `UnboundId` instead of `ApacheDS`

ApacheDS has not had a GA release for a considerable period, and its classes in Spring Security were [deprecated in version 5.2](https://github.com/spring-projects/spring-security/pull/6376).
Consequently, support for ApacheDS will be discontinued in version 7.0.

If you are currently using ApacheDS as an embedded LDAP server, we recommend migrating to [UnboundId](https://ldap.com/unboundid-ldap-sdk-for-java/).
You can find instructions in [this section](../servlet/authentication/passwords/ldap.md#servlet-authentication-ldap-embedded) that describe how to set up an embedded UnboundId LDAP server.
