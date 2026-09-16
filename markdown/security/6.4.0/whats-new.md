---
title: "What’s New in Spring Security 6.4"
source: "ROOT:whats-new.adoc"
---

<a id="new"></a>

# What’s New in Spring Security 6.4

Spring Security 6.4 provides a number of new features.
Below are the highlights of the release, or you can view [the release notes](https://github.com/spring-projects/spring-security/releases) for a detailed listing of each feature and bug fix.

<a id="_method_security"></a>

## Method Security

- All [method security annotations](servlet/authorization/method-security.md#meta-annotations) now support [Framework’s `@AliasFor`](https://docs.spring.io/spring-framework/docs/6.2.0/javadoc-api/org/springframework/core/annotation/AliasFor.html)
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

<a id="_oauth_2_0"></a>

## OAuth 2.0

- `oauth2Login()` now accepts [`OAuth2AuthorizationRequestResolver` as a `@Bean`](https://github.com/spring-projects/spring-security/pull/15237)
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
- Deprecated `Default*` implementations of `OAuth2AccessTokenResponseClient`

<a id="_saml_2_0"></a>

## SAML 2.0

- Added [OpenSAML 5 Support](servlet/saml2/opensaml.md).
Now you can use either OpenSAML 4 or OpenSAML 5; by default, Spring Security will select the write implementations based on what’s on your classpath.
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
- `RelyingPartyRegistrationRepository` results can now be [cached](https://docs.spring.io/spring-security/site/docs/6.4.0/api/org/springframework/security/saml2/provider/service/registration/CachingRelyingPartyRegistrationRepository.html).
This is helpful if you want to defer the loading of the registration values til after application startup.
It is also helpful if you want to control when metadata gets refreshed.
- To align with the SAML 2.0 standard, the metadata endpoint now [uses the `application/samlmetadata+xml` MIME type](https://github.com/spring-projects/spring-security/issues/15147)

<a id="_web"></a>

## Web

- CSRF BREACH tokens are now [more consistent](https://github.com/spring-projects/spring-security/issues/15187)
- The Remember Me cookie now is [more customizable](https://github.com/spring-projects/spring-security/pull/15203)
- Security Filter Chain is now improved.
Specifically, the following arrangement is invalid since an any request filter chain comes before all other filter chains:

  #### Java

  ```java
  @Bean
  @Order(0)
  SecurityFilterChain api(HttpSecurity http) throws Exception {
      http
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

<a id="_one_time_token_login"></a>

## One-Time Token Login

Spring Security now [supports One-Time Token Login](servlet/authentication/onetimetoken.md) via the `oneTimeTokenLogin()` DSL.

<a id="_passkeys"></a>

## Passkeys

Spring Security now has [Passkeys](servlet/authentication/passkeys.md) support.

<a id="_kotlin"></a>

## Kotlin

- The Kotlin DSL now supports [SAML 2.0](https://github.com/spring-projects/spring-security/issues/14935) and [`GrantedAuthorityDefaults`](https://github.com/spring-projects/spring-security/issues/15171) and [`RoleHierarchy`](https://github.com/spring-projects/spring-security/issues/15136) `@Bean`s
- `@PreFilter` and `@PostFilter` are [now supported](https://github.com/spring-projects/spring-security/pull/15095) in Kotlin
- The Kotlin Reactive DSL now supports [`SecurityContextRepository`](https://github.com/spring-projects/spring-security/pull/15013)

<a id="_acl"></a>

## Acl

- `AclAuthorizationStrategyImpl` now [supports `RoleHierarchy`](https://github.com/spring-projects/spring-security/issues/4186)
