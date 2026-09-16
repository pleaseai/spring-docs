---
title: "Saml 2.0 Metadata"
source: "ROOT:servlet/saml2/metadata.adoc"
---

<a id="servlet-saml2login-metadata"></a>

# Saml 2.0 Metadata

Spring Security can [parse asserting party metadata](#parsing-asserting-party-metadata) to produce an `AssertingPartyMetadata` instance as well as [publish relying party metadata](#publishing-relying-party-metadata) from a `RelyingPartyRegistration` instance.

<a id="parsing-asserting-party-metadata"></a>

## Parsing `<saml2:IDPSSODescriptor>` metadata

You can parse an asserting party’s metadata [using `RelyingPartyRegistrations`](login/overview.md#servlet-saml2login-relyingpartyregistrationrepository).

When using the OpenSAML vendor support, the resulting `AssertingPartyMetadata` will be of type `OpenSamlAssertingPartyDetails`.
This means you’ll be able to do get the underlying OpenSAML XMLObject by doing the following:

#### Java

```java
OpenSamlAssertingPartyDetails details = (OpenSamlAssertingPartyDetails)
        registration.getAssertingPartyMetadata();
EntityDescriptor openSamlEntityDescriptor = details.getEntityDescriptor();
```

#### Kotlin

```kotlin
val details: OpenSamlAssertingPartyDetails =
        registration.getAssertingPartyMetadata() as OpenSamlAssertingPartyDetails
val openSamlEntityDescriptor: EntityDescriptor = details.getEntityDescriptor()
```

<a id="using-assertingpartymetadatarepository"></a>

### Using `AssertingPartyMetadataRepository`

You can also be more targeted than `RelyingPartyRegistrations` by using `AssertingPartyMetadataRepository`, an interface that allows for only retrieving the asserting party metadata.

This allows three valuable features:

- Implementations can refresh asserting party metadata in an expiry-aware fashion
- Implementations of `RelyingPartyRegistrationRepository` can more easily articulate a relationship between a relying party and its one or many corresponding asserting parties
- Implementations can verify metadata signatures

For example, `OpenSaml4AssertingPartyMetadataRepository` uses OpenSAML’s `MetadataResolver`, and API whose implementations regularly refresh the underlying metadata in an expiry-aware fashion.

This means that you can now create a refreshable `RelyingPartyRegistrationRepository` in just a few lines of code:

#### Java

```java
@Component
public class RefreshableRelyingPartyRegistrationRepository
        implements IterableRelyingPartyRegistrationRepository {

	private final AssertingPartyMetadataRepository metadata =
            OpenSamlAssertingPartyMetadataRepository
                .fromTrustedMetadataLocation("https://idp.example.org/metadata").build();

	@Override
    public RelyingPartyRegistration findByRegistrationId(String registrationId) {
		AssertingPartyMetadata metadata = this.metadata.findByEntityId(registrationId);
        if (metadata == null) {
            return null;
        }
		return applyRelyingParty(metadata);
    }

	@Override
    public Iterator<RelyingPartyRegistration> iterator() {
		return StreamSupport.stream(this.metadata.spliterator(), false)
            .map(this::applyRelyingParty).iterator();
    }

	private RelyingPartyRegistration applyRelyingParty(AssertingPartyMetadata metadata) {
		return RelyingPartyRegistration.withAssertingPartyMetadata(metadata)
            // apply any relying party configuration
            .build();
	}

}
```

#### Kotlin

```kotlin
@Component
class RefreshableRelyingPartyRegistrationRepository : IterableRelyingPartyRegistrationRepository {

    private val metadata: AssertingPartyMetadataRepository =
        OpenSamlAssertingPartyMetadataRepository.fromTrustedMetadataLocation(
            "https://idp.example.org/metadata").build()

    fun findByRegistrationId(registrationId:String?): RelyingPartyRegistration {
        val metadata = this.metadata.findByEntityId(registrationId)
        if (metadata == null) {
            return null
        }
        return applyRelyingParty(metadata)
    }

    fun iterator(): Iterator<RelyingPartyRegistration> {
        return StreamSupport.stream(this.metadata.spliterator(), false)
            .map(this::applyRelyingParty).iterator()
    }

    private fun applyRelyingParty(metadata: AssertingPartyMetadata): RelyingPartyRegistration {
        val details: AssertingPartyMetadata = metadata as AssertingPartyMetadata
        return RelyingPartyRegistration.withAssertingPartyMetadata(details)
            // apply any relying party configuration
            .build()
    }
 }
```

> [!TIP]
> `OpenSaml4AssertingPartyMetadataRepository` also ships with a constructor so you can provide a custom `MetadataResolver`. Since the underlying `MetadataResolver` is doing the expirying and refreshing, if you use the constructor directly, you will only get these features by providing an implementation that does so.

<a id="_verifying_metadata_signatures"></a>

### Verifying Metadata Signatures

You can also verify metadata signatures using `OpenSaml4AssertingPartyMetadataRepository` by providing the appropriate set of `Saml2X509Credential`s as follows:

#### Java

```java
OpenSamlAssertingPartyMetadataRepository.withMetadataLocation("https://idp.example.org/metadata")
    .verificationCredentials((c) -> c.add(myVerificationCredential))
    .build();
```

#### Kotlin

```kotlin
OpenSamlAssertingPartyMetadataRepository.withMetadataLocation("https://idp.example.org/metadata")
    .verificationCredentials({ c : Collection<Saml2X509Credential> ->
        c.add(myVerificationCredential) })
    .build()
```

> [!NOTE]
> If no credentials are provided, the component will not perform signature validation.

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
