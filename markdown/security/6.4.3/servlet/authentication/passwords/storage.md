---
title: "Storage Mechanisms"
source: "ROOT:servlet/authentication/passwords/storage.adoc"
---

<a id="servlet-authentication-unpwd-storage"></a>

# Storage Mechanisms

Each of the supported mechanisms for reading a username and password can use any of the supported storage mechanisms:

- Simple Storage with [In-Memory Authentication](in-memory.md#servlet-authentication-inmemory)
- Relational Databases with [JDBC Authentication](jdbc.md#servlet-authentication-jdbc)
- Custom data stores with [UserDetailsService](user-details-service.md#servlet-authentication-userdetailsservice)
- LDAP storage with [LDAP Authentication](ldap.md#servlet-authentication-ldap)
