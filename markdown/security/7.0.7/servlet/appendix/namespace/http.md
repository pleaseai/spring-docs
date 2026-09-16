---
title: "Web Application Security"
source: "ROOT:servlet/appendix/namespace/http.adoc"
---

<a id="nsa-web"></a>

# Web Application Security

<a id="nsa-debug"></a>

## <debug>

Enables Spring Security debugging infrastructure.
This will provide human-readable (multi-line) debugging information to monitor requests coming into the security filters.
This may include sensitive information, such as request parameters or headers, and should only be used in a development environment.

<a id="nsa-http"></a>

## <http>

If you use an `<http>` element within your application, a `FilterChainProxy` bean named "springSecurityFilterChain" is created and the configuration within the element is used to build a filter chain within
`FilterChainProxy`.
As of Spring Security 3.1, additional `http` elements can be used to add extra filter chains <sup>\[[1](#_footnotedef_1)\]</sup> for how to set up the mapping from your `web.xml` \].
Some core filters are always created in a filter chain and others will be added to the stack depending on the attributes and child elements which are present.
The positions of the standard filters are fixed (see
[the filter order table](../../configuration/xml-namespace.md#filter-stack) in the namespace introduction), removing a common source of errors with previous versions of the framework when users had to configure the filter chain explicitly in the
`FilterChainProxy` bean.
You can, of course, still do this if you need full control of the configuration.

All filters which require a reference to the [`AuthenticationManager`](../../authentication/architecture.md#servlet-authentication-authenticationmanager) will be automatically injected with the internal instance created by the namespace configuration.

Each `<http>` namespace block always creates an `SecurityContextPersistenceFilter`, an `ExceptionTranslationFilter` and a `FilterSecurityInterceptor`.
These are fixed and cannot be replaced with alternatives.

<a id="nsa-http-attributes"></a>

### <http> Attributes

The attributes on the `<http>` element control some of the properties on the core filters.

<a id="nsa-http-use-authorization-manager"></a>

- **use-authorization-manager**
Use AuthorizationManager API instead of SecurityMetadataSource (defaults to true)

<a id="nsa-http-authorization-manager-ref"></a>

- **use-authorization-manager**
Use this AuthorizationManager instead of deriving one from <intercept-url> elements

<a id="nsa-http-access-decision-manager-ref"></a>

- **access-decision-manager-ref**
Optional attribute specifying the ID of the `AccessDecisionManager` implementation which should be used for authorizing HTTP requests.
By default an `AffirmativeBased` implementation is used for with a `RoleVoter` and an `AuthenticatedVoter`.

<a id="nsa-http-authentication-manager-ref"></a>

- **authentication-manager-ref**
A reference to the `AuthenticationManager` used for the `FilterChain` created by this http element.

<a id="nsa-http-observation-registry-ref"></a>

- **observation-registry-ref**
A reference to the `ObservationRegistry` used for the `FilterChain` and related components

<a id="nsa-http-auto-config"></a>

- **auto-config**
Automatically registers a login form, BASIC authentication, logout services.
If set to "true", all of these capabilities are added (although you can still customize the configuration of each by providing the respective element).
If unspecified, defaults to "false".
Use of this attribute is not recommended.
Use explicit configuration elements instead to avoid confusion.

<a id="nsa-http-create-session"></a>

- **create-session**
Controls the eagerness with which an HTTP session is created by Spring Security classes.
Options include:

  - `always` - Spring Security will proactively create a session if one does not exist.
  - `ifRequired` - Spring Security will only create a session only if one is required (default value).
  - `never` - Spring Security will never create a session, but will make use of one if the application does.
  - `stateless` - Spring Security will not create a session and ignore the session for obtaining a Spring `Authentication`.

<a id="nsa-http-disable-url-rewriting"></a>

- **disable-url-rewriting**
Prevents session IDs from being appended to URLs in the application.
Clients must use cookies if this attribute is set to `true`.
The default is `true`.

<a id="nsa-http-entry-point-ref"></a>

- **entry-point-ref**
Normally the `AuthenticationEntryPoint` used will be set depending on which authentication mechanisms have been configured.
This attribute allows this behaviour to be overridden by defining a customized `AuthenticationEntryPoint` bean which will start the authentication process.

<a id="nsa-http-jaas-api-provision"></a>

- **jaas-api-provision**
If available, runs the request as the `Subject` acquired from the `JaasAuthenticationToken` which is implemented by adding a `JaasApiIntegrationFilter` bean to the stack.
Defaults to `false`.

<a id="nsa-http-name"></a>

- **name**
A bean identifier, used for referring to the bean elsewhere in the context.

<a id="nsa-http-once-per-request"></a>

- **once-per-request**
Corresponds to the `observeOncePerRequest` property of `FilterSecurityInterceptor`.
Defaults to `false`.

<a id="nsa-http-filter-all-dispatcher-types"></a>

- **filter-all-dispatcher-types**
Corresponds to the `shouldFilterAllDispatcherTypes` property of the `AuthorizationFilter`. Does not work when `use-authorization-manager=false`.
Defaults to `true`.

<a id="nsa-http-pattern"></a>

- **pattern**
Defining a pattern for the [http](#nsa-http) element controls the requests which will be filtered through the list of filters which it defines.
The interpretation is dependent on the configured [request-matcher](#nsa-http-request-matcher).
If no pattern is defined, all requests will be matched, so the most specific patterns should be declared first.

<a id="nsa-http-realm"></a>

- **realm**
Sets the realm name used for basic authentication (if enabled).
Corresponds to the `realmName` property on `BasicAuthenticationEntryPoint`.

<a id="nsa-http-redirect-to-https-request-matcher-ref"></a>

- **redirect-to-https-request-matcher-ref**
A reference to a bean that implements `RequestMatcher` that will determine which requests must redirect to HTTPS.
This is helpful when, for example, wanting to run HTTP locally and HTTPS in production using a request header.

<a id="nsa-http-request-matcher"></a>

- **request-matcher**
Defines the `RequestMatcher` strategy used in the `FilterChainProxy` and the beans created by the `intercept-url` to match incoming requests.
Options are currently `mvc`, `ant`, `regex` and `ciRegex`, for Spring MVC, ant, regular-expression and case-insensitive regular-expression respectively.
A separate instance is created for each [intercept-url](#nsa-intercept-url) element using its [pattern](#nsa-intercept-url-pattern), [method](#nsa-intercept-url-method) and [servlet-path](#nsa-intercept-url-servlet-path) attributes.
By default, paths are matched using a `PathPatternRequestMatcher`; however, regular expressions are matched using a `RegexRequestMatcher`.
See the Javadoc for these classes for more details on exactly how the matching is performed.
MVC is the default strategy if Spring MVC is present in the classpath, if not, Ant paths are used.

<a id="nsa-http-request-matcher-ref"></a>

- **request-matcher-ref**
A reference to a bean that implements `RequestMatcher` that will determine if this `FilterChain` should be used.
This is a more powerful alternative to [pattern](#nsa-http-pattern).

<a id="nsa-http-security"></a>

- **security**
A request pattern can be mapped to an empty filter chain, by setting this attribute to `none`.
No security will be applied and none of Spring Security’s features will be available.

<a id="nsa-http-security-context-holder-strategy-ref"></a>

- **security-context-repository-ref**
Allows injection of a custom `SecurityContextHolderStrategy` into `SecurityContextPersistenceFilter`, `SecurityContextHolderFilter`, `BasicAuthenticationFilter`, `UsernamePasswordAuthenticationFilter`, `ExceptionTranslationFilter`, `LogoutFilter`, and others.

<a id="nsa-http-security-context-explicit-save"></a>

- **security-context-explicit-save**
If true, use `SecurityContextHolderFilter` instead of `SecurityContextPersistenceFilter`.
Requires explicit save

<a id="nsa-http-security-context-repository-ref"></a>

- **security-context-repository-ref**
Allows injection of a custom `SecurityContextRepository` into the `SecurityContextPersistenceFilter`.

<a id="nsa-http-servlet-api-provision"></a>

- **servlet-api-provision**
Provides versions of `HttpServletRequest` security methods such as `isUserInRole()` and `getPrincipal()` which are implemented by adding a `SecurityContextHolderAwareRequestFilter` bean to the stack.
Defaults to `true`.

<a id="nsa-http-use-expressions"></a>

- **use-expressions**
Enables EL-expressions in the `access` attribute, as described in the chapter on [expression-based access-control](../../authorization/authorize-http-requests.md#authorization-expressions).
The default value is true.

<a id="nsa-http-children"></a>

### Child Elements of <http>

- [access-denied-handler](#nsa-access-denied-handler)
- [anonymous](#nsa-anonymous)
- [cors](#nsa-cors)
- [csrf](#nsa-csrf)
- [custom-filter](#nsa-custom-filter)
- [expression-handler](#nsa-expression-handler)
- [form-login](#nsa-form-login)
- [headers](#nsa-headers)
- [http-basic](#nsa-http-basic)
- [intercept-url](#nsa-intercept-url)
- [jee](#nsa-jee)
- [logout](#nsa-logout)
- [oauth2-client](#nsa-oauth2-client)
- [oauth2-login](#nsa-oauth2-login)
- [oauth2-resource-server](#nsa-oauth2-resource-server)
- [password-management](#nsa-password-management)
- [port-mappings](#nsa-port-mappings)
- [remember-me](#nsa-remember-me)
- [request-cache](#nsa-request-cache)
- [saml2-login](#nsa-saml2-login)
- [saml2-logout](#nsa-saml2-logout)
- [session-management](#nsa-session-management)
- [x509](#nsa-x509)

<a id="nsa-access-denied-handler"></a>

## <access-denied-handler>

This element allows you to set the `errorPage` property for the default `AccessDeniedHandler` used by the `ExceptionTranslationFilter`, using the [error-page](#nsa-access-denied-handler-error-page) attribute, or to supply your own implementation using the [ref](#nsa-access-denied-handler-ref) attribute.
This is discussed in more detail in the section on the [ExceptionTranslationFilter](../../architecture.md#servlet-exceptiontranslationfilter).

<a id="nsa-access-denied-handler-parents"></a>

### Parent Elements of <access-denied-handler>

- [http](#nsa-http)

<a id="nsa-access-denied-handler-attributes"></a>

### <access-denied-handler> Attributes

<a id="nsa-access-denied-handler-error-page"></a>

- **error-page**
The access denied page that an authenticated user will be redirected to if they request a page which they don’t have the authority to access.

<a id="nsa-access-denied-handler-ref"></a>

- **ref**
Defines a reference to a Spring bean of type `AccessDeniedHandler`.

<a id="nsa-cors"></a>

## <cors>

This element allows for configuring a `CorsFilter`.
Either a `CorsFilter` or a `CorsConfigurationSource` must be specified.
If Spring MVC is present, then it will attempt to look up its `CorsConfigurationSource`.

<a id="nsa-cors-attributes"></a>

### <cors> Attributes

The attributes on the `<cors>` element control the headers element.

<a id="nsa-cors-ref"></a>

- **ref**
Optional attribute that specifies the bean name of a `CorsFilter`.

<a id="nsa-cors-configuration-source-ref"></a>

- **cors-configuration-source-ref**
Optional attribute that specifies the bean name of a `CorsConfigurationSource` to be injected into a `CorsFilter` created by the XML namespace.

<a id="nsa-cors-parents"></a>

### Parent Elements of <cors>

- [http](#nsa-http)

<a id="nsa-headers"></a>

## <headers>

This element allows for configuring additional (security) headers to be send with the response.
It enables easy configuration for several headers and also allows for setting custom headers through the [header](#nsa-header) element.
Additional information, can be found in the [Security Headers](../../../features/exploits/headers.md#headers) section of the reference.

- `Cache-Control`, `Pragma`, and `Expires` - Can be set using the [cache-control](#nsa-cache-control) element.
This ensures that the browser does not cache your secured pages.
- `Strict-Transport-Security` - Can be set using the [hsts](#nsa-hsts) element.
This ensures that the browser automatically requests HTTPS for future requests.
- `X-Frame-Options` - Can be set using the [frame-options](#nsa-frame-options) element.
The [X-Frame-Options](https://en.wikipedia.org/wiki/Clickjacking#X-Frame-Options) header can be used to prevent clickjacking attacks.
- `X-XSS-Protection` - Can be set using the [xss-protection](#nsa-xss-protection) element.
The [X-XSS-Protection ](https://en.wikipedia.org/wiki/Cross-site_scripting) header can be used by browser to do basic control.
- `X-Content-Type-Options` - Can be set using the [content-type-options](#nsa-content-type-options) element.
The [X-Content-Type-Options](https://blogs.msdn.com/b/ie/archive/2008/09/02/ie8-security-part-vi-beta-2-update.aspx) header prevents Internet Explorer from MIME-sniffing a response away from the declared content-type.
This also applies to Google Chrome, when downloading extensions.
- `Public-Key-Pinning` or `Public-Key-Pinning-Report-Only` - Can be set using the [hpkp](#nsa-hpkp) element.
This allows HTTPS websites to resist impersonation by attackers using mis-issued or otherwise fraudulent certificates.
- `Content-Security-Policy` or `Content-Security-Policy-Report-Only` - Can be set using the [content-security-policy](#nsa-content-security-policy) element.
[Content Security Policy (CSP)](https://www.w3.org/TR/CSP2/) is a mechanism that web applications can leverage to mitigate content injection vulnerabilities, such as cross-site scripting (XSS).
- `Referrer-Policy` - Can be set using the [referrer-policy](#nsa-referrer-policy) element, [Referrer-Policy](https://www.w3.org/TR/referrer-policy/) is a mechanism that web applications can leverage to manage the referrer field, which contains the last page the user was on.
- `Feature-Policy` - Can be set using the [feature-policy](#nsa-feature-policy) element, [Feature-Policy](https://wicg.github.io/feature-policy/) is a mechanism that allows web developers to selectively enable, disable, and modify the behavior of certain APIs and web features in the browser.
- `Cross-Origin-Opener-Policy` - Can be set using the [cross-origin-opener-policy](#nsa-cross-origin-opener-policy) element, [Cross-Origin-Opener-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy) is a mechanism that allows you to ensure a top-level document does not share a browsing context group with cross-origin documents.
- `Cross-Origin-Embedder-Policy` - Can be set using the [cross-origin-embedder-policy](#nsa-cross-origin-embedder-policy) element, [Cross-Origin-Embedder-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy) is a mechanism that prevents a document from loading any cross-origin resources that don’t explicitly grant the document permission.
- `Cross-Origin-Resource-Policy` - Can be set using the [cross-origin-resource-policy](#nsa-cross-origin-resource-policy) element, [Cross-Origin-Resource-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy) is a mechanism that conveys a desire that the browser blocks no-cors cross-origin/cross-site requests to the given resource.

<a id="nsa-headers-attributes"></a>

### <headers> Attributes

The attributes on the `<headers>` element control the headers element.

<a id="nsa-headers-defaults-disabled"></a>

- **defaults-disabled**
Optional attribute that specifies to disable the default Spring Security’s HTTP response headers.
The default is false (the default headers are included).

<a id="nsa-headers-disabled"></a>

- **disabled**
Optional attribute that specifies to disable Spring Security’s HTTP response headers.
The default is false (the headers are enabled).

<a id="nsa-headers-parents"></a>

### Parent Elements of <headers>

- [http](#nsa-http)

<a id="nsa-headers-children"></a>

### Child Elements of <headers>

- [cache-control](#nsa-cache-control)
- [content-security-policy](#nsa-content-security-policy)
- [content-type-options](#nsa-content-type-options)
- [cross-origin-embedder-policy](#nsa-cross-origin-embedder-policy)
- [cross-origin-opener-policy](#nsa-cross-origin-opener-policy)
- [cross-origin-resource-policy](#nsa-cross-origin-resource-policy)
- [feature-policy](#nsa-feature-policy)
- [frame-options](#nsa-frame-options)
- [header](#nsa-header)
- [hpkp](#nsa-hpkp)
- [hsts](#nsa-hsts)
- [permission-policy](#nsa-permissions-policy)
- [referrer-policy](#nsa-referrer-policy)
- [xss-protection](#nsa-xss-protection)

<a id="nsa-cache-control"></a>

## <cache-control>

Adds `Cache-Control`, `Pragma`, and `Expires` headers to ensure that the browser does not cache your secured pages.

<a id="nsa-cache-control-attributes"></a>

### <cache-control> Attributes

<a id="nsa-cache-control-disabled"></a>

- **disabled**
Specifies if Cache Control should be disabled.
Default false.

<a id="nsa-cache-control-parents"></a>

### Parent Elements of <cache-control>

- [headers](#nsa-headers)

<a id="nsa-hsts"></a>

## <hsts>

When enabled adds the [Strict-Transport-Security](https://tools.ietf.org/html/rfc6797) header to the response for any secure request.
This allows the server to instruct browsers to automatically use HTTPS for future requests.

<a id="nsa-hsts-attributes"></a>

### <hsts> Attributes

<a id="nsa-hsts-disabled"></a>

- **disabled**
Specifies if Strict-Transport-Security should be disabled.
Default false.

<a id="nsa-hsts-include-subdomains"></a>

- **include-sub-domains**
Specifies if subdomains should be included.
Default true.

<a id="nsa-hsts-max-age-seconds"></a>

- **max-age-seconds**
Specifies the maximum amount of time the host should be considered a Known HSTS Host.
Default one year.

<a id="nsa-hsts-request-matcher-ref"></a>

- **request-matcher-ref**
The RequestMatcher instance to be used to determine if the header should be set.
Default is if HttpServletRequest.isSecure() is true.

<a id="nsa-hsts-preload"></a>

- **preload**
Specifies if preload should be included.
Default false.

<a id="nsa-hsts-parents"></a>

### Parent Elements of <hsts>

- [headers](#nsa-headers)

<a id="nsa-hpkp"></a>

## <hpkp>

When enabled adds the [Public Key Pinning Extension for HTTP](https://tools.ietf.org/html/rfc7469) header to the response for any secure request.
This allows HTTPS websites to resist impersonation by attackers using mis-issued or otherwise fraudulent certificates.

<a id="nsa-hpkp-attributes"></a>

### <hpkp> Attributes

<a id="nsa-hpkp-disabled"></a>

- **disabled**
Specifies if HTTP Public Key Pinning (HPKP) should be disabled.
Default true.

<a id="nsa-hpkp-include-subdomains"></a>

- **include-sub-domains**
Specifies if subdomains should be included.
Default false.

<a id="nsa-hpkp-max-age-seconds"></a>

- **max-age-seconds**
Sets the value for the max-age directive of the Public-Key-Pins header.
Default 60 days.

<a id="nsa-hpkp-report-only"></a>

- **report-only**
Specifies if the browser should only report pin validation failures.
Default true.

<a id="nsa-hpkp-report-uri"></a>

- **report-uri**
Specifies the URI to which the browser should report pin validation failures.

<a id="nsa-hpkp-parents"></a>

### Parent Elements of <hpkp>

- [headers](#nsa-headers)

<a id="nsa-pins"></a>

## <pins>

The list of pins

<a id="nsa-pins-children"></a>

### Child Elements of <pins>

- [pin](#nsa-pin)

<a id="nsa-pin"></a>

## <pin>

A pin is specified using the base64-encoded SPKI fingerprint as value and the cryptographic hash algorithm as attribute

<a id="nsa-pin-attributes"></a>

### <pin> Attributes

<a id="nsa-pin-algorithm"></a>

- **algorithm**
The cryptographic hash algorithm.
Default is SHA256.

<a id="nsa-pin-parents"></a>

### Parent Elements of <pin>

- [pins](#nsa-pins)

<a id="nsa-content-security-policy"></a>

## <content-security-policy>

When enabled adds the [Content Security Policy (CSP)](https://www.w3.org/TR/CSP2/) header to the response.
CSP is a mechanism that web applications can leverage to mitigate content injection vulnerabilities, such as cross-site scripting (XSS).

<a id="nsa-content-security-policy-attributes"></a>

### <content-security-policy> Attributes

<a id="nsa-content-security-policy-policy-directives"></a>

- **policy-directives**
The security policy directive(s) for the Content-Security-Policy header or if report-only is set to true, then the Content-Security-Policy-Report-Only header is used.

<a id="nsa-content-security-policy-report-only"></a>

- **report-only**
Set to true, to enable the Content-Security-Policy-Report-Only header for reporting policy violations only.
Defaults to false.

<a id="nsa-content-security-policy-parents"></a>

### Parent Elements of <content-security-policy>

- [headers](#nsa-headers)

<a id="nsa-referrer-policy"></a>

## <referrer-policy>

When enabled adds the [Referrer Policy](https://www.w3.org/TR/referrer-policy/) header to the response.

<a id="nsa-referrer-policy-attributes"></a>

### <referrer-policy> Attributes

<a id="nsa-referrer-policy-policy"></a>

- **policy**
The policy for the Referrer-Policy header.
Default "no-referrer".

<a id="nsa-referrer-policy-parents"></a>

### Parent Elements of <referrer-policy>

- [headers](#nsa-headers)

<a id="nsa-feature-policy"></a>

## <feature-policy>

When enabled adds the [Feature Policy](https://wicg.github.io/feature-policy/) header to the response.

<a id="nsa-feature-policy-attributes"></a>

### <feature-policy> Attributes

<a id="nsa-feature-policy-policy-directives"></a>

- **policy-directives**
The security policy directive(s) for the Feature-Policy header.

<a id="nsa-feature-policy-parents"></a>

### Parent Elements of <feature-policy>

- [headers](#nsa-headers)

<a id="nsa-frame-options"></a>

## <frame-options>

When enabled adds the [X-Frame-Options header](https://tools.ietf.org/html/draft-ietf-websec-x-frame-options) to the response, this allows newer browsers to do some security checks and prevent [clickjacking](https://en.wikipedia.org/wiki/Clickjacking) attacks.

<a id="nsa-frame-options-attributes"></a>

### <frame-options> Attributes

<a id="nsa-frame-options-disabled"></a>

- **disabled**
If disabled, the X-Frame-Options header will not be included.
Default false.

<a id="nsa-frame-options-policy"></a>

- **policy**

  - `DENY` The page cannot be displayed in a frame, regardless of the site attempting to do so.
  This is the default when frame-options-policy is specified.
  - `SAMEORIGIN` The page can only be displayed in a frame on the same origin as the page itself

  In other words, if you specify DENY, not only will attempts to load the page in a frame fail when loaded from other sites, attempts to do so will fail when loaded from the same site.
  On the other hand, if you specify SAMEORIGIN, you can still use the page in a frame as long as the site including it in a frame it is the same as the one serving the page.

<a id="nsa-frame-options-parents"></a>

### Parent Elements of <frame-options>

- [headers](#nsa-headers)

<a id="nsa-permissions-policy"></a>

## <permissions-policy>

Adds the [Permissions-Policy header](https://w3c.github.io/webappsec-permissions-policy/) to the response.

<a id="nsa-permissions-policy-attributes"></a>

### <permissions-policy> Attributes

<a id="nsa-permissions-policy-policy"></a>

- **policy**
The policy value to write for the `Permissions-Policy` header

<a id="nsa-permissions-policy-parents"></a>

### Parent Elements of <permissions-policy>

- [headers](#nsa-headers)

<a id="nsa-xss-protection"></a>

## <xss-protection>

Adds the [X-XSS-Protection header](https://blogs.msdn.com/b/ie/archive/2008/07/02/ie8-security-part-iv-the-xss-filter.aspx) to the response to assist in protecting against [reflected / Type-1 Cross-Site Scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting#Non-Persistent) attacks.
This is in no-way a full protection to XSS attacks!

<a id="nsa-xss-protection-attributes"></a>

### <xss-protection> Attributes

<a id="nsa-xss-protection-disabled"></a>

- **xss-protection-disabled**
Do not include the header for [reflected / Type-1 Cross-Site Scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting#Non-Persistent) protection.

<a id="nsa-xss-protection-header-value"></a>

- **xss-protection-header-value**
Explicitly set the value for [reflected / Type-1 Cross-Site Scripting (XSS)](https://en.wikipedia.org/wiki/Cross-site_scripting#Non-Persistent) header.
One of: "0", "1", "1; mode=block". Defaults to "0".

<a id="nsa-xss-protection-parents"></a>

### Parent Elements of <xss-protection>

- [headers](#nsa-headers)

<a id="nsa-content-type-options"></a>

## <content-type-options>

Add the X-Content-Type-Options header with the value of nosniff to the response.
This [disables MIME-sniffing](https://blogs.msdn.com/b/ie/archive/2008/09/02/ie8-security-part-vi-beta-2-update.aspx) for IE8+ and Chrome extensions.

<a id="nsa-content-type-options-attributes"></a>

### <content-type-options> Attributes

<a id="nsa-content-type-options-disabled"></a>

- **disabled**
Specifies if Content Type Options should be disabled.
Default false.

<a id="nsa-content-type-options-parents"></a>

### Parent Elements of <content-type-options>

- [headers](#nsa-headers)

<a id="nsa-cross-origin-embedder-policy"></a>

#### <cross-origin-embedder-policy>

When enabled adds the [Cross-Origin-Embedder-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Embedder-Policy) header to the response.

<a id="nsa-cross-origin-embedder-policy-attributes"></a>

##### <cross-origin-embedder-policy> Attributes

<a id="nsa-cross-origin-embedder-policy-policy"></a>

- **policy**
The policy for the `Cross-Origin-Embedder-Policy` header.

<a id="nsa-cross-origin-embedder-policy-parents"></a>

##### Parent Elements of <cross-origin-embedder-policy>

- [headers](#nsa-headers)

<a id="nsa-cross-origin-opener-policy"></a>

#### <cross-origin-opener-policy>

When enabled adds the [Cross-Origin-Opener-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy) header to the response.

<a id="nsa-cross-origin-opener-policy-attributes"></a>

##### <cross-origin-opener-policy> Attributes

<a id="nsa-cross-origin-opener-policy-policy"></a>

- **policy**
The policy for the `Cross-Origin-Opener-Policy` header.

<a id="nsa-cross-origin-opener-policy-parents"></a>

##### Parent Elements of <cross-origin-opener-policy>

- [headers](#nsa-headers)

<a id="nsa-cross-origin-resource-policy"></a>

#### <cross-origin-resource-policy>

When enabled adds the [Cross-Origin-Resource-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy) header to the response.

<a id="nsa-cross-origin-resource-policy-attributes"></a>

##### <cross-origin-resource-policy> Attributes

<a id="nsa-cross-origin-resource-policy-policy"></a>

- **policy**
The policy for the `Cross-Origin-Resource-Policy` header.

<a id="nsa-cross-origin-resource-policy-parents"></a>

##### Parent Elements of <cross-origin-resource-policy>

- [headers](#nsa-headers)

<a id="nsa-header"></a>

## <header>

Add additional headers to the response, both the name and value need to be specified.

<a id="nsa-header-attributes"></a>

### <header-attributes> Attributes

<a id="nsa-header-name"></a>

- **header-name**
The `name` of the header.

<a id="nsa-header-value"></a>

- **value**
The `value` of the header to add.

<a id="nsa-header-ref"></a>

- **ref**
Reference to a custom implementation of the `HeaderWriter` interface.

<a id="nsa-header-parents"></a>

### Parent Elements of <header>

- [headers](#nsa-headers)

<a id="nsa-anonymous"></a>

## <anonymous>

Adds an `AnonymousAuthenticationFilter` to the stack and an `AnonymousAuthenticationProvider`.
Required if you are using the `IS_AUTHENTICATED_ANONYMOUSLY` attribute.

<a id="nsa-anonymous-parents"></a>

### Parent Elements of <anonymous>

- [http](#nsa-http)

<a id="nsa-anonymous-attributes"></a>

### <anonymous> Attributes

<a id="nsa-anonymous-enabled"></a>

- **enabled**
With the default namespace setup, the anonymous "authentication" facility is automatically enabled.
You can disable it using this property.

<a id="nsa-anonymous-granted-authority"></a>

- **granted-authority**
The granted authority that should be assigned to the anonymous request.
Commonly this is used to assign the anonymous request particular roles, which can subsequently be used in authorization decisions.
If unset, defaults to `ROLE_ANONYMOUS`.

<a id="nsa-anonymous-key"></a>

- **key**
The key shared between the provider and filter.
This generally does not need to be set.
If unset, it will default to a secure randomly generated value.
This means setting this value can improve startup time when using the anonymous functionality since secure random values can take a while to be generated.

<a id="nsa-anonymous-username"></a>

- **username**
The username that should be assigned to the anonymous request.
This allows the principal to be identified, which may be important for logging and auditing.
if unset, defaults to `anonymousUser`.

<a id="nsa-csrf"></a>

## <csrf>

This element will add [Cross Site Request Forger (CSRF)](https://en.wikipedia.org/wiki/Cross-site_request_forgery) protection to the application.
It also updates the default RequestCache to only replay "GET" requests upon successful authentication.
Additional information can be found in the [Cross Site Request Forgery (CSRF)](../../../features/exploits/csrf.md#csrf) section of the reference.

<a id="nsa-csrf-parents"></a>

### Parent Elements of <csrf>

- [http](#nsa-http)

<a id="nsa-csrf-attributes"></a>

### <csrf> Attributes

<a id="nsa-csrf-disabled"></a>

- **disabled**
Optional attribute that specifies to disable Spring Security’s CSRF protection.
The default is false (CSRF protection is enabled).
It is highly recommended to leave CSRF protection enabled.

<a id="nsa-csrf-token-repository-ref"></a>

- **token-repository-ref**
The CsrfTokenRepository to use.
The default is `HttpSessionCsrfTokenRepository`.

<a id="nsa-csrf-request-handler-ref"></a>

- **request-handler-ref**
The optional `CsrfTokenRequestHandler` to use. The default is `CsrfTokenRequestAttributeHandler`.

<a id="nsa-csrf-request-matcher-ref"></a>

- **request-matcher-ref**
The RequestMatcher instance to be used to determine if CSRF should be applied.
Default is any HTTP method except "GET", "TRACE", "HEAD", "OPTIONS".

<a id="nsa-custom-filter"></a>

## <custom-filter>

This element is used to add a filter to the filter chain.
It doesn’t create any additional beans but is used to select a bean of type `jakarta.servlet.Filter` which is already defined in the application context and add that at a particular position in the filter chain maintained by Spring Security.
Full details can be found in the [ namespace chapter](../../configuration/xml-namespace.md#ns-custom-filters).

<a id="nsa-custom-filter-parents"></a>

### Parent Elements of <custom-filter>

- [http](#nsa-http)

<a id="nsa-custom-filter-attributes"></a>

### <custom-filter> Attributes

<a id="nsa-custom-filter-after"></a>

- **after**
The filter immediately after which the custom-filter should be placed in the chain.
This feature will only be needed by advanced users who wish to mix their own filters into the security filter chain and have some knowledge of the standard Spring Security filters.
The filter names map to specific Spring Security implementation filters.

<a id="nsa-custom-filter-before"></a>

- **before**
The filter immediately before which the custom-filter should be placed in the chain

<a id="nsa-custom-filter-position"></a>

- **position**
The explicit position at which the custom-filter should be placed in the chain.
Use if you are replacing a standard filter.

<a id="nsa-custom-filter-ref"></a>

- **ref**
Defines a reference to a Spring bean that implements `Filter`.

<a id="nsa-expression-handler"></a>

## <expression-handler>

Defines the `SecurityExpressionHandler` instance which will be used if expression-based access-control is enabled.
A default implementation (with no ACL support) will be used if not supplied.

<a id="nsa-expression-handler-parents"></a>

### Parent Elements of <expression-handler>

- [global-method-security](method-security.md#nsa-global-method-security)
- [http](#nsa-http)
- [method-security](method-security.md#nsa-method-security)
- [websocket-message-broker](websocket.md#nsa-websocket-message-broker)

<a id="nsa-expression-handler-attributes"></a>

### <expression-handler> Attributes

<a id="nsa-expression-handler-ref"></a>

- **ref**
Defines a reference to a Spring bean that implements `SecurityExpressionHandler`.

<a id="nsa-form-login"></a>

## <form-login>

Used to add an `UsernamePasswordAuthenticationFilter` to the filter stack and an `LoginUrlAuthenticationEntryPoint` to the application context to provide authentication on demand.
This will always take precedence over other namespace-created entry points.
If no attributes are supplied, a login page will be generated automatically at the URL "/login" <sup>\[[2](#_footnotedef_2)\]</sup> The behaviour can be customized using the [`<form-login>` Attributes](#nsa-form-login-attributes).

<a id="nsa-form-login-parents"></a>

### Parent Elements of <form-login>

- [http](#nsa-http)

<a id="nsa-form-login-attributes"></a>

### <form-login> Attributes

<a id="nsa-form-login-always-use-default-target"></a>

- **always-use-default-target**
If set to `true`, the user will always start at the value given by [default-target-url](#nsa-form-login-default-target-url), regardless of how they arrived at the login page.
Maps to the `alwaysUseDefaultTargetUrl` property of `UsernamePasswordAuthenticationFilter`.
Default value is `false`.

<a id="nsa-form-login-authentication-details-source-ref"></a>

- **authentication-details-source-ref**
Reference to an `AuthenticationDetailsSource` which will be used by the authentication filter

<a id="nsa-form-login-authentication-failure-handler-ref"></a>

- **authentication-failure-handler-ref**
Can be used as an alternative to [authentication-failure-url](#nsa-form-login-authentication-failure-url), giving you full control over the navigation flow after an authentication failure.
The value should be the name of an `AuthenticationFailureHandler` bean in the application context.

<a id="nsa-form-login-authentication-failure-url"></a>

- **authentication-failure-url**
Maps to the `authenticationFailureUrl` property of `UsernamePasswordAuthenticationFilter`.
Defines the URL the browser will be redirected to on login failure.
Defaults to `/login?error`, which will be automatically handled by the automatic login page generator, re-rendering the login page with an error message.

<a id="nsa-form-login-authentication-success-handler-ref"></a>

- **authentication-success-handler-ref**
This can be used as an alternative to [default-target-url](#nsa-form-login-default-target-url) and [always-use-default-target](#nsa-form-login-always-use-default-target), giving you full control over the navigation flow after a successful authentication.
The value should be the name of an `AuthenticationSuccessHandler` bean in the application context.
By default, an implementation of `SavedRequestAwareAuthenticationSuccessHandler` is used and injected with the [default-target-url ](#nsa-form-login-default-target-url).

<a id="nsa-form-login-default-target-url"></a>

- **default-target-url**
Maps to the `defaultTargetUrl` property of `UsernamePasswordAuthenticationFilter`.
If not set, the default value is "/" (the application root).
A user will be taken to this URL after logging in, provided they were not asked to login while attempting to access a secured resource, when they will be taken to the originally requested URL.

<a id="nsa-form-login-login-page"></a>

- **login-page**
The URL that should be used to render the login page.
Maps to the `loginFormUrl` property of the `LoginUrlAuthenticationEntryPoint`.
Defaults to "/login".

<a id="nsa-form-login-login-processing-url"></a>

- **login-processing-url**
Maps to the `filterProcessesUrl` property of `UsernamePasswordAuthenticationFilter`.
The default value is "/login".

<a id="nsa-form-login-password-parameter"></a>

- **password-parameter**
The name of the request parameter which contains the password.
Defaults to "password".

<a id="nsa-form-login-username-parameter"></a>

- **username-parameter**
The name of the request parameter which contains the username.
Defaults to "username".

<a id="nsa-form-login-authentication-success-forward-url"></a>

- **authentication-success-forward-url**
Maps a `ForwardAuthenticationSuccessHandler` to `authenticationSuccessHandler` property of `UsernamePasswordAuthenticationFilter`.

<a id="nsa-form-login-authentication-failure-forward-url"></a>

- **authentication-failure-forward-url**
Maps a `ForwardAuthenticationFailureHandler` to `authenticationFailureHandler` property of `UsernamePasswordAuthenticationFilter`.

<a id="nsa-oauth2-login"></a>

## <oauth2-login>

The [OAuth 2.0 Login](../../oauth2/login/index.md#oauth2login) feature configures authentication support using an OAuth 2.0 and/or OpenID Connect 1.0 Provider.

<a id="nsa-oauth2-login-parents"></a>

### Parent Elements of <oauth2-login>

- [http](#nsa-http)

<a id="nsa-oauth2-login-attributes"></a>

### <oauth2-login> Attributes

<a id="nsa-oauth2-login-client-registration-repository-ref"></a>

- **client-registration-repository-ref**
Reference to the `ClientRegistrationRepository`.

<a id="nsa-oauth2-login-authorized-client-repository-ref"></a>

- **authorized-client-repository-ref**
Reference to the `OAuth2AuthorizedClientRepository`.

<a id="nsa-oauth2-login-authorized-client-service-ref"></a>

- **authorized-client-service-ref**
Reference to the `OAuth2AuthorizedClientService`.

<a id="nsa-oauth2-login-authorization-request-repository-ref"></a>

- **authorization-request-repository-ref**
Reference to the `AuthorizationRequestRepository`.

<a id="nsa-oauth2-login-authorization-request-resolver-ref"></a>

- **authorization-request-resolver-ref**
Reference to the `OAuth2AuthorizationRequestResolver`.

<a id="nsa-oauth2-login-authorization-redirect-strategy-ref"></a>

- **authorization-redirect-strategy-ref**
Reference to the authorization `RedirectStrategy`.

<a id="nsa-oauth2-login-access-token-response-client-ref"></a>

- **access-token-response-client-ref**
Reference to the `OAuth2AccessTokenResponseClient`.

<a id="nsa-oauth2-login-user-authorities-mapper-ref"></a>

- **user-authorities-mapper-ref**
Reference to the `GrantedAuthoritiesMapper`.

<a id="nsa-oauth2-login-user-service-ref"></a>

- **user-service-ref**
Reference to the `OAuth2UserService`.

<a id="nsa-oauth2-login-oidc-user-service-ref"></a>

- **oidc-user-service-ref**
Reference to the OpenID Connect `OAuth2UserService`.

<a id="nsa-oauth2-login-login-processing-url"></a>

- **login-processing-url**
The URI where the filter processes authentication requests.

<a id="nsa-oauth2-login-login-page"></a>

- **login-page**
The URI to send users to login.

<a id="nsa-oauth2-login-authentication-success-handler-ref"></a>

- **authentication-success-handler-ref**
Reference to the `AuthenticationSuccessHandler`.

<a id="nsa-oauth2-login-authentication-failure-handler-ref"></a>

- **authentication-failure-handler-ref**
Reference to the `AuthenticationFailureHandler`.

<a id="nsa-oauth2-login-jwt-decoder-factory-ref"></a>

- **jwt-decoder-factory-ref**
Reference to the `JwtDecoderFactory` used by `OidcAuthorizationCodeAuthenticationProvider`.

<a id="nsa-oauth2-client"></a>

## <oauth2-client>

Configures [OAuth 2.0 Client](../../oauth2/client/index.md#oauth2client) support.

<a id="nsa-oauth2-client-parents"></a>

### Parent Elements of <oauth2-client>

- [http](#nsa-http)

<a id="nsa-oauth2-client-attributes"></a>

### <oauth2-client> Attributes

<a id="nsa-oauth2-client-client-registration-repository-ref"></a>

- **client-registration-repository-ref**
Reference to the `ClientRegistrationRepository`.

<a id="nsa-oauth2-client-authorized-client-repository-ref"></a>

- **authorized-client-repository-ref**
Reference to the `OAuth2AuthorizedClientRepository`.

<a id="nsa-oauth2-client-authorized-client-service-ref"></a>

- **authorized-client-service-ref**
Reference to the `OAuth2AuthorizedClientService`.

<a id="nsa-oauth2-client-children"></a>

### Child Elements of <oauth2-client>

- [authorization-code-grant](#nsa-authorization-code-grant)

<a id="nsa-authorization-code-grant"></a>

## <authorization-code-grant>

Configures [OAuth 2.0 Authorization Code Grant](../../oauth2/client/authorization-grants.md#oauth2Client-auth-grant-support).

<a id="nsa-authorization-code-grant-parents"></a>

### Parent Elements of <authorization-code-grant>

- [oauth2-client](#nsa-oauth2-client)

<a id="nsa-authorization-code-grant-attributes"></a>

### <authorization-code-grant> Attributes

<a id="nsa-authorization-code-grant-authorization-request-repository-ref"></a>

- **authorization-request-repository-ref**
Reference to the `AuthorizationRequestRepository`.

<a id="nsa-authorization-code-grant-authorization-redirect-strategy-ref"></a>

- **authorization-redirect-strategy-ref**
Reference to the authorization `RedirectStrategy`.

<a id="nsa-authorization-code-grant-authorization-request-resolver-ref"></a>

- **authorization-request-resolver-ref**
Reference to the `OAuth2AuthorizationRequestResolver`.

<a id="nsa-authorization-code-grant-access-token-response-client-ref"></a>

- **access-token-response-client-ref**
Reference to the `OAuth2AccessTokenResponseClient`.

<a id="nsa-client-registrations"></a>

## <client-registrations>

A container element for client(s) registered ([ClientRegistration](../../oauth2/client/index.md#oauth2Client-client-registration)) with an OAuth 2.0 or OpenID Connect 1.0 Provider.

<a id="nsa-client-registrations-children"></a>

### Child Elements of <client-registrations>

- [client-registration](#nsa-client-registration)
- [provider](#nsa-provider)

<a id="nsa-client-registration"></a>

## <client-registration>

Represents a client registered with an OAuth 2.0 or OpenID Connect 1.0 Provider.

<a id="nsa-client-registration-parents"></a>

### Parent Elements of <client-registration>

- [client-registrations](#nsa-client-registrations)

<a id="nsa-client-registration-attributes"></a>

### <client-registration> Attributes

<a id="nsa-client-registration-registration-id"></a>

- **registration-id**
The ID that uniquely identifies the `ClientRegistration`.

<a id="nsa-client-registration-client-id"></a>

- **client-id**
The client identifier.

<a id="nsa-client-registration-client-secret"></a>

- **client-secret**
The client secret.

<a id="nsa-client-registration-client-authentication-method"></a>

- **client-authentication-method**
The method used to authenticate the Client with the Provider.
The supported values are **client\_secret\_basic**, **client\_secret\_post**, **private\_key\_jwt**, **client\_secret\_jwt** and **none** [(public clients)](https://tools.ietf.org/html/rfc6749#section-2.1).

<a id="nsa-client-registration-authorization-grant-type"></a>

- **authorization-grant-type**
The OAuth 2.0 Authorization Framework defines four [Authorization Grant](https://tools.ietf.org/html/rfc6749#section-1.3) types.
The supported values are `authorization_code`, `client_credentials`, `password`, as well as, extension grant type `urn:ietf:params:oauth:grant-type:jwt-bearer`.

<a id="nsa-client-registration-redirect-uri"></a>

- **redirect-uri**
The client’s registered redirect URI that the *Authorization Server* redirects the end-user’s user-agent to after the end-user has authenticated and authorized access to the client.

<a id="nsa-client-registration-scope"></a>

- **scope**
The scope(s) requested by the client during the Authorization Request flow, such as openid, email, or profile.

<a id="nsa-client-registration-client-name"></a>

- **client-name**
A descriptive name used for the client.
The name may be used in certain scenarios, such as when displaying the name of the client in the auto-generated login page.

<a id="nsa-client-registration-provider-id"></a>

- **provider-id**
A reference to the associated provider. May reference a `<provider>` element or use one of the common providers (google, github, facebook, okta).

<a id="nsa-provider"></a>

## <provider>

The configuration information for an OAuth 2.0 or OpenID Connect 1.0 Provider.

<a id="nsa-provider-parents"></a>

### Parent Elements of <provider>

- [client-registrations](#nsa-client-registrations)

<a id="nsa-provider-attributes"></a>

### <provider> Attributes

<a id="nsa-provider-provider-id"></a>

- **provider-id**
The ID that uniquely identifies the provider.

<a id="nsa-provider-authorization-uri"></a>

- **authorization-uri**
The Authorization Endpoint URI for the Authorization Server.

<a id="nsa-provider-token-uri"></a>

- **token-uri**
The Token Endpoint URI for the Authorization Server.

<a id="nsa-provider-user-info-uri"></a>

- **user-info-uri**
The UserInfo Endpoint URI used to access the claims/attributes of the authenticated end-user.

<a id="nsa-provider-user-info-authentication-method"></a>

- **user-info-authentication-method**
The authentication method used when sending the access token to the UserInfo Endpoint.
The supported values are **header**, **form** and **query**.

<a id="nsa-provider-user-info-user-name-attribute"></a>

- **user-info-user-name-attribute**
The name of the attribute returned in the UserInfo Response that references the Name or Identifier of the end-user.

<a id="nsa-provider-jwk-set-uri"></a>

- **jwk-set-uri**
The URI used to retrieve the [JSON Web Key (JWK)](https://tools.ietf.org/html/rfc7517) Set from the Authorization Server, which contains the cryptographic key(s) used to verify the [JSON Web Signature (JWS)](https://tools.ietf.org/html/rfc7515) of the ID Token and optionally the UserInfo Response.

<a id="nsa-provider-issuer-uri"></a>

- **issuer-uri**
The URI used to initially configure a `ClientRegistration` using discovery of an OpenID Connect Provider’s [Configuration endpoint](https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderConfig) or an Authorization Server’s [Metadata endpoint](https://tools.ietf.org/html/rfc8414#section-3).

<a id="nsa-oauth2-resource-server"></a>

## <oauth2-resource-server>

Adds a `BearerTokenAuthenticationFilter`, `BearerTokenAuthenticationEntryPoint`, and `BearerTokenAccessDeniedHandler` to the configuration.
In addition, either `<jwt>` or `<opaque-token>` must be specified.

<a id="nsa-oauth2-resource-server-parents"></a>

### Parents Elements of <oauth2-resource-server>

- [http](#nsa-http)

<a id="nsa-oauth2-resource-server-children"></a>

### Child Elements of <oauth2-resource-server>

- [jwt](#nsa-jwt)
- [opaque-token](#nsa-opaque-token)

<a id="nsa-oauth2-resource-server-attributes"></a>

### <oauth2-resource-server> Attributes

<a id="nsa-oauth2-resource-server-authentication-manager-resolver-ref"></a>

- **authentication-manager-resolver-ref**
Reference to an `AuthenticationManagerResolver` which will resolve the `AuthenticationManager` at request time

<a id="nsa-oauth2-resource-server-bearer-token-resolver-ref"></a>

- **bearer-token-resolver-ref**
Reference to a `BearerTokenResolver` which will retrieve the bearer token from the request.
This cannot be used in conjunction with `authentication-converter-ref`

<a id="nsa-oauth2-resource-server-entry-point-ref"></a>

- **entry-point-ref**
Reference to a `AuthenticationEntryPoint` which will handle unauthorized requests

<a id="nsa-oauth2-resource-server-authentication-converter-ref"></a>

- **authentication-converter-ref**
Reference to a `AuthenticationConverter` which convert request to authentication.
This cannot be used in conjunction with `bearer-token-resolver-ref`

<a id="nsa-jwt"></a>

## <jwt>

Represents an OAuth 2.0 Resource Server that will authorize JWTs

<a id="nsa-jwt-parents"></a>

### Parent Elements of <jwt>

- [oauth2-resource-server](#nsa-oauth2-resource-server)

<a id="nsa-jwt-attributes"></a>

### <jwt> Attributes

<a id="nsa-jwt-jwt-authentication-converter-ref"></a>

- **jwt-authentication-converter-ref**
Reference to a `Converter<Jwt, AbstractAuthenticationToken>`

<a id="nsa-jwt-decoder-ref"></a>

- **jwt-decoder-ref**
Reference to a `JwtDecoder`. This is a larger component that overrides `jwk-set-uri`

<a id="nsa-jwt-jwk-set-uri"></a>

- **jwk-set-uri**
The JWK Set Uri used to load signing verification keys from an OAuth 2.0 Authorization Server

<a id="nsa-opaque-token"></a>

## <opaque-token>

Represents an OAuth 2.0 Resource Server that will authorize opaque tokens

<a id="nsa-opaque-token-parents"></a>

### Parent Elements of <opaque-token>

- [oauth2-resource-server](#nsa-oauth2-resource-server)

<a id="nsa-opaque-token-attributes"></a>

### <opaque-token> Attributes

<a id="nsa-opaque-token-introspector-ref"></a>

- **introspector-ref**
Reference to an `OpaqueTokenIntrospector`. This is a larger component that overrides `introspection-uri`, `client-id`, and `client-secret`.

<a id="nsa-opaque-token-introspection-uri"></a>

- **introspection-uri**
The Introspection Uri used to introspect the details of an opaque token. Should be accompanied with a `client-id` and `client-secret`.

<a id="nsa-opaque-token-client-id"></a>

- **client-id**
The Client Id to use for client authentication against the provided `introspection-uri`.

<a id="nsa-opaque-token-client-secret"></a>

- **client-secret**
The Client Secret to use for client authentication against the provided `introspection-uri`.

<a id="nsa-opaque-token-authentication-converter-ref"></a>

- **authentication-converter-ref**
Reference to an `OpaqueTokenAuthenticationConverter`. Responsible for converting successful introspection result into an `Authentication` instance.

<a id="nsa-relying-party-registrations"></a>

## <relying-party-registrations>

The container element for relying party(ies) registered ([ClientRegistration](../../saml2/login/overview.md#servlet-saml2login-relyingpartyregistration)) with a SAML 2.0 Identity Provider.

<a id="nsa-relying-party-registrations-attributes"></a>

### <relying-party-registrations> Attributes

<a id="nsa-relying-party-registrations-id"></a>

- **id**
The ID that uniquely identifies the `RelyingPartyRegistrationRepository`.

<a id="nsa-relying-party-registrations-children"></a>

### Child Elements of <relying-party-registrations>

- [asserting-party](#nsa-asserting-party)
- [relying-party-registration](#nsa-relying-party-registration)

<a id="nsa-relying-party-registration"></a>

## <relying-party-registration>

Represents a relying party registered with a SAML 2.0 Identity Provider

<a id="nsa-relying-party-registration-parents"></a>

### Parent Elements of <relying-party-registration>

- [relying-party-registrations](#nsa-relying-party-registrations)

<a id="nsa-relying-party-registration-attributes"></a>

### <relying-party-registration> Attributes

<a id="nsa-relying-party-registration-registration-id"></a>

- **registration-id**
The ID that uniquely identifies the `RelyingPartyRegistration`.

<a id="nsa-relying-party-registration-metadata-location"></a>

- **metadata-location**
The asserting party metadata location.

<a id="nsa-relying-party-registration-entity-id"></a>

- **client-id**
The relying party’s [EntityID](https://www.oasis-open.org/committees/download.php/51890/SAML%20MD%20simplified%20overview.pdf#2.9%20EntityDescriptor).

<a id="nsa-relying-party-registration-assertion-consumer-service-location"></a>

- **assertion-consumer-service-location**
The AssertionConsumerService Location. Equivalent to the value found in `<AssertionConsumerService Location="…​"/>` in the relying party’s `<SPSSODescriptor>`.

<a id="nsa-relying-party-registration-assertion-consumer-service-binding"></a>

- **assertion-consumer-service-binding**
the AssertionConsumerService Binding. Equivalent to the value found in `<AssertionConsumerService Binding="…​"/>` in the relying party’s `<SPSSODescriptor>`.
The supported values are **POST** and **REDIRECT**.

<a id="nsa-relying-party-registration-single-logout-service-location"></a>

- **single-logout-service-location**
The SingleLogoutService Location. Equivalent to the value found in <SingleLogoutService Location="…​"/> in the relying party’s <SPSSODescriptor>.

<a id="nsa-relying-party-registration-single-logout-service-response-location"></a>

- **single-logout-service-response-location**
The SingleLogoutService ResponseLocation. Equivalent to the value found in <SingleLogoutService ResponseLocation="…​"/> in the relying party’s <SPSSODescriptor>.

<a id="nsa-relying-party-registration-single-logout-service-binding"></a>

- **single-logout-service-binding**
The SingleLogoutService Binding. Equivalent to the value found in <SingleLogoutService Binding="…​"/> in the relying party’s <SPSSODescriptor>.
The supported values are **POST** and **REDIRECT**.

<a id="nsa-relying-party-registration-asserting-party-id"></a>

- **asserting-party-id**
A reference to the associated asserting party. Must reference an `<asserting-party>` element.

<a id="nsa-relying-party-registration-children"></a>

### Child Elements of <relying-party-registration>

- [decryption-credential](#nsa-decryption-credential)
- [signing-credential](#nsa-signing-credential)

<a id="nsa-decryption-credential"></a>

## <decryption-credential>

The decryption credentials associated with the relying party.

<a id="nsa-decryption-credential-parents"></a>

### Parent Elements of <decryption-credential>

- [relying-party-registration](#nsa-relying-party-registration)

<a id="nsa-decryption-credential-attributes"></a>

### <decryption-credential> Attributes

<a id="nsa-decryption-credential-certificate-location"></a>

- **certificate-location**
The location to get the certificate

<a id="nsa-decryption-credential-private-key-location"></a>

- **private-key-location**
The location to get the Relying Party’s private key

<a id="nsa-signing-credential"></a>

## <signing-credential>

The signing credentials associated with the relying party.

<a id="nsa-signing-credential-parents"></a>

### Parent Elements of <verification-credential>

- [relying-party-registration](#nsa-relying-party-registration)

<a id="nsa-signing-credential-attributes"></a>

### <verification-credential> Attributes

<a id="nsa-signing-credential-certificate-location"></a>

- **certificate-location**
The location to get this certificate

<a id="nsa-signing-credential-private-key-location"></a>

- **private-key-location**
The location to get the Relying Party’s private key

<a id="nsa-asserting-party"></a>

## <asserting-party>

The configuration information for a SAML 2.0 Asserting Party.

<a id="nsa-asserting-party-parents"></a>

### Parent Elements of <asserting-party>

- [relying-party-registrations](#nsa-relying-party-registrations)

<a id="nsa-asserting-party-attributes"></a>

### <asserting-party> Attributes

<a id="nsa-asserting-party-asserting-party-id"></a>

- **asserting-party-id**
The ID that uniquely identifies the asserting party.

<a id="nsa-asserting-party-entity-id"></a>

- **entity-id**
The EntityID of the Asserting Party

<a id="nsa-asserting-party-want-authn-requests-signed"></a>

- **want-authn-requests-signed**
The `WantAuthnRequestsSigned` setting, indicating the asserting party’s preference that relying parties should sign the `AuthnRequest` before sending.

<a id="nsa-asserting-party-single-sign-on-service-location"></a>

- **single-sign-on-service-location**
The [SingleSignOnService](https://www.oasis-open.org/committees/download.php/51890/SAML%20MD%20simplified%20overview.pdf#2.5%20Endpoint) Location.

<a id="nsa-asserting-party-single-sign-on-service-binding"></a>

- **single-sign-on-service-binding**
The [SingleSignOnService](https://www.oasis-open.org/committees/download.php/51890/SAML%20MD%20simplified%20overview.pdf#2.5%20Endpoint) Binding.
The supported values are **POST** and **REDIRECT**.

<a id="nsa-asserting-party-signing-algorithms"></a>

- **signing-algorithms**
The list of `org.opensaml.saml.ext.saml2alg.SigningMethod` Algorithms for this asserting party, in preference order.

<a id="nsa-asserting-party-single-logout-service-location"></a>

- **single-logout-service-location**
The SingleLogoutService Location. Equivalent to the value found in <SingleLogoutService Location="…​"/> in the asserting party’s <IDPSSODescriptor>.

<a id="nsa-asserting-party-single-logout-service-response-location"></a>

- **single-logout-service-response-location**
The SingleLogoutService ResponseLocation. Equivalent to the value found in <SingleLogoutService ResponseLocation="…​"/> in the asserting party’s <IDPSSODescriptor>.

<a id="nsa-asserting-party-single-logout-service-binding"></a>

- **single-logout-service-binding**
The SingleLogoutService Binding. Equivalent to the value found in <SingleLogoutService Binding="…​"/> in the asserting party’s <IDPSSODescriptor>.
The supported values are **POST** and **REDIRECT**.

<a id="nsa-asserting-party-children"></a>

### Child Elements of <asserting-party>

- [encryption-credential](#nsa-encryption-credential)
- [verification-credential](#nsa-verification-credential)

<a id="nsa-encryption-credential"></a>

## <encryption-credential>

The encryption credentials associated with the asserting party.

<a id="nsa-encryption-credential-parents"></a>

### Parent Elements of <encryption-credential>

- [asserting-party](#nsa-asserting-party)

<a id="nsa-encryption-credential-attributes"></a>

### <encryption-credential> Attributes

<a id="nsa-encryption-credential-certificate-location"></a>

- **certificate-location**
The location to get the certificate

<a id="nsa-encryption-credential-private-key-location"></a>

- **private-key-location**
The location to get the Relying Party’s private key

<a id="nsa-verification-credential"></a>

## <verification-credential>

The verification credentials associated with the asserting party.

<a id="nsa-verification-credential-parents"></a>

### Parent Elements of <verification-credential>

- [asserting-party](#nsa-asserting-party)

<a id="nsa-verification-credential-attributes"></a>

### <verification-credential> Attributes

<a id="nsa-verification-credential-certificate-location"></a>

- **certificate-location**
The location to get this certificate

<a id="nsa-verification-credential-private-key-location"></a>

- **private-key-location**
The location to get the Relying Party’s private key

<a id="nsa-http-basic"></a>

## <http-basic>

Adds a `BasicAuthenticationFilter` and `BasicAuthenticationEntryPoint` to the configuration.
The latter will only be used as the configuration entry point if form-based login is not enabled.

<a id="nsa-http-basic-parents"></a>

### Parent Elements of <http-basic>

- [http](#nsa-http)

<a id="nsa-http-basic-attributes"></a>

### <http-basic> Attributes

<a id="nsa-http-basic-authentication-details-source-ref"></a>

- **authentication-details-source-ref**
Reference to an `AuthenticationDetailsSource` which will be used by the authentication filter

<a id="nsa-http-basic-entry-point-ref"></a>

- **entry-point-ref**
Sets the `AuthenticationEntryPoint` which is used by the `BasicAuthenticationFilter`.

<a id="nsa-http-firewall"></a>

## <http-firewall> Element

This is a top-level element which can be used to inject a custom implementation of `HttpFirewall` into the `FilterChainProxy` created by the namespace.
The default implementation should be suitable for most applications.

<a id="nsa-http-firewall-attributes"></a>

### <http-firewall> Attributes

<a id="nsa-http-firewall-ref"></a>

- **ref**
Defines a reference to a Spring bean that implements `HttpFirewall`.

<a id="nsa-intercept-url"></a>

## <intercept-url>

This element is used to define the set of URL patterns that the application is interested in and to configure how they should be handled.
It is used to construct the `FilterInvocationSecurityMetadataSource` used by the `FilterSecurityInterceptor`.
It is also responsible for configuring a `ChannelProcessingFilter` if particular URLs need to be accessed by HTTPS, for example.
When matching the specified patterns against an incoming request, the matching is done in the order in which the elements are declared.
So the most specific patterns should come first and the most general should come last.

<a id="nsa-intercept-url-parents"></a>

### Parent Elements of <intercept-url>

- [filter-security-metadata-source](#nsa-filter-security-metadata-source)
- [http](#nsa-http)

<a id="nsa-intercept-url-attributes"></a>

### <intercept-url> Attributes

<a id="nsa-intercept-url-access"></a>

- **access**
Lists the access attributes which will be stored in the `FilterInvocationSecurityMetadataSource` for the defined URL pattern/method combination.
This should be a comma-separated list of the security configuration attributes (such as role names).

<a id="nsa-intercept-url-method"></a>

- **method**
The HTTP Method which will be used in combination with the pattern and servlet path (optional) to match an incoming request.
If omitted, any method will match.
If an identical pattern is specified with and without a method, the method-specific match will take precedence.

<a id="nsa-intercept-url-pattern"></a>

- **pattern**
The pattern which defines the URL path.
The content will depend on the `request-matcher` attribute from the containing http element, so will default to MVC matcher if Spring MVC is in the classpath.

<a id="nsa-intercept-url-request-matcher-ref"></a>

- **request-matcher-ref**
A reference to a `RequestMatcher` that will be used to determine if this `<intercept-url>` is used.

<a id="nsa-intercept-url-requires-channel"></a>

- **requires-channel**
Can be "http" or "https" depending on whether a particular URL pattern should be accessed over HTTP or HTTPS respectively.
Alternatively the value "any" can be used when there is no preference.
If this attribute is present on any `<intercept-url>` element, then a `ChannelProcessingFilter` will be added to the filter stack and its additional dependencies added to the application context.

If a `<port-mappings>` configuration is added, this will be used to by the `SecureChannelProcessor` and `InsecureChannelProcessor` beans to determine the ports used for redirecting to HTTP/HTTPS.

> [!NOTE]
> This property is invalid for [filter-security-metadata-source](#nsa-filter-security-metadata-source)

<a id="nsa-intercept-url-servlet-path"></a>

- **servlet-path**
The servlet path which will be used in combination with the pattern and HTTP method to match an incoming request.
This attribute is only applicable when [request-matcher](#nsa-http-request-matcher) is 'mvc'.
In addition, the value is only required in the following 2 use cases: 1) There are 2 or more `HttpServlet` 's registered in the `ServletContext` that have mappings starting with `'/'` and are different; 2) The pattern starts with the same value of a registered `HttpServlet` path, excluding the default (root) `HttpServlet` `'/'`.

> [!NOTE]
> This property is invalid for [filter-security-metadata-source](#nsa-filter-security-metadata-source)

<a id="nsa-jee"></a>

## <jee>

Adds a J2eePreAuthenticatedProcessingFilter to the filter chain to provide integration with container authentication.

<a id="nsa-jee-parents"></a>

### Parent Elements of <jee>

- [http](#nsa-http)

<a id="nsa-jee-attributes"></a>

### <jee> Attributes

<a id="nsa-jee-mappable-roles"></a>

- **mappable-roles**
A comma-separate list of roles to look for in the incoming HttpServletRequest.

<a id="nsa-jee-user-service-ref"></a>

- **user-service-ref**
A reference to a user-service (or UserDetailsService bean) Id

<a id="nsa-logout"></a>

## <logout>

Adds a `LogoutFilter` to the filter stack.
This is configured with a `SecurityContextLogoutHandler`.

<a id="nsa-logout-parents"></a>

### Parent Elements of <logout>

- [http](#nsa-http)

<a id="nsa-logout-attributes"></a>

### <logout> Attributes

<a id="nsa-logout-delete-cookies"></a>

- **delete-cookies**
A comma-separated list of the names of cookies which should be deleted when the user logs out.

<a id="nsa-logout-invalidate-session"></a>

- **invalidate-session**
Maps to the `invalidateHttpSession` of the `SecurityContextLogoutHandler`.
Defaults to "true", so the session will be invalidated on logout.

<a id="nsa-logout-logout-success-url"></a>

- **logout-success-url**
The destination URL which the user will be taken to after logging out.
Defaults to <form-login-login-page>/?logout (i.e. /login?logout)

  Setting this attribute will inject the `SessionManagementFilter` with a `SimpleRedirectInvalidSessionStrategy` configured with the attribute value.
  When an invalid session ID is submitted, the strategy will be invoked, redirecting to the configured URL.

<a id="nsa-logout-logout-url"></a>

- **logout-url**
The URL which will cause a logout (i.e. which will be processed by the filter).
Defaults to "/logout".

<a id="nsa-logout-success-handler-ref"></a>

- **success-handler-ref**
May be used to supply an instance of `LogoutSuccessHandler` which will be invoked to control the navigation after logging out.

<a id="nsa-saml2-login"></a>

## <saml2-login>

The [SAML 2.0 Login](../../saml2/login/index.md#servlet-saml2login) feature configures authentication support using an SAML 2.0 Service Provider.

<a id="nsa-saml2-login-parents"></a>

### Parent Elements of <saml2-login>

- [http](#nsa-http)

<a id="nsa-saml2-login-attributes"></a>

### <saml2-login> Attributes

<a id="nsa-saml2-login-relying-party-registration-repository-ref"></a>

- **relying-party-registration-repository-ref**
Reference to the `RelyingPartyRegistrationRepository`.

<a id="nsa-saml2-login-authentication-request-repository-ref"></a>

- **authentication-request-repository-ref**
Reference to the `Saml2AuthenticationRequestRepository`.

<a id="nsa-saml2-login-authentication-request-resolver-ref"></a>

- **authentication-request-context-resolver-ref**
Reference to the `Saml2AuthenticationRequestResolver`.

<a id="nsa-saml2-login-authentication-converter-ref"></a>

- **authentication-converter-ref**
Reference to the `AuthenticationConverter`.

<a id="nsa-saml2-login-login-processing-url"></a>

- **login-processing-url**
The URI where the filter processes authentication requests.

<a id="nsa-saml2-login-login-page"></a>

- **login-page**
The URI to send users to login.

<a id="nsa-saml2-login-authentication-success-handler-ref"></a>

- **authentication-success-handler-ref**
Reference to the `AuthenticationSuccessHandler`.

<a id="nsa-saml2-login-authentication-failure-handler-ref"></a>

- **authentication-failure-handler-ref**
Reference to the `AuthenticationFailureHandler`.

<a id="nsa-saml2-login-authentication-manager-ref"></a>

- **authentication-manager-ref**
Reference to the `AuthenticationManager`.

<a id="nsa-saml2-logout"></a>

## <saml2-logout>

The [SAML 2.0 Single Logout](../../saml2/logout.md#servlet-saml2login-logout) feature configures support for RP- and AP-initiated SAML 2.0 Single Logout.

<a id="nsa-saml2-logout-parents"></a>

### Parent Elements of <saml2-logout>

- [http](#nsa-http)

<a id="nsa-saml2-logout-attributes"></a>

### <saml2-logout> Attributes

<a id="nsa-saml2-logout-logout-url"></a>

- **logout-url**
The URL by which the relying or asserting party can trigger logout.

<a id="nsa-saml2-logout-logout-request-url"></a>

- **logout-request-url**
The URL by which the asserting party can send a SAML 2.0 Logout Request.

<a id="nsa-saml2-logout-logout-response-url"></a>

- **logout-response-url**
The URL by which the asserting party can send a SAML 2.0 Logout Response.

<a id="nsa-saml2-logout-relying-party-registration-repository-ref"></a>

- **relying-party-registration-repository-ref**
Reference to the `RelyingPartyRegistrationRepository`.

<a id="nsa-saml2-logout-logout-request-validator-ref"></a>

- **logout-request-validator-ref**
Reference to the `Saml2LogoutRequestValidator`.

<a id="nsa-saml2-logout-logout-request-resolver-ref"></a>

- **logout-request-resolver-ref**
Reference to the `Saml2LogoutRequestResolver`.

<a id="nsa-saml2-logout-logout-request-repository-ref"></a>

- **logout-request-repository-ref**
Reference to the `Saml2LogoutRequestRepository`.

<a id="nsa-saml2-logout-logout-response-validator-ref"></a>

- **logout-response-validator-ref**
Reference to the `Saml2LogoutResponseValidator`.

<a id="nsa-saml2-logout-logout-response-resolver-ref"></a>

- **logout-response-resolver-ref**
Reference to the `Saml2LogoutResponseResolver`.

<a id="nsa-password-management"></a>

## <password-management>

This element configures password management.

<a id="nsa-password-management-parents"></a>

### Parent Elements of <password-management>

- [http](#nsa-http)

<a id="nsa-password-management-attributes"></a>

### <password-management> Attributes

<a id="nsa-password-management-change-password-page"></a>

- **change-password-page**
The change password page. Defaults to "/change-password".

<a id="nsa-port-mappings"></a>

## <port-mappings>

By default, an instance of `PortMapperImpl` will be added to the configuration for use in redirecting to secure and insecure URLs.
This element can optionally be used to override the default mappings which that class defines.
Each child `<port-mapping>` element defines a pair of HTTP:HTTPS ports.
The default mappings are 80:443 and 8080:8443.
An example of overriding these can be found in [Redirect to HTTPS](../../exploits/http.md#servlet-http-redirect).

<a id="nsa-port-mappings-parents"></a>

### Parent Elements of <port-mappings>

- [http](#nsa-http)

<a id="nsa-port-mappings-children"></a>

### Child Elements of <port-mappings>

- [port-mapping](#nsa-port-mapping)

<a id="nsa-port-mapping"></a>

## <port-mapping>

Provides a method to map http ports to https ports when forcing a redirect.

<a id="nsa-port-mapping-parents"></a>

### Parent Elements of <port-mapping>

- [port-mappings](#nsa-port-mappings)

<a id="nsa-port-mapping-attributes"></a>

### <port-mapping> Attributes

<a id="nsa-port-mapping-http"></a>

- **http**
The http port to use.

<a id="nsa-port-mapping-https"></a>

- **https**
The https port to use.

<a id="nsa-remember-me"></a>

## <remember-me>

Adds the `RememberMeAuthenticationFilter` to the stack.
This in turn will be configured with either a `TokenBasedRememberMeServices`, a `PersistentTokenBasedRememberMeServices` or a user-specified bean implementing `RememberMeServices` depending on the attribute settings.

<a id="nsa-remember-me-parents"></a>

### Parent Elements of <remember-me>

- [http](#nsa-http)

<a id="nsa-remember-me-attributes"></a>

### <remember-me> Attributes

<a id="nsa-remember-me-authentication-success-handler-ref"></a>

- **authentication-success-handler-ref**
Sets the `authenticationSuccessHandler` property on the `RememberMeAuthenticationFilter` if custom navigation is required.
The value should be the name of a `AuthenticationSuccessHandler` bean in the application context.

<a id="nsa-remember-me-data-source-ref"></a>

- **data-source-ref**
A reference to a `DataSource` bean.
If this is set, `PersistentTokenBasedRememberMeServices` will be used and configured with a `JdbcTokenRepositoryImpl` instance.

<a id="nsa-remember-me-remember-me-parameter"></a>

- **remember-me-parameter**
The name of the request parameter which toggles remember-me authentication.
Defaults to "remember-me".
Maps to the "parameter" property of `AbstractRememberMeServices`.

<a id="nsa-remember-me-remember-me-cookie"></a>

- **remember-me-cookie**
The name of cookie which store the token for remember-me authentication.
Defaults to "remember-me".
Maps to the "cookieName" property of `AbstractRememberMeServices`.

<a id="nsa-remember-me-key"></a>

- **key**
Maps to the "key" property of `AbstractRememberMeServices`.
Should be set to a unique value to ensure that remember-me cookies are only valid within the one application <sup>\[[3](#_footnotedef_3)\]</sup>.
If this is not set a secure random value will be generated.
Since generating secure random values can take a while, setting this value explicitly can help improve startup times when using the remember-me functionality.

<a id="nsa-remember-me-services-alias"></a>

- **services-alias**
Exports the internally defined `RememberMeServices` as a bean alias, allowing it to be used by other beans in the application context.

<a id="nsa-remember-me-services-ref"></a>

- **services-ref**
Allows complete control of the `RememberMeServices` implementation that will be used by the filter.
The value should be the `id` of a bean in the application context which implements this interface.
Should also implement `LogoutHandler` if a logout filter is in use.

<a id="nsa-remember-me-token-repository-ref"></a>

- **token-repository-ref**
Configures a `PersistentTokenBasedRememberMeServices` but allows the use of a custom `PersistentTokenRepository` bean.

<a id="nsa-remember-me-token-validity-seconds"></a>

- **token-validity-seconds**
Maps to the `tokenValiditySeconds` property of `AbstractRememberMeServices`.
Specifies the period in seconds for which the remember-me cookie should be valid.
By default it will be valid for 14 days.

<a id="nsa-remember-me-use-secure-cookie"></a>

- **use-secure-cookie**
It is recommended that remember-me cookies are only submitted over HTTPS and thus should be flagged as "secure".
By default, a secure cookie will be used if the connection over which the login request is made is secure (as it should be).
If you set this property to `false`, secure cookies will not be used.
Setting it to `true` will always set the secure flag on the cookie.
This attribute maps to the `useSecureCookie` property of `AbstractRememberMeServices`.

<a id="nsa-remember-me-user-service-ref"></a>

- **user-service-ref**
The remember-me services implementations require access to a `UserDetailsService`, so there has to be one defined in the application context.
If there is only one, it will be selected and used automatically by the namespace configuration.
If there are multiple instances, you can specify a bean `id` explicitly using this attribute.

<a id="nsa-request-cache"></a>

## <request-cache> Element

Sets the `RequestCache` instance which will be used by the `ExceptionTranslationFilter` to store request information before invoking an `AuthenticationEntryPoint`.

<a id="nsa-request-cache-parents"></a>

### Parent Elements of <request-cache>

- [http](#nsa-http)

<a id="nsa-request-cache-attributes"></a>

### <request-cache> Attributes

<a id="nsa-request-cache-ref"></a>

- **ref**
Defines a reference to a Spring bean that is a `RequestCache`.

<a id="nsa-session-management"></a>

## <session-management>

Session-management related functionality is implemented by the addition of a `SessionManagementFilter` to the filter stack.

<a id="nsa-session-management-parents"></a>

### Parent Elements of <session-management>

- [http](#nsa-http)

<a id="nsa-session-management-attributes"></a>

### <session-management> Attributes

<a id="nsa-session-management-authentication-strategy-explicit-invocation"></a>

- **authentication-strategy-explicit-invocation**
Setting this attribute to true will mean that `SessionManagementFilter` will not be injected and explicit invocation of SessionAuthenticationStrategy is required.

<a id="nsa-session-management-invalid-session-url"></a>

- **invalid-session-url**
Setting this attribute will inject the `SessionManagementFilter` with a `SimpleRedirectInvalidSessionStrategy` configured with the attribute value.
When an invalid session ID is submitted, the strategy will be invoked, redirecting to the configured URL.

<a id="nsa-session-management-invalid-session-strategy-ref"></a>

- **invalid-session-url**
Allows injection of the InvalidSessionStrategy instance used by the SessionManagementFilter.
Use either this or the `invalid-session-url` attribute but not both.

<a id="nsa-session-management-session-authentication-error-url"></a>

- **session-authentication-error-url**
Defines the URL of the error page which should be shown when the SessionAuthenticationStrategy raises an exception.
If not set, an unauthorized (401) error code will be returned to the client.
Note that this attribute doesn’t apply if the error occurs during a form-based login, where the URL for authentication failure will take precedence.

<a id="nsa-session-management-session-authentication-strategy-ref"></a>

- **session-authentication-strategy-ref**
Allows injection of the SessionAuthenticationStrategy instance used by the SessionManagementFilter

<a id="nsa-session-management-session-fixation-protection"></a>

- **session-fixation-protection**
Indicates how session fixation protection will be applied when a user authenticates.
If set to "none", no protection will be applied.
"newSession" will create a new empty session, with only Spring Security-related attributes migrated.
"migrateSession" will create a new session and copy all session attributes to the new session.
In Servlet 3.1 (Java EE 7) and newer containers, specifying "changeSessionId" will keep the existing session and use the container-supplied session fixation protection (HttpServletRequest#changeSessionId()).
Defaults to "changeSessionId" in Servlet 3.1 and newer containers, "migrateSession" in older containers.
Throws an exception if "changeSessionId" is used in older containers.

  If session fixation protection is enabled, the `SessionManagementFilter` is injected with an appropriately configured `DefaultSessionAuthenticationStrategy`.
  See the Javadoc for this class for more details.

<a id="nsa-session-management-children"></a>

### Child Elements of <session-management>

- [concurrency-control](#nsa-concurrency-control)

<a id="nsa-concurrency-control"></a>

## <concurrency-control>

Adds support for concurrent session control, allowing limits to be placed on the number of active sessions a user can have.
A `ConcurrentSessionFilter` will be created, and a `ConcurrentSessionControlAuthenticationStrategy` will be used with the `SessionManagementFilter`.
If a `form-login` element has been declared, the strategy object will also be injected into the created authentication filter.
An instance of `SessionRegistry` (a `SessionRegistryImpl` instance unless the user wishes to use a custom bean) will be created for use by the strategy.

<a id="nsa-concurrency-control-parents"></a>

### Parent Elements of <concurrency-control>

- [session-management](#nsa-session-management)

<a id="nsa-concurrency-control-attributes"></a>

### <concurrency-control> Attributes

<a id="nsa-concurrency-control-error-if-maximum-exceeded"></a>

- **error-if-maximum-exceeded**
If set to "true" a `SessionAuthenticationException` will be raised when a user attempts to exceed the maximum allowed number of sessions.
The default behaviour is to expire the original session.

<a id="nsa-concurrency-control-expired-url"></a>

- **expired-url**
The URL a user will be redirected to if they attempt to use a session which has been "expired" by the concurrent session controller because the user has exceeded the number of allowed sessions and has logged in again elsewhere.
Should be set unless `exception-if-maximum-exceeded` is set.
If no value is supplied, an expiry message will just be written directly back to the response.

<a id="nsa-concurrency-control-expired-session-strategy-ref"></a>

- **expired-url**
Allows injection of the ExpiredSessionStrategy instance used by the ConcurrentSessionFilter

<a id="nsa-concurrency-control-max-sessions"></a>

- **max-sessions**
Maps to the `maximumSessions` property of `ConcurrentSessionControlAuthenticationStrategy`.
Specify `-1` as the value to support unlimited sessions.

<a id="nsa-concurrency-control-max-sessions-ref"></a>

- **max-sessions-ref**
Allows injection of the SessionLimit instance used by the ConcurrentSessionControlAuthenticationStrategy

<a id="nsa-concurrency-control-session-registry-alias"></a>

- **session-registry-alias**
It can also be useful to have a reference to the internal session registry for use in your own beans or an admin interface.
You can expose the internal bean using the `session-registry-alias` attribute, giving it a name that you can use elsewhere in your configuration.

<a id="nsa-concurrency-control-session-registry-ref"></a>

- **session-registry-ref**
The user can supply their own `SessionRegistry` implementation using the `session-registry-ref` attribute.
The other concurrent session control beans will be wired up to use it.

<a id="nsa-x509"></a>

## <x509>

Adds support for X.509 authentication.
An `X509AuthenticationFilter` will be added to the stack and an `Http403ForbiddenEntryPoint` bean will be created.
The latter will only be used if no other authentication mechanisms are in use (its only functionality is to return an HTTP 403 error code).
A `PreAuthenticatedAuthenticationProvider` will also be created which delegates the loading of user authorities to a `UserDetailsService`.

<a id="nsa-x509-parents"></a>

### Parent Elements of <x509>

- [http](#nsa-http)

<a id="nsa-x509-attributes"></a>

### <x509> Attributes

<a id="nsa-x509-authentication-details-source-ref"></a>

- **authentication-details-source-ref**
A reference to an `AuthenticationDetailsSource`

<a id="nsa-x509-principal-extractor-ref"></a>

- **principal-extractor-ref**
Reference to an `X509PrincipalExtractor` which will be used by the authentication filter.

<a id="nsa-x509-subject-principal-regex"></a>

- **subject-principal-regex**
Defines a regular expression which will be used to extract the username from the certificate (for use with the `UserDetailsService`).

<a id="nsa-x509-user-service-ref"></a>

- **user-service-ref**
Allows a specific `UserDetailsService` to be used with X.509 in the case where multiple instances are configured.
If not set, an attempt will be made to locate a suitable instance automatically and use that.

<a id="nsa-filter-chain-map"></a>

## <filter-chain-map>

Used to explicitly configure a FilterChainProxy instance with a FilterChainMap

<a id="nsa-filter-chain-map-attributes"></a>

### <filter-chain-map> Attributes

<a id="nsa-filter-chain-map-request-matcher"></a>

- **request-matcher**
Defines the strategy to use for matching incoming requests.
Currently the options are 'ant' (for ant path patterns), 'regex' for regular expressions and 'ciRegex' for case-insensitive regular expressions.

<a id="nsa-filter-chain-map-children"></a>

### Child Elements of <filter-chain-map>

- [filter-chain](#nsa-filter-chain)

<a id="nsa-filter-chain"></a>

## <filter-chain>

Used within to define a specific URL pattern and the list of filters which apply to the URLs matching that pattern.
When multiple filter-chain elements are assembled in a list in order to configure a FilterChainProxy, the most specific patterns must be placed at the top of the list, with most general ones at the bottom.

<a id="nsa-filter-chain-parents"></a>

### Parent Elements of <filter-chain>

- [filter-chain-map](#nsa-filter-chain-map)

<a id="nsa-filter-chain-attributes"></a>

### <filter-chain> Attributes

<a id="nsa-filter-chain-filters"></a>

- **filters**
A comma separated list of references to Spring beans that implement `Filter`.
The value "none" means that no `Filter` should be used for this `FilterChain`.

<a id="nsa-filter-chain-pattern"></a>

- **pattern**
A pattern that creates RequestMatcher in combination with the [request-matcher](#nsa-filter-chain-map-request-matcher)

<a id="nsa-filter-chain-request-matcher-ref"></a>

- **request-matcher-ref**
A reference to a `RequestMatcher` that will be used to determine if any `Filter` from the `filters` attribute should be invoked.

<a id="nsa-filter-security-metadata-source"></a>

## <filter-security-metadata-source>

Used to explicitly configure a FilterSecurityMetadataSource bean for use with a FilterSecurityInterceptor.
Usually only needed if you are configuring a FilterChainProxy explicitly, rather than using the<http> element.
The intercept-url elements used should only contain pattern, method and access attributes.
Any others will result in a configuration error.

<a id="nsa-filter-security-metadata-source-attributes"></a>

### <filter-security-metadata-source> Attributes

<a id="nsa-filter-security-metadata-source-id"></a>

- **id**
A bean identifier, used for referring to the bean elsewhere in the context.

<a id="nsa-filter-security-metadata-source-request-matcher"></a>

- **request-matcher**
Defines the strategy use for matching incoming requests.
Currently the options are 'ant' (for ant path patterns), 'regex' for regular expressions and 'ciRegex' for case-insensitive regular expressions.

<a id="nsa-filter-security-metadata-source-use-expressions"></a>

- **use-expressions**
Enables the use of expressions in the 'access' attributes in <intercept-url> elements rather than the traditional list of configuration attributes.
Defaults to 'true'.
If enabled, each attribute should contain a single Boolean expression.
If the expression evaluates to 'true', access will be granted.

<a id="nsa-filter-security-metadata-source-children"></a>

### Child Elements of <filter-security-metadata-source>

- [intercept-url](#nsa-intercept-url)
