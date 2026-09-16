---
title: "Saml 2.0 Metadata"
source: "ROOT:servlet/saml2/metadata.adoc"
---

<a id="servlet-saml2login-metadata"></a>

# Saml 2.0 Metadata

Spring Security can [parse asserting party metadata](#parsing-asserting-party-metadata) to produce an `AssertingPartyDetails` instance as well as [publish relying party metadata](#publishing-relying-party-metadata) from a `RelyingPartyRegistration` instance.

<a id="parsing-asserting-party-metadata"></a>

## Parsing `<saml2:IDPSSODescriptor>` metadata

You can parse an asserting party’s metadata [using `RelyingPartyRegistrations`](login/overview.md#servlet-saml2login-relyingpartyregistrationrepository).

When using the OpenSAML vendor support, the resulting `AssertingPartyDetails` will be of type `OpenSamlAssertingPartyDetails`.
This means you’ll be able to do get the underlying OpenSAML XMLObject by doing the following:

#### Java

```java
OpenSamlAssertingPartyDetails details = (OpenSamlAssertingPartyDetails)
        registration.getAssertingPartyDetails();
EntityDescriptor openSamlEntityDescriptor = details.getEntityDescriptor();
```

#### Kotlin

```kotlin
val details: OpenSamlAssertingPartyDetails =
        registration.getAssertingPartyDetails() as OpenSamlAssertingPartyDetails;
val openSamlEntityDescriptor: EntityDescriptor = details.getEntityDescriptor();
```

<a id="publishing-relying-party-metadata"></a>

## Producing `<saml2:SPSSODescriptor>` Metadata

You can publish a metadata endpoint using the `saml2Metadata` DSL method, as you’ll see below:

#### Java

```java
http
    // ...
    .saml2Login(withDefaults())
    .saml2Metadata(withDefaults());
```

#### Kotlin

```kotlin
http {
    //...
    saml2Login { }
    saml2Metadata { }
}
```

You can use this metadata endpoint to register your relying party with your asserting party.
This is often as simple as finding the correct form field to supply the metadata endpoint.

By default, the metadata endpoint is `/saml2/metadata`, though it also responds to `/saml2/metadata/{registrationId}` and `/saml2/service-provider-metadata/{registrationId}`.

You can change this by calling the `metadataUrl` method in the DSL:

#### Java

```java
.saml2Metadata((saml2) -> saml2.metadataUrl("/saml/metadata"))
```

#### Kotlin

```kotlin
saml2Metadata {
	metadataUrl = "/saml/metadata"
}
```

<a id="_changing_the_way_a_relyingpartyregistration_is_looked_up"></a>

## Changing the Way a `RelyingPartyRegistration` Is Looked Up

If you have a different strategy for identifying which `RelyingPartyRegistration` to use, you can configure your own `Saml2MetadataResponseResolver` like the one below:

#### Java

```java
@Bean
Saml2MetadataResponseResolver metadataResponseResolver(RelyingPartyRegistrationRepository registrations) {
	RequestMatcherMetadataResponseResolver metadata = new RequestMatcherMetadataResponseResolver(
			(id) -> registrations.findByRegistrationId("relying-party"));
	metadata.setMetadataFilename("metadata.xml");
	return metadata;
}
```

#### Kotlin

```kotlin
@Bean
fun metadataResponseResolver(val registrations: RelyingPartyRegistrationRepository): Saml2MetadataResponseResolver {
    val metadata = new RequestMatcherMetadataResponseResolver(
			id: String -> registrations.findByRegistrationId("relying-party"))
	metadata.setMetadataFilename("metadata.xml")
	return metadata
}
```
