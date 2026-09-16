---
title: "Spring and Spring Security Kerberos"
source: "ROOT:servlet/authentication/kerberos/ssk.adoc"
---

<a id="springsecuritykerberos"></a>

# Spring and Spring Security Kerberos

This part of the reference documentation explains the core functionality
that Spring Security Kerberos provides to any Spring based application.

[Authentication Provider](#ssk-authprovider) describes the authentication provider support.

[Spnego Negotiate](#ssk-spnego) describes the spnego negotiate support.

[Using KerberosRestTemplate](#ssk-resttemplate) describes the RestTemplate support.

<a id="ssk-authprovider"></a>

## Authentication Provider

Provider configuration using JavaConfig.

```java
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

	@Value("${app.service-principal}")
	private String servicePrincipal;

	@Value("${app.keytab-location}")
	private String keytabLocation;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		KerberosAuthenticationProvider kerberosAuthenticationProvider = kerberosAuthenticationProvider();
		KerberosServiceAuthenticationProvider kerberosServiceAuthenticationProvider = kerberosServiceAuthenticationProvider();
		ProviderManager providerManager = new ProviderManager(kerberosAuthenticationProvider,
				kerberosServiceAuthenticationProvider);

		http
			.authorizeHttpRequests((authz) -> authz
				.requestMatchers("/", "/home").permitAll()
				.anyRequest().authenticated()
			)
			.exceptionHandling()
				.authenticationEntryPoint(spnegoEntryPoint())
				.and()
			.formLogin()
				.loginPage("/login").permitAll()
				.and()
			.logout()
				.permitAll()
				.and()
			.authenticationProvider(kerberosAuthenticationProvider())
			.authenticationProvider(kerberosServiceAuthenticationProvider())
			.addFilterBefore(spnegoAuthenticationProcessingFilter(providerManager),
					BasicAuthenticationFilter.class);
			return http.build();
	}

	@Bean
	public KerberosAuthenticationProvider kerberosAuthenticationProvider() {
		KerberosAuthenticationProvider provider = new KerberosAuthenticationProvider();
		SunJaasKerberosClient client = new SunJaasKerberosClient();
		client.setDebug(true);
		provider.setKerberosClient(client);
		provider.setUserDetailsService(dummyUserDetailsService());
		return provider;
	}

	@Bean
	public SpnegoEntryPoint spnegoEntryPoint() {
		return new SpnegoEntryPoint("/login");
	}

	public SpnegoAuthenticationProcessingFilter spnegoAuthenticationProcessingFilter(
			AuthenticationManager authenticationManager) {
		SpnegoAuthenticationProcessingFilter filter = new SpnegoAuthenticationProcessingFilter();
		filter.setAuthenticationManager(authenticationManager);
		return filter;
	}

	@Bean
	public KerberosServiceAuthenticationProvider kerberosServiceAuthenticationProvider() {
		KerberosServiceAuthenticationProvider provider = new KerberosServiceAuthenticationProvider();
		provider.setTicketValidator(sunJaasKerberosTicketValidator());
		provider.setUserDetailsService(dummyUserDetailsService());
		return provider;
	}

	@Bean
	public SunJaasKerberosTicketValidator sunJaasKerberosTicketValidator() {
		SunJaasKerberosTicketValidator ticketValidator = new SunJaasKerberosTicketValidator();
		ticketValidator.setServicePrincipal(servicePrincipal);
		ticketValidator.setKeyTabLocation(new FileSystemResource(keytabLocation));
		ticketValidator.setDebug(true);
		return ticketValidator;
	}

	@Bean
	public DummyUserDetailsService dummyUserDetailsService() {
		return new DummyUserDetailsService();
	}
}
```

<a id="ssk-spnego"></a>

## Spnego Negotiate

Spnego configuration using JavaConfig.

```java
@Configuration
@EnableWebSecurity
public class WebSecurityConfig {

	@Value("${app.ad-domain}")
	private String adDomain;

	@Value("${app.ad-server}")
	private String adServer;

	@Value("${app.service-principal}")
	private String servicePrincipal;

	@Value("${app.keytab-location}")
	private String keytabLocation;

	@Value("${app.ldap-search-base}")
	private String ldapSearchBase;

	@Value("${app.ldap-search-filter}")
	private String ldapSearchFilter;

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		KerberosServiceAuthenticationProvider kerberosServiceAuthenticationProvider = kerberosServiceAuthenticationProvider();
		ActiveDirectoryLdapAuthenticationProvider activeDirectoryLdapAuthenticationProvider = activeDirectoryLdapAuthenticationProvider();
		ProviderManager providerManager = new ProviderManager(kerberosServiceAuthenticationProvider,
				activeDirectoryLdapAuthenticationProvider);

		http
			.authorizeHttpRequests((authz) -> authz
				.requestMatchers("/", "/home").permitAll()
				.anyRequest().authenticated()
			)
			.exceptionHandling()
				.authenticationEntryPoint(spnegoEntryPoint())
				.and()
			.formLogin()
				.loginPage("/login").permitAll()
				.and()
			.logout()
				.permitAll()
				.and()
			.authenticationProvider(activeDirectoryLdapAuthenticationProvider())
			.authenticationProvider(kerberosServiceAuthenticationProvider())
			.addFilterBefore(spnegoAuthenticationProcessingFilter(providerManager),
				BasicAuthenticationFilter.class);

		return http.build();
	}

	@Bean
	public ActiveDirectoryLdapAuthenticationProvider activeDirectoryLdapAuthenticationProvider() {
		return new ActiveDirectoryLdapAuthenticationProvider(adDomain, adServer);
	}

	@Bean
	public SpnegoEntryPoint spnegoEntryPoint() {
		return new SpnegoEntryPoint("/login");
	}

	public SpnegoAuthenticationProcessingFilter spnegoAuthenticationProcessingFilter(
			AuthenticationManager authenticationManager) {
		SpnegoAuthenticationProcessingFilter filter = new SpnegoAuthenticationProcessingFilter();
		filter.setAuthenticationManager(authenticationManager);
		return filter;
	}

	public KerberosServiceAuthenticationProvider kerberosServiceAuthenticationProvider() throws Exception {
		KerberosServiceAuthenticationProvider provider = new KerberosServiceAuthenticationProvider();
		provider.setTicketValidator(sunJaasKerberosTicketValidator());
		provider.setUserDetailsService(ldapUserDetailsService());
		return provider;
	}

	@Bean
	public SunJaasKerberosTicketValidator sunJaasKerberosTicketValidator() {
		SunJaasKerberosTicketValidator ticketValidator = new SunJaasKerberosTicketValidator();
		ticketValidator.setServicePrincipal(servicePrincipal);
		ticketValidator.setKeyTabLocation(new FileSystemResource(keytabLocation));
		ticketValidator.setDebug(true);
		return ticketValidator;
	}

	@Bean
	public KerberosLdapContextSource kerberosLdapContextSource() throws Exception {
		KerberosLdapContextSource contextSource = new KerberosLdapContextSource(adServer);
		contextSource.setLoginConfig(loginConfig());
		return contextSource;
	}

	public SunJaasKrb5LoginConfig loginConfig() throws Exception {
		SunJaasKrb5LoginConfig loginConfig = new SunJaasKrb5LoginConfig();
		loginConfig.setKeyTabLocation(new FileSystemResource(keytabLocation));
		loginConfig.setServicePrincipal(servicePrincipal);
		loginConfig.setDebug(true);
		loginConfig.setIsInitiator(true);
		loginConfig.afterPropertiesSet();
		return loginConfig;
	}

	@Bean
	public LdapUserDetailsService ldapUserDetailsService() throws Exception {
		FilterBasedLdapUserSearch userSearch =
				new FilterBasedLdapUserSearch(ldapSearchBase, ldapSearchFilter, kerberosLdapContextSource());
		LdapUserDetailsService service =
				new LdapUserDetailsService(userSearch, new ActiveDirectoryLdapAuthoritiesPopulator());
		service.setUserDetailsMapper(new LdapUserDetailsMapper());
		return service;
	}
}
```

<a id="ssk-resttemplate"></a>

## Using KerberosRestTemplate

If there is a need to access Kerberos protected web resources
programmatically we have `KerberosRestTemplate` which extends
`RestTemplate` and does necessary login actions prior to delegating to
actual RestTemplate methods. You basically have few options to
configure this template.

- Leave keyTabLocation and userPrincipal empty if you want to
use cached ticket.
- Use keyTabLocation and userPrincipal if you want to use
keytab file.
- Use loginOptions if you want to customise Krb5LoginModule options.
- Use a customised httpClient.

With ticket cache.

```java
public void doWithTicketCache() {
    KerberosRestTemplate restTemplate =
            new KerberosRestTemplate();
    restTemplate.getForObject("http://neo.example.org:8080/hello", String.class);
}
```

With keytab file.

```java
public void doWithKeytabFile() {
    KerberosRestTemplate restTemplate =
            new KerberosRestTemplate("/tmp/user2.keytab", "user2@EXAMPLE.ORG");
    restTemplate.getForObject("http://neo.example.org:8080/hello", String.class);
}
```

<a id="ssk-kerberosldap"></a>

## Authentication with LDAP Services

With most of your samples we’re using `DummyUserDetailsService`
because there is not necessarily need to query a real user details
once kerberos authentication is successful and we can use kerberos
principal info to create that dummy user. However there is a way to
access kerberized LDAP services in a say way and query user details
from there.

`KerberosLdapContextSource` can be used to bind into LDAP via kerberos
which is at least proven to work well with Windows AD services.

```java
@Value("${app.ad-server}")
private String adServer;

@Value("${app.service-principal}")
private String servicePrincipal;

@Value("${app.keytab-location}")
private String keytabLocation;

@Value("${app.ldap-search-base}")
private String ldapSearchBase;

@Value("${app.ldap-search-filter}")
private String ldapSearchFilter;

@Bean
public KerberosLdapContextSource kerberosLdapContextSource() {
	KerberosLdapContextSource contextSource = new KerberosLdapContextSource(adServer);
	SunJaasKrb5LoginConfig loginConfig = new SunJaasKrb5LoginConfig();
	loginConfig.setKeyTabLocation(new FileSystemResource(keytabLocation));
	loginConfig.setServicePrincipal(servicePrincipal);
	loginConfig.setDebug(true);
	loginConfig.setIsInitiator(true);
	contextSource.setLoginConfig(loginConfig);
	return contextSource;
}

@Bean
public LdapUserDetailsService ldapUserDetailsService() {
	FilterBasedLdapUserSearch userSearch =
			new FilterBasedLdapUserSearch(ldapSearchBase, ldapSearchFilter, kerberosLdapContextSource());
	LdapUserDetailsService service = new LdapUserDetailsService(userSearch);
	service.setUserDetailsMapper(new LdapUserDetailsMapper());
	return service;
}
```

> [!TIP]
> Sample [Security Server Windows Auth Sample](samples.md#samples-sec-server-win-auth)
> is currently configured to query user details from AD if authentication happen via kerberos.
