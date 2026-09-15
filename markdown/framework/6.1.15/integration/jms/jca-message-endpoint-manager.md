---
title: "Support for JCA Message Endpoints"
source: "ROOT:integration/jms/jca-message-endpoint-manager.adoc"
---

<a id="jms-jca-message-endpoint-manager"></a>

# Support for JCA Message Endpoints

Beginning with version 2.5, Spring also provides support for a JCA-based
`MessageListener` container. The `JmsMessageEndpointManager` tries to
automatically determine the `ActivationSpec` class name from the provider’s
`ResourceAdapter` class name. Therefore, it is typically possible to provide
Spring’s generic `JmsActivationSpecConfig`, as the following example shows:

```xml
<bean class="org.springframework.jms.listener.endpoint.JmsMessageEndpointManager">
	<property name="resourceAdapter" ref="resourceAdapter"/>
	<property name="activationSpecConfig">
		<bean class="org.springframework.jms.listener.endpoint.JmsActivationSpecConfig">
			<property name="destinationName" value="myQueue"/>
		</bean>
	</property>
	<property name="messageListener" ref="myMessageListener"/>
</bean>
```

Alternatively, you can set up a `JmsMessageEndpointManager` with a given
`ActivationSpec` object. The `ActivationSpec` object may also come from a JNDI lookup
(using `<jee:jndi-lookup>`). The following example shows how to do so:

```xml
<bean class="org.springframework.jms.listener.endpoint.JmsMessageEndpointManager">
	<property name="resourceAdapter" ref="resourceAdapter"/>
	<property name="activationSpec">
		<bean class="org.apache.activemq.ra.ActiveMQActivationSpec">
			<property name="destination" value="myQueue"/>
			<property name="destinationType" value="jakarta.jms.Queue"/>
		</bean>
	</property>
	<property name="messageListener" ref="myMessageListener"/>
</bean>
```

Using Spring’s `ResourceAdapterFactoryBean`, you can configure the target `ResourceAdapter`
locally, as the following example shows:

```xml
<bean id="resourceAdapter" class="org.springframework.jca.support.ResourceAdapterFactoryBean">
	<property name="resourceAdapter">
		<bean class="org.apache.activemq.ra.ActiveMQResourceAdapter">
			<property name="serverUrl" value="tcp://localhost:61616"/>
		</bean>
	</property>
	<property name="workManager">
		<bean class="org.springframework.jca.work.SimpleTaskWorkManager"/>
	</property>
</bean>
```

The specified `WorkManager` can also point to an environment-specific thread pool — typically through a `SimpleTaskWorkManager` instance’s `asyncTaskExecutor` property.
Consider defining a shared thread pool for all your `ResourceAdapter` instances
if you happen to use multiple adapters.

In some environments, you can instead obtain the entire `ResourceAdapter` object from JNDI
(by using `<jee:jndi-lookup>`). The Spring-based message listeners can then interact with
the server-hosted `ResourceAdapter`, which also use the server’s built-in `WorkManager`.

See the javadoc for [`JmsMessageEndpointManager`](https://docs.spring.io/spring-framework/docs/6.1.15/javadoc-api/org/springframework/jms/listener/endpoint/JmsMessageEndpointManager.html),
[`JmsActivationSpecConfig`](https://docs.spring.io/spring-framework/docs/6.1.15/javadoc-api/org/springframework/jms/listener/endpoint/JmsActivationSpecConfig.html),
and [`ResourceAdapterFactoryBean`](https://docs.spring.io/spring-framework/docs/6.1.15/javadoc-api/org/springframework/jca/support/ResourceAdapterFactoryBean.html)
for more details.

Spring also provides a generic JCA message endpoint manager that is not tied to JMS:
`org.springframework.jca.endpoint.GenericMessageEndpointManager`. This component allows
for using any message listener type (such as a JMS `MessageListener`) and any
provider-specific `ActivationSpec` object. See your JCA provider’s documentation to
find out about the actual capabilities of your connector, and see the
[`GenericMessageEndpointManager`](https://docs.spring.io/spring-framework/docs/6.1.15/javadoc-api/org/springframework/jca/endpoint/GenericMessageEndpointManager.html)
javadoc for the Spring-specific configuration details.

> [!NOTE]
> JCA-based message endpoint management is very analogous to EJB 2.1 Message-Driven Beans.
> It uses the same underlying resource provider contract. As with EJB 2.1 MDBs, you can use any
> message listener interface supported by your JCA provider in the Spring context as well.
> Spring nevertheless provides explicit “convenience” support for JMS, because JMS is the
> most common endpoint API used with the JCA endpoint management contract.
