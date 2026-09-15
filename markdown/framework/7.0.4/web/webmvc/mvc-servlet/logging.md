---
title: "Logging"
source: "ROOT:web/webmvc/mvc-servlet/logging.adoc"
---

<a id="mvc-logging"></a>

# Logging

[See equivalent in the Reactive stack](../../webflux/reactive-spring.md#webflux-logging)

DEBUG-level logging in Spring MVC is designed to be compact, minimal, and
human-friendly. It focuses on high-value bits of information that are useful over and
over again versus others that are useful only when debugging a specific issue.

TRACE-level logging generally follows the same principles as DEBUG (and, for example, also
should not be a fire hose) but can be used for debugging any issue. In addition, some log
messages may show a different level of detail at TRACE versus DEBUG.

Good logging comes from the experience of using the logs. If you spot anything that does
not meet the stated goals, please let us know.

<a id="mvc-logging-sensitive-data"></a>

## Sensitive Data

[See equivalent in the Reactive stack](../../webflux/reactive-spring.md#webflux-logging-sensitive-data)

DEBUG and TRACE logging may log sensitive information. This is why request parameters and
headers are masked by default and their logging in full must be enabled explicitly
through the `enableLoggingRequestDetails` property on `DispatcherServlet`.

The following example shows how to do so by using Java configuration:

#### Java

```java
public class MyInitializer
		extends AbstractAnnotationConfigDispatcherServletInitializer {
	@Override
	protected Class<?>[] getRootConfigClasses() {
		...
	}

	@Override
	protected Class<?>[] getServletConfigClasses() {
		...
	}

	@Override
	protected String[] getServletMappings() {
		...
	}
	@Override
	protected void customizeRegistration(ServletRegistration.Dynamic registration) {
		registration.setInitParameter("enableLoggingRequestDetails", "true");
	}

}
```

#### Kotlin

```kotlin
class MyInitializer : AbstractAnnotationConfigDispatcherServletInitializer() {
	override fun getRootConfigClasses(): Array<Class<*>>? {
		...
	}

	override fun getServletConfigClasses(): Array<Class<*>>? {
		...
	}

	override fun getServletMappings(): Array<String> {
		...
	}
	override fun customizeRegistration(registration: ServletRegistration.Dynamic) {
		registration.setInitParameter("enableLoggingRequestDetails", "true")
	}
}
```
