---
title: "Spring Security Kerberos Samples"
source: "ROOT:servlet/authentication/kerberos/samples.adoc"
---

<a id="springsecuritykerberossamples"></a>

# Spring Security Kerberos Samples

This part of the reference documentation is introducing samples
projects. Samples can be compiled manually by building main
distribution from
[github.com/spring-projects/spring-security-kerberos](https://github.com/spring-projects/spring-security-kerberos).

> [!IMPORTANT]
> If you run sample as is it will not work until a correct configuration
> is applied. See notes below for specific samples.

[Security Server Windows Auth Sample](#samples-sec-server-win-auth) sample for Windows environment

[Security Server Side Auth Sample](#samples-sec-server-client-auth) sample using server side authenticator

[Security Server Spnego and Form Auth Sample](#samples-sec-server-spnego-form-auth) sample using ticket validation
with spnego and form

[Security Client KerberosRestTemplate Sample](#samples-sec-client-rest-template) sample for KerberosRestTemplate

<a id="samples-sec-server-win-auth"></a>

## Security Server Windows Auth Sample

Goals of this sample:

- In windows environment, User will be able to logon to application
with Windows Active directory Credential which has been entered
during log on to windows. There should not be any ask for
userid/password credentials.
- In non-windows environment, User will be presented with a screen
to provide Active directory credentials.

```yaml
server:
    port: 8080
    app:
        ad-domain: EXAMPLE.ORG
        ad-server: ldap://WIN-EKBO0EQ7TS7.example.org/
        service-principal: HTTP/neo.example.org@EXAMPLE.ORG
        keytab-location: /tmp/tomcat.keytab
        ldap-search-base: dc=example,dc=org
        ldap-search-filter: "(| (userPrincipalName={0}) (sAMAccountName={0}))"
```

In above you can see the default configuration for this sample. You
can override these settings using a normal Spring Boot tricks like
using command-line options or custom `application.yml` file.

Run a server.

```text
$ java -jar sec-server-win-auth-7.0.4.jar
```

> [!IMPORTANT]
> You may need to use custom kerberos config with Linux either by using
> `-Djava.security.krb5.conf=/path/to/krb5.ini` or
> `GlobalSunJaasKerberosConfig` bean.

> [!NOTE]
> See [Setup Windows Domain Controller](appendix.md#setupwinkerberos)
> for more instructions how to work with windows kerberos environment.

Login to `Windows 8.1` using domain credentials and access sample

![ie1](https://raw.githubusercontent.com/spring-projects/spring-security/7.0.4/docs/modules/ROOT/assets/images/servlet/authentication/kerberos/ie1.png)

![ie2](https://raw.githubusercontent.com/spring-projects/spring-security/7.0.4/docs/modules/ROOT/assets/images/servlet/authentication/kerberos/ie2.png)

Access sample application from a non windows vm and use domain
credentials manually.

![ff1](https://raw.githubusercontent.com/spring-projects/spring-security/7.0.4/docs/modules/ROOT/assets/images/servlet/authentication/kerberos/ff1.png)

![ff2](https://raw.githubusercontent.com/spring-projects/spring-security/7.0.4/docs/modules/ROOT/assets/images/servlet/authentication/kerberos/ff2.png)

![ff3](https://raw.githubusercontent.com/spring-projects/spring-security/7.0.4/docs/modules/ROOT/assets/images/servlet/authentication/kerberos/ff3.png)

<a id="samples-sec-server-client-auth"></a>

## Security Server Side Auth Sample

This sample demonstrates how server is able to authenticate user
against kerberos environment using his credentials passed in via a
form login.

Run a server.

```text
$ java -jar sec-server-client-auth-7.0.4.jar
```

```yaml
server:
    port: 8080
```

<a id="samples-sec-server-spnego-form-auth"></a>

## Security Server Spnego and Form Auth Sample

This sample demonstrates how a server can be configured to accept a
Spnego based negotiation from a browser while still being able to fall
back to a form based authentication.

Using a `user1` principal [Setup MIT Kerberos](appendix.md#setupmitkerberos),
do a kerberos login manually using credentials.

```text
$ kinit user1
Password for user1@EXAMPLE.ORG:

$ klist
Ticket cache: FILE:/tmp/krb5cc_1000
Default principal: user1@EXAMPLE.ORG

Valid starting     Expires            Service principal
10/03/15 17:18:45  11/03/15 03:18:45  krbtgt/EXAMPLE.ORG@EXAMPLE.ORG
  renew until 11/03/15 17:18:40
```

or using a keytab file.

```text
$ kinit -kt user2.keytab user1

$ klist
Ticket cache: FILE:/tmp/krb5cc_1000
Default principal: user2@EXAMPLE.ORG

Valid starting     Expires            Service principal
10/03/15 17:25:03  11/03/15 03:25:03  krbtgt/EXAMPLE.ORG@EXAMPLE.ORG
  renew until 11/03/15 17:25:03
```

Run a server.

```text
$ java -jar sec-server-spnego-form-auth-7.0.4.jar
```

Now you should be able to open your browser and let it do Spnego
authentication with existing ticket.

> [!NOTE]
> See [Configure Browsers for Spnego Negotiation](appendix.md#browserspnegoconfig)
> for more instructions for configuring browsers to use Spnego.

```yaml
server:
    port: 8080
app:
    service-principal: HTTP/neo.example.org@EXAMPLE.ORG
    keytab-location: /tmp/tomcat.keytab
```

<a id="samples-sec-client-rest-template"></a>

## Security Client KerberosRestTemplate Sample

This is a sample using a Spring RestTemplate to access Kerberos
protected resource. You can use this together with
[Security Server Spnego and Form Auth Sample](#samples-sec-server-spnego-form-auth).

Default application is configured as shown below.

```yaml
app:
    user-principal: user2@EXAMPLE.ORG
    keytab-location: /tmp/user2.keytab
    access-url: https://neo.example.org:8080/hello
```

Using a `user1` principal [Setup MIT Kerberos](appendix.md#setupmitkerberos),
do a kerberos login manually using credentials.

```text
$ java -jar sec-client-rest-template-7.0.4.jar --app.user-principal --app.keytab-location
```

> [!NOTE]
> In above we simply set `app.user-principal` and `app.keytab-location`
> to empty values which disables a use of keytab file.

If operation is succesfull you should see below output with `user1@EXAMPLE.ORG`.

```text
<html xmlns="https://www.w3.org/1999/xhtml"
      xmlns:sec="https://www.thymeleaf.org/thymeleaf-extras-springsecurity3">
  <head>
    <title>Spring Security Kerberos Example</title>
  </head>
  <body>
    <h1>Hello user1@EXAMPLE.ORG!</h1>
  </body>
</html>
```

Or use a `user2` with a keytab file.

```text
$ java -jar sec-client-rest-template-7.0.4.jar
```

If operation is succesfull you should see below output with `user2@EXAMPLE.ORG`.

```text
<html xmlns="https://www.w3.org/1999/xhtml"
      xmlns:sec="https://www.thymeleaf.org/thymeleaf-extras-springsecurity3">
  <head>
    <title>Spring Security Kerberos Example</title>
  </head>
  <body>
    <h1>Hello user2@EXAMPLE.ORG!</h1>
  </body>
</html>
```
