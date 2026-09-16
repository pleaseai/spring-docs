---
title: "Password Storage"
source: "ROOT:features/authentication/password-storage.adoc"
---

<a id="authentication-password-storage"></a>

# Password Storage

Spring Security’s `PasswordEncoder` interface is used to perform a one-way transformation of a password to let the password be stored securely.
Given `PasswordEncoder` is a one-way transformation, it is not useful when the password transformation needs to be two-way (such as storing credentials used to authenticate to a database).
Typically, `PasswordEncoder` is used for storing a password that needs to be compared to a user-provided password at the time of authentication.

<a id="authentication-password-storage-history"></a>

## Password Storage History

Throughout the years, the standard mechanism for storing passwords has evolved.
In the beginning, passwords were stored in plaintext.
The passwords were assumed to be safe because the data store the passwords were saved in required credentials to access it.
However, malicious users were able to find ways to get large “data dumps” of usernames and passwords by using attacks such as SQL Injection.
As more and more user credentials became public, security experts realized that we needed to do more to protect users' passwords.

Developers were then encouraged to store passwords after running them through a one way hash, such as SHA-256.
When a user tried to authenticate, the hashed password would be compared to the hash of the password that they typed.
This meant that the system only needed to store the one-way hash of the password.
If a breach occurred, only the one-way hashes of the passwords were exposed.
Since the hashes were one-way and it was computationally difficult to guess the passwords given the hash, it would not be worth the effort to figure out each password in the system.
To defeat this new system, malicious users decided to create lookup tables known as [Rainbow Tables](https://en.wikipedia.org/wiki/Rainbow_table).
Rather than doing the work of guessing each password every time, they computed the password once and stored it in a lookup table.

To mitigate the effectiveness of Rainbow Tables, developers were encouraged to use salted passwords.
Instead of using just the password as input to the hash function, random bytes (known as salt) would be generated for every user’s password.
The salt and the user’s password would be run through the hash function to produce a unique hash.
The salt would be stored alongside the user’s password in clear text.
Then when a user tried to authenticate, the hashed password would be compared to the hash of the stored salt and the password that they typed.
The unique salt meant that Rainbow Tables were no longer effective because the hash was different for every salt and password combination.

In modern times, we realize that cryptographic hashes (like SHA-256) are no longer secure.
The reason is that with modern hardware we can perform billions of hash calculations a second.
This means that we can crack each password individually with ease.

Developers are now encouraged to leverage adaptive one-way functions to store a password.
Validation of passwords with adaptive one-way functions are intentionally resource-intensive (they intentionally use a lot of CPU, memory, or other resources).
An adaptive one-way function allows configuring a “work factor” that can grow as hardware gets better.
We recommend that the “work factor” be tuned to take about one second to verify a password on your system.
This trade off is to make it difficult for attackers to crack the password, but not so costly that it puts excessive burden on your own system or irritates users.
Spring Security has attempted to provide a good starting point for the “work factor”, but we encourage users to customize the “work factor” for their own system, since the performance varies drastically from system to system.
Examples of adaptive one-way functions that should be used include [bcrypt](#authentication-password-storage-bcrypt), [PBKDF2](#authentication-password-storage-pbkdf2), [scrypt](#authentication-password-storage-scrypt), and [argon2](#authentication-password-storage-argon2).

Because adaptive one-way functions are intentionally resource intensive, validating a username and password for every request can significantly degrade the performance of an application.
There is nothing Spring Security (or any other library) can do to speed up the validation of the password, since security is gained by making the validation resource intensive.
Users are encouraged to exchange the long term credentials (that is, username and password) for a short term credential (such as a session, and OAuth Token, and so on).
The short term credential can be validated quickly without any loss in security.

<a id="authentication-password-storage-dpe"></a>

## DelegatingPasswordEncoder

Prior to Spring Security 5.0, the default `PasswordEncoder` was `NoOpPasswordEncoder`, which required plain-text passwords.
Based on the [Password History](#authentication-password-storage-history) section, you might expect that the default `PasswordEncoder` would now be something like `BCryptPasswordEncoder`.
However, this ignores three real world problems:

- Many applications use old password encodings that cannot easily migrate.
- The best practice for password storage will change again.
- As a framework, Spring Security cannot make breaking changes frequently.

Instead Spring Security introduces `DelegatingPasswordEncoder`, which solves all of the problems by:

- Ensuring that passwords are encoded by using the current password storage recommendations
- Allowing for validating passwords in modern and legacy formats
- Allowing for upgrading the encoding in the future

You can easily construct an instance of `DelegatingPasswordEncoder` by using `PasswordEncoderFactories`:

#### Create Default DelegatingPasswordEncoder - Java

```java
PasswordEncoder passwordEncoder =
		PasswordEncoderFactories.createDelegatingPasswordEncoder();
```

#### Create Default DelegatingPasswordEncoder - Kotlin

```kotlin
val passwordEncoder: PasswordEncoder = PasswordEncoderFactories.createDelegatingPasswordEncoder()
```

Alternatively, you can create your own custom instance:

#### Create Custom DelegatingPasswordEncoder - Java

```java
String idForEncode = "bcrypt";
Map encoders = new HashMap<>();
encoders.put(idForEncode, new BCryptPasswordEncoder());
encoders.put("noop", NoOpPasswordEncoder.getInstance());
encoders.put("pbkdf2", Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_5());
encoders.put("pbkdf2@SpringSecurity_v5_8", Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8());
encoders.put("scrypt", SCryptPasswordEncoder.defaultsForSpringSecurity_v4_1());
encoders.put("scrypt@SpringSecurity_v5_8", SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8());
encoders.put("argon2", Argon2PasswordEncoder.defaultsForSpringSecurity_v5_2());
encoders.put("argon2@SpringSecurity_v5_8", Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8());
encoders.put("sha256", new StandardPasswordEncoder());

PasswordEncoder passwordEncoder =
	new DelegatingPasswordEncoder(idForEncode, encoders);
```

#### Create Custom DelegatingPasswordEncoder - Kotlin

```kotlin
val idForEncode = "bcrypt"
val encoders: MutableMap<String, PasswordEncoder> = mutableMapOf()
encoders[idForEncode] = BCryptPasswordEncoder()
encoders["noop"] = NoOpPasswordEncoder.getInstance()
encoders["pbkdf2"] = Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_5()
encoders["pbkdf2@SpringSecurity_v5_8"] = Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8()
encoders["scrypt"] = SCryptPasswordEncoder.defaultsForSpringSecurity_v4_1()
encoders["scrypt@SpringSecurity_v5_8"] = SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8()
encoders["argon2"] = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_2()
encoders["argon2@SpringSecurity_v5_8"] = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
encoders["sha256"] = StandardPasswordEncoder()

val passwordEncoder: PasswordEncoder = DelegatingPasswordEncoder(idForEncode, encoders)
```

<a id="authentication-password-storage-dpe-format"></a>

### Password Storage Format

The general format for a password is:

#### DelegatingPasswordEncoder Storage Format

```text
{id}encodedPassword
```

`id` is an identifier that is used to look up which `PasswordEncoder` should be used and `encodedPassword` is the original encoded password for the selected `PasswordEncoder`.
The `id` must be at the beginning of the password, start with `{`, and end with `}`.
If the `id` cannot be found, the `id` is set to null.
For example, the following might be a list of passwords encoded using different `id` values.
All of the original passwords are `password`.

#### DelegatingPasswordEncoder Encoded Passwords Example

```text
{bcrypt}$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG // <1>
{noop}password // <2>
{pbkdf2}5d923b44a6d129f3ddf3e3c8d29412723dcbde72445e8ef6bf3b508fbf17fa4ed4d6b99ca763d8dc // <3>
{scrypt}$e0801$8bWJaSu2IKSn9Z9kM+TPXfOc/9bdYSrN1oD9qfVThWEwdRTnO7re7Ei+fUZRJ68k9lTyuTeUp4of4g24hHnazw==$OAOec05+bXxvuu/1qZ6NUR+xQYvYv7BeL1QxwRpY5Pc=  // <4>
{sha256}97cde38028ad898ebc02e690819fa220e88c62e0699403e94fff291cfffaf8410849f27605abcbc0 // <5>
```

1. The first password has a `PasswordEncoder` id of `bcrypt` and an `encodedPassword` value of `$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG`.
When matching, it would delegate to `BCryptPasswordEncoder`
1. The second password has a `PasswordEncoder` id of `noop` and `encodedPassword` value of `password`.
When matching, it would delegate to `NoOpPasswordEncoder`
1. The third password has a `PasswordEncoder` id of `pbkdf2` and `encodedPassword` value of `5d923b44a6d129f3ddf3e3c8d29412723dcbde72445e8ef6bf3b508fbf17fa4ed4d6b99ca763d8dc`.
When matching, it would delegate to `Pbkdf2PasswordEncoder`
1. The fourth password has a `PasswordEncoder` id of `scrypt` and `encodedPassword` value of `$e0801$8bWJaSu2IKSn9Z9kM+TPXfOc/9bdYSrN1oD9qfVThWEwdRTnO7re7Ei+fUZRJ68k9lTyuTeUp4of4g24hHnazw==$OAOec05+bXxvuu/1qZ6NUR+xQYvYv7BeL1QxwRpY5Pc=`
When matching, it would delegate to `SCryptPasswordEncoder`
1. The final password has a `PasswordEncoder` id of `sha256` and `encodedPassword` value of `97cde38028ad898ebc02e690819fa220e88c62e0699403e94fff291cfffaf8410849f27605abcbc0`.
When matching, it would delegate to `StandardPasswordEncoder`

> [!NOTE]
> Some users might be concerned that the storage format is provided for a potential hacker.
> This is not a concern because the storage of the password does not rely on the algorithm being a secret.
> Additionally, most formats are easy for an attacker to figure out without the prefix.
> For example, BCrypt passwords often start with `$2a$`.

<a id="authentication-password-storage-dpe-encoding"></a>

### Password Encoding

The `idForEncode` passed into the constructor determines which `PasswordEncoder` is used for encoding passwords.
In the `DelegatingPasswordEncoder` we constructed earlier, that means that the result of encoding `password` is delegated to `BCryptPasswordEncoder` and be prefixed with `{bcrypt}`.
The end result looks like the following example:

#### DelegatingPasswordEncoder Encode Example

```text
{bcrypt}$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG
```

<a id="authentication-password-storage-dpe-matching"></a>

### Password Matching

Matching is based upon the `{id}` and the mapping of the `id` to the `PasswordEncoder` provided in the constructor.
Our example in [Password Storage Format](#authentication-password-storage-dpe-format) provides a working example of how this is done.
By default, the result of invoking `matches(CharSequence, String)` with a password and an `id` that is not mapped (including a null id) results in an `IllegalArgumentException`.
This behavior can be customized by using `DelegatingPasswordEncoder.setDefaultPasswordEncoderForMatches(PasswordEncoder)`.

By using the `id`, we can match on any password encoding but encode passwords by using the most modern password encoding.
This is important, because unlike encryption, password hashes are designed so that there is no simple way to recover the plaintext.
Since there is no way to recover the plaintext, it is difficult to migrate the passwords.
While it is simple for users to migrate `NoOpPasswordEncoder`, we chose to include it by default to make it simple for the getting-started experience.

<a id="authentication-password-storage-dep-getting-started"></a>

### Getting Started Experience

If you are putting together a demo or a sample, it is a bit cumbersome to take time to hash the passwords of your users.
There are convenience mechanisms to make this easier, but this is still not intended for production.

#### withDefaultPasswordEncoder Example - Java

```java
UserDetails user = User.withDefaultPasswordEncoder()
		.username("user")
		.password("password")
		.roles("user")
		.build();
System.out.println(user.getPassword());
// {bcrypt}$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG
```

#### withDefaultPasswordEncoder Example - Kotlin

```kotlin
val user = User.withDefaultPasswordEncoder()
    .username("user")
    .password("password")
    .roles("user")
    .build()
println(user.password)
// {bcrypt}$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG
```

If you are creating multiple users, you can also reuse the builder:

#### withDefaultPasswordEncoder Reusing the Builder - Java

```java
UserBuilder users = User.withDefaultPasswordEncoder();
UserDetails user = users
		.username("user")
		.password("password")
		.roles("USER")
		.build();
UserDetails admin = users
		.username("admin")
		.password("password")
		.roles("USER","ADMIN")
		.build();
```

#### withDefaultPasswordEncoder Reusing the Builder - Kotlin

```kotlin
val users = User.withDefaultPasswordEncoder()
val user = users
    .username("user")
    .password("password")
    .roles("USER")
    .build()
val admin = users
    .username("admin")
    .password("password")
    .roles("USER", "ADMIN")
    .build()
```

This does hash the password that is stored, but the passwords are still exposed in memory and in the compiled source code.
Therefore, it is still not considered secure for a production environment.
For production, you should [hash your passwords externally](#authentication-password-storage-boot-cli).

<a id="authentication-password-storage-boot-cli"></a>

### Encode with Spring Boot CLI

The easiest way to properly encode your password is to use the [Spring Boot CLI](https://docs.spring.io/spring-boot/docs/current/reference/html/spring-boot-cli.html).

For example, the following example encodes the password of `password` for use with [DelegatingPasswordEncoder](#authentication-password-storage-dpe):

#### Spring Boot CLI encodepassword Example

```
spring encodepassword password
{bcrypt}$2a$10$X5wFBtLrL/kHcmrOGGTrGufsBX8CJ0WpQpF3pgeuxBB/H73BK1DW6
```

<a id="authentication-password-storage-dpe-troubleshoot"></a>

### Troubleshooting

The following error occurs when one of the passwords that are stored has no `id`, as described in [Password Storage Format](#authentication-password-storage-dpe-format).

```
java.lang.IllegalArgumentException: There is no PasswordEncoder mapped for the id "null"
	at org.springframework.security.crypto.password.DelegatingPasswordEncoder$UnmappedIdPasswordEncoder.matches(DelegatingPasswordEncoder.java:233)
	at org.springframework.security.crypto.password.DelegatingPasswordEncoder.matches(DelegatingPasswordEncoder.java:196)
```

The easiest way to resolve it is to figure out how your passwords are currently being stored and explicitly provide the correct `PasswordEncoder`.

If you are migrating from Spring Security 4.2.x, you can revert to the previous behavior by [exposing a `NoOpPasswordEncoder` bean](#authentication-password-storage-configuration).

Alternatively, you can prefix all of your passwords with the correct `id` and continue to use `DelegatingPasswordEncoder`.
For example, if you are using BCrypt, you would migrate your password from something like:

```
$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG
```

to

```
{bcrypt}$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG
```

For a complete listing of the mappings, see the Javadoc for [`PasswordEncoderFactories`](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/crypto/factory/PasswordEncoderFactories.html).

<a id="authentication-password-storage-bcrypt"></a>

## BCryptPasswordEncoder

The `BCryptPasswordEncoder` implementation uses the widely supported [bcrypt](https://en.wikipedia.org/wiki/Bcrypt) algorithm to hash the passwords.
To make it more resistant to password cracking, bcrypt is deliberately slow.
Like other adaptive one-way functions, it should be tuned to take about 1 second to verify a password on your system.
The default implementation of `BCryptPasswordEncoder` uses strength 10 as mentioned in the Javadoc of [`BCryptPasswordEncoder`](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/crypto/bcrypt/BCryptPasswordEncoder.html). You are encouraged to
tune and test the strength parameter on your own system so that it takes roughly 1 second to verify a password.

#### BCryptPasswordEncoder - Java

```java
// Create an encoder with strength 16
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(16);
String result = encoder.encode("myPassword");
assertTrue(encoder.matches("myPassword", result));
```

#### BCryptPasswordEncoder - Kotlin

```kotlin
// Create an encoder with strength 16
val encoder = BCryptPasswordEncoder(16)
val result: String? = encoder.encode("myPassword")
assertTrue(encoder.matches("myPassword", result))
```

<a id="authentication-password-storage-argon2"></a>

## Argon2PasswordEncoder

The `Argon2PasswordEncoder` implementation uses the [Argon2](https://en.wikipedia.org/wiki/Argon2) algorithm to hash the passwords.
Argon2 is the winner of the [Password Hashing Competition](https://en.wikipedia.org/wiki/Password_Hashing_Competition).
To defeat password cracking on custom hardware, Argon2 is a deliberately slow algorithm that requires large amounts of memory.
Like other adaptive one-way functions, it should be tuned to take about 1 second to verify a password on your system.
The current implementation of the `Argon2PasswordEncoder` requires BouncyCastle.

#### Argon2PasswordEncoder - Java

```java
// Create an encoder with all the defaults
Argon2PasswordEncoder encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
String result = encoder.encode("myPassword");
assertTrue(encoder.matches("myPassword", result));
```

#### Argon2PasswordEncoder - Kotlin

```kotlin
// Create an encoder with all the defaults
val encoder = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8()
val result: String? = encoder.encode("myPassword")
assertTrue(encoder.matches("myPassword", result))
```

<a id="authentication-password-storage-pbkdf2"></a>

## Pbkdf2PasswordEncoder

The `Pbkdf2PasswordEncoder` implementation uses the [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2) algorithm to hash the passwords.
To defeat password cracking PBKDF2 is a deliberately slow algorithm.
Like other adaptive one-way functions, it should be tuned to take about 1 second to verify a password on your system.
This algorithm is a good choice when FIPS certification is required.

#### Pbkdf2PasswordEncoder - Java

```java
// Create an encoder with all the defaults
Pbkdf2PasswordEncoder encoder = Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8();
String result = encoder.encode("myPassword");
assertTrue(encoder.matches("myPassword", result));
```

#### Pbkdf2PasswordEncoder - Kotlin

```kotlin
// Create an encoder with all the defaults
val encoder = Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8()
val result: String? = encoder.encode("myPassword")
assertTrue(encoder.matches("myPassword", result))
```

<a id="authentication-password-storage-scrypt"></a>

## SCryptPasswordEncoder

The `SCryptPasswordEncoder` implementation uses the [scrypt](https://en.wikipedia.org/wiki/Scrypt) algorithm to hash the passwords.
To defeat password cracking on custom hardware, scrypt is a deliberately slow algorithm that requires large amounts of memory.
Like other adaptive one-way functions, it should be tuned to take about 1 second to verify a password on your system.

#### SCryptPasswordEncoder - Java

```java
// Create an encoder with all the defaults
SCryptPasswordEncoder encoder = SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8();
String result = encoder.encode("myPassword");
assertTrue(encoder.matches("myPassword", result));
```

#### SCryptPasswordEncoder - Kotlin

```kotlin
// Create an encoder with all the defaults
val encoder = SCryptPasswordEncoder.defaultsForSpringSecurity_v5_8()
val result: String? = encoder.encode("myPassword")
assertTrue(encoder.matches("myPassword", result))
```

<a id="authentication-password-storage-other"></a>

## Other `PasswordEncoder`s

There are a significant number of other `PasswordEncoder` implementations that exist entirely for backward compatibility.
They are all deprecated to indicate that they are no longer considered secure.
However, there are no plans to remove them, since it is difficult to migrate existing legacy systems.

<a id="password4j"></a>

## Password4j-based Password Encoders

Spring Security 7.0 introduces alternative password encoder implementations based on the [Password4j](https://github.com/Password4j/password4j) library.
These encoders provide additional options for popular hashing algorithms and can be used as alternatives to the existing Spring Security implementations.

The Password4j library is a Java cryptographic library that focuses on password hashing with support for multiple algorithms.
These encoders are particularly useful when you need specific algorithm configurations or want to leverage Password4j’s optimizations.

All Password4j-based encoders are thread-safe and can be shared across multiple threads.

<a id="password4j-argon2"></a>

### Argon2Password4jPasswordEncoder

The `Argon2Password4jPasswordEncoder` implementation uses the [Argon2](https://en.wikipedia.org/wiki/Argon2) algorithm via the Password4j library to hash passwords.
This provides an alternative to Spring Security’s built-in `Argon2PasswordEncoder` with different configuration options and potential performance characteristics.

Argon2 is the winner of the [Password Hashing Competition](https://en.wikipedia.org/wiki/Password_Hashing_Competition) and is recommended for new applications.
This implementation leverages Password4j’s Argon2 support which properly includes the salt in the output hash.

Create an encoder with default settings:

#### Argon2Password4jPasswordEncoder - Java

```java
PasswordEncoder encoder = new Argon2Password4jPasswordEncoder();
String result = encoder.encode("myPassword");
assertThat(encoder.matches("myPassword", result)).isTrue();
```

#### Argon2Password4jPasswordEncoder - Kotlin

```kotlin
val encoder: PasswordEncoder = Argon2Password4jPasswordEncoder()
val result = encoder.encode("myPassword")
assertThat(encoder.matches("myPassword", result)).isTrue()
```

Create an encoder with custom Argon2 parameters:

#### Argon2Password4jPasswordEncoder Custom - Java

```java
Argon2Function argon2Fn = Argon2Function.getInstance(65536, 3, 4, 32,
		Argon2.ID);
PasswordEncoder encoder = new Argon2Password4jPasswordEncoder(argon2Fn);
String result = encoder.encode("myPassword");
assertThat(encoder.matches("myPassword", result)).isTrue();
```

#### Argon2Password4jPasswordEncoder Custom - Kotlin

```kotlin
val argon2Fn = Argon2Function.getInstance(
    65536, 3, 4, 32,
    Argon2.ID
)
val encoder: PasswordEncoder = Argon2Password4jPasswordEncoder(argon2Fn)
val result = encoder.encode("myPassword")
assertThat(encoder.matches("myPassword", result)).isTrue()
```

<a id="password4j-bcrypt"></a>

### BcryptPassword4jPasswordEncoder

The `BcryptPassword4jPasswordEncoder` implementation uses the [BCrypt](https://en.wikipedia.org/wiki/Bcrypt) algorithm via the Password4j library to hash passwords.
This provides an alternative to Spring Security’s built-in `BCryptPasswordEncoder` with Password4j’s implementation characteristics.

BCrypt is a well-established password hashing algorithm that includes built-in salt generation and is resistant to rainbow table attacks.
This implementation leverages Password4j’s BCrypt support which properly includes the salt in the output hash.

Create an encoder with default settings:

#### BcryptPassword4jPasswordEncoder - Java

```java
PasswordEncoder encoder = new BCryptPasswordEncoder();
String result = encoder.encode("myPassword");
assertThat(encoder.matches("myPassword", result)).isTrue();
```

#### BcryptPassword4jPasswordEncoder - Kotlin

```kotlin
val encoder: PasswordEncoder = BCryptPasswordEncoder()
val result = encoder.encode("myPassword")
Assertions.assertThat(encoder.matches("myPassword", result)).isTrue()
```

Create an encoder with custom bcrypt parameters:

#### BcryptPassword4jPasswordEncoder Custom - Java

```java
BcryptFunction bcryptFn = BcryptFunction.getInstance(12);
PasswordEncoder encoder = new BcryptPassword4jPasswordEncoder(bcryptFn);
String result = encoder.encode("myPassword");
assertThat(encoder.matches("myPassword", result)).isTrue();
```

#### BcryptPassword4jPasswordEncoder Custom - Kotlin

```kotlin
val bcryptFunction = BcryptFunction.getInstance(12)
val encoder: PasswordEncoder = BcryptPassword4jPasswordEncoder(bcryptFunction)
val result = encoder.encode("myPassword")
Assertions.assertThat(encoder.matches("myPassword", result)).isTrue()
```

<a id="password4j-scrypt"></a>

### ScryptPassword4jPasswordEncoder

The `ScryptPassword4jPasswordEncoder` implementation uses the [SCrypt](https://en.wikipedia.org/wiki/Scrypt) algorithm via the Password4j library to hash passwords.
This provides an alternative to Spring Security’s built-in `SCryptPasswordEncoder` with Password4j’s implementation characteristics.

SCrypt is a memory-hard password hashing algorithm designed to be resistant to hardware brute-force attacks.
This implementation leverages Password4j’s SCrypt support which properly includes the salt in the output hash.

Create an encoder with default settings:

#### ScryptPassword4jPasswordEncoder - Java

```java
PasswordEncoder encoder = new ScryptPassword4jPasswordEncoder();
String result = encoder.encode("myPassword");
assertThat(encoder.matches("myPassword", result)).isTrue();
```

#### ScryptPassword4jPasswordEncoder - Kotlin

```kotlin
val encoder: PasswordEncoder = ScryptPassword4jPasswordEncoder()
val result = encoder.encode("myPassword")
Assertions.assertThat(encoder.matches("myPassword", result)).isTrue()
```

Create an encoder with custom scrypt parameters:

#### ScryptPassword4jPasswordEncoder Custom - Java

```java
ScryptFunction scryptFn = ScryptFunction.getInstance(32768, 8, 1, 32);
PasswordEncoder encoder = new ScryptPassword4jPasswordEncoder(scryptFn);
String result = encoder.encode("myPassword");
assertThat(encoder.matches("myPassword", result)).isTrue();
```

#### ScryptPassword4jPasswordEncoder Custom - Kotlin

```kotlin
val scryptFn = ScryptFunction.getInstance(32768, 8, 1, 32)
val encoder: PasswordEncoder = ScryptPassword4jPasswordEncoder(scryptFn)
val result = encoder.encode("myPassword")
Assertions.assertThat(encoder.matches("myPassword", result)).isTrue()
```

<a id="password4j-pbkdf2"></a>

### Pbkdf2Password4jPasswordEncoder

The `Pbkdf2Password4jPasswordEncoder` implementation uses the [PBKDF2](https://en.wikipedia.org/wiki/PBKDF2) algorithm via the Password4j library to hash passwords.
This provides an alternative to Spring Security’s built-in `Pbkdf2PasswordEncoder` with explicit salt management.

PBKDF2 is a key derivation function designed to be computationally expensive to thwart dictionary and brute force attacks.
This implementation handles salt management explicitly since Password4j’s PBKDF2 implementation does not include the salt in the output hash.
The encoded password format is: `{salt}:{hash}` where both salt and hash are Base64 encoded.

Create an encoder with default settings:

#### Pbkdf2Password4jPasswordEncoder - Java

```java
PasswordEncoder encoder = new Pbkdf2Password4jPasswordEncoder();
String result = encoder.encode("myPassword");
assertThat(encoder.matches("myPassword", result)).isTrue();
```

#### Pbkdf2Password4jPasswordEncoder - Kotlin

```kotlin
val encoder: PasswordEncoder = Pbkdf2Password4jPasswordEncoder()
val result = encoder.encode("myPassword")
Assertions.assertThat(encoder.matches("myPassword", result)).isTrue()
```

Create an encoder with custom PBKDF2 parameters:

#### Pbkdf2Password4jPasswordEncoder Custom - Java

```java
PBKDF2Function pbkdf2Fn = PBKDF2Function.getInstance(Hmac.SHA256, 100000, 256);
PasswordEncoder encoder = new Pbkdf2Password4jPasswordEncoder(pbkdf2Fn);
String result = encoder.encode("myPassword");
assertThat(encoder.matches("myPassword", result)).isTrue();
```

#### Pbkdf2Password4jPasswordEncoder Custom - Kotlin

```kotlin
val pbkdf2Fn = PBKDF2Function.getInstance(Hmac.SHA256, 100000, 256)
val encoder: PasswordEncoder = Pbkdf2Password4jPasswordEncoder(pbkdf2Fn)
val result = encoder.encode("myPassword")
Assertions.assertThat(encoder.matches("myPassword", result)).isTrue()
```

<a id="password4j-ballooning"></a>

### BalloonHashingPassword4jPasswordEncoder

The `BalloonHashingPassword4jPasswordEncoder` implementation uses the Balloon hashing algorithm via the Password4j library to hash passwords.
Balloon hashing is a memory-hard password hashing algorithm designed to be resistant to both time-memory trade-off attacks and side-channel attacks.

This implementation handles salt management explicitly since Password4j’s Balloon hashing implementation does not include the salt in the output hash.
The encoded password format is: `{salt}:{hash}` where both salt and hash are Base64 encoded.

Create an encoder with default settings:

#### BalloonHashingPassword4jPasswordEncoder - Java

```java
PasswordEncoder encoder = new BalloonHashingPassword4jPasswordEncoder();
String result = encoder.encode("myPassword");
assertThat(encoder.matches("myPassword", result)).isTrue();
```

#### BalloonHashingPassword4jPasswordEncoder - Kotlin

```kotlin
val encoder: PasswordEncoder = BalloonHashingPassword4jPasswordEncoder()
val result = encoder.encode("myPassword")
Assertions.assertThat(encoder.matches("myPassword", result)).isTrue()
```

Create an encoder with custom parameters:

#### BalloonHashingPassword4jPasswordEncoder Custom - Java

```java
BalloonHashingFunction ballooningHashingFn =
	BalloonHashingFunction.getInstance("SHA-256", 1024, 3, 4, 3);
PasswordEncoder encoder = new BalloonHashingPassword4jPasswordEncoder(ballooningHashingFn);
String result = encoder.encode("myPassword");
assertThat(encoder.matches("myPassword", result)).isTrue();
```

#### BalloonHashingPassword4jPasswordEncoder Custom - Kotlin

```kotlin
val ballooningHashingFn =
    BalloonHashingFunction.getInstance("SHA-256", 1024, 3, 4, 3)
val encoder: PasswordEncoder = BalloonHashingPassword4jPasswordEncoder(ballooningHashingFn)
val result = encoder.encode("myPassword")
Assertions.assertThat(encoder.matches("myPassword", result)).isTrue()
```

<a id="authentication-password-storage-configuration"></a>

## Password Storage Configuration

Spring Security uses [DelegatingPasswordEncoder](#authentication-password-storage-dpe) by default.
However, you can customize this by exposing a `PasswordEncoder` as a Spring bean.

If you are migrating from Spring Security 4.2.x, you can revert to the previous behavior by exposing a `NoOpPasswordEncoder` bean.

> [!WARNING]
> Reverting to `NoOpPasswordEncoder` is not considered to be secure.
> You should instead migrate to using `DelegatingPasswordEncoder` to support secure password encoding.

#### Java

```java
@Bean
public static NoOpPasswordEncoder passwordEncoder() {
    return NoOpPasswordEncoder.getInstance();
}
```

#### XML

```xml
<b:bean id="passwordEncoder"
        class="org.springframework.security.crypto.password.NoOpPasswordEncoder" factory-method="getInstance"/>
```

#### Kotlin

```kotlin
@Bean
fun passwordEncoder(): PasswordEncoder {
    return NoOpPasswordEncoder.getInstance();
}
```

> [!NOTE]
> XML Configuration requires the `NoOpPasswordEncoder` bean name to be `passwordEncoder`.

<a id="authentication-change-password-configuration"></a>

## Change Password Configuration

Most applications that allow a user to specify a password also require a feature for updating that password.

[A Well-Known URL for Changing Passwords](https://w3c.github.io/webappsec-change-password-url/) indicates a mechanism by which password managers can discover the password update endpoint for a given application.

You can configure Spring Security to provide this discovery endpoint.
For example, if the change password endpoint in your application is `/change-password`, then you can configure Spring Security like so:

#### Java

```java
http
    .passwordManagement(Customizer.withDefaults())
```

#### XML

```xml
<sec:password-management/>
```

#### Kotlin

```kotlin
http {
    passwordManagement { }
}
```

Then, when a password manager navigates to `/.well-known/change-password` then Spring Security will redirect your endpoint, `/change-password`.

Or, if your endpoint is something other than `/change-password`, you can also specify that like so:

#### Java

```java
http
    .passwordManagement((management) -> management
        .changePasswordPage("/update-password")
    )
```

#### XML

```xml
<sec:password-management change-password-page="/update-password"/>
```

#### Kotlin

```kotlin
http {
    passwordManagement {
        changePasswordPage = "/update-password"
    }
}
```

With the above configuration, when a password manager navigates to `/.well-known/change-password`, then Spring Security will redirect to `/update-password`.

<a id="authentication-compromised-password-check"></a>

## Compromised Password Checking

There are some scenarios where you need to check whether a password has been compromised, for example, if you are creating an application that deals with sensitive data, it is often needed that you perform some check on user’s passwords in order to assert its reliability.
One of these checks can be if the password has been compromised, usually because it has been found in a [data breach](https://wikipedia.org/wiki/Data_breach).

To facilitate that, Spring Security provides integration with the [Have I Been Pwned API](https://haveibeenpwned.com/API/v3#PwnedPasswords) via the [`HaveIBeenPwnedRestApiPasswordChecker`](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/web/authentication/password/HaveIBeenPwnedRestApiPasswordChecker.html) implementation of the [`CompromisedPasswordChecker`](https://docs.spring.io/spring-security/site/docs/7.0.1/api/org/springframework/security/authentication/password/CompromisedPasswordChecker.html) interface.

You can either use the `CompromisedPasswordChecker` API by yourself or, if you are using [the `DaoAuthenticationProvider`](../../servlet/authentication/passwords/dao-authentication-provider.md) via [Spring Security authentication mechanisms](../../servlet/authentication/passwords/index.md), you can provide a `CompromisedPasswordChecker` bean, and it will be automatically picked up by Spring Security configuration.

By doing that, when you try to authenticate via Form Login using a weak password, let’s say `123456`, you will receive a 401 or be redirected to the `/login?error` page (depending on your user-agent).
However, just a 401 or the redirect is not so useful in that case, it will cause some confusion because the user provided the right password and still was not allowed to log in.
In such cases, you can handle the `CompromisedPasswordException` via the `AuthenticationFailureHandler` to perform your desired logic, like redirecting the user-agent to `/reset-password`, for example:

#### Using CompromisedPasswordChecker - Java

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	http
		.authorizeHttpRequests(authorize -> authorize
			.anyRequest().authenticated()
		)
		.formLogin((login) -> login
			.failureHandler(new CompromisedPasswordAuthenticationFailureHandler())
		);
	return http.build();
}

@Bean
public CompromisedPasswordChecker compromisedPasswordChecker() {
	return new HaveIBeenPwnedRestApiPasswordChecker();
}

static class CompromisedPasswordAuthenticationFailureHandler implements AuthenticationFailureHandler {

	private final SimpleUrlAuthenticationFailureHandler defaultFailureHandler = new SimpleUrlAuthenticationFailureHandler(
			"/login?error");

	private final RedirectStrategy redirectStrategy = new DefaultRedirectStrategy();

	@Override
	public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
			AuthenticationException exception) throws IOException, ServletException {
		if (exception instanceof CompromisedPasswordException) {
			this.redirectStrategy.sendRedirect(request, response, "/reset-password");
			return;
		}
		this.defaultFailureHandler.onAuthenticationFailure(request, response, exception);
	}

}
```

#### Using CompromisedPasswordChecker - Kotlin

```kotlin
@Bean
open fun filterChain(http: HttpSecurity): SecurityFilterChain {
    http {
        authorizeHttpRequests {
            authorize(anyRequest, authenticated)
        }
        formLogin {
            authenticationFailureHandler = CompromisedPasswordAuthenticationFailureHandler()
        }
    }
    return http.build()
}

@Bean
open fun compromisedPasswordChecker(): CompromisedPasswordChecker {
    return HaveIBeenPwnedRestApiPasswordChecker()
}

class CompromisedPasswordAuthenticationFailureHandler : AuthenticationFailureHandler {
    private val defaultFailureHandler = SimpleUrlAuthenticationFailureHandler("/login?error")
    private val redirectStrategy = DefaultRedirectStrategy()

    override fun onAuthenticationFailure(
        request: HttpServletRequest,
        response: HttpServletResponse,
        exception: AuthenticationException
    ) {
        if (exception is CompromisedPasswordException) {
            redirectStrategy.sendRedirect(request, response, "/reset-password")
            return
        }
        defaultFailureHandler.onAuthenticationFailure(request, response, exception)
    }
}
```
