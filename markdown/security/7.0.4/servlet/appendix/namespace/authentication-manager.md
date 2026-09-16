---
title: "Authentication Services"
source: "ROOT:servlet/appendix/namespace/authentication-manager.adoc"
---

<a id="nsa-authentication"></a>

# Authentication Services

This creates an instance of Spring Security’s `ProviderManager` class, which needs to be configured with a list of one or more `AuthenticationProvider` instances.
These can either be created using syntax elements provided by the namespace, or they can be standard bean definitions, marked for addition to the list using the `authentication-provider` element.

<a id="nsa-authentication-manager"></a>

## <authentication-manager>

Every Spring Security application which uses the namespace must have include this element somewhere.
It is responsible for registering the `AuthenticationManager` which provides authentication services to the application.
All elements which create `AuthenticationProvider` instances should be children of this element.

<a id="nsa-authentication-manager-attributes"></a>

### <authentication-manager> Attributes

<a id="nsa-authentication-manager-alias"></a>

- **alias**
This attribute allows you to define an alias name for the internal instance for use in your own configuration.

<a id="nsa-authentication-manager-erase-credentials"></a>

- **erase-credentials**
If set to true, the AuthenticationManager will attempt to clear any credentials data in the returned Authentication object, once the user has been authenticated.
Literally it maps to the `eraseCredentialsAfterAuthentication` property of the [`ProviderManager`](../../authentication/architecture.md#servlet-authentication-providermanager).

<a id="nsa-authentication-manager-observation-registry-ref"></a>

- **observation-registry-ref**
A reference to the `ObservationRegistry` used for the `FilterChain` and related components

<a id="nsa-authentication-manager-id"></a>

- **id**
This attribute allows you to define an id for the internal instance for use in your own configuration.
It is the same as the alias element, but provides a more consistent experience with elements that use the id attribute.

<a id="nsa-authentication-manager-children"></a>

### Child Elements of <authentication-manager>

- [authentication-provider](#nsa-authentication-provider)
- [ldap-authentication-provider](ldap.md#nsa-ldap-authentication-provider)

<a id="nsa-authentication-provider"></a>

## <authentication-provider>

Unless used with a `ref` attribute, this element is shorthand for configuring a `DaoAuthenticationProvider`.
`DaoAuthenticationProvider` loads user information from a `UserDetailsService` and compares the username/password combination with the values supplied at login.
The `UserDetailsService` instance can be defined either by using an available namespace element (`jdbc-user-service` or by using the `user-service-ref` attribute to point to a bean defined elsewhere in the application context).

<a id="nsa-authentication-provider-parents"></a>

### Parent Elements of <authentication-provider>

- [authentication-manager](#nsa-authentication-manager)

<a id="nsa-authentication-provider-attributes"></a>

### <authentication-provider> Attributes

<a id="nsa-authentication-provider-ref"></a>

- **ref**
Defines a reference to a Spring bean that implements `AuthenticationProvider`.

If you have written your own `AuthenticationProvider` implementation (or want to configure one of Spring Security’s own implementations as a traditional bean for some reason, then you can use the following syntax to add it to the internal list of `ProviderManager`:

```xml

<security:authentication-manager>
  <security:authentication-provider ref="myAuthenticationProvider" />
</security:authentication-manager>
<bean id="myAuthenticationProvider" class="com.something.MyAuthenticationProvider"/>

```

<a id="nsa-authentication-provider-user-service-ref"></a>

- **user-service-ref**
A reference to a bean that implements UserDetailsService that may be created using the standard bean element or the custom user-service element.

<a id="nsa-authentication-provider-children"></a>

### Child Elements of <authentication-provider>

- [jdbc-user-service](#nsa-jdbc-user-service)
- [ldap-user-service](ldap.md#nsa-ldap-user-service)
- [password-encoder](#nsa-password-encoder)
- [user-service](#nsa-user-service)

<a id="nsa-jdbc-user-service"></a>

## <jdbc-user-service>

Causes creation of a JDBC-based UserDetailsService.

<a id="nsa-jdbc-user-service-attributes"></a>

### <jdbc-user-service> Attributes

<a id="nsa-jdbc-user-service-authorities-by-username-query"></a>

- **authorities-by-username-query**
An SQL statement to query for a user’s granted authorities given a username.

The default is

```
select username, authority from authorities where username = ?
```

<a id="nsa-jdbc-user-service-cache-ref"></a>

- **cache-ref**
Defines a reference to a cache for use with a UserDetailsService.

<a id="nsa-jdbc-user-service-data-source-ref"></a>

- **data-source-ref**
The bean ID of the DataSource which provides the required tables.

<a id="nsa-jdbc-user-service-group-authorities-by-username-query"></a>

- **group-authorities-by-username-query**
An SQL statement to query user’s group authorities given a username.
The default is

  ```
  select
  g.id, g.group_name, ga.authority
  from
  groups g, group_members gm, group_authorities ga
  where
  gm.username = ? and g.id = ga.group_id and g.id = gm.group_id
  ```

<a id="nsa-jdbc-user-service-id"></a>

- **id**
A bean identifier, used for referring to the bean elsewhere in the context.

<a id="nsa-jdbc-user-service-role-prefix"></a>

- **role-prefix**
A non-empty string prefix that will be added to role strings loaded from persistent storage (default is "ROLE\_").
Use the value "none" for no prefix in cases where the default is non-empty.

<a id="nsa-jdbc-user-service-users-by-username-query"></a>

- **users-by-username-query**
An SQL statement to query a username, password, and enabled status given a username.
The default is

  ```
  select username, password, enabled from users where username = ?
  ```

<a id="nsa-password-encoder"></a>

## <password-encoder>

Authentication providers can optionally be configured to use a password encoder as described in the [Password Storage](../../../features/authentication/password-storage.md#authentication-password-storage).
This will result in the bean being injected with the appropriate `PasswordEncoder` instance.

<a id="nsa-password-encoder-parents"></a>

### Parent Elements of <password-encoder>

- [authentication-provider](#nsa-authentication-provider)
- [password-compare](#nsa-password-compare)

<a id="nsa-password-encoder-attributes"></a>

### <password-encoder> Attributes

<a id="nsa-password-encoder-hash"></a>

- **hash**
Defines the hashing algorithm used on user passwords.
We recommend strongly against using MD4, as it is a very weak hashing algorithm.

<a id="nsa-password-encoder-ref"></a>

- **ref**
Defines a reference to a Spring bean that implements `PasswordEncoder`.

<a id="nsa-user-service"></a>

## <user-service>

Creates an in-memory UserDetailsService from a properties file or a list of "user" child elements.
Usernames are converted to lower-case internally to allow for case-insensitive lookups, so this should not be used if case-sensitivity is required.

<a id="nsa-user-service-attributes"></a>

### <user-service> Attributes

<a id="nsa-user-service-id"></a>

- **id**
A bean identifier, used for referring to the bean elsewhere in the context.

<a id="nsa-user-service-properties"></a>

- **properties**
The location of a Properties file where each line is in the format of

  ```
  username=password,grantedAuthority[,grantedAuthority][,enabled|disabled]
  ```

<a id="nsa-user-service-children"></a>

### Child Elements of <user-service>

- [user](#nsa-user)

<a id="nsa-user"></a>

## <user>

Represents a user in the application.

<a id="nsa-user-parents"></a>

### Parent Elements of <user>

- [user-service](#nsa-user-service)

<a id="nsa-user-attributes"></a>

### <user> Attributes

<a id="nsa-user-authorities"></a>

- **authorities**
One of more authorities granted to the user.
Separate authorities with a comma (but no space).
For example, "ROLE\_USER,ROLE\_ADMINISTRATOR"

<a id="nsa-user-disabled"></a>

- **disabled**
Can be set to "true" to mark an account as disabled and unusable.

<a id="nsa-user-locked"></a>

- **locked**
Can be set to "true" to mark an account as locked and unusable.

<a id="nsa-user-name"></a>

- **name**
The username assigned to the user.

<a id="nsa-user-password"></a>

- **password**
The password assigned to the user.
This may be hashed if the corresponding authentication provider supports hashing (remember to set the "hash" attribute of the "user-service" element).
This attribute be omitted in the case where the data will not be used for authentication, but only for accessing authorities.
If omitted, the namespace will generate a random value, preventing its accidental use for authentication.
Cannot be empty.
