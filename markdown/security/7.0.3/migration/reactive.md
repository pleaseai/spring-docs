---
title: "Reactive"
source: "ROOT:migration/reactive.adoc"
---

# Reactive

If you have already performed the [initial migration steps](index.md) for your Reactive application, you’re now ready to perform steps specific to Reactive applications.

<a id="_validate_typ_header_with_jwttypevalidator"></a>

## Validate `typ` Header with `JwtTypeValidator`

If when following the 6.5 preparatory steps you set `validateTypes` to `false`, you can now remove it.
You can also remove explicitly adding `JwtTypeValidator` to the list of defaults.

For example, change this:

#### Java

```java
@Bean
JwtDecoder jwtDecoder() {
	NimbusReactiveJwtDecoder jwtDecoder = NimbusReactiveJwtDecoder.withIssuerLocation(location)
        .validateTypes(false) <1>
        // ... your remaining configuration
        .build();
	jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithValidators(
		new JwtIssuerValidator(location), JwtTypeValidator.jwt())); <2>
	return jwtDecoder;
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): JwtDecoder {
    val jwtDecoder = NimbusReactiveJwtDecoder.withIssuerLocation(location)
        .validateTypes(false) <1>
        // ... your remaining configuration
        .build()
    jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithValidators(
        JwtIssuerValidator(location), JwtTypeValidator.jwt())) <2>
    return jwtDecoder
}
```

1. - Switch off Nimbus verifying the `typ`
1. - Add the default `typ` validator

to this:

#### Java

```java
@Bean
NimbusReactiveJwtDecoder jwtDecoder() {
	NimbusJwtDecoder jwtDecoder = NimbusReactiveJwtDecoder.withIssuerLocation(location)
        // ... your remaining configuration <1>
        .build();
	jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(location)); <2>
	return jwtDecoder;
}
```

#### Kotlin

```kotlin
@Bean
fun jwtDecoder(): NimbusReactiveJwtDecoder {
    val jwtDecoder = NimbusReactiveJwtDecoder.withIssuerLocation(location)
        // ... your remaining configuration
        .build()
    jwtDecoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(location)) <2>
    return jwtDecoder
}
```

1. - `validateTypes` now defaults to `false`
1. - `JwtTypeValidator#jwt` is added by all `createDefaultXXX` methods
