---
title: "SAML 2.0 Login"
source: "ROOT:servlet/saml2/login/index.adoc"
---

<a id="servlet-saml2login"></a>

# SAML 2.0 Login

The SAML 2.0 Login feature provides an application with the ability to act as a SAML 2.0 relying party, having users [log in](https://wiki.shibboleth.net/confluence/display/CONCEPT/FlowsAndConfig) to the application by using their existing account at a SAML 2.0 Asserting Party (Okta, ADFS, and others).

> [!NOTE]
> SAML 2.0 Login is implemented by using the **Web Browser SSO Profile**, as specified in
> [SAML 2 Profiles](https://www.oasis-open.org/committees/download.php/35389/sstc-saml-profiles-errata-2.0-wd-06-diff.pdf#page=15).

<a id="servlet-saml2login-spring-security-history"></a>

Since 2009, support for relying parties has existed as an [extension project](https://github.com/spring-projects/spring-security-saml/tree/1e013b07a7772defd6a26fcfae187c9bf661ee8f#spring-saml).
In 2019, the process began to port that into [Spring Security](https://github.com/spring-projects/spring-security) proper.
This process is similar to the one started in 2017 for [Spring Security’s OAuth 2.0 support](../../oauth2/index.md).

> [!NOTE]
> A working sample for [SAML 2.0 Login](https://github.com/spring-projects/spring-security-samples/tree/6.4.x/servlet/spring-boot/java/saml2/login) is available in the [Spring Security Samples repository](https://github.com/spring-projects/spring-security-samples/tree/6.4.x).
