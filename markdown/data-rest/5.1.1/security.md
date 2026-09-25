---
title: "Security"
source: "ROOT:security.adoc"
---

<a id="security"></a>

# Security

Spring Data REST works quite well with Spring Security. This section shows examples of how to secure your Spring Data REST services with method-level security.

<a id="security.pre-and-post"></a>

## `@Pre` and `@Post` Security

The following example from Spring Data REST’s test suite shows Spring Security’s [PreAuthorization model](https://docs.spring.io/spring-security/reference/servlet/authorization/expression-based.html#_access_control_using_preauthorize_and_postauthorize) (the most sophisticated security model):

```java
@PreAuthorize("hasRole('ROLE_USER')") // <1>
public interface PreAuthorizedOrderRepository extends CrudRepository<Order, UUID> {

	@PreAuthorize("hasRole('ROLE_ADMIN')")
	@Override
	Optional<Order> findById(UUID id);

	@PreAuthorize("hasRole('ROLE_ADMIN')") // <2>
	@Override
	void deleteById(UUID aLong);

	@PreAuthorize("hasRole('ROLE_ADMIN')")
	@Override
	void delete(Order order);

	@PreAuthorize("hasRole('ROLE_ADMIN')")
	@Override
	void deleteAll(Iterable<? extends Order> orders);

	@PreAuthorize("hasRole('ROLE_ADMIN')")
	@Override
	void deleteAll();
}
```

1. This Spring Security annotation secures the entire repository. The [Spring Security SpEL expression](https://docs.spring.io/spring-security/reference/servlet/authorization/expression-based.html) indicates that the principal must have `ROLE_USER` in its collection of roles.
1. To change method-level settings, you must override the method signature and apply a Spring Security annotation. In this case, the method overrides the repository-level settings with the requirement that the user have `ROLE_ADMIN` to perform a delete.

The preceding example shows a standard Spring Data repository definition extending `CrudRepository` with some key changes: the specification of particular roles to access the various methods:

> [!IMPORTANT]
> Repository and method level security settings do not combine. Instead, method-level settings override repository level settings.

The previous example illustrates that `CrudRepository`, in fact, has four delete methods. You must override all delete methods to properly secure it.

<a id="security.secured"></a>

## @Secured security

The following example shows Spring Security’s older `@Secured` annotation, which is purely role-based:

```java
@Secured("ROLE_USER") // <1>
@RepositoryRestResource(collectionResourceRel = "people", path = "people")
public interface SecuredPersonRepository extends CrudRepository<Person, UUID> {

	@Secured("ROLE_ADMIN") // <2>
	@Override
	void deleteById(UUID aLong);

	@Secured("ROLE_ADMIN")
	@Override
	void delete(Person person);

	@Secured("ROLE_ADMIN")
	@Override
	void deleteAll(Iterable<? extends Person> persons);

	@Secured("ROLE_ADMIN")
	@Override
	void deleteAll();
}
```

1. This results in the same security check as the previous example but has less flexibility. It allows only roles as the means to restrict access.
1. Again, this shows that delete methods require `ROLE_ADMIN`.

> [!NOTE]
> If you start with a new project or first apply Spring Security, `@PreAuthorize` is the recommended solution. If are already using Spring Security with `@Secured` in other parts of your app, you can continue on that path without rewriting everything.

<a id="security.enable-method-level"></a>

## Enabling Method-level Security

To configure method-level security, here is a brief snippet from Spring Data REST’s test suite:

```java
@Configuration // <1>
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, prePostEnabled = true) // <2>
class SecurityConfiguration { // <3>
	...
}
```

1. This is a Spring configuration class.
1. It uses Spring Security’s `@EnableGlobalMethodSecurity` annotation to enable both `@Secured` and `@Pre`/`@Post` support. NOTE: You don’t have to use both. This particular case is used to prove both versions work with Spring Data REST.
1. This class extends Spring Security’s `WebSecurityConfigurerAdapter` which is used for pure Java configuration of security.

The rest of the configuration class is not listed, because it follows [standard practices](https://docs.spring.io/spring-security/reference/servlet/configuration/java.html) that you can read about in the Spring Security reference docs.
