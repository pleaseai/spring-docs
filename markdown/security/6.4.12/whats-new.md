---
title: "What’s New in Spring Security 6.4"
source: "ROOT:whats-new.adoc"
---

<a id="new"></a>

# What’s New in Spring Security 6.4

Spring Security 6.4 provides a number of new features.
Below are the highlights of the release, or you can view [the release notes](https://github.com/spring-projects/spring-security/releases) for a detailed listing of each feature and bug fix.

<a id="_deprecation_notices"></a>

## Deprecation Notices

As we get closer to Spring Security 7, it’s important to stay up to date on deprecations.
As such, this section points out deprecations in the 6.4 release.

- **Method Security** - `AuthorizationManager#check` is deprecated in favor of `AuthorizationManager#authorize`.
This is primarily to allow the return type to be an interface instead of a concrete class.
If you are invoking `AuthorizationManager#check`, please invoke `AuthorizationManager#authorize` instead.

  Relatedly, `AuthorizationEventPublisher#publishEvent` that takes an `AuthorizationDecision` is deprecated in favor of a method of the same name that takes an `AuthorizationResult` interface instead.
- **Method Security** - `PrePostTemplateDefaults` is deprecated in favor of the more generic `AnnotationTemplateExpressionDefaults` as there is now meta-annotation property support for `@AuthenticationPrincipal` and `@CurrentSecurityContext` as well.
If you are constructing a `PrePostTemplateDefaults`, change this out for an `AnnotationTemplateExpressionDefaults`.
- **OAuth 2.0** - `NimbusOpaqueTokenIntrospector` has been deprecated in favor of `SpringOpaqueTokenIntrospector` in order to remove Spring Security OAuth 2.0 Resource Server’s reliance on the `oidc-oauth2-sdk` package.
If you are constructing a `NimbusOpaqueTokenIntrospector`, replace it with `SpringOpaqueTokenIntrospector`'s constructor
- **OAuth 2.0** - `DefaultAuthorizationCodeTokenResponseClient`, `DefaultClientCredentialsTokenResponseClient`, `DefaultJwtBearerTokenResponseClient`, `DefaultPasswordTokenResponseClient`, `DefaultRefreshTokenTokenResponseClient`, and `DefaultTokenExchangeTokenResponseClient` are deprecated in favor of their `RestClient` equivalents.

  Relatedly,`JwtBearerGrantRequestEntityConverter`, `OAuth2AuthorizationCodeGrantRequestEntityConverter`, `OAuth2ClientCredentialsGrantRequestEntityConverter`, `OAuth2PasswordGrantRequestEntityConverter`, `OAuth2RefreshTokenGrantRequestEntityConverter` are deprecated in favor of providing an instance of `DefaultOAuth2TokenRequestParametersConverter` to one of the above token response clients

  For example, if you have the following arrangement:

  ```java
  private static class MyCustomConverter
      extends AbstractOAuth2AuthorizationGrantRequestEntityConverter<OAuth2AuthorizationCodeGrantRequest> {
  	@Override
      protected MultiValueMap<String, String> createParameters
              (OAuth2AuthorizationCodeGrantRequest request) {
  		MultiValueMap<String, String> parameters = super.createParameters(request);
  		parameters.add("custom", "value");
  		return parameters;
      }
  }

  @Bean
  OAuth2AccessTokenResponseClient authorizationCode() {
  	DefaultAuthorizationCodeTokenResponseClient client =
          new DefaultAuthorizationCodeTokenResponseClient();
  	Converter<AuthorizationCodeGrantRequest, RequestEntity<?>> entityConverter =
          new OAuth2AuthorizationCodeGrantRequestEntityConverter();
  	entityConverter.setParametersConverter(new MyCustomConverter());
  	client.setRequestEntityConverter(entityConverter);
      return client;
  }
  ```

  This configuration is deprecated since it uses `DefaultAuthorizationCodeTokenResponseClient` and `OAuth2AuthorizationCodeGrantRequestEntityConverter`.
  The recommended configuration is now:

  ```java
  private static class MyCustomConverter implements Converter<OAuth2AuthorizationCodeGrantRequest, Map<String, String>> {
  	@Override
      public MultiValueMap<String, String> convert(OAuth2AuthorizeCodeGrantRequest request) {
  		MultiValueMap<String, String> parameters = OAuth2AuthorizationCodeGrantRequest.defaultParameters(request);
  		parameters.add("custom", "value");
  		return parameters;
      }
  }

  @Bean
  OAuth2AccessTokenResponseClient authorizationCode() {
  	RestClientAuthorizationCodeTokenResponseClient client =
          new RestClientAuthorizationCodeTokenResponseClient();
  	client.setParametersConverter(new MyCustomConverter());
      return client;
  }
  ```
- **SAML 2.0** - Unversioned OpenSAML implementations of Spring Security SAML 2.0 Service Provider’s interfaces have been deprecated in favor of versioned ones.
For example, `OpenSamlAuthenticationTokenConverter` is now replaced by `OpenSaml4AuthenticationTokenConverter` and `OpenSaml5AuthenticationTokenConverter`.
If you are constructing one of these deprecated versions, please replace it with the one that corresponds to the OpenSAML version you are using.
- **SAML 2.0** - Methods surrounding `AssertingPartyDetails` are deprecated in favor of equivalent methods that use the `AssertingPartyMetadata` interface.
- **LDAP** - Usages of `DistinguishedName` are now deprecated in order to align with Spring LDAP’s deprecations

<a id="_one_time_token_login"></a>

## One-Time Token Login

- Spring Security now [supports One-Time Token Login](servlet/authentication/onetimetoken.md) via the `oneTimeTokenLogin()` DSL, including [JDBC support](servlet/authentication/onetimetoken.md#customize-generate-consume-token).

<a id="_passkeys"></a>

## Passkeys

Spring Security now has [Passkeys](servlet/authentication/passkeys.md) support.

<a id="_method_security"></a>

## Method Security

- All [method security annotations](servlet/authorization/method-security.md#meta-annotations) now support [Framework’s `@AliasFor`](https://docs.spring.io/spring-framework/docs/6.2.12/javadoc-api/org/springframework/core/annotation/AliasFor.html)
- `@AuthenticationPrincipal` and `@CurrentSecurityContext` now support [annotation templates](servlet/authorization/method-security.md#_templating_meta_annotation_expressions).

  This means that you can now use Spring’s meta-annotation support like so:

  #### Java

  ```java
  @Target(TargetType.TYPE)
  @Retention(RetentionPolicy.RUNTIME)
  @AuthenticationPrincipal("claims['{claim}']")
  @interface CurrentUsername {
  	String claim() default "sub";
  }

  // ...

  @GetMapping
  public String method(@CurrentUsername("username") String username) {
  	// ...
  }
  ```

  #### Kotlin

  ```kotlin
  annotation CurrentUsername(val claim: String = "sub")

  // ...

  @GetMapping
  fun method(@CurrentUsername("username") val username: String): String {
  	// ...
  }
  ```
- [Several](https://github.com/spring-projects/spring-security/issues/13490) [improvements](https://github.com/spring-projects/spring-security/issues/13234) [were made](https://github.com/spring-projects/spring-security/issues/15097) to align Security’s annotation search with `AbstractFallbackMethodSecurityMetadataSource`'s algorithm.
This aids in migration from earlier versions of Spring Security.
- Native applications can now [use `@AuthorizeReturnObject`](servlet/authorization/method-security.md#authorize-return-object-aot)
- Native applications can now [reference beans in `@PreAuthorize` and `@PostAuthorize`](servlet/authorization/method-security.md#pre-post-authorize-aot)
- `SecurityAnnotationScanners` offers [a convenient API](https://github.com/spring-projects/spring-security/issues/15700) for scanning for Security annotations and for adding Security’s selection and templating features to custom annotations

<a id="_oauth_2_0"></a>

## OAuth 2.0

- `oauth2Login()` now accepts [`OAuth2AuthorizationRequestResolver` as a `@Bean`](https://github.com/spring-projects/spring-security/pull/15237)
- `ClientRegistrations` now supports externally obtained configuration
- Added `loginPage()` to DSL in reactive `oauth2Login()`
- OIDC Back-Channel support now accepts [logout tokens of type `logout+jwt`](https://github.com/spring-projects/spring-security/issues/15003)
- `RestClient` can now be [configured](servlet/oauth2/index.md#oauth2-client-access-protected-resources) with `OAuth2ClientHttpRequestInterceptor` to [make protected resources requests](servlet/oauth2/index.md#oauth2-client-accessing-protected-resources-example)
- Added `RestClient`-based implementations of `OAuth2AccessTokenResponseClient` for more consistent configuration of access token requests.

  To opt-in to using `RestClient` support, simply publish a bean for each grant type as in the following example:

  #### Java

  ```java
  @Configuration
  public class SecurityConfig {

  	@Bean
  	public OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> authorizationCodeAccessTokenResponseClient() {
  		return new RestClientAuthorizationCodeTokenResponseClient();
  	}

  	@Bean
  	public OAuth2AccessTokenResponseClient<OAuth2RefreshTokenGrantRequest> refreshTokenAccessTokenResponseClient() {
  		return new RestClientRefreshTokenTokenResponseClient();
  	}

  	@Bean
  	public OAuth2AccessTokenResponseClient<OAuth2ClientCredentialsGrantRequest> clientCredentialsAccessTokenResponseClient() {
  		return new RestClientClientCredentialsTokenResponseClient();
  	}

  	@Bean
  	public OAuth2AccessTokenResponseClient<JwtBearerGrantRequest> jwtBearerAccessTokenResponseClient() {
  		return new RestClientJwtBearerTokenResponseClient();
  	}

  	@Bean
  	public OAuth2AccessTokenResponseClient<TokenExchangeGrantRequest> tokenExchangeAccessTokenResponseClient() {
  		return new RestClientTokenExchangeTokenResponseClient();
  	}

  }
  ```

  #### Kotlin

  ```kotlin
  @Configuration
  class SecurityConfig {

  	@Bean
  	fun authorizationCodeAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<OAuth2AuthorizationCodeGrantRequest> {
  		return RestClientAuthorizationCodeTokenResponseClient()
  	}

  	@Bean
  	fun refreshTokenAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<OAuth2RefreshTokenGrantRequest> {
  		return RestClientRefreshTokenTokenResponseClient()
  	}

  	@Bean
  	fun clientCredentialsAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<OAuth2ClientCredentialsGrantRequest> {
  		return RestClientClientCredentialsTokenResponseClient()
  	}

  	@Bean
  	fun jwtBearerAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<JwtBearerGrantRequest> {
  		return RestClientJwtBearerTokenResponseClient()
  	}

  	@Bean
  	fun tokenExchangeAccessTokenResponseClient(): OAuth2AccessTokenResponseClient<TokenExchangeGrantRequest> {
  		return RestClientTokenExchangeTokenResponseClient()
  	}

  }
  ```
- Token Exchange now [supports refresh tokens](https://github.com/spring-projects/spring-security/issues/15534)

<a id="_saml_2_0"></a>

## SAML 2.0

- Added [OpenSAML 5 Support](servlet/saml2/opensaml.md).
Now you can use either OpenSAML 4 or OpenSAML 5; by default, Spring Security will select the right implementations based on what’s on your classpath.
- Using EntityIDs for the `registrationId` is simplified.

  A common pattern is to identify asserting parties by their `entityID`.
  In previous versions, this required directly configuring `OpenSamlAuthenticationRequestResolver`.
  Now, the request resolver looks by default for the `registrationId` [as a request parameter](https://github.com/spring-projects/spring-security/issues/15017) in addition to looking for it in the path.
  This allows you to use `RelyingPartyRegistrations` or `OpenSaml4/5AssertingPartyMetadataRepository` without also needing to modify the `registrationId` values or customize the request resolver.

  Relatedly, you can now configure your `authenticationRequestUri` to [contain a query parameter](servlet/saml2/login/authentication-requests.md#configuring-authentication-request-uri)
- Asserting Parties can now be refreshed in the background according to the metadata’s expiry.

  For example, you can now use [`OpenSaml5AssertingPartyMetadataRepository`](servlet/saml2/metadata.md#using-assertingpartymetadatarepository) to do:

  #### Java

  ```java
  @Component
  public class RefreshableRelyingPartyRegistrationRepository implements IterableRelyingPartyRegistrationRepository {
  	private final AssertingPartyMetadataRepository assertingParties = OpenSaml5AssertingPartyMetadataRepository
  		.fromTrustedMetadataLocation("https://idp.example.org").build();

  	@Override
  	public RelyingPartyRegistration findByRegistrationId(String registrationId) {
  		AssertingPartyMetadata assertingParty = this.assertingParties.findByEntityId(registrationId);
  		return RelyingPartyRegistration.withAssertingPartyMetadata(assertingParty)
  			// relying party configurations
  			.build();
  	}

  	// ...
  }
  ```

  #### Kotlin

  ```kotlin
  @Component
  open class RefreshableRelyingPartyRegistrationRepository: IterableRelyingPartyRegistrationRepository {
  	private val assertingParties: AssertingPartyMetadataRepository = OpenSaml5AssertingPartyMetadataRepository
  		.fromTrustedMetadataLocation("https://idp.example.org").build()

  	override fun findByRegistrationId(String registrationId): RelyingPartyRegistration {
  		val assertingParty = this.assertingParties.findByEntityId(registrationId)
  		return RelyingPartyRegistration.withAssertingPartyMetadata(assertingParty)
  			// relying party configurations
  			.build()
  	}

  	// ...
  }
  ```

  This implementation also supports the validation of a metadata’s signature.
- You can now sign [relying party metadata](https://github.com/spring-projects/spring-security/pull/14916)
- `RelyingPartyRegistrationRepository` results can now be [cached](https://docs.spring.io/spring-security/site/docs/6.4.12/api/org/springframework/security/saml2/provider/service/registration/CachingRelyingPartyRegistrationRepository.html).
This is helpful if you want to defer the loading of the registration values til after application startup.
It is also helpful if you want to control when metadata gets refreshed via Spring Cache.
- To align with the SAML 2.0 standard, the metadata endpoint now [uses the `application/samlmetadata+xml` MIME type](https://github.com/spring-projects/spring-security/issues/15147)

<a id="_web"></a>

## Web

- CSRF BREACH tokens are now [more consistent](https://github.com/spring-projects/spring-security/issues/15187)
- The Remember Me cookie now is [more customizable](https://github.com/spring-projects/spring-security/pull/15203)
- Security Filter Chain finds more invalid configurations.
For example, a filter chain declared after an any-request filter chain is invalid since it will never be invoked:

  #### Java

  ```java
  @Bean
  @Order(0)
  SecurityFilterChain api(HttpSecurity http) throws Exception {
      http
          // implicit securityMatcher("/**")
          .authorizeHttpRequests(...)
          .httpBasic(...)

      return http.build();
  }

  @Bean
  @Order(1)
  SecurityFilterChain app(HttpSecurity http) throws Exception {
      http
          .securityMatcher("/app/**")
          .authorizeHttpRequests(...)
          .formLogin(...)

      return http.build();
  }
  ```

  #### Kotlin

  ```kotlin
  @Bean
  @Order(0)
  fun api(val http: HttpSecurity): SecurityFilterChain {
      http {
  		authorizeHttpRequests {
  			// ...
  		}
  	}
      return http.build()
  }

  @Bean
  @Order(1)
  fun app(val http: HttpSecurity): SecurityFilterChain {
      http {
  		securityMatcher("/app/**")
  		authorizeHttpRequests {
  			// ...
  		}
  	}
      return http.build()
  }
  ```

  You can read more [in the related ticket](https://github.com/spring-projects/spring-security/issues/15220).
- `ServerHttpSecurity` now [picks up `ServerWebExchangeFirewall` as a `@Bean`](https://github.com/spring-projects/spring-security/issues/15974)

<a id="_observability"></a>

## Observability

Observability now supports [toggling authorization, authentication, and request observations separately](servlet/integrations/observability.md#observability-tracing-disable)
For example, to turn off filter chain observations, you can publish a `@Bean` like this one:

#### Java

```java
@Bean
SecurityObservationSettings allSpringSecurityObservations() {
	return SecurityObservationSettings.withDefaults()
            .shouldObserveFilterChains(false).build();
}
```

#### Kotlin

```kotlin
@Bean
fun allSpringSecurityObservations(): SecurityObservationSettings {
    return SecurityObservationSettings.builder()
            .shouldObserveFilterChains(false).build()
}
```

<a id="_kotlin"></a>

## Kotlin

- The Kotlin DSL now supports [SAML 2.0](https://github.com/spring-projects/spring-security/issues/14935) and [`GrantedAuthorityDefaults`](https://github.com/spring-projects/spring-security/issues/15171) and [`RoleHierarchy`](https://github.com/spring-projects/spring-security/issues/15136) `@Bean`s
- `@PreFilter` and `@PostFilter` are [now supported](https://github.com/spring-projects/spring-security/pull/15095) in Kotlin
- The Kotlin Reactive DSL now supports [`SecurityContextRepository`](https://github.com/spring-projects/spring-security/pull/15013)

<a id="_acl"></a>

## Acl

- `AclAuthorizationStrategyImpl` now [supports `RoleHierarchy`](https://github.com/spring-projects/spring-security/issues/4186)
