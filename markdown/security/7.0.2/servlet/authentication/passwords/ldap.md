---
title: "LDAP Authentication"
source: "ROOT:servlet/authentication/passwords/ldap.adoc"
---

<a id="servlet-authentication-ldap"></a>

# LDAP Authentication

LDAP (Lightweight Directory Access Protocol) is often used by organizations as a central repository for user information and as an authentication service.
It can also be used to store the role information for application users.

Spring Security’s LDAP-based authentication is used by Spring Security when it is configured to  [accept a username/password](index.md#servlet-authentication-unpwd-input) for authentication.
However, despite using a username and password for authentication, it does not use `UserDetailsService`, because, in [bind authentication](#servlet-authentication-ldap-bind), the LDAP server does not return the password, so the application cannot perform validation of the password.

There are many different scenarios for how an LDAP server can be configured, so Spring Security’s LDAP provider is fully configurable.
It uses separate strategy interfaces for authentication and role retrieval and provides default implementations, which can be configured to handle a wide range of situations.

<a id="servlet-authentication-ldap-required-dependencies"></a>

## Required Dependencies

To get started, add the `spring-security-ldap` dependency to your project.
When using Spring Boot, add the following dependencies:

#### Maven

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-ldap</artifactId>
</dependency>

<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-ldap</artifactId>
</dependency>
```

#### Gradle

```groovy
dependencies {
    implementation "org.springframework.boot:spring-boot-starter-data-ldap"
    implementation "org.springframework.security:spring-security-ldap"
}
```

<a id="servlet-authentication-ldap-prerequisites"></a>

## Prerequisites

You should be familiar with LDAP before trying to use it with Spring Security.
The following link provides a good introduction to the concepts involved and a guide to setting up a directory using the free LDAP server, OpenLDAP: [www.zytrax.com/books/ldap/](https://www.zytrax.com/books/ldap/).
Some familiarity with the JNDI APIs used to access LDAP from Java can also be useful.
We do not use any third-party LDAP libraries (Mozilla, JLDAP, or others) in the LDAP provider, but extensive use is made of Spring LDAP, so some familiarity with that project may be useful if you plan on adding your own customizations.

When using LDAP authentication, you should ensure that you properly configure LDAP connection pooling.
If you are unfamiliar with how to do so, see the [Java LDAP documentation](https://docs.oracle.com/javase/jndi/tutorial/ldap/connect/config.html).

<a id="servlet-authentication-ldap-embedded"></a>

## Setting up an Embedded LDAP Server

The first thing you need to do is to ensure that you have an LDAP Server to which to point your configuration.
For simplicity, it is often best to start with an embedded LDAP Server.
Spring Security supports using either:

- [Embedded UnboundID Server](#servlet-authentication-ldap-unboundid)
- [Embedded ApacheDS Server](#servlet-authentication-ldap-apacheds)

In the following samples, we expose `users.ldif` as a classpath resource to initialize the embedded LDAP server with two users, `user` and `admin`, both of which have a password of `password`:

#### users.ldif

```ldif
dn: ou=groups,dc=springframework,dc=org
objectclass: top
objectclass: organizationalUnit
ou: groups

dn: ou=people,dc=springframework,dc=org
objectclass: top
objectclass: organizationalUnit
ou: people

dn: uid=admin,ou=people,dc=springframework,dc=org
objectclass: top
objectclass: person
objectclass: organizationalPerson
objectclass: inetOrgPerson
cn: Rod Johnson
sn: Johnson
uid: admin
userPassword: password

dn: uid=user,ou=people,dc=springframework,dc=org
objectclass: top
objectclass: person
objectclass: organizationalPerson
objectclass: inetOrgPerson
cn: Dianne Emu
sn: Emu
uid: user
userPassword: password

dn: cn=user,ou=groups,dc=springframework,dc=org
objectclass: top
objectclass: groupOfNames
cn: user
member: uid=admin,ou=people,dc=springframework,dc=org
member: uid=user,ou=people,dc=springframework,dc=org

dn: cn=admin,ou=groups,dc=springframework,dc=org
objectclass: top
objectclass: groupOfNames
cn: admin
member: uid=admin,ou=people,dc=springframework,dc=org
```

<a id="servlet-authentication-ldap-unboundid"></a>

### Embedded UnboundID Server

If you wish to use [UnboundID](https://ldap.com/unboundid-ldap-sdk-for-java/), specify the following dependencies:

#### Maven

```xml
<dependency>
	<groupId>com.unboundid</groupId>
	<artifactId>unboundid-ldapsdk</artifactId>
	<version>7.0.4</version>
	<scope>runtime</scope>
</dependency>
```

#### Gradle

```groovy
dependencies {
	runtimeOnly "com.unboundid:unboundid-ldapsdk:7.0.4"
}
```

You can then configure the Embedded LDAP Server using an `EmbeddedLdapServerContextSourceFactoryBean`.
This will instruct Spring Security to start an in-memory LDAP server:

#### Java

```java
@Bean
public EmbeddedLdapServerContextSourceFactoryBean contextSourceFactoryBean() {
	return EmbeddedLdapServerContextSourceFactoryBean.fromEmbeddedLdapServer();
}
```

#### Kotlin

```kotlin
@Bean
fun contextSourceFactoryBean(): EmbeddedLdapServerContextSourceFactoryBean {
    return EmbeddedLdapServerContextSourceFactoryBean.fromEmbeddedLdapServer()
}
```

Alternatively, you can manually configure the Embedded LDAP Server.
If you choose this approach, you will be responsible for managing the lifecycle of the Embedded LDAP Server.

#### Java

```java
@Bean
UnboundIdContainer ldapContainer() {
	return new UnboundIdContainer("dc=springframework,dc=org",
				"classpath:users.ldif");
}
```

#### XML

```xml
<b:bean class="org.springframework.security.ldap.server.UnboundIdContainer"
	c:defaultPartitionSuffix="dc=springframework,dc=org"
	c:ldif="classpath:users.ldif"/>
```

#### Kotlin

```kotlin
@Bean
fun ldapContainer(): UnboundIdContainer {
    return UnboundIdContainer("dc=springframework,dc=org","classpath:users.ldif")
}
```

<a id="servlet-authentication-ldap-apacheds"></a>

### Embedded ApacheDS Server

Spring Security 7 removes support for Apache DS.
Please use [UnboundID](#servlet-authentication-ldap-unboundid) instead.

<a id="servlet-authentication-ldap-contextsource"></a>

## LDAP ContextSource

Once you have an LDAP Server to which to point your configuration, you need to configure Spring Security to point to an LDAP server that should be used to authenticate users.
To do so, create an LDAP `ContextSource` (which is the equivalent of a JDBC `DataSource`).
If you have already configured an `EmbeddedLdapServerContextSourceFactoryBean`, Spring Security will create an LDAP `ContextSource` that points to the embedded LDAP server.

#### Java

```java
@Bean
public EmbeddedLdapServerContextSourceFactoryBean contextSourceFactoryBean() {
	EmbeddedLdapServerContextSourceFactoryBean contextSourceFactoryBean =
			EmbeddedLdapServerContextSourceFactoryBean.fromEmbeddedLdapServer();
	contextSourceFactoryBean.setPort(0);
	return contextSourceFactoryBean;
}
```

#### Kotlin

```kotlin
@Bean
fun contextSourceFactoryBean(): EmbeddedLdapServerContextSourceFactoryBean {
    val contextSourceFactoryBean = EmbeddedLdapServerContextSourceFactoryBean.fromEmbeddedLdapServer()
    contextSourceFactoryBean.setPort(0)
    return contextSourceFactoryBean
}
```

Alternatively, you can explicitly configure the LDAP `ContextSource` to connect to the supplied LDAP server:

#### Java

```java
ContextSource contextSource(UnboundIdContainer container) {
	return new DefaultSpringSecurityContextSource("ldap://localhost:53389/dc=springframework,dc=org");
}
```

#### XML

```xml
<ldap-server
	url="ldap://localhost:53389/dc=springframework,dc=org" />
```

#### Kotlin

```kotlin
fun contextSource(container: UnboundIdContainer): ContextSource {
    return DefaultSpringSecurityContextSource("ldap://localhost:53389/dc=springframework,dc=org")
}
```

<a id="servlet-authentication-ldap-authentication"></a>

## Authentication

Spring Security’s LDAP support does not use the [UserDetailsService](user-details-service.md#servlet-authentication-userdetailsservice) because LDAP bind authentication does not let clients read the password or even a hashed version of the password.
This means there is no way for a password to be read and then authenticated by Spring Security.

For this reason, LDAP support is implemented through the `LdapAuthenticator` interface.
The `LdapAuthenticator` interface is also responsible for retrieving any required user attributes.
This is because the permissions on the attributes may depend on the type of authentication being used.
For example, if binding as the user, it may be necessary to read the attributes with the user’s own permissions.

Spring Security supplies two `LdapAuthenticator` implementations:

- [Using Bind Authentication](#servlet-authentication-ldap-bind)
- [Using Password Authentication](#servlet-authentication-ldap-pwd)

<a id="servlet-authentication-ldap-bind"></a>

## Using Bind Authentication

[Bind Authentication](https://ldap.com/the-ldap-bind-operation/) is the most common mechanism for authenticating users with LDAP.
In bind authentication, the user’s credentials (username and password) are submitted to the LDAP server, which authenticates them.
The advantage to using bind authentication is that the user’s secrets (the password) do not need to be exposed to clients, which helps to protect them from leaking.

The following example shows bind authentication configuration:

#### Java

```java
@Bean
AuthenticationManager authenticationManager(BaseLdapPathContextSource contextSource) {
	LdapBindAuthenticationManagerFactory factory = new LdapBindAuthenticationManagerFactory(contextSource);
	factory.setUserDnPatterns("uid={0},ou=people");
	return factory.createAuthenticationManager();
}
```

#### XML

```xml
<ldap-authentication-provider
	user-dn-pattern="uid={0},ou=people"/>
```

#### Kotlin

```kotlin
@Bean
fun authenticationManager(contextSource: BaseLdapPathContextSource): AuthenticationManager {
    val factory = LdapBindAuthenticationManagerFactory(contextSource)
    factory.setUserDnPatterns("uid={0},ou=people")
    return factory.createAuthenticationManager()
}
```

The preceding simple example would obtain the DN for the user by substituting the user login name in the supplied pattern and attempting to bind as that user with the login password.
This is OK if all your users are stored under a single node in the directory.
If, instead, you wish to configure an LDAP search filter to locate the user, you could use the following:

#### Java

```java
@Bean
AuthenticationManager authenticationManager(BaseLdapPathContextSource contextSource) {
	LdapBindAuthenticationManagerFactory factory = new LdapBindAuthenticationManagerFactory(contextSource);
	factory.setUserSearchFilter("(uid={0})");
	factory.setUserSearchBase("ou=people");
	return factory.createAuthenticationManager();
}
```

#### XML

```xml
<ldap-authentication-provider
		user-search-filter="(uid={0})"
	user-search-base="ou=people"/>
```

#### Kotlin

```kotlin
@Bean
fun authenticationManager(contextSource: BaseLdapPathContextSource): AuthenticationManager {
    val factory = LdapBindAuthenticationManagerFactory(contextSource)
    factory.setUserSearchFilter("(uid={0})")
    factory.setUserSearchBase("ou=people")
    return factory.createAuthenticationManager()
}
```

If used with the `ContextSource` [definition shown earlier](#servlet-authentication-ldap-contextsource), this would perform a search under the DN `ou=people,dc=springframework,dc=org` by using `(uid={0})` as a filter.
Again, the user login name is substituted for the parameter in the filter name, so it searches for an entry with the `uid` attribute equal to the user name.
If a user search base is not supplied, the search is performed from the root.

<a id="servlet-authentication-ldap-pwd"></a>

## Using Password Authentication

Password comparison is when the password supplied by the user is compared with the one stored in the repository.
This can either be done by retrieving the value of the password attribute and checking it locally or by performing an LDAP “compare” operation, where the supplied password is passed to the server for comparison and the real password value is never retrieved.
An LDAP compare cannot be done when the password is properly hashed with a random salt.

#### Java

```java
@Bean
AuthenticationManager authenticationManager(BaseLdapPathContextSource contextSource) {
	LdapPasswordComparisonAuthenticationManagerFactory factory = new LdapPasswordComparisonAuthenticationManagerFactory(
			contextSource, NoOpPasswordEncoder.getInstance());
	factory.setUserDnPatterns("uid={0},ou=people");
	return factory.createAuthenticationManager();
}
```

#### XML

```xml
<ldap-authentication-provider
		user-dn-pattern="uid={0},ou=people">
	<password-compare />
</ldap-authentication-provider>
```

#### Kotlin

```kotlin
@Bean
fun authenticationManager(contextSource: BaseLdapPathContextSource?): AuthenticationManager? {
    val factory = LdapPasswordComparisonAuthenticationManagerFactory(
        contextSource, NoOpPasswordEncoder.getInstance()
    )
    factory.setUserDnPatterns("uid={0},ou=people")
    return factory.createAuthenticationManager()
}
```

The following example shows a more advanced configuration with some customizations:

#### Java

```java
@Bean
AuthenticationManager authenticationManager(BaseLdapPathContextSource contextSource) {
	LdapPasswordComparisonAuthenticationManagerFactory factory = new LdapPasswordComparisonAuthenticationManagerFactory(
			contextSource, new BCryptPasswordEncoder());
	factory.setUserDnPatterns("uid={0},ou=people");
	factory.setPasswordAttribute("pwd");  // <1>
	return factory.createAuthenticationManager();
}
```

#### XML

```xml
<ldap-authentication-provider
		user-dn-pattern="uid={0},ou=people">
	<password-compare password-attribute="pwd"> <!--1-->
		<password-encoder ref="passwordEncoder" /> <!--2-->
	</password-compare>
</ldap-authentication-provider>
<b:bean id="passwordEncoder"
	class="org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder" />
```

#### Kotlin

```kotlin
@Bean
fun authenticationManager(contextSource: BaseLdapPathContextSource): AuthenticationManager {
    val factory = LdapPasswordComparisonAuthenticationManagerFactory(
        contextSource, BCryptPasswordEncoder()
    )
    factory.setUserDnPatterns("uid={0},ou=people")
    factory.setPasswordAttribute("pwd") // <1>
    return factory.createAuthenticationManager()
}
```

1. Specify the password attribute as `pwd`.

<a id="_ldapauthoritiespopulator"></a>

## LdapAuthoritiesPopulator

Spring Security’s `LdapAuthoritiesPopulator` is used to determine what authorities are returned for the user.
The following example shows how configure `LdapAuthoritiesPopulator`:

#### Java

```java
@Bean
LdapAuthoritiesPopulator authorities(BaseLdapPathContextSource contextSource) {
	String groupSearchBase = "";
	DefaultLdapAuthoritiesPopulator authorities =
		new DefaultLdapAuthoritiesPopulator(contextSource, groupSearchBase);
	authorities.setGroupSearchFilter("member={0}");
	return authorities;
}

@Bean
AuthenticationManager authenticationManager(BaseLdapPathContextSource contextSource, LdapAuthoritiesPopulator authorities) {
	LdapBindAuthenticationManagerFactory factory = new LdapBindAuthenticationManagerFactory(contextSource);
	factory.setUserDnPatterns("uid={0},ou=people");
	factory.setLdapAuthoritiesPopulator(authorities);
	return factory.createAuthenticationManager();
}
```

#### XML

```xml
<ldap-authentication-provider
	user-dn-pattern="uid={0},ou=people"
	group-search-filter="member={0}"/>
```

#### Kotlin

```kotlin
@Bean
fun authorities(contextSource: BaseLdapPathContextSource): LdapAuthoritiesPopulator {
    val groupSearchBase = ""
    val authorities = DefaultLdapAuthoritiesPopulator(contextSource, groupSearchBase)
    authorities.setGroupSearchFilter("member={0}")
    return authorities
}

@Bean
fun authenticationManager(
    contextSource: BaseLdapPathContextSource,
    authorities: LdapAuthoritiesPopulator): AuthenticationManager {
    val factory = LdapBindAuthenticationManagerFactory(contextSource)
    factory.setUserDnPatterns("uid={0},ou=people")
    factory.setLdapAuthoritiesPopulator(authorities)
    return factory.createAuthenticationManager()
}
```

<a id="_active_directory"></a>

## Active Directory

Active Directory supports its own non-standard authentication options, and the normal usage pattern does not fit too cleanly with the standard `LdapAuthenticationProvider`.
Typically, authentication is performed by using the domain username (in the form of `user@domain`), rather than using an LDAP distinguished name.
To make this easier, Spring Security has an authentication provider, which is customized for a typical Active Directory setup.

Configuring `ActiveDirectoryLdapAuthenticationProvider` is quite straightforward.
You need only supply the domain name and an LDAP URL that supplies the address of the server.

> [!NOTE]
> It is also possible to obtain the server’s IP address by using a DNS lookup.
> This is not currently supported, but hopefully will be in a future version.

The following example configures Active Directory:

#### Java

```java
@Bean
ActiveDirectoryLdapAuthenticationProvider authenticationProvider() {
	return new ActiveDirectoryLdapAuthenticationProvider("example.com", "ldap://company.example.com/");
}
```

#### XML

```xml
<bean id="authenticationProvider"
        class="org.springframework.security.ldap.authentication.ad.ActiveDirectoryLdapAuthenticationProvider">
	<constructor-arg value="example.com" />
	<constructor-arg value="ldap://company.example.com/" />
</bean>
```

#### Kotlin

```kotlin
@Bean
fun authenticationProvider(): ActiveDirectoryLdapAuthenticationProvider {
    return ActiveDirectoryLdapAuthenticationProvider("example.com", "ldap://company.example.com/")
}
```
