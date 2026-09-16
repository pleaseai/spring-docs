---
title: "OAuth 2.0 Protected Resource Metadata"
source: "ROOT:servlet/oauth2/resource-server/protected-resource-metadata.adoc"
---

<a id="oauth2resourceserver-protected-resource-metadata"></a>

# OAuth 2.0 Protected Resource Metadata

`OAuth2ResourceServerConfigurer.ProtectedResourceMetadataConfigurer` provides the ability to customize the [OAuth 2.0 Protected Resource Metadata endpoint](https://www.rfc-editor.org/rfc/rfc9728.html#section-3).
It defines an extension point that lets you customize the [OAuth 2.0 Protected Resource Metadata response](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.2).

`OAuth2ResourceServerConfigurer.ProtectedResourceMetadataConfigurer` provides the following configuration option:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
	http
		.oauth2ResourceServer((resourceServer) ->
			resourceServer
				.protectedResourceMetadata(protectedResourceMetadata ->
                    protectedResourceMetadata
                        .protectedResourceMetadataCustomizer(protectedResourceMetadataCustomizer)   <1>
				)
		);

	return http.build();
}
```

1. `protectedResourceMetadataCustomizer()`: The `Consumer` providing access to the `OAuth2ProtectedResourceMetadata.Builder` allowing the ability to customize the claims of the Resource Server’s configuration.

`OAuth2ResourceServerConfigurer.ProtectedResourceMetadataConfigurer` configures the `OAuth2ProtectedResourceMetadataFilter` and registers it with the Resource Server `SecurityFilterChain` `@Bean`.
`OAuth2ProtectedResourceMetadataFilter` is the `Filter` that returns the [OAuth2ProtectedResourceMetadata response](https://www.rfc-editor.org/rfc/rfc9728.html#section-3.2).
