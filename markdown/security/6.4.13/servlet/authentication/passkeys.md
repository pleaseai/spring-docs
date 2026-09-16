---
title: "Passkeys"
source: "ROOT:servlet/authentication/passkeys.adoc"
---

<a id="passkeys"></a>

# Passkeys

Spring Security provides support for [passkeys](https://www.passkeys.com).
Passkeys are a more secure method of authenticating than passwords and are built using [WebAuthn](https://www.w3.org/TR/webauthn-3/).

In order to use a passkey to authenticate, a user must first [Register a New Credential](#passkeys-register).
After the credential is registered, it can be used to authenticate by [verifying an authentication assertion](#passkeys-verify).

<a id="passkeys-dependencies"></a>

## Required Dependencies

To get started, add the `webauthn4j-core` dependency to your project.

> [!NOTE]
> This assumes that you are managing Spring Security’s versions with Spring Boot or Spring Security’s BOM as described in [getting-spring-security.adoc](../../getting-spring-security.md).

#### Maven

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-web</artifactId>
</dependency>
<dependency>
    <groupId>com.webauthn4j</groupId>
    <artifactId>webauthn4j-core</artifactId>
    <version>0.28.6.RELEASE</version>
</dependency>
```

#### Gradle

```groovy
depenendencies {
    implementation "org.springframework.security:spring-security-web"
    implementation "com.webauthn4j:webauthn4j-core:0.28.6.RELEASE"
}
```

<a id="passkeys-configuration"></a>

## Configuration

The following configuration enables passkey authentication.
It provides a way to [Register a New Credential](#passkeys-register) at `/webauthn/register` and a default log in page that allows [authenticating with passkeys](#passkeys-verify).

#### Java

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) {
	http
		// ...
		.formLogin(withDefaults())
		.webAuthn((webAuthn) -> webAuthn
			.rpId("example.com")
			.allowedOrigins("https://example.com")
		);
	return http.build();
}

@Bean
UserDetailsService userDetailsService() {
	UserDetails userDetails = User.withDefaultPasswordEncoder()
		.username("user")
		.password("password")
		.roles("USER")
		.build();

	return new InMemoryUserDetailsManager(userDetails);
}
```

#### Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
	http {
		webAuthn {
			rpId = "example.com"
			allowedOrigins = setOf("https://example.com")
		}
	}
}

@Bean
open fun userDetailsService(): UserDetailsService {
	val userDetails = User.withDefaultPasswordEncoder()
		.username("user")
		.password("password")
		.roles("USER")
		.build()
	return InMemoryUserDetailsManager(userDetails)
}
```

<a id="passkeys-register"></a>

## Register a New Credential

In order to use a passkey, a user must first [Register a New Credential](https://www.w3.org/TR/webauthn-3/#sctn-registering-a-new-credential).

Registering a new credential is composed of two steps:

1. Requesting the Registration Options
1. Registering the Credential

<a id="passkeys-register-options"></a>

### Request the Registration Options

The first step in registration of a new credential is to request the registration options.
In Spring Security, a request for the registration options is typically done using JavaScript and looks like:

> [!NOTE]
> Spring Security provides a default registration page that can be used as a reference on how to register credentials.

#### Request for Registration Options

```http
POST /webauthn/register/options
X-CSRF-TOKEN: 4bfd1575-3ad1-4d21-96c7-4ef2d9f86721
```

The request above will obtain the registration options for the currently authenticated user.
Since the challenge is persisted (state is changed) to be compared at the time of registration, the request must be a POST and include a CSRF token.

#### Response for Registration Options

```json
{
  "rp": {
    "name": "SimpleWebAuthn Example",
    "id": "example.localhost"
  },
  "user": {
    "name": "user@example.localhost",
    "id": "oWJtkJ6vJ_m5b84LB4_K7QKTCTEwLIjCh4tFMCGHO4w",
    "displayName": "user@example.localhost"
  },
  "challenge": "q7lCdd3SVQxdC-v8pnRAGEn1B2M-t7ZECWPwCAmhWvc",
  "pubKeyCredParams": [
    {
      "type": "public-key",
      "alg": -8
    },
    {
      "type": "public-key",
      "alg": -7
    },
    {
      "type": "public-key",
      "alg": -257
    }
  ],
  "timeout": 300000,
  "excludeCredentials": [],
  "authenticatorSelection": {
    "residentKey": "required",
    "userVerification": "preferred"
  },
  "attestation": "none",
  "extensions": {
    "credProps": true
  }
}
```

<a id="passkeys-register-create"></a>

### Registering the Credential

After the registration options are obtained, they are used to create the credentials that are registered.
To register a new credential, the application should pass the options to [`navigator.credentials.create`](https://w3c.github.io/webappsec-credential-management/#dom-credentialscontainer-create) after base64url decoding the binary values such as `user.id`, `challenge`, and `excludeCredentials[].id`.

The returned value can then be sent to the server as a JSON request.
An example registration request can be found below:

#### Example Registration Request

```http
POST /webauthn/register
X-CSRF-TOKEN: 4bfd1575-3ad1-4d21-96c7-4ef2d9f86721

{
  "publicKey": { // <1>
    "credential": {
      "id": "dYF7EGnRFFIXkpXi9XU2wg",
      "rawId": "dYF7EGnRFFIXkpXi9XU2wg",
      "response": {
        "attestationObject": "o2NmbXRkbm9uZWdhdHRTdG10oGhhdXRoRGF0YViUy9GqwTRaMpzVDbXq1dyEAXVOxrou08k22ggRC45MKNhdAAAAALraVWanqkAfvZZFYZpVEg0AEHWBexBp0RRSF5KV4vV1NsKlAQIDJiABIVggQjmrekPGzyqtoKK9HPUH-8Z2FLpoqkklFpFPQVICQ3IiWCD6I9Jvmor685fOZOyGXqUd87tXfvJk8rxj9OhuZvUALA",
        "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uY3JlYXRlIiwiY2hhbGxlbmdlIjoiSl9RTi10SFJYRWVKYjlNcUNrWmFPLUdOVmlibXpGVGVWMk43Z0ptQUdrQSIsIm9yaWdpbiI6Imh0dHBzOi8vZXhhbXBsZS5sb2NhbGhvc3Q6ODQ0MyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
        "transports": [
          "internal",
          "hybrid"
        ]
      },
      "type": "public-key",
      "clientExtensionResults": {},
      "authenticatorAttachment": "platform"
    },
    "label": "1password" // <2>
  }
}
```

1. The result of calling `navigator.credentials.create` with binary values base64url encoded.
1. A label that the user selects to have associated with this credential to help the user distinguish the credential.

#### Example Successful Registration Response

```http
HTTP/1.1 200 OK

{
  "success": true
}
```

<a id="passkeys-verify"></a>

## Verifying an Authentication Assertion

After [Register a New Credential](#passkeys-register) the passkey can be [verified](https://www.w3.org/TR/webauthn-3/#sctn-verifying-assertion) (authenticated).

Verifying a credential is composed of two steps:

1. Requesting the Verification Options
1. Verifying the Credential

<a id="passkeys-verify-options"></a>

### Request the Verification Options

The first step in verification of a credential is to request the verification options.
In Spring Security, a request for the verification options is typically done using JavaScript and looks like:

> [!NOTE]
> Spring Security provides a default log in page that can be used as a reference on how to verify credentials.

#### Request for Verification Options

```http
POST /webauthn/authenticate/options
X-CSRF-TOKEN: 4bfd1575-3ad1-4d21-96c7-4ef2d9f86721
```

The request above will obtain the verification options.
Since the challenge is persisted (state is changed) to be compared at the time of authentication, the request must be a POST and include a CSRF token.

The response will contain the options for obtaining a credential with binary values such as `challenge` base64url encoded.

#### Example Response for Verification Options

```json
{
  "challenge": "cQfdGrj9zDg3zNBkOH3WPL954FTOShVy0-CoNgSewNM",
  "timeout": 300000,
  "rpId": "example.localhost",
  "allowCredentials": [],
  "userVerification": "preferred",
  "extensions": {}
}
```

<a id="passkeys-verify-get"></a>

### Verifying the Credential

After the verification options are obtained, they are used to get a credential.
To get a credential, the application should pass the options to [`navigator.credentials.get`](https://w3c.github.io/webappsec-credential-management/#dom-credentialscontainer-create) after base64url decoding the binary values such as `challenge`.

The returned value of `navigator.credentials.get` can then be sent to the server as a JSON request.
Binary values such as `rawId` and `response.*` must be base64url encoded.
An example authentication request can be found below:

#### Example Authentication Request

```http
POST /login/webauthn
X-CSRF-TOKEN: 4bfd1575-3ad1-4d21-96c7-4ef2d9f86721

{
  "id": "dYF7EGnRFFIXkpXi9XU2wg",
  "rawId": "dYF7EGnRFFIXkpXi9XU2wg",
  "response": {
    "authenticatorData": "y9GqwTRaMpzVDbXq1dyEAXVOxrou08k22ggRC45MKNgdAAAAAA",
    "clientDataJSON": "eyJ0eXBlIjoid2ViYXV0aG4uZ2V0IiwiY2hhbGxlbmdlIjoiRFVsRzRDbU9naWhKMG1vdXZFcE9HdUk0ZVJ6MGRRWmxUQmFtbjdHQ1FTNCIsIm9yaWdpbiI6Imh0dHBzOi8vZXhhbXBsZS5sb2NhbGhvc3Q6ODQ0MyIsImNyb3NzT3JpZ2luIjpmYWxzZX0",
    "signature": "MEYCIQCW2BcUkRCAXDmGxwMi78jknenZ7_amWrUJEYoTkweldAIhAMD0EMp1rw2GfwhdrsFIeDsL7tfOXVPwOtfqJntjAo4z",
    "userHandle": "Q3_0Xd64_HW0BlKRAJnVagJTpLKLgARCj8zjugpRnVo"
  },
  "clientExtensionResults": {},
  "authenticatorAttachment": "platform"
}
```

#### Example Successful Authentication Response

```http
HTTP/1.1 200 OK

{
  "redirectUrl": "/", // <1>
  "authenticated": true // <2>
}
```

1. The URL to redirect to
1. Indicates that the user is authenticated

#### Example Authentication Failure Response

```http
HTTP/1.1 401 OK

```
