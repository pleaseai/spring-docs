---
title: "Couchbase Field Level Encryption"
source: "ROOT:couchbase/fieldlevelencryption.adoc"
---

<a id="couchbase.fieldlevelencryption"></a>

# Couchbase Field Level Encryption

Couchbase supports [Field Level Encryption](https://docs.couchbase.com/java-sdk/current/howtos/encrypting-using-sdk.html). This section documents how to use it with Spring Data Couchbase.

<a id="requirements"></a>

## Requirements

- Spring Data Couchbase 5.0.0-RC1 or above.

<a id="overview"></a>

## Overview

Fields annotated with com.couchbase.client.java.encryption.annotation.Encrypted (@Encrypted) will be automatically encrypted on write and decrypted on read. Unencrypted fields can be migrated to encrypted by specifying @Encrypted(migration = Encrypted.Migration.FROM\_UNENCRYPTED).

<a id="getting-started-configuration"></a>

## Getting Started & Configuration

<a id="dependencies"></a>

### Dependencies

Field Level Encryption is available with the dependency ( see [Field Level Encryption](https://docs.couchbase.com/java-sdk/current/howtos/encrypting-using-sdk.html) )

```
    <groupId>com.couchbase.client</groupId>
    <artifactId>couchbase-encryption</artifactId>
```

HashiCorp Vault Transit integration requires [Spring Vault](https://docs.spring.io/spring-vault/docs/current/reference/html)

```
    <groupId>org.springframework.vault</groupId>
    <artifactId>spring-vault-core</artifactId>
```

<a id="providing-a-cryptomanager"></a>

### Providing a CryptoManager

A CryptoManager needs to be provided by overriding the cryptoManager() method in AbstractCouchbaseConfiguration. This CryptoManager will be used by Spring Data Couchbase and also by Couchbase Java SDK direct calls made from a CouchbaseClientFactory.

```
@Override
protected CryptoManager cryptoManager() {
  KeyStore javaKeyStore = KeyStore.getInstance("MyKeyStoreType");
  FileInputStream fis = new java.io.FileInputStream("keyStoreName");
  char[] password = { 'a', 'b', 'c' };
  javaKeyStore.load(fis, password);
  Keyring keyring = new KeyStoreKeyring(javaKeyStore, keyName -> "swordfish");

  // AES-256 authenticated with HMAC SHA-512. Requires a 64-byte key.
  AeadAes256CbcHmacSha512Provider provider = AeadAes256CbcHmacSha512Provider.builder().keyring(keyring).build();

  CryptoManager cryptoManager = DefaultCryptoManager.builder().decrypter(provider.decrypter())
    .defaultEncrypter(provider.encrypterForKey("myKey")).build();
  return cryptoManager;
}
```

<a id="defining-a-field-as-encrypted-"></a>

### Defining a Field as Encrypted.

1. @Encrypted defines a field as encrypted.
1. @Encrypted(migration = Encrypted.Migration.FROM\_UNENCRYPTED) defines a field that may or may not be encrypted when read. It will be encrypted when written.
1. @Encrypted(encrypter = "<encrypterAlias>") specifies the alias of the encrypter to use for encryption. Note this is not the algorithm, but the name specified when adding the encrypter to the CryptoManager.

<a id="example"></a>

### Example

```java
@Configuration
@EnableCouchbaseRepositories("<parent-dir-of-repository-interfaces>")
@EnableReactiveCouchbaseRepositories("<parent-dir-of-repository-interfaces>")
static class Config extends AbstractCouchbaseConfiguration {

  // Usual Setup
  @Override public String getConnectionString() { /* ... */ }
  @Override public String getUserName() { /* ... */ }
  @Override public String getPassword() { /* ... */ }
  @Override public String getBucketName() { /* ... */ }

  /* provide a cryptoManager */
  @Override
  protected CryptoManager cryptoManager() {
    KeyStore javaKeyStore = KeyStore.getInstance("MyKeyStoreType");
    FileInputStream fis = new java.io.FileInputStream("keyStoreName");
    char[] password = { 'a', 'b', 'c' };
    javaKeyStore.load(fis, password);
    Keyring keyring = new KeyStoreKeyring(javaKeyStore, keyName -> "swordfish");

    // AES-256 authenticated with HMAC SHA-512. Requires a 64-byte key.
    AeadAes256CbcHmacSha512Provider provider = AeadAes256CbcHmacSha512Provider.builder().keyring(keyring).build();

    CryptoManager cryptoManager = DefaultCryptoManager.builder().decrypter(provider.decrypter())
      .defaultEncrypter(provider.encrypterForKey("myKey")).build();
    return cryptoManager;
  }

}
```

```java
@Document
public class AddressWithEncStreet extends Address {

    private @Encrypted String encStreet;
    .
    .
```

```java
AddressWithEncStreet address = new AddressWithEncStreet(); // plaintext address with encrypted street
address.setCity("Santa Clara");
address.setEncStreet("Olcott Street");
addressEncryptedRepository.save(address);
```

```json
{
  "_class": "AddressWithEncStreet",
   "city": "Santa Clara",
   "encrypted$encStreet": {
     "alg": "AEAD_AES_256_CBC_HMAC_SHA512",
     "ciphertext": "A/tJALmtixTxqj77ZUcUgMklIt3372DKD7l5FvbCzHNJMplbgQEv0RgSbxIfiRNr+uW2H7cokkcCW/F5YnQoXA==",
     "kid": "myKey"
   }
}
```
