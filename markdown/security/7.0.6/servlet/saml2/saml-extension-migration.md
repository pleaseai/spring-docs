---
title: "SAML 2.0 Extension Migration"
source: "ROOT:servlet/saml2/saml-extension-migration.adoc"
---

# SAML 2.0 Extension Migration

This document contains guidance for moving SAML 2.0 Service Providers from Spring Security SAML Extensions 1.x to Spring Security Since Spring Security doesn’t provide Identity Provider support, migrating a Spring Security SAML Extensions Identity Provider is out of scope for this document.

Because the two approaches are as different as they are, this document will tend to cover patterns more than precise search-and-replace steps.

<a id="saml2-login-logout"></a>

## Login & Logout

<a id="_changes_in_approach"></a>

### Changes In Approach

[Spring Security](https://github.com/spring-projects/spring-security) takes a slightly different approach from [Spring Security SAML Extensions](https://github.com/spring-projects/spring-security-saml) in a few notable ways.

<a id="_simplified_enablement"></a>

#### Simplified Enablement

Spring Security SAML Extensions support for Service Providers is provided by a series of filters enabled by adding each filter manually in the correct order to various Spring Security filter chains.

Spring Security’s SAML 2.0 Service Provider support is enabled via the Spring Security DSL methods:
[`saml2Login`](login/index.md),
[`saml2Logout`](logout.md), and
[`saml2Metadata`](metadata.md). It selects the correct filters to add and puts them in the appropriate places in the filter chain.

<a id="_stronger_encapsulation"></a>

#### Stronger Encapsulation

Like Spring Security SAML Extensions, Spring Security bases it’s SAML support on OpenSAML. The Extensions project exposes OpenSAML over public interfaces, blurring the lines between the two projects, effectively requiring OpenSAML, and making upgrades to later versions of OpenSAML more complicated.

Spring Security provides stronger encapsulation. No public interfaces expose OpenSAML components and any class that exposes OpenSAML in its public API is named with an `OpenSaml` prefix for additional clarity.

<a id="_out_of_the_box_multitenancy"></a>

#### Out-of-the-box Multitenancy

Spring Security SAML Extensions offered some lightweight support for declaring more than one Identity Provider and accessing it at login time using the `idp` request parameter. This was limiting as far as changing things at runtime was concerned and also doesn’t allow for a many-to-many relationship between relying and asserting parties.

Spring Security builds SAML 2.0 multitenancy into its default URLs and basic components in the form of a `RelyingPartyRegistration`. This component acts as a link between a Relying Party’s metadata and an Asserting Party’s metadata, and all pairs are available for lookup in a `RelyingPartyRegistrationRepository`. Each URL represents a unique registration pair to be retrieved.

Whether it’s AuthnRequests, Responses, LogoutRequests, LogoutResponses, or EntityDescriptors, each filter is based off of `RelyingPartyRegistrationRepository` and so is fundamentally multi-tenant.

<a id="_examples_matrix"></a>

### Examples Matrix

Both Spring Security and Spring Security SAML Extensions have examples for how to configure the Service Provider:

| Use case | Spring Security | Spring Security SAML Extension |
| --- | --- | --- |
| Login & Logout | [Sample](https://github.com/spring-projects/spring-security-samples/tree/main/servlet/spring-boot/java/saml2/login) | [Sample](https://github.com/jzheaux/spring-security-saml-migrate/tree/main/login-logout) |
| Login using SAML Extension URLs | [Sample](https://github.com/spring-projects/spring-security-samples/tree/main/servlet/spring-boot/java/saml2/custom-urls) | - |
| Metadata support | [Sample](https://github.com/spring-projects/spring-security-samples/tree/main/servlet/spring-boot/java/saml2/refreshable-metadata) | - |

You can also see a showcase example in [Spring Security SAML Extension](https://github.com/spring-projects/spring-security-saml/tree/main/sample)'s GitHub project.

> [!NOTE]
> Spring Security does not support HTTP-Redirect binding for SAML 2.0 Responses.
> According to the SAML specification, the HTTP-Redirect binding is not permitted for SAML Responses due to URL length and signature limitations. Attempting to use this binding may result in unexpected errors.
> Use HTTP-POST binding instead when configuring your identity provider.

<a id="saml2-unported"></a>

## Unported Features

There are some features that are not yet ported over and there are as yet no plans to do so:

- HTTP-Redirect binding for SAML 2.0 Responses
- Artifact binding support
