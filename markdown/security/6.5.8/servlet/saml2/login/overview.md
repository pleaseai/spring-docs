---
title: "SAML 2.0 Login Overview"
source: "ROOT:servlet/saml2/login/overview.adoc"
---

# SAML 2.0 Login Overview

We start by examining how SAML 2.0 Relying Party Authentication works within Spring Security.
First, we see that, like [OAuth 2.0 Login](#oauth2login), Spring Security takes the user to a third party for performing authentication.
It does this through a series of redirects:

#### Redirecting to Asserting Party Authentication

![saml2webssoauthenticationrequestfilter](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/servlet/saml2/saml2webssoauthenticationrequestfilter.png)

> [!NOTE]
> The figure above builds off our [`SecurityFilterChain`](../../architecture.md#servlet-securityfilterchain) and [`AbstractAuthenticationProcessingFilter`](../../authentication/architecture.md#servlet-authentication-abstractprocessingfilter) diagrams:

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_1.png) First, a user makes an unauthenticated request to the `/private` resource, for which it is not authorized.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_2.png) Spring Security’s [`AuthorizationFilter`](../../authorization/authorize-http-requests.md) indicates that the unauthenticated request is *Denied* by throwing an `AccessDeniedException`.

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_3.png) Since the user lacks authorization, the [`ExceptionTranslationFilter`](../../architecture.md#servlet-exceptiontranslationfilter) initiates *Start Authentication*.
The configured [`AuthenticationEntryPoint`](../../authentication/architecture.md#servlet-authentication-authenticationentrypoint) is an instance of [`LoginUrlAuthenticationEntryPoint`](https://docs.spring.io/spring-security/site/docs/6.5.8/api/org/springframework/security/web/authentication/LoginUrlAuthenticationEntryPoint.html), which redirects to [the `<saml2:AuthnRequest>` generating endpoint](#servlet-saml2login-sp-initiated-factory), `Saml2WebSsoAuthenticationRequestFilter`.
Alternatively, if you have [configured more than one asserting party](#servlet-saml2login-relyingpartyregistrationrepository), it first redirects to a picker page.

![number 4](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_4.png) Next, the `Saml2WebSsoAuthenticationRequestFilter` creates, signs, serializes, and encodes a `<saml2:AuthnRequest>` using its configured [`Saml2AuthenticationRequestFactory`](#servlet-saml2login-sp-initiated-factory).

![number 5](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_5.png) Then the browser takes this `<saml2:AuthnRequest>` and presents it to the asserting party.
The asserting party tries to authentication the user.
If successful, it returns a `<saml2:Response>` back to the browser.

![number 6](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_6.png) The browser then POSTs the `<saml2:Response>` to the assertion consumer service endpoint.

The following image shows how Spring Security authenticates a `<saml2:Response>`.

<a id="servlet-saml2login-authentication-saml2webssoauthenticationfilter"></a>

#### Authenticating a `<saml2:Response>`

![saml2webssoauthenticationfilter](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/servlet/saml2/saml2webssoauthenticationfilter.png)

> [!NOTE]
> The figure builds off our [`SecurityFilterChain`](../../architecture.md#servlet-securityfilterchain) diagram.

<a id="servlet-saml2login-authentication-saml2authenticationtokenconverter"></a>

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_1.png) When the browser submits a `<saml2:Response>` to the application, it [delegates to `Saml2WebSsoAuthenticationFilter`](authentication.md#servlet-saml2login-authenticate-responses).
This filter calls its configured `AuthenticationConverter` to create a `Saml2AuthenticationToken` by extracting the response from the `HttpServletRequest`.
This converter additionally resolves the [`RelyingPartyRegistration`](#servlet-saml2login-relyingpartyregistration) and supplies it to `Saml2AuthenticationToken`.

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_2.png) Next, the filter passes the token to its configured [`AuthenticationManager`](../../authentication/architecture.md#servlet-authentication-providermanager).
By default, it uses the [`OpenSaml4AuthenticationProvider`](#servlet-saml2login-architecture).

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_3.png) If authentication fails, then *Failure*.

- The [`SecurityContextHolder`](../../authentication/architecture.md#servlet-authentication-securitycontextholder) is cleared out.
- The [`AuthenticationEntryPoint`](../../authentication/architecture.md#servlet-authentication-authenticationentrypoint) is invoked to restart the authentication process.

![number 4](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_4.png) If authentication is successful, then *Success*.

- The [`Authentication`](../../authentication/architecture.md#servlet-authentication-authentication) is set on the [`SecurityContextHolder`](../../authentication/architecture.md#servlet-authentication-securitycontextholder).
- The `Saml2WebSsoAuthenticationFilter` invokes `FilterChain#doFilter(request,response)` to continue with the rest of the application logic.

<a id="servlet-saml2login-minimaldependencies"></a>

## Minimal Dependencies

SAML 2.0 service provider support resides in `spring-security-saml2-service-provider`.
It builds off of the OpenSAML library, and, for that reason, you must also include the Shibboleth Maven repository in your build configuration.
Check [this link](https://shibboleth.atlassian.net/wiki/spaces/DEV/pages/1123844333/Use+of+Maven+Central#Publishing-to-Maven-Central) for more details about why a separate repository is needed.

#### Maven

```xml
<repositories>
    <!-- ... -->
    <repository>
        <id>shibboleth-releases</id>
        <name>Shibboleth Releases Repository</name>
        <url>https://build.shibboleth.net/maven/releases/</url>
        <snapshots>
            <enabled>false</enabled>
        </snapshots>
    </repository>
</repositories>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-saml2-service-provider</artifactId>
</dependency>
```

#### Gradle

```groovy
repositories {
    // ...
    maven { url "https://build.shibboleth.net/nexus/content/repositories/releases/" }
}
dependencies {
    // ...
    implementation 'org.springframework.security:spring-security-saml2-service-provider'
}
```

<a id="servlet-saml2login-minimalconfiguration"></a>

## Minimal Configuration

When using [Spring Boot](https://spring.io/projects/spring-boot), configuring an application as a service provider consists of two basic steps:
. Include the needed dependencies.
. Indicate the necessary asserting party metadata.

> [!NOTE]
> Also, this configuration presupposes that you have already [registered the relying party with your asserting party](../metadata.md#servlet-saml2login-metadata).

<a id="saml2-specifying-identity-provider-metadata"></a>

### Specifying Identity Provider Metadata

In a Spring Boot application, to specify an identity provider’s metadata, create configuration similar to the following:

```yml
spring:
  security:
    saml2:
      relyingparty:
        registration:
          adfs:
            assertingparty:
              entity-id: https://idp.example.com/issuer
              verification.credentials:
                - certificate-location: "classpath:idp.crt"
              singlesignon.url: https://idp.example.com/issuer/sso
              singlesignon.sign-request: false
```

where:

- `idp.example.com/issuer` is the value contained in the `Issuer` attribute of the SAML responses that the identity provider issues.
- `classpath:idp.crt` is the location on the classpath for the identity provider’s certificate for verifying SAML responses.
- `idp.example.com/issuer/sso` is the endpoint where the identity provider is expecting `AuthnRequest` instances.
- `adfs` is [an arbitrary identifier you choose](#servlet-saml2login-relyingpartyregistrationid)

And that’s it!

> [!NOTE]
> Identity Provider and Asserting Party are synonymous, as are Service Provider and Relying Party.
> These are frequently abbreviated as AP and RP, respectively.

<a id="_runtime_expectations"></a>

### Runtime Expectations

As configured [earlier](#saml2-specifying-identity-provider-metadata), the application processes any `POST /login/saml2/sso/{registrationId}` request containing a `SAMLResponse` parameter:

```http
POST /login/saml2/sso/adfs HTTP/1.1

SAMLResponse=PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZ...
```

There are two ways to induce your asserting party to generate a `SAMLResponse`:

- You can navigate to your asserting party.
It likely has some kind of link or button for each registered relying party that you can click to send the `SAMLResponse`.
- You can navigate to a protected page in your application — for example, `localhost:8080`.
Your application then redirects to the configured asserting party, which then sends the `SAMLResponse`.

From here, consider jumping to:

- [How SAML 2.0 Login Integrates with OpenSAML](#servlet-saml2login-architecture)
- [How to Use the `Saml2AuthenticatedPrincipal`](authentication.md#servlet-saml2login-authenticatedprincipal)
- [How to Override or Replace Spring Boot’s Auto Configuration](#servlet-saml2login-sansboot)

<a id="servlet-saml2login-architecture"></a>

## How SAML 2.0 Login Integrates with OpenSAML

Spring Security’s SAML 2.0 support has a couple of design goals:

- Rely on a library for SAML 2.0 operations and domain objects.
To achieve this, Spring Security uses OpenSAML.
- Ensure that this library is not required when using Spring Security’s SAML support.
To achieve this, any interfaces or classes where Spring Security uses OpenSAML in the contract remain encapsulated.
This makes it possible for you to switch out OpenSAML for some other library or an unsupported version of OpenSAML.

As a natural outcome of these two goals, Spring Security’s SAML API is quite small relative to other modules.
Instead, such classes as `OpenSamlXAuthenticationRequestFactory` and `OpenSamlXAuthenticationProvider` expose `Converter` implementations that customize various steps in the authentication process.

For example, once your application receives a `SAMLResponse` and delegates to `Saml2WebSsoAuthenticationFilter`, the filter delegates to `OpenSamlXAuthenticationProvider`:

![opensamlauthenticationprovider](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/servlet/saml2/opensamlauthenticationprovider.png)

This figure builds off of the [`Saml2WebSsoAuthenticationFilter` diagram](#servlet-saml2login-authentication-saml2webssoauthenticationfilter).

![number 1](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_1.png) The `Saml2WebSsoAuthenticationFilter` formulates the `Saml2AuthenticationToken` and invokes the [`AuthenticationManager`](../../authentication/architecture.md#servlet-authentication-providermanager).

![number 2](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_2.png) The [`AuthenticationManager`](../../authentication/architecture.md#servlet-authentication-providermanager) invokes the OpenSAML authentication provider.

![number 3](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_3.png) The authentication provider deserializes the response into an OpenSAML `Response` and checks its signature.
If the signature is invalid, authentication fails.

![number 4](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_4.png) Then the provider [decrypts any `EncryptedAssertion` elements](authentication.md#servlet-saml2login-opensamlauthenticationprovider-decryption).
If any decryptions fail, authentication fails.

![number 5](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_5.png) Next, the provider validates the response’s `Issuer` and `Destination` values.
If they do not match what’s in the `RelyingPartyRegistration`, authentication fails.

![number 6](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_6.png) After that, the provider verifies the signature of each `Assertion`.
If any signature is invalid, authentication fails.
Also, if neither the response nor the assertions have signatures, authentication fails.
Either the response or all the assertions must have signatures.

![number 7](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_7.png) Then, the provider [,](authentication.md#servlet-saml2login-opensamlauthenticationprovider-decryption)decrypts any `EncryptedID` or `EncryptedAttribute` elements\].
If any decryptions fail, authentication fails.

![number 8](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_8.png) Next, the provider validates each assertion’s `ExpiresAt` and `NotBefore` timestamps, the `<Subject>` and any `<AudienceRestriction>` conditions.
If any validations fail, authentication fails.

![number 9](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_9.png) Following that, the provider takes the first assertion’s `AttributeStatement` and maps it to a `Map<String, List<Object>>`.
It also grants the `ROLE_USER` granted authority.

![number 10](https://raw.githubusercontent.com/spring-projects/spring-security/6.5.8/docs/modules/ROOT/assets/images/icons/number_10.png) And finally, it takes the `NameID` from the first assertion, the `Map` of attributes, and the `GrantedAuthority` and constructs a `Saml2AuthenticatedPrincipal`.
Then, it places that principal and the authorities into a `Saml2Authentication`.

The resulting `Authentication#getPrincipal` is a Spring Security `Saml2AuthenticatedPrincipal` object, and `Authentication#getName` maps to the first assertion’s `NameID` element.
`Saml2AuthenticatedPrincipal#getRelyingPartyRegistrationId` holds the [identifier to the associated `RelyingPartyRegistration`](#servlet-saml2login-relyingpartyregistrationid).

<a id="servlet-saml2login-opensaml-customization"></a>

### Customizing OpenSAML Configuration

Any class that uses both Spring Security and OpenSAML should statically initialize `OpenSamlInitializationService` at the beginning of the class:

#### Java

```java
static {
	OpenSamlInitializationService.initialize();
}
```

#### Kotlin

```kotlin
companion object {
    init {
        OpenSamlInitializationService.initialize()
    }
}
```

This replaces OpenSAML’s `InitializationService#initialize`.

Occasionally, it can be valuable to customize how OpenSAML builds, marshalls, and unmarshalls SAML objects.
In these circumstances, you may instead want to call `OpenSamlInitializationService#requireInitialize(Consumer)` that gives you access to OpenSAML’s `XMLObjectProviderFactory`.

For example, when sending an unsigned AuthNRequest, you may want to force reauthentication.
In that case, you can register your own `AuthnRequestMarshaller`, like so:

#### Java

```java
static {
    OpenSamlInitializationService.requireInitialize(factory -> {
        AuthnRequestMarshaller marshaller = new AuthnRequestMarshaller() {
            @Override
            public Element marshall(XMLObject object, Element element) throws MarshallingException {
                configureAuthnRequest((AuthnRequest) object);
                return super.marshall(object, element);
            }

            public Element marshall(XMLObject object, Document document) throws MarshallingException {
                configureAuthnRequest((AuthnRequest) object);
                return super.marshall(object, document);
            }

            private void configureAuthnRequest(AuthnRequest authnRequest) {
                authnRequest.setForceAuthn(true);
            }
        }

        factory.getMarshallerFactory().registerMarshaller(AuthnRequest.DEFAULT_ELEMENT_NAME, marshaller);
    });
}
```

#### Kotlin

```kotlin
companion object {
    init {
        OpenSamlInitializationService.requireInitialize {
            val marshaller = object : AuthnRequestMarshaller() {
                override fun marshall(xmlObject: XMLObject, element: Element): Element {
                    configureAuthnRequest(xmlObject as AuthnRequest)
                    return super.marshall(xmlObject, element)
                }

                override fun marshall(xmlObject: XMLObject, document: Document): Element {
                    configureAuthnRequest(xmlObject as AuthnRequest)
                    return super.marshall(xmlObject, document)
                }

                private fun configureAuthnRequest(authnRequest: AuthnRequest) {
                    authnRequest.isForceAuthn = true
                }
            }
            it.marshallerFactory.registerMarshaller(AuthnRequest.DEFAULT_ELEMENT_NAME, marshaller)
        }
    }
}
```

The `requireInitialize` method may be called only once per application instance.

<a id="servlet-saml2login-sansboot"></a>

## Overriding or Replacing Boot Auto Configuration

Spring Boot generates two `@Bean` objects for a relying party.

The first is a `SecurityFilterChain` that configures the application as a relying party.
When including `spring-security-saml2-service-provider`, the `SecurityFilterChain` looks like:

#### Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(authorize -> authorize
            .anyRequest().authenticated()
        )
        .saml2Login(withDefaults());
    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        authorizeRequests {
            authorize(anyRequest, authenticated)
        }
        saml2Login { }
    }
    return http.build()
}
```

If the application does not expose a `SecurityFilterChain` bean, Spring Boot exposes the preceding default one.

You can replace this by exposing the bean within the application:

#### Java

```java
@Configuration
@EnableWebSecurity
public class MyCustomSecurityConfiguration {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/messages/**").hasAuthority("ROLE_USER")
                .anyRequest().authenticated()
            )
            .saml2Login(withDefaults());
        return http.build();
    }
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
class MyCustomSecurityConfiguration {
    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeRequests {
                authorize("/messages/**", hasAuthority("ROLE_USER"))
                authorize(anyRequest, authenticated)
            }
            saml2Login {
            }
        }
        return http.build()
    }
}
```

The preceding example requires the role of `USER` for any URL that starts with `/messages/`.

<a id="servlet-saml2login-relyingpartyregistrationrepository"></a>

The second `@Bean` Spring Boot creates is a [`RelyingPartyRegistrationRepository`](https://docs.spring.io/spring-security/site/docs/6.5.8/api/org/springframework/security/saml2/provider/service/registration/RelyingPartyRegistrationRepository.html), which represents the asserting party and relying party metadata.
This includes such things as the location of the SSO endpoint the relying party should use when requesting authentication from the asserting party.

You can override the default by publishing your own `RelyingPartyRegistrationRepository` bean.
For example, you can look up the asserting party’s configuration by hitting its metadata endpoint:

#### Java

```java
@Value("${metadata.location}")
String assertingPartyMetadataLocation;

@Bean
public RelyingPartyRegistrationRepository relyingPartyRegistrations() {
    RelyingPartyRegistration registration = RelyingPartyRegistrations
            .fromMetadataLocation(assertingPartyMetadataLocation)
            .registrationId("example")
            .build();
    return new InMemoryRelyingPartyRegistrationRepository(registration);
}
```

#### Kotlin

```kotlin
@Value("\${metadata.location}")
var assertingPartyMetadataLocation: String? = null

@Bean
open fun relyingPartyRegistrations(): RelyingPartyRegistrationRepository? {
    val registration = RelyingPartyRegistrations
        .fromMetadataLocation(assertingPartyMetadataLocation)
        .registrationId("example")
        .build()
    return InMemoryRelyingPartyRegistrationRepository(registration)
}
```

<a id="servlet-saml2login-relyingpartyregistrationid"></a>

> [!NOTE]
> The `registrationId` is an arbitrary value that you choose for differentiating between registrations.

Alternatively, you can provide each detail manually:

#### Java

```java
@Value("${verification.key}")
File verificationKey;

@Bean
public RelyingPartyRegistrationRepository relyingPartyRegistrations() throws Exception {
    X509Certificate certificate = X509Support.decodeCertificate(this.verificationKey);
    Saml2X509Credential credential = Saml2X509Credential.verification(certificate);
    RelyingPartyRegistration registration = RelyingPartyRegistration
            .withRegistrationId("example")
            .assertingPartyMetadata(party -> party
                .entityId("https://idp.example.com/issuer")
                .singleSignOnServiceLocation("https://idp.example.com/SSO.saml2")
                .wantAuthnRequestsSigned(false)
                .verificationX509Credentials(c -> c.add(credential))
            )
            .build();
    return new InMemoryRelyingPartyRegistrationRepository(registration);
}
```

#### Kotlin

```kotlin
@Value("\${verification.key}")
var verificationKey: File? = null

@Bean
open fun relyingPartyRegistrations(): RelyingPartyRegistrationRepository {
    val certificate: X509Certificate? = X509Support.decodeCertificate(verificationKey!!)
    val credential: Saml2X509Credential = Saml2X509Credential.verification(certificate)
    val registration = RelyingPartyRegistration
        .withRegistrationId("example")
        .assertingPartyMetadata { party: AssertingPartyMetadata.Builder ->
            party
                .entityId("https://idp.example.com/issuer")
                .singleSignOnServiceLocation("https://idp.example.com/SSO.saml2")
                .wantAuthnRequestsSigned(false)
                .verificationX509Credentials { c: MutableCollection<Saml2X509Credential?> ->
                    c.add(
                        credential
                    )
                }
        }
        .build()
    return InMemoryRelyingPartyRegistrationRepository(registration)
}
```

> [!NOTE]
> `X509Support` is an OpenSAML class, used in the preceding snippet for brevity.

<a id="servlet-saml2login-relyingpartyregistrationrepository-dsl"></a>

Alternatively, you can directly wire up the repository by using the DSL, which also overrides the auto-configured `SecurityFilterChain`:

#### Java

```java
@Configuration
@EnableWebSecurity
public class MyCustomSecurityConfiguration {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(authorize -> authorize
                .requestMatchers("/messages/**").hasAuthority("ROLE_USER")
                .anyRequest().authenticated()
            )
            .saml2Login(saml2 -> saml2
                .relyingPartyRegistrationRepository(relyingPartyRegistrations())
            );
        return http.build();
    }
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
class MyCustomSecurityConfiguration {
    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        http {
            authorizeRequests {
                authorize("/messages/**", hasAuthority("ROLE_USER"))
                authorize(anyRequest, authenticated)
            }
            saml2Login {
                relyingPartyRegistrationRepository = relyingPartyRegistrations()
            }
        }
        return http.build()
    }
}
```

> [!NOTE]
> A relying party can be multi-tenant by registering more than one relying party in the `RelyingPartyRegistrationRepository`.

<a id="servlet-saml2login-relyingpartyregistrationrepository-caching"></a>

If you want your metadata to be refreshable on a periodic basis, you can wrap your repository in `CachingRelyingPartyRegistrationRepository` like so:

#### Java

```java
@Configuration
@EnableWebSecurity
public class MyCustomSecurityConfiguration {
    @Bean
    public RelyingPartyRegistrationRepository registrations(CacheManager cacheManager) {
		Supplier<IterableRelyingPartyRegistrationRepository> delegate = () ->
            new InMemoryRelyingPartyRegistrationRepository(RelyingPartyRegistrations
                .fromMetadataLocation("https://idp.example.org/ap/metadata")
                .registrationId("ap").build());
		CachingRelyingPartyRegistrationRepository registrations =
            new CachingRelyingPartyRegistrationRepository(delegate);
		registrations.setCache(cacheManager.getCache("my-cache-name"));
        return registrations;
    }
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
class MyCustomSecurityConfiguration  {
    @Bean
    fun registrations(cacheManager: CacheManager): RelyingPartyRegistrationRepository {
        val delegate = Supplier<IterableRelyingPartyRegistrationRepository> {
             InMemoryRelyingPartyRegistrationRepository(RelyingPartyRegistrations
                .fromMetadataLocation("https://idp.example.org/ap/metadata")
                .registrationId("ap").build())
        }
        val registrations = CachingRelyingPartyRegistrationRepository(delegate)
        registrations.setCache(cacheManager.getCache("my-cache-name"))
        return registrations
    }
}
```

In this way, the set of `RelyingPartyRegistration`s will refresh based on [the cache’s eviction schedule](https://docs.spring.io/spring-framework/reference/6.2.16/integration/cache/store-configuration.html).

<a id="servlet-saml2login-relyingpartyregistration"></a>

## RelyingPartyRegistration

A [`RelyingPartyRegistration`](https://docs.spring.io/spring-security/site/docs/6.5.8/api/org/springframework/security/saml2/provider/service/registration/RelyingPartyRegistration.html)
instance represents a link between an relying party and an asserting party’s metadata.

In a `RelyingPartyRegistration`, you can provide relying party metadata like its `Issuer` value, where it expects SAML Responses to be sent to, and any credentials that it owns for the purposes of signing or decrypting payloads.

Also, you can provide asserting party metadata like its `Issuer` value, where it expects AuthnRequests to be sent to, and any public credentials that it owns for the purposes of the relying party verifying or encrypting payloads.

The following `RelyingPartyRegistration` is the minimum required for most setups:

#### Java

```java
RelyingPartyRegistration relyingPartyRegistration = RelyingPartyRegistrations
        .fromMetadataLocation("https://ap.example.org/metadata")
        .registrationId("my-id")
        .build();
```

#### Kotlin

```kotlin
val relyingPartyRegistration = RelyingPartyRegistrations
    .fromMetadataLocation("https://ap.example.org/metadata")
    .registrationId("my-id")
    .build()
```

Note that you can also create a `RelyingPartyRegistration` from an arbitrary `InputStream` source.
One such example is when the metadata is stored in a database:

```java
String xml = fromDatabase();
try (InputStream source = new ByteArrayInputStream(xml.getBytes())) {
    RelyingPartyRegistration relyingPartyRegistration = RelyingPartyRegistrations
            .fromMetadata(source)
            .registrationId("my-id")
            .build();
}
```

A more sophisticated setup is also possible:

#### Java

```java
RelyingPartyRegistration relyingPartyRegistration = RelyingPartyRegistration.withRegistrationId("my-id")
        .entityId("{baseUrl}/{registrationId}")
        .decryptionX509Credentials(c -> c.add(relyingPartyDecryptingCredential()))
        .assertionConsumerServiceLocation("/my-login-endpoint/{registrationId}")
        .assertingPartyMetadata(party -> party
                .entityId("https://ap.example.org")
                .verificationX509Credentials(c -> c.add(assertingPartyVerifyingCredential()))
                .singleSignOnServiceLocation("https://ap.example.org/SSO.saml2")
        )
        .build();
```

#### Kotlin

```kotlin
val relyingPartyRegistration =
    RelyingPartyRegistration.withRegistrationId("my-id")
        .entityId("{baseUrl}/{registrationId}")
        .decryptionX509Credentials { c: MutableCollection<Saml2X509Credential?> ->
            c.add(relyingPartyDecryptingCredential())
        }
        .assertionConsumerServiceLocation("/my-login-endpoint/{registrationId}")
        .assertingPartyMetadata { party -> party
                .entityId("https://ap.example.org")
                .verificationX509Credentials { c -> c.add(assertingPartyVerifyingCredential()) }
                .singleSignOnServiceLocation("https://ap.example.org/SSO.saml2")
        }
        .build()
```

> [!TIP]
> The top-level metadata methods are details about the relying party.
> The methods inside `AssertingPartyMetadata` are details about the asserting party.

> [!NOTE]
> The location where a relying party is expecting SAML Responses is the Assertion Consumer Service Location.

The default for the relying party’s `entityId` is `{baseUrl}/saml2/service-provider-metadata/{registrationId}`.
This is this value needed when configuring the asserting party to know about your relying party.

The default for the `assertionConsumerServiceLocation` is `/login/saml2/sso/{registrationId}`.
By default, it is mapped to [`Saml2WebSsoAuthenticationFilter`](#servlet-saml2login-authentication-saml2webssoauthenticationfilter) in the filter chain.

<a id="servlet-saml2login-rpr-uripatterns"></a>

### URI Patterns

You probably noticed the `{baseUrl}` and `{registrationId}` placeholders in the preceding examples.

These are useful for generating URIs. As a result, the relying party’s `entityId` and `assertionConsumerServiceLocation` support the following placeholders:

- `baseUrl` - the scheme, host, and port of a deployed application
- `registrationId` - the registration id for this relying party
- `baseScheme` - the scheme of a deployed application
- `baseHost` - the host of a deployed application
- `basePort` - the port of a deployed application

For example, the `assertionConsumerServiceLocation` defined earlier was:

`/my-login-endpoint/{registrationId}`

In a deployed application, it translates to:

`/my-login-endpoint/adfs`

The `entityId` shown earlier was defined as:

`{baseUrl}/{registrationId}`

In a deployed application, that translates to:

`https://rp.example.com/adfs`

The prevailing URI patterns are as follows:

- `/saml2/authenticate/{registrationId}` - The endpoint that [generates a `<saml2:AuthnRequest>`](authentication-requests.md) based on the configurations for that `RelyingPartyRegistration` and sends it to the asserting party
- `/login/saml2/sso/` - The endpoint that [authenticates an asserting party’s `<saml2:Response>`](authentication.md); the `RelyingPartyRegistration` is looked up from previously authenticated state or the response’s issuer if needed; also supports `/login/saml2/sso/{registrationId}`
- `/logout/saml2/sso` - The endpoint that [processes `<saml2:LogoutRequest>` and `<saml2:LogoutResponse>` payloads](../logout.md); the `RelyingPartyRegistration` is looked up from previously authenticated state or the request’s issuer if needed; also supports `/logout/saml2/slo/{registrationId}`
- `/saml2/metadata` - The [relying party metadata](../metadata.md) for the set of `RelyingPartyRegistration`s; also supports `/saml2/metadata/{registrationId}` or `/saml2/service-provider-metadata/{registrationId}` for a specific `RelyingPartyRegistration`

Since the `registrationId` is the primary identifier for a `RelyingPartyRegistration`, it is needed in the URL for unauthenticated scenarios.
If you wish to remove the `registrationId` from the URL for any reason, you can [specify a `RelyingPartyRegistrationResolver`](#servlet-saml2login-rpr-relyingpartyregistrationresolver) to tell Spring Security how to look up the `registrationId`.

<a id="servlet-saml2login-rpr-credentials"></a>

### Credentials

In the example shown [earlier](#servlet-saml2login-relyingpartyregistration), you also likely noticed the credential that was used.

Oftentimes, a relying party uses the same key to sign payloads as well as decrypt them.
Alternatively, it can use the same key to verify payloads as well as encrypt them.

Because of this, Spring Security ships with `Saml2X509Credential`, a SAML-specific credential that simplifies configuring the same key for different use cases.

At a minimum, you need to have a certificate from the asserting party so that the asserting party’s signed responses can be verified.

To construct a `Saml2X509Credential` that you can use to verify assertions from the asserting party, you can load the file and use
the `CertificateFactory`:

#### Java

```java
Resource resource = new ClassPathResource("ap.crt");
try (InputStream is = resource.getInputStream()) {
    X509Certificate certificate = (X509Certificate)
            CertificateFactory.getInstance("X.509").generateCertificate(is);
    return Saml2X509Credential.verification(certificate);
}
```

#### Kotlin

```kotlin
val resource = ClassPathResource("ap.crt")
resource.inputStream.use {
    return Saml2X509Credential.verification(
        CertificateFactory.getInstance("X.509").generateCertificate(it) as X509Certificate?
    )
}
```

Suppose that the asserting party is going to also encrypt the assertion.
In that case, the relying party needs a private key to decrypt the encrypted value.

In that case, you need an `RSAPrivateKey` as well as its corresponding `X509Certificate`.
You can load the first by using Spring Security’s `RsaKeyConverters` utility class and the second as you did before:

#### Java

```java
X509Certificate certificate = relyingPartyDecryptionCertificate();
Resource resource = new ClassPathResource("rp.crt");
try (InputStream is = resource.getInputStream()) {
    RSAPrivateKey rsa = RsaKeyConverters.pkcs8().convert(is);
    return Saml2X509Credential.decryption(rsa, certificate);
}
```

#### Kotlin

```kotlin
val certificate: X509Certificate = relyingPartyDecryptionCertificate()
val resource = ClassPathResource("rp.crt")
resource.inputStream.use {
    val rsa: RSAPrivateKey = RsaKeyConverters.pkcs8().convert(it)
    return Saml2X509Credential.decryption(rsa, certificate)
}
```

> [!TIP]
> When you specify the locations of these files as the appropriate Spring Boot properties, Spring Boot performs these conversions for you.

<a id="servlet-saml2login-rpr-duplicated"></a>

### Duplicated Relying Party Configurations

When an application uses multiple asserting parties, some configuration is duplicated between `RelyingPartyRegistration` instances:

- The relying party’s `entityId`
- Its `assertionConsumerServiceLocation`
- Its credentials — for example, its signing or decryption credentials

This setup may let credentials be more easily rotated for some identity providers versus others.

The duplication can be alleviated in a few different ways.

First, in YAML this can be alleviated with references:

```yaml
spring:
  security:
    saml2:
      relyingparty:
        registration:
          okta:
            signing.credentials: &relying-party-credentials
              - private-key-location: classpath:rp.key
                certificate-location: classpath:rp.crt
            assertingparty:
              entity-id: ...
          azure:
            signing.credentials: *relying-party-credentials
            assertingparty:
              entity-id: ...
```

Second, in a database, you need not replicate the model of `RelyingPartyRegistration`.

Third, in Java, you can create a custom configuration method:

#### Java

```java
private RelyingPartyRegistration.Builder
        addRelyingPartyDetails(RelyingPartyRegistration.Builder builder) {

    Saml2X509Credential signingCredential = ...
    builder.signingX509Credentials(c -> c.addAll(signingCredential));
    // ... other relying party configurations
}

@Bean
public RelyingPartyRegistrationRepository relyingPartyRegistrations() {
    RelyingPartyRegistration okta = addRelyingPartyDetails(
            RelyingPartyRegistrations
                .fromMetadataLocation(oktaMetadataUrl)
                .registrationId("okta")).build();

    RelyingPartyRegistration azure = addRelyingPartyDetails(
            RelyingPartyRegistrations
                .fromMetadataLocation(oktaMetadataUrl)
                .registrationId("azure")).build();

    return new InMemoryRelyingPartyRegistrationRepository(okta, azure);
}
```

#### Kotlin

```kotlin
private fun addRelyingPartyDetails(builder: RelyingPartyRegistration.Builder): RelyingPartyRegistration.Builder {
    val signingCredential: Saml2X509Credential = ...
    builder.signingX509Credentials { c: MutableCollection<Saml2X509Credential?> ->
        c.add(
            signingCredential
        )
    }
    // ... other relying party configurations
}

@Bean
open fun relyingPartyRegistrations(): RelyingPartyRegistrationRepository? {
    val okta = addRelyingPartyDetails(
        RelyingPartyRegistrations
            .fromMetadataLocation(oktaMetadataUrl)
            .registrationId("okta")
    ).build()
    val azure = addRelyingPartyDetails(
        RelyingPartyRegistrations
            .fromMetadataLocation(oktaMetadataUrl)
            .registrationId("azure")
    ).build()
    return InMemoryRelyingPartyRegistrationRepository(okta, azure)
}
```

<a id="servlet-saml2login-rpr-relyingpartyregistrationresolver"></a>

### Resolving the `RelyingPartyRegistration` from the Request

As seen so far, Spring Security resolves the `RelyingPartyRegistration` by looking for the registration id in the URI path.

Depending on the use case, a number of other strategies are also employed to derive one.
For example:

- For processing `<saml2:Response>`s, the `RelyingPartyRegistration` is looked up from the associated `<saml2:AuthRequest>` or from the `<saml2:Response#Issuer>` element
- For processing `<saml2:LogoutRequest>`s, the `RelyingPartyRegistration` is looked up from the currently logged in user or from the `<saml2:LogoutRequest#Issuer>` element
- For publishing metadata, the `RelyingPartyRegistration`s are looked up from any repository that also implements `Iterable<RelyingPartyRegistration>`

When this needs adjustment, you can turn to the specific components for each of these endpoints targeted at customizing this:

- For SAML Responses, customize the `AuthenticationConverter`
- For Logout Requests, customize the `Saml2LogoutRequestValidatorParametersResolver`
- For Metadata, customize the `Saml2MetadataResponseResolver`

<a id="federating-saml2-login"></a>

### Federating Login

One common arrangement with SAML 2.0 is an identity provider that has multiple asserting parties.
In this case, the identity provider’s metadata endpoint returns multiple `<md:IDPSSODescriptor>` elements.

These multiple asserting parties can be accessed in a single call to `RelyingPartyRegistrations` like so:

#### Java

```java
Collection<RelyingPartyRegistration> registrations = RelyingPartyRegistrations
        .collectionFromMetadataLocation("https://example.org/saml2/idp/metadata.xml")
        .stream().map((builder) -> builder
            .registrationId(UUID.randomUUID().toString())
            .entityId("https://example.org/saml2/sp")
            .build()
        )
        .collect(Collectors.toList());
```

#### Kotlin

```kotlin
var registrations: Collection<RelyingPartyRegistration> = RelyingPartyRegistrations
        .collectionFromMetadataLocation("https://example.org/saml2/idp/metadata.xml")
        .stream().map { builder : RelyingPartyRegistration.Builder -> builder
            .registrationId(UUID.randomUUID().toString())
            .entityId("https://example.org/saml2/sp")
            .assertionConsumerServiceLocation("{baseUrl}/login/saml2/sso")
            .build()
        }
        .collect(Collectors.toList())
```

Note that because the registration id is set to a random value, this will change certain SAML 2.0 endpoints to be unpredictable.
There are several ways to address this; let’s focus on a way that suits the specific use case of federation.

In many federation cases, all the asserting parties share service provider configuration.
Given that Spring Security will by default include the `registrationId` in the service provider metadata, another step is to change corresponding URIs to exclude the `registrationId`, which you can see has already been done in the above sample where the `entityId` and `assertionConsumerServiceLocation` are configured with a static endpoint.

You can see a completed example of this in [our `saml-extension-federation` sample](https://github.com/spring-projects/spring-security-samples/tree/6.5.x/servlet/spring-boot/java/saml2/saml-extension-federation).

<a id="using-spring-security-saml-extension-uris"></a>

### Using Spring Security SAML Extension URIs

In the event that you are migrating from the Spring Security SAML Extension, there may be some benefit to configuring your application to use the SAML Extension URI defaults.

For more information on this, please see [our `custom-urls` sample](https://github.com/spring-projects/spring-security-samples/tree/6.5.x/servlet/spring-boot/java/saml2/custom-urls) and [our `saml-extension-federation` sample](https://github.com/spring-projects/spring-security-samples/tree/6.5.x/servlet/spring-boot/java/saml2/saml-extension-federation).
