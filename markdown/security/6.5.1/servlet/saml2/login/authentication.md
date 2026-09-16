---
title: "Authenticating `<saml2:Response>`s"
source: "ROOT:servlet/saml2/login/authentication.adoc"
---

<a id="servlet-saml2login-authenticate-responses"></a>

# Authenticating `<saml2:Response>`s

To verify SAML 2.0 Responses, Spring Security uses [`Saml2AuthenticationTokenConverter`](overview.md#servlet-saml2login-authentication-saml2authenticationtokenconverter) to populate the `Authentication` request and [`OpenSaml4AuthenticationProvider`](overview.md#servlet-saml2login-architecture) to authenticate it.

You can configure this in a number of ways including:

1. Changing the way the `RelyingPartyRegistration` is Looked Up
1. Setting a clock skew to timestamp validation
1. Mapping the response to a list of `GrantedAuthority` instances
1. Customizing the strategy for validating assertions
1. Customizing the strategy for decrypting response and assertion elements

To configure these, you’ll use the `saml2Login#authenticationManager` method in the DSL.

<a id="saml2-response-processing-endpoint"></a>

## Changing the SAML Response Processing Endpoint

The default endpoint is `/login/saml2/sso/{registrationId}`.
You can change this in the DSL and in the associated metadata like so:

#### Java

```java
@Bean
SecurityFilterChain securityFilters(HttpSecurity http) throws Exception {
	http
        // ...
        .saml2Login((saml2) -> saml2.loginProcessingUrl("/saml2/login/sso"))
        // ...

    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilters(val http: HttpSecurity): SecurityFilterChain {
	http {
        // ...
        .saml2Login {
            loginProcessingUrl = "/saml2/login/sso"
        }
        // ...
    }

    return http.build()
}
```

and:

#### Java

```java
relyingPartyRegistrationBuilder.assertionConsumerServiceLocation("/saml/SSO")
```

#### Kotlin

```kotlin
relyingPartyRegistrationBuilder.assertionConsumerServiceLocation("/saml/SSO")
```

<a id="relyingpartyregistrationresolver-apply"></a>

## Changing `RelyingPartyRegistration` lookup

By default, this converter will match against any associated `<saml2:AuthnRequest>` or any `registrationId` it finds in the URL.
Or, if it cannot find one in either of those cases, then it attempts to look it up by the `<saml2:Response#Issuer>` element.

There are a number of circumstances where you might need something more sophisticated, like if you are supporting `ARTIFACT` binding.
In those cases, you can customize lookup through a custom `AuthenticationConverter`, which you can customize like so:

#### Java

```java
@Bean
SecurityFilterChain securityFilters(HttpSecurity http, AuthenticationConverter authenticationConverter) throws Exception {
	http
        // ...
        .saml2Login((saml2) -> saml2.authenticationConverter(authenticationConverter))
        // ...

    return http.build();
}
```

#### Kotlin

```kotlin
@Bean
fun securityFilters(val http: HttpSecurity, val converter: AuthenticationConverter): SecurityFilterChain {
	http {
        // ...
        .saml2Login {
            authenticationConverter = converter
        }
        // ...
    }

    return http.build()
}
```

<a id="servlet-saml2login-opensamlauthenticationprovider-clockskew"></a>

## Setting a Clock Skew

It’s not uncommon for the asserting and relying parties to have system clocks that aren’t perfectly synchronized.
For that reason, you can configure `OpenSaml4AuthenticationProvider`'s default assertion validator with some tolerance:

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        OpenSaml4AuthenticationProvider authenticationProvider = new OpenSaml4AuthenticationProvider();
        authenticationProvider.setAssertionValidator(OpenSaml4AuthenticationProvider
                .createDefaultAssertionValidatorWithParameters(assertionToken -> {
                    Map<String, Object> params = new HashMap<>();
                    params.put(CLOCK_SKEW, Duration.ofMinutes(10).toMillis());
                    // ... other validation parameters
                    return new ValidationContext(params);
                })
        );

        http
            .authorizeHttpRequests(authz -> authz
                .anyRequest().authenticated()
            )
            .saml2Login(saml2 -> saml2
                .authenticationManager(new ProviderManager(authenticationProvider))
            );
        return http.build();
    }
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
open class SecurityConfig {
    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        val authenticationProvider = OpenSaml4AuthenticationProvider()
        authenticationProvider.setAssertionValidator(
            OpenSaml4AuthenticationProvider
                .createDefaultAssertionValidatorWithParameters(Converter<OpenSaml4AuthenticationProvider.AssertionToken, ValidationContext> {
                    val params: MutableMap<String, Any> = HashMap()
                    params[CLOCK_SKEW] =
                        Duration.ofMinutes(10).toMillis()
                    ValidationContext(params)
                })
        )
        http {
            authorizeRequests {
                authorize(anyRequest, authenticated)
            }
            saml2Login {
                authenticationManager = ProviderManager(authenticationProvider)
            }
        }
        return http.build()
    }
}
```

If you are using [OpenSAML 5](../opensaml.md), then we have a simpler way, using `OpenSaml5AuthenticationProvider.AssertionValidator`:

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        OpenSaml5AuthenticationProvider authenticationProvider = new OpenSaml5AuthenticationProvider();
        AssertionValidator assertionValidator = AssertionValidator.builder()
                .clockSkew(Duration.ofMinutes(10)).build();
		authenticationProvider.setAssertionValidator(assertionValidator);
        http
            .authorizeHttpRequests(authz -> authz
                .anyRequest().authenticated()
            )
            .saml2Login(saml2 -> saml2
                .authenticationManager(new ProviderManager(authenticationProvider))
            );
        return http.build();
	}
}
```

#### Kotlin

```kotlin
@Configuration @EnableWebSecurity
class SecurityConfig {
    @Bean
    @Throws(Exception::class)
    fun filterChain(http: HttpSecurity): SecurityFilterChain {
        val authenticationProvider = OpenSaml5AuthenticationProvider()
        val assertionValidator = AssertionValidator.builder().clockSkew(Duration.ofMinutes(10)).build()
        authenticationProvider.setAssertionValidator(assertionValidator)
        http {
            authorizeHttpRequests {
                authorize(anyRequest, authenticated)
            }
            saml2Login {
                authenticationManager = ProviderManager(authenticationProvider)
            }
        }
        return http.build()
    }
}
```

<a id="_converting_an_assertion_into_an_authentication"></a>

## Converting an `Assertion` into an `Authentication`

`OpenSamlXAuthenticationProvider#setResponseAuthenticationConverter` provides a way for you to change how it converts your assertion into an `Authentication` instance.

You can set a custom converter in the following way:

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Autowired
    Converter<ResponseToken, Saml2Authentication> authenticationConverter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        OpenSaml5AuthenticationProvider authenticationProvider = new OpenSaml5AuthenticationProvider();
        authenticationProvider.setResponseAuthenticationConverter(this.authenticationConverter);

        http
            .authorizeHttpRequests((authz) -> authz
                .anyRequest().authenticated())
            .saml2Login((saml2) -> saml2
                .authenticationManager(new ProviderManager(authenticationProvider))
            );
        return http.build();
    }

}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
open class SecurityConfig {
    @Autowired
    var authenticationConverter: Converter<ResponseToken, Saml2Authentication>? = null

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        val authenticationProvider = OpenSaml5AuthenticationProvider()
        authenticationProvider.setResponseAuthenticationConverter(this.authenticationConverter)
        http {
            authorizeRequests {
                authorize(anyRequest, authenticated)
            }
            saml2Login {
                authenticationManager = ProviderManager(authenticationProvider)
            }
        }
        return http.build()
    }
}
```

The ensuing examples all build off of this common construct to show you different ways this converter comes in handy.

<a id="servlet-saml2login-opensamlauthenticationprovider-userdetailsservice"></a>

## Coordinating with a `UserDetailsService`

Or, perhaps you would like to include user details from a legacy `UserDetailsService`.
In that case, the response authentication converter can come in handy, as can be seen below:

#### Java

```java
@Component
class MyUserDetailsResponseAuthenticationConverter implements Converter<ResponseToken, Saml2Authentication> {
	private final ResponseAuthenticationConverter delegate = new ResponseAuthenticationConverter();
	private final UserDetailsService userDetailsService;

	MyUserDetailsResponseAuthenticationConverter(UserDetailsService userDetailsService) {
		this.userDetailsService = userDetailsService;
	}

	@Override
    public Saml2Authentication convert(ResponseToken responseToken) {
	    Saml2Authentication authentication = this.delegate.convert(responseToken); <1>
		UserDetails principal = this.userDetailsService.loadByUsername(username); <2>
		String saml2Response = authentication.getSaml2Response();
		Collection<GrantedAuthority> authorities = principal.getAuthorities();
		return new Saml2Authentication((AuthenticatedPrincipal) userDetails, saml2Response, authorities); <3>
    }

}
```

#### Kotlin

```kotlin
@Component
open class MyUserDetailsResponseAuthenticationConverter(val delegate: ResponseAuthenticationConverter,
        UserDetailsService userDetailsService): Converter<ResponseToken, Saml2Authentication> {

	@Override
    open fun convert(responseToken: ResponseToken): Saml2Authentication {
	    val authentication = this.delegate.convert(responseToken) <1>
		val principal = this.userDetailsService.loadByUsername(username) <2>
		val saml2Response = authentication.getSaml2Response()
		val authorities = principal.getAuthorities()
		return Saml2Authentication(userDetails as AuthenticatedPrincipal, saml2Response, authorities) <3>
    }

}
```

1. First, call the default converter, which extracts attributes and authorities from the response
1. Second, call the [`UserDetailsService`](../../authentication/passwords/user-details-service.md#servlet-authentication-userdetailsservice) using the relevant information
1. Third, return an authentication that includes the user details

> [!TIP]
> If your `UserDetailsService` returns a value that also implements `AuthenticatedPrincipal`, then you don’t need a custom authentication implementation.

Or, if you are using OpenSaml 4, then you can achieve something similar as follows:

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Autowired
    UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        OpenSaml4AuthenticationProvider authenticationProvider = new OpenSaml4AuthenticationProvider();
        authenticationProvider.setResponseAuthenticationConverter(responseToken -> {
            Saml2Authentication authentication = OpenSaml4AuthenticationProvider
                    .createDefaultResponseAuthenticationConverter() <1>
                    .convert(responseToken);
            Assertion assertion = responseToken.getResponse().getAssertions().get(0);
            String username = assertion.getSubject().getNameID().getValue();
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username); <2>
            return MySaml2Authentication(userDetails, authentication); <3>
        });

        http
            .authorizeHttpRequests(authz -> authz
                .anyRequest().authenticated()
            )
            .saml2Login(saml2 -> saml2
                .authenticationManager(new ProviderManager(authenticationProvider))
            );
        return http.build();
    }
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
open class SecurityConfig {
    @Autowired
    var userDetailsService: UserDetailsService? = null

    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        val authenticationProvider = OpenSaml4AuthenticationProvider()
        authenticationProvider.setResponseAuthenticationConverter { responseToken: OpenSaml4AuthenticationProvider.ResponseToken ->
            val authentication = OpenSaml4AuthenticationProvider
                .createDefaultResponseAuthenticationConverter() <1>
                .convert(responseToken)
            val assertion: Assertion = responseToken.response.assertions[0]
            val username: String = assertion.subject.nameID.value
            val userDetails = userDetailsService!!.loadUserByUsername(username) <2>
            MySaml2Authentication(userDetails, authentication) <3>
        }
        http {
            authorizeRequests {
                authorize(anyRequest, authenticated)
            }
            saml2Login {
                authenticationManager = ProviderManager(authenticationProvider)
            }
        }
        return http.build()
    }
}
```

1. First, call the default converter, which extracts attributes and authorities from the response
1. Second, call the [`UserDetailsService`](../../authentication/passwords/user-details-service.md#servlet-authentication-userdetailsservice) using the relevant information
1. Third, return a custom authentication that includes the user details

> [!NOTE]
> It’s not required to call `OpenSaml4AuthenticationProvider`'s default authentication converter.
> It returns a `Saml2AuthenticatedPrincipal` containing the attributes it extracted from `AttributeStatement`s as well as the single `ROLE_USER` authority.

<a id="_configuring_the_principal_name"></a>

### Configuring the Principal Name

Sometimes, the principal name is not in the `<saml2:NameID>` element.
In that case, you can configure the `ResponseAuthenticationConverter` with a custom strategy like so:

#### Java

```java
@Bean
ResponseAuthenticationConverter authenticationConverter() {
	ResponseAuthenticationConverter authenticationConverter = new ResponseAuthenticationConverter();
	authenticationConverter.setPrincipalNameConverter((assertion) -> {
		// ... work with OpenSAML's Assertion object to extract the principal
	});
	return authenticationConverter;
}
```

#### Kotlin

```kotlin
@Bean
fun authenticationConverter(): ResponseAuthenticationConverter {
    val authenticationConverter: ResponseAuthenticationConverter = ResponseAuthenticationConverter()
    authenticationConverter.setPrincipalNameConverter { assertion ->
		// ... work with OpenSAML's Assertion object to extract the principal
    }
    return authenticationConverter
}
```

<a id="_configuring_a_principals_granted_authorities"></a>

### Configuring a Principal’s Granted Authorities

Spring Security automatically grants `ROLE_USER` when using `OpenSamlXAuhenticationProvider`.
With `OpenSaml5AuthenticationProvider`, you can configure a different set of granted authorities like so:

#### Java

```java
@Bean
ResponseAuthenticationConverter authenticationConverter() {
	ResponseAuthenticationConverter authenticationConverter = new ResponseAuthenticationConverter();
	authenticationConverter.setPrincipalNameConverter((assertion) -> {
		// ... grant the needed authorities based on attributes in the assertion
	});
	return authenticationConverter;
}
```

#### Kotlin

```kotlin
@Bean
fun authenticationConverter(): ResponseAuthenticationConverter {
    val authenticationConverter = ResponseAuthenticationConverter()
    authenticationConverter.setPrincipalNameConverter{ assertion ->
		// ... grant the needed authorities based on attributes in the assertion
    }
    return authenticationConverter
}
```

<a id="servlet-saml2login-opensamlauthenticationprovider-additionalvalidation"></a>

## Performing Additional Response Validation

`OpenSaml4AuthenticationProvider` validates the `Issuer` and `Destination` values right after decrypting the `Response`.
You can customize the validation by extending the default validator concatenating with your own response validator, or you can replace it entirely with yours.

For example, you can throw a custom exception with any additional information available in the `Response` object, like so:

```java
OpenSaml4AuthenticationProvider provider = new OpenSaml4AuthenticationProvider();
provider.setResponseValidator((responseToken) -> {
	Saml2ResponseValidatorResult result = OpenSamlAuthenticationProvider
		.createDefaultResponseValidator()
		.convert(responseToken)
		.concat(myCustomValidator.convert(responseToken));
	if (!result.getErrors().isEmpty()) {
		String inResponseTo = responseToken.getInResponseTo();
		throw new CustomSaml2AuthenticationException(result, inResponseTo);
	}
	return result;
});
```

When using `OpenSaml5AuthenticationProvider`, you can do the same with less boilerplate:

```java
OpenSaml5AuthenticationProvider provider = new OpenSaml5AuthenticationProvider();
ResponseValidator responseValidator = ResponseValidator.withDefaults(myCustomValidator);
provider.setResponseValidator(responseValidator);
```

You can also customize which validation steps Spring Security should do.
For example, if you want to skip `Response#InResponseTo` validation, you can call `ResponseValidator`'s constructor, excluding `InResponseToValidator` from the list:

```java
OpenSaml5AuthenticationProvider provider = new OpenSaml5AuthenticationProvider();
ResponseValidator responseValidator = new ResponseValidator(new DestinationValidator(), new IssuerValidator());
provider.setResponseValidator(responseValidator);
```

> [!TIP]
> OpenSAML performs `Asssertion#InResponseTo` validation in its `BearerSubjectConfirmationValidator` class, which is configurable using [setAssertionValidator](#_performing_additional_assertion_validation).

<a id="_performing_additional_assertion_validation"></a>

## Performing Additional Assertion Validation

`OpenSaml4AuthenticationProvider` performs minimal validation on SAML 2.0 Assertions.
After verifying the signature, it will:

1. Validate `<AudienceRestriction>` and `<DelegationRestriction>` conditions
1. Validate `<SubjectConfirmation>`s, expect for any IP address information

To perform additional validation, you can configure your own assertion validator that delegates to `OpenSaml4AuthenticationProvider`'s default and then performs its own.

<a id="servlet-saml2login-opensamlauthenticationprovider-onetimeuse"></a>

For example, you can use OpenSAML’s `OneTimeUseConditionValidator` to also validate a `<OneTimeUse>` condition, like so:

#### Java

```java
OpenSaml4AuthenticationProvider provider = new OpenSaml4AuthenticationProvider();
OneTimeUseConditionValidator validator = ...;
provider.setAssertionValidator(assertionToken -> {
    Saml2ResponseValidatorResult result = OpenSaml4AuthenticationProvider
            .createDefaultAssertionValidator()
            .convert(assertionToken);
    Assertion assertion = assertionToken.getAssertion();
    OneTimeUse oneTimeUse = assertion.getConditions().getOneTimeUse();
    ValidationContext context = new ValidationContext();
    try {
        if (validator.validate(oneTimeUse, assertion, context) = ValidationResult.VALID) {
            return result;
        }
    } catch (Exception e) {
        return result.concat(new Saml2Error(INVALID_ASSERTION, e.getMessage()));
    }
    return result.concat(new Saml2Error(INVALID_ASSERTION, context.getValidationFailureMessage()));
});
```

#### Kotlin

```kotlin
var provider = OpenSaml4AuthenticationProvider()
var validator: OneTimeUseConditionValidator = ...
provider.setAssertionValidator { assertionToken ->
    val result = OpenSaml4AuthenticationProvider
        .createDefaultAssertionValidator()
        .convert(assertionToken)
    val assertion: Assertion = assertionToken.assertion
    val oneTimeUse: OneTimeUse = assertion.conditions.oneTimeUse
    val context = ValidationContext()
    try {
        if (validator.validate(oneTimeUse, assertion, context) = ValidationResult.VALID) {
            return@setAssertionValidator result
        }
    } catch (e: Exception) {
        return@setAssertionValidator result.concat(Saml2Error(INVALID_ASSERTION, e.message))
    }
    result.concat(Saml2Error(INVALID_ASSERTION, context.validationFailureMessage))
}
```

> [!NOTE]
> While recommended, it’s not necessary to call `OpenSaml4AuthenticationProvider`'s default assertion validator.
> A circumstance where you would skip it would be if you don’t need it to check the `<AudienceRestriction>` or the `<SubjectConfirmation>` since you are doing those yourself.

If you are using [OpenSAML 5](../opensaml.md), then we have a simpler way using `OpenSaml5AuthenticationProvider.AssertionValidator`:

#### Java

```java
OpenSaml5AuthenticationProvider provider = new OpenSaml5AuthenticationProvider();
OneTimeUseConditionValidator validator = ...;
AssertionValidator assertionValidator = AssertionValidator.builder()
        .conditionValidators((c) -> c.add(validator)).build();
provider.setAssertionValidator(assertionValidator);
```

#### Kotlin

```kotlin
val provider = OpenSaml5AuthenticationProvider()
val validator: OneTimeUseConditionValidator = ...;
val assertionValidator = AssertionValidator.builder()
        .conditionValidators { add(validator) }.build()
provider.setAssertionValidator(assertionValidator)
```

You can use this same builder to remove validators that you don’t want to use like so:

#### Java

```java
OpenSaml5AuthenticationProvider provider = new OpenSaml5AuthenticationProvider();
AssertionValidator assertionValidator = AssertionValidator.builder()
        .conditionValidators((c) -> c.removeIf(AudienceRestrictionValidator.class::isInstance)).build();
provider.setAssertionValidator(assertionValidator);
```

#### Kotlin

```kotlin
val provider = new OpenSaml5AuthenticationProvider()
val assertionValidator = AssertionValidator.builder()
        .conditionValidators {
			c: List<ConditionValidator> -> c.removeIf { it is AudienceRestrictionValidator }
        }.build()
provider.setAssertionValidator(assertionValidator)
```

<a id="servlet-saml2login-opensamlauthenticationprovider-decryption"></a>

## Customizing Decryption

Spring Security decrypts `<saml2:EncryptedAssertion>`, `<saml2:EncryptedAttribute>`, and `<saml2:EncryptedID>` elements automatically by using the decryption [`Saml2X509Credential` instances](overview.md#servlet-saml2login-rpr-credentials) registered in the [`RelyingPartyRegistration`](overview.md#servlet-saml2login-relyingpartyregistration).

`OpenSaml4AuthenticationProvider` exposes [two decryption strategies](overview.md#servlet-saml2login-architecture).
The response decrypter is for decrypting encrypted elements of the `<saml2:Response>`, like `<saml2:EncryptedAssertion>`.
The assertion decrypter is for decrypting encrypted elements of the `<saml2:Assertion>`, like `<saml2:EncryptedAttribute>` and `<saml2:EncryptedID>`.

You can replace `OpenSaml4AuthenticationProvider`'s default decryption strategy with your own.
For example, if you have a separate service that decrypts the assertions in a `<saml2:Response>`, you can use it instead like so:

#### Java

```java
MyDecryptionService decryptionService = ...;
OpenSaml4AuthenticationProvider provider = new OpenSaml4AuthenticationProvider();
provider.setResponseElementsDecrypter((responseToken) -> decryptionService.decrypt(responseToken.getResponse()));
```

#### Kotlin

```kotlin
val decryptionService: MyDecryptionService = ...
val provider = OpenSaml4AuthenticationProvider()
provider.setResponseElementsDecrypter { responseToken -> decryptionService.decrypt(responseToken.response) }
```

If you are also decrypting individual elements in a `<saml2:Assertion>`, you can customize the assertion decrypter, too:

#### Java

```java
provider.setAssertionElementsDecrypter((assertionToken) -> decryptionService.decrypt(assertionToken.getAssertion()));
```

#### Kotlin

```kotlin
provider.setAssertionElementsDecrypter { assertionToken -> decryptionService.decrypt(assertionToken.assertion) }
```

> [!NOTE]
> There are two separate decrypters since assertions can be signed separately from responses.
> Trying to decrypt a signed assertion’s elements before signature verification may invalidate the signature.
> If your asserting party signs the response only, then it’s safe to decrypt all elements using only the response decrypter.

<a id="servlet-saml2login-authenticationmanager-custom"></a>

## Using a Custom Authentication Manager

<a id="servlet-saml2login-opensamlauthenticationprovider-authenticationmanager"></a>

Of course, the `authenticationManager` DSL method can be also used to perform a completely custom SAML 2.0 authentication.
This authentication manager should expect a `Saml2AuthenticationToken` object containing the SAML 2.0 Response XML data.

#### Java

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        AuthenticationManager authenticationManager = new MySaml2AuthenticationManager(...);
        http
            .authorizeHttpRequests(authorize -> authorize
                .anyRequest().authenticated()
            )
            .saml2Login(saml2 -> saml2
                .authenticationManager(authenticationManager)
            )
        ;
        return http.build();
    }
}
```

#### Kotlin

```kotlin
@Configuration
@EnableWebSecurity
open class SecurityConfig {
    @Bean
    open fun filterChain(http: HttpSecurity): SecurityFilterChain {
        val customAuthenticationManager: AuthenticationManager = MySaml2AuthenticationManager(...)
        http {
            authorizeRequests {
                authorize(anyRequest, authenticated)
            }
            saml2Login {
                authenticationManager = customAuthenticationManager
            }
        }
        return http.build()
    }
}
```

<a id="servlet-saml2login-authenticatedprincipal"></a>

## Using `Saml2AuthenticatedPrincipal`

With the relying party correctly configured for a given asserting party, it’s ready to accept assertions.
Once the relying party validates an assertion, the result is a `Saml2Authentication` with a `Saml2AuthenticatedPrincipal`.

This means that you can access the principal in your controller like so:

#### Java

```java
@Controller
public class MainController {
	@GetMapping("/")
	public String index(@AuthenticationPrincipal Saml2AuthenticatedPrincipal principal, Model model) {
		String email = principal.getFirstAttribute("email");
		model.setAttribute("email", email);
		return "index";
	}
}
```

#### Kotlin

```kotlin
@Controller
class MainController {
    @GetMapping("/")
    fun index(@AuthenticationPrincipal principal: Saml2AuthenticatedPrincipal, model: Model): String {
        val email = principal.getFirstAttribute<String>("email")
        model.setAttribute("email", email)
        return "index"
    }
}
```

> [!TIP]
> Because the SAML 2.0 specification allows for each attribute to have multiple values, you can either call `getAttribute` to get the list of attributes or `getFirstAttribute` to get the first in the list.
> `getFirstAttribute` is quite handy when you know that there is only one value.
