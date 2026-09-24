---
title: "Auto generating keys"
source: "ROOT:couchbase/autokeygeneration.adoc"
---

<a id="couchbase.autokeygeneration"></a>

# Auto generating keys

This chapter describes how couchbase document keys can be auto-generated using builtin mechanisms.
There are two types of auto-generation strategies supported.

- [Key generation using attributes](#couchbase.autokeygeneration.usingattributes)
- [Key generation using uuid](#couchbase.autokeygeneration.unique)

> [!NOTE]
> The maximum key length supported by couchbase is 250 bytes.

<a id="couchbase.autokeygeneration.configuration"></a>

## Configuration

Keys to be auto-generated should be annotated with `@GeneratedValue`.
The default strategy is `USE_ATTRIBUTES`.
Prefix and suffix for the key can be provided as part of the entity itself, these values are not persisted, they are only used for key generation.
The prefixes and suffixes are ordered using the `order` value.
The default order is `0`, multiple prefixes without order will overwrite the previous.
If a value for id is already available, auto-generation will be skipped.
The delimiter for concatenation can be provided using `delimiter`, the default delimiter is `.`.

```java
@Document
public class User {
     @Id @GeneratedValue(strategy = USE_ATTRIBUTES, delimiter = ".")
     private String id;
     @IdPrefix(order=0)
     private String userPrefix;
     @IdSuffix(order=0)
     private String userSuffix;
     ...
}
```

<a id="couchbase.autokeygeneration.usingattributes"></a>

## Key generation using attributes

It is a common practice to generate keys using a combination of the document attributes.
Key generation using attributes concatenates all the attribute values annotated with `IdAttribute`, based on the ordering provided similar to prefixes and suffixes.

```java
@Document
public class User {
     @Id @GeneratedValue(strategy = USE_ATTRIBUTES)
     private String id;
     @IdAttribute
     private String userid;
     ...
}
```

<a id="couchbase.autokeygeneration.unique"></a>

## Key generation using uuid

This auto-generation uses UUID random generator to generate document keys consuming 16 bytes of key space.
This mechanism is only recommended for test scaffolding.

```java
@Document
public class User {
     @Id @GeneratedValue(strategy = UNIQUE)
     private String id;
     ...
}
```
