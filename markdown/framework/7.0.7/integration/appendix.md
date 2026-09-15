---
title: "Appendix"
source: "ROOT:integration/appendix.adoc"
---

<a id="appendix"></a>

# Appendix

<a id="appendix.xsd-schemas"></a>

## XML Schemas

This part of the appendix lists XML schemas related to integration technologies.

<a id="appendix.xsd-schemas-jee"></a>

### The `jee` Schema

The `jee` elements deal with issues related to Jakarta EE (Enterprise Edition) configuration,
such as looking up a JNDI object and defining EJB references.

To use the elements in the `jee` schema, you need to have the following preamble at the top
of your Spring XML configuration file. The text in the following snippet references the
correct schema so that the elements in the `jee` namespace are available to you:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:jee="http://www.springframework.org/schema/jee"
	xsi:schemaLocation="
		http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/jee
		https://www.springframework.org/schema/jee/spring-jee.xsd">

	<!-- bean definitions here -->

</beans>
```

<a id="appendix.xsd-schemas-jee-jndi-lookup"></a>

#### <jee:jndi-lookup/> (simple)

The following example shows how to use JNDI to look up a data source without the `jee` schema:

```xml
<bean id="dataSource" class="org.springframework.jndi.JndiObjectFactoryBean">
	<property name="jndiName" value="jdbc/MyDataSource"/>
</bean>
<bean id="userDao" class="com.foo.JdbcUserDao">
	<!-- Spring will do the cast automatically (as usual) -->
	<property name="dataSource" ref="dataSource"/>
</bean>
```

The following example shows how to use JNDI to look up a data source with the `jee`
schema:

```xml
<jee:jndi-lookup id="dataSource" jndi-name="jdbc/MyDataSource"/>

<bean id="userDao" class="com.foo.JdbcUserDao">
	<!-- Spring will do the cast automatically (as usual) -->
	<property name="dataSource" ref="dataSource"/>
</bean>
```

<a id="appendix.xsd-schemas-jee-jndi-lookup-environment-single"></a>

#### `<jee:jndi-lookup/>` (with Single JNDI Environment Setting)

The following example shows how to use JNDI to look up an environment variable without
`jee`:

```xml
<bean id="simple" class="org.springframework.jndi.JndiObjectFactoryBean">
	<property name="jndiName" value="jdbc/MyDataSource"/>
	<property name="jndiEnvironment">
		<props>
			<prop key="ping">pong</prop>
		</props>
	</property>
</bean>
```

The following example shows how to use JNDI to look up an environment variable with `jee`:

```xml
<jee:jndi-lookup id="simple" jndi-name="jdbc/MyDataSource">
	<jee:environment>ping=pong</jee:environment>
</jee:jndi-lookup>
```

<a id="appendix.xsd-schemas-jee-jndi-lookup-environment-multiple"></a>

#### `<jee:jndi-lookup/>` (with Multiple JNDI Environment Settings)

The following example shows how to use JNDI to look up multiple environment variables
without `jee`:

```xml
<bean id="simple" class="org.springframework.jndi.JndiObjectFactoryBean">
	<property name="jndiName" value="jdbc/MyDataSource"/>
	<property name="jndiEnvironment">
		<props>
			<prop key="sing">song</prop>
			<prop key="ping">pong</prop>
		</props>
	</property>
</bean>
```

The following example shows how to use JNDI to look up multiple environment variables with
`jee`:

```xml
<jee:jndi-lookup id="simple" jndi-name="jdbc/MyDataSource">
	<!-- newline-separated, key-value pairs for the environment (standard Properties format) -->
	<jee:environment>
		sing=song
		ping=pong
	</jee:environment>
</jee:jndi-lookup>
```

<a id="appendix.xsd-schemas-jee-jndi-lookup-complex"></a>

#### `<jee:jndi-lookup/>` (Complex)

The following example shows how to use JNDI to look up a data source and a number of
different properties without `jee`:

```xml
<bean id="simple" class="org.springframework.jndi.JndiObjectFactoryBean">
	<property name="jndiName" value="jdbc/MyDataSource"/>
	<property name="cache" value="true"/>
	<property name="resourceRef" value="true"/>
	<property name="lookupOnStartup" value="false"/>
	<property name="expectedType" value="com.myapp.DefaultThing"/>
	<property name="proxyInterface" value="com.myapp.Thing"/>
</bean>
```

The following example shows how to use JNDI to look up a data source and a number of
different properties with `jee`:

```xml
<jee:jndi-lookup id="simple"
		jndi-name="jdbc/MyDataSource"
		cache="true"
		resource-ref="true"
		lookup-on-startup="false"
		expected-type="com.myapp.DefaultThing"
		proxy-interface="com.myapp.Thing"/>
```

<a id="appendix.xsd-schemas-jee-local-slsb"></a>

#### `<jee:local-slsb/>` (Simple)

The `<jee:local-slsb/>` element configures a reference to a local EJB Stateless Session Bean.

The following example shows how to configure a reference to a local EJB Stateless Session Bean
without `jee`:

```xml
<bean id="simple"
		class="org.springframework.ejb.access.LocalStatelessSessionProxyFactoryBean">
	<property name="jndiName" value="ejb/RentalServiceBean"/>
	<property name="businessInterface" value="com.foo.service.RentalService"/>
</bean>
```

The following example shows how to configure a reference to a local EJB Stateless Session Bean
with `jee`:

```xml
<jee:local-slsb id="simpleSlsb" jndi-name="ejb/RentalServiceBean"
		business-interface="com.foo.service.RentalService"/>
```

<a id="appendix.xsd-schemas-jee-local-slsb-complex"></a>

#### `<jee:local-slsb/>` (Complex)

The `<jee:local-slsb/>` element configures a reference to a local EJB Stateless Session Bean.

The following example shows how to configure a reference to a local EJB Stateless Session Bean
and a number of properties without `jee`:

```xml
<bean id="complexLocalEjb"
		class="org.springframework.ejb.access.LocalStatelessSessionProxyFactoryBean">
	<property name="jndiName" value="ejb/RentalServiceBean"/>
	<property name="businessInterface" value="com.example.service.RentalService"/>
	<property name="cacheHome" value="true"/>
	<property name="lookupHomeOnStartup" value="true"/>
	<property name="resourceRef" value="true"/>
</bean>
```

The following example shows how to configure a reference to a local EJB Stateless Session Bean
and a number of properties with `jee`:

```xml
<jee:local-slsb id="complexLocalEjb"
		jndi-name="ejb/RentalServiceBean"
		business-interface="com.foo.service.RentalService"
		cache-home="true"
		lookup-home-on-startup="true"
		resource-ref="true">
```

<a id="appendix.xsd-schemas-jee-remote-slsb"></a>

#### <jee:remote-slsb/>

The `<jee:remote-slsb/>` element configures a reference to a `remote` EJB Stateless Session Bean.

The following example shows how to configure a reference to a remote EJB Stateless Session Bean
without `jee`:

```xml
<bean id="complexRemoteEjb"
		class="org.springframework.ejb.access.SimpleRemoteStatelessSessionProxyFactoryBean">
	<property name="jndiName" value="ejb/MyRemoteBean"/>
	<property name="businessInterface" value="com.foo.service.RentalService"/>
	<property name="cacheHome" value="true"/>
	<property name="lookupHomeOnStartup" value="true"/>
	<property name="resourceRef" value="true"/>
	<property name="homeInterface" value="com.foo.service.RentalService"/>
	<property name="refreshHomeOnConnectFailure" value="true"/>
</bean>
```

The following example shows how to configure a reference to a remote EJB Stateless Session Bean
with `jee`:

```xml
<jee:remote-slsb id="complexRemoteEjb"
		jndi-name="ejb/MyRemoteBean"
		business-interface="com.foo.service.RentalService"
		cache-home="true"
		lookup-home-on-startup="true"
		resource-ref="true"
		home-interface="com.foo.service.RentalService"
		refresh-home-on-connect-failure="true">
```

<a id="appendix.xsd-schemas-jms"></a>

### The `jms` Schema

The `jms` elements deal with configuring JMS-related beans, such as Spring’s
[Message Listener Containers](jms/using.md#jms-mdp). These elements are detailed in the
section of the [JMS chapter](jms.md) entitled [JMS Namespace Support](jms/namespace.md)
. See that chapter for full details on this support
and the `jms` elements themselves.

In the interest of completeness, to use the elements in the `jms` schema, you need to have
the following preamble at the top of your Spring XML configuration file. The text in the
following snippet references the correct schema so that the elements in the `jms` namespace
are available to you:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:jms="http://www.springframework.org/schema/jms"
	xsi:schemaLocation="
		http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/jms
		https://www.springframework.org/schema/jms/spring-jms.xsd">

	<!-- bean definitions here -->

</beans>
```

<a id="appendix.xsd-schemas-context-mbe"></a>

### Using `<context:mbean-export/>`

This element is detailed in
[Configuring Annotation-based MBean Export](jmx/naming.md#jmx-context-mbeanexport).

<a id="appendix.xsd-schemas-cache"></a>

### The `cache` Schema

You can use the `cache` elements to enable support for Spring’s `@CacheEvict`, `@CachePut`,
and `@Caching` annotations. The `cache` schema also supports declarative XML-based caching. See
[Enabling Caching Annotations](cache/annotations.md#cache-annotation-enable) and
[Declarative XML-based Caching](cache/declarative-xml.md) for details.

To use the elements in the `cache` schema, you need to have the following preamble at the
top of your Spring XML configuration file. The text in the following snippet references
the correct schema so that the elements in the `cache` namespace are available to you:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<beans xmlns="http://www.springframework.org/schema/beans"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xmlns:cache="http://www.springframework.org/schema/cache"
	xsi:schemaLocation="
		http://www.springframework.org/schema/beans
		https://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/cache
		https://www.springframework.org/schema/cache/spring-cache.xsd">

	<!-- bean definitions here -->

</beans>
```
