---
title: "Querydsl Support"
source: "ROOT:ldap/querydsl.adoc"
---

<a id="ldap.querydsl"></a>

# Querydsl Support

- An Annotation Processor, `LdapAnnotationProcessor`, for generating Querydsl classes based on Spring LDAP ODM annotations.
See [Object-Directory Mapping](https://docs.spring.io/spring-ldap/docs/3.2.10/reference/#odm) for more information on the ODM annotations.
- A Query implementation, `QueryDslLdapQuery`, for building and running Querydsl queries in code.
- Spring Data repository support for Querydsl predicates. `QueryDslPredicateExecutor` includes a number of additional methods with appropriate parameters.
You can extend this interface (along with `LdapRepository`) to include this support in your repository.
