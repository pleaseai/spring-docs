---
title: "Spring Security Crypto Module"
source: "ROOT:features/integrations/cryptography.adoc"
---

<a id="crypto"></a>

# Spring Security Crypto Module

<a id="spring-security-crypto-introduction"></a>

The Spring Security Crypto module provides support for symmetric encryption, key generation, and password encoding.
The code is distributed as part of the core module but has no dependencies on any other Spring Security (or Spring) code.

<a id="spring-security-crypto-encryption"></a>

## Encryptors

The [`Encryptors`](https://docs.spring.io/spring-security/site/docs/6.3.8/api/org/springframework/security/crypto/encrypt/Encryptors.html) class provides factory methods for constructing symmetric encryptors.
This class lets you create [`BytesEncryptor`](https://docs.spring.io/spring-security/site/docs/6.3.8/api/org/springframework/security/crypto/encrypt/BytesEncryptor.html) instances to encrypt data in raw `byte[]` form.
You can also construct [TextEncryptor](https://docs.spring.io/spring-security/site/docs/6.3.8/api/org/springframework/security/crypto/encrypt/TextEncryptor.html) instances to encrypt text strings.
Encryptors are thread-safe.

> [!NOTE]
> Both `BytesEncryptor` and `TextEncryptor` are interfaces. `BytesEncryptor` has multiple implementations.

<a id="spring-security-crypto-encryption-bytes"></a>

### BytesEncryptor

You can use the `Encryptors.stronger` factory method to construct a `BytesEncryptor`:

#### Java

```java
Encryptors.stronger("password", "salt");
```

#### Kotlin

```kotlin
Encryptors.stronger("password", "salt")
```

The `stronger` encryption method creates an encryptor by using 256-bit AES encryption with
Galois Counter Mode (GCM).
It derives the secret key by using PKCS #5’s PBKDF2 (Password-Based Key Derivation Function #2).
This method requires Java 6.
The password used to generate the `SecretKey` should be kept in a secure place and should not be shared.
The salt is used to prevent dictionary attacks against the key in the event that your encrypted data is compromised.
A 16-byte random initialization vector is also applied so that each encrypted message is unique.

The provided salt should be in hex-encoded String form, be random, and be at least 8 bytes in length.
You can generate such a salt by using a `KeyGenerator`:

#### Java

```java
String salt = KeyGenerators.string().generateKey(); // generates a random 8-byte salt that is then hex-encoded
```

#### Kotlin

```kotlin
val salt = KeyGenerators.string().generateKey() // generates a random 8-byte salt that is then hex-encoded
```

You can also use the `standard` encryption method, which is 256-bit AES in Cipher Block Chaining (CBC) Mode.
This mode is not [authenticated](https://en.wikipedia.org/wiki/Authenticated_encryption) and does not provide any
guarantees about the authenticity of the data.
For a more secure alternative, use `Encryptors.stronger`.

<a id="spring-security-crypto-encryption-text"></a>

### TextEncryptor

You can use the `Encryptors.text` factory method to construct a standard TextEncryptor:

#### Java

```java
Encryptors.text("password", "salt");
```

#### Kotlin

```kotlin
Encryptors.text("password", "salt")
```

A `TextEncryptor` uses a standard `BytesEncryptor` to encrypt text data.
Encrypted results are returned as hex-encoded strings for easy storage on the filesystem or in a database.

<a id="spring-security-crypto-keygenerators"></a>

## Key Generators

The [`KeyGenerators`](https://docs.spring.io/spring-security/site/docs/6.3.8/api/org/springframework/security/crypto/keygen/KeyGenerators.html) class provides a number of convenience factory methods for constructing different types of key generators.
By using this class, you can create a [`BytesKeyGenerator`](https://docs.spring.io/spring-security/site/docs/6.3.8/api/org/springframework/security/crypto/keygen/BytesKeyGenerator.html) to generate `byte[]` keys.
You can also construct a [StringKeyGenerator](https://docs.spring.io/spring-security/site/docs/6.3.8/api/org/springframework/security/crypto/keygen/StringKeyGenerator.html`)` to generate string keys.
`KeyGenerators` is a thread-safe class.

<a id="_byteskeygenerator"></a>

### BytesKeyGenerator

You can use the `KeyGenerators.secureRandom` factory methods to generate a `BytesKeyGenerator` backed by a `SecureRandom` instance:

#### Java

```java
BytesKeyGenerator generator = KeyGenerators.secureRandom();
byte[] key = generator.generateKey();
```

#### Kotlin

```kotlin
val generator = KeyGenerators.secureRandom()
val key = generator.generateKey()
```

The default key length is 8 bytes.
A `KeyGenerators.secureRandom` variant provides control over the key length:

#### Java

```java
KeyGenerators.secureRandom(16);
```

#### Kotlin

```kotlin
KeyGenerators.secureRandom(16)
```

Use the `KeyGenerators.shared` factory method to construct a BytesKeyGenerator that always returns the same key on every invocation:

#### Java

```java
KeyGenerators.shared(16);
```

#### Kotlin

```kotlin
KeyGenerators.shared(16)
```

<a id="_stringkeygenerator"></a>

### StringKeyGenerator

You can use the `KeyGenerators.string` factory method to construct an 8-byte, `SecureRandom` `KeyGenerator` that hex-encodes each key as a `String`:

#### Java

```java
KeyGenerators.string();
```

#### Kotlin

```kotlin
KeyGenerators.string()
```

<a id="spring-security-crypto-passwordencoders"></a>

## Password Encoding

The password package of the `spring-security-crypto` module provides support for encoding passwords.
`PasswordEncoder` is the central service interface and has the following signature:

```java
public interface PasswordEncoder {
	String encode(CharSequence rawPassword);

	boolean matches(CharSequence rawPassword, String encodedPassword);

	default boolean upgradeEncoding(String encodedPassword) {
		return false;
	}
}
```

The `matches` method returns true if the `rawPassword`, once encoded, equals the `encodedPassword`.
This method is designed to support password-based authentication schemes.

The `BCryptPasswordEncoder` implementation uses the widely supported “bcrypt” algorithm to hash the passwords.
Bcrypt uses a random 16-byte salt value and is a deliberately slow algorithm, to hinder password crackers.
You can tune the amount of work it does by using the `strength` parameter, which takes a value from 4 to 31.
The higher the value, the more work has to be done to calculate the hash.
The default value is `10`.
You can change this value in your deployed system without affecting existing passwords, as the value is also stored in the encoded hash.
The following example uses the `BCryptPasswordEncoder`:

#### Java

```java
// Create an encoder with strength 16
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(16);
String result = encoder.encode("myPassword");
assertTrue(encoder.matches("myPassword", result));
```

#### Kotlin

```kotlin
// Create an encoder with strength 16
val encoder = BCryptPasswordEncoder(16)
val result: String = encoder.encode("myPassword")
assertTrue(encoder.matches("myPassword", result))
```

The `Pbkdf2PasswordEncoder` implementation uses PBKDF2 algorithm to hash the passwords.
To defeat password cracking, PBKDF2 is a deliberately slow algorithm and should be tuned to take about .5 seconds to verify a password on your system.
The following system uses the `Pbkdf2PasswordEncoder`:

#### Java

```java
// Create an encoder with all the defaults
Pbkdf2PasswordEncoder encoder = Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8();
String result = encoder.encode("myPassword");
assertTrue(encoder.matches("myPassword", result));
```

#### Kotlin

```kotlin
// Create an encoder with all the defaults
val encoder = Pbkdf2PasswordEncoder.defaultsForSpringSecurity_v5_8()
val result: String = encoder.encode("myPassword")
assertTrue(encoder.matches("myPassword", result))
```
