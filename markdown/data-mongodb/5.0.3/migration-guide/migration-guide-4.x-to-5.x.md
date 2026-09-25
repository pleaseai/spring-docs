---
title: "Migration Guide from 4.x to 5.x"
source: "ROOT:migration-guide/migration-guide-4.x-to-5.x.adoc"
---

<a id="mongodb.migration.4.x-5.x"></a>

# Migration Guide from 4.x to 5.x

Spring Data MongoDB 5.x requires the MongoDB Java Driver 5.6+

To learn more about driver versions please visit the [MongoDB Documentation](https://www.mongodb.com/docs/drivers/java/sync/current/upgrade/).

<a id="_mongodb_java_driver_4_x_driver_compatibility_removed"></a>

## MongoDB Java Driver 4.x Driver Compatibility Removed

Spring Data MongoDB does no longer support the 4.x MongoDB Java Driver generation.

<a id="_uuid_representation_changes"></a>

## UUID Representation Changes

Spring Data no longer defaults UUID settings via its configuration support classes, factory beans, nor XML namespace.

In order to persist UUID values the `UuidRepresentation` hast to be set explicitly.

#### Java

```java
@Configuration
static class Config extends AbstractMongoClientConfiguration {

	@Override
	protected void configureClientSettings(MongoClientSettings.Builder builder) {
		builder.uuidRepresentation(UuidRepresentation.STANDARD);
	}

    // ...
}
```

#### XML

```xml
<mongo:mongo-client>
	<mongo:client-settings uuid-representation="STANDARD"/>
</mongo:mongo-client>
```

<a id="_bigintegerbigdecimal_conversion_changes"></a>

## BigInteger/BigDecimal Conversion Changes

Spring Data no longer defaults BigInteger/BigDecimal conversion via its configuration support classes.
In order to persist those values the default `BigDecimalRepresentation` hast to be set explicitly.

```java
@Configuration
static class Config extends AbstractMongoClientConfiguration {

	@Override
	protected void configureConverters(MongoConverterConfigurationAdapter configAdapter) {
		configAdapter.bigDecimal(BigDecimalRepresentation.DECIMAL128);
	}

    // ...
}
```

Users upgrading from prior versions may choose `BigDecimalRepresentation.STRING` as default to retain previous behaviour.

<a id="_defaultmessagelistenercontainer_auto_startup"></a>

## DefaultMessageListenerContainer auto startup

The `DefaultMessageListenerContainer` that can be used to listen to e.g. *Change Streams* now defaults its `SmartLifecycle` auto startup to `true`.

<a id="_jmx_support_discontinued"></a>

## JMX Support Discontinued.

We recommend switching to Spring Boot [Actuator Endpoints](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html).
