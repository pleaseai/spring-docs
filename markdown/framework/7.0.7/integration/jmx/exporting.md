---
title: "Exporting Your Beans to JMX"
source: "ROOT:integration/jmx/exporting.adoc"
---

<a id="jmx-exporting"></a>

# Exporting Your Beans to JMX

The core class in Spring’s JMX framework is the `MBeanExporter`. This class is
responsible for taking your Spring beans and registering them with a JMX `MBeanServer`.
For example, consider the following class:

#### Java

```java
public class JmxTestBean implements IJmxTestBean {

	private String name;
	private int age;

	@Override
	public int getAge() {
		return age;
	}

	@Override
	public void setAge(int age) {
		this.age = age;
	}

	@Override
	public void setName(String name) {
		this.name = name;
	}

	@Override
	public String getName() {
		return name;
	}

	@Override
	public int add(int x, int y) {
		return x + y;
	}

	@Override
	public void dontExposeMe() {
		throw new RuntimeException();
	}
}
```

#### Kotlin

```kotlin
class JmxTestBean : IJmxTestBean {

	override lateinit var name: String
	override var age = 0

	override fun add(x: Int, y: Int): Int {
		return x + y
	}

	override fun dontExposeMe() {
		throw RuntimeException()
	}
}
```

To expose the properties and methods of this bean as attributes and operations of an
MBean, you can configure an instance of the `MBeanExporter` class in your
configuration file and pass in the bean, as the following example shows:

#### Java

```java
@Configuration
public class JmxConfiguration {

	@Bean
	MBeanExporter exporter(JmxTestBean testBean) {
		MBeanExporter exporter = new MBeanExporter();
		exporter.setBeans(Map.of("bean:name=testBean1", testBean));
		return exporter;
	}

	@Bean
	JmxTestBean testBean() {
		JmxTestBean testBean = new JmxTestBean();
		testBean.setName("TEST");
		testBean.setAge(100);
		return testBean;
	}
}
```

#### Kotlin

```kotlin
@Configuration
class JmxConfiguration {

	@Bean
	fun exporter(testBean: JmxTestBean) = MBeanExporter().apply {
		setBeans(mapOf("bean:name=testBean1" to testBean))
	}

	@Bean
	fun testBean() = JmxTestBean().apply {
		name = "TEST"
		age = 100
	}
}
```

#### Xml

```xml
<beans xmlns="http://www.springframework.org/schema/beans"
	   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	   xsi:schemaLocation="http://www.springframework.org/schema/beans
	   https://www.springframework.org/schema/beans/spring-beans.xsd">

	<!-- this bean must not be lazily initialized if the exporting is to happen -->
	<bean id="exporter" class="org.springframework.jmx.export.MBeanExporter">
		<property name="beans">
			<map>
				<entry key="bean:name=testBean1" value-ref="testBean"/>
			</map>
		</property>
	</bean>

	<bean id="testBean" class="org.example.JmxTestBean">
		<property name="name" value="TEST"/>
		<property name="age" value="100"/>
	</bean>
</beans>
```

The pertinent bean definition from the preceding configuration snippet is the `exporter`
bean. The `beans` property tells the `MBeanExporter` exactly which of your beans must be
exported to the JMX `MBeanServer`. In the default configuration, the key of each entry
in the `beans` `Map` is used as the `ObjectName` for the bean referenced by the
corresponding entry value. You can change this behavior, as described in [Controlling  `ObjectName` Instances for Your Beans](naming.md).

With this configuration, the `testBean` bean is exposed as an MBean under the
`ObjectName` `bean:name=testBean1`. By default, all `public` properties of the bean
are exposed as attributes and all `public` methods (except those inherited from the
`Object` class) are exposed as operations.

> [!NOTE]
> `MBeanExporter` is a `Lifecycle` bean (see [Startup and Shutdown Callbacks](../../core/beans/factory-nature.md#beans-factory-lifecycle-processor)
> ). By default, MBeans are exported as late as possible during
> the application lifecycle. You can configure the `phase` at which
> the export happens or disable automatic registration by setting the `autoStartup` flag.

<a id="jmx-exporting-mbeanserver"></a>

## Creating an MBeanServer

The configuration shown in the [preceding section](#) assumes that the
application is running in an environment that has one (and only one) `MBeanServer`
already running. In this case, Spring tries to locate the running `MBeanServer` and
register your beans with that server (if any). This behavior is useful when your
application runs inside a container (such as Tomcat or IBM WebSphere) that has its
own `MBeanServer`.

However, this approach is of no use in a standalone environment or when running inside
a container that does not provide an `MBeanServer`. To address this, you can create an
`MBeanServer` instance declaratively by adding an instance of the
`org.springframework.jmx.support.MBeanServerFactoryBean` class to your configuration.
You can also ensure that a specific `MBeanServer` is used by setting the value of the
`MBeanExporter` instance’s `server` property to the `MBeanServer` value returned by an
`MBeanServerFactoryBean`, as the following example shows:

```xml
<beans>

	<bean id="mbeanServer" class="org.springframework.jmx.support.MBeanServerFactoryBean"/>

	<!--
	this bean needs to be eagerly pre-instantiated in order for the exporting to occur;
	this means that it must not be marked as lazily initialized
	-->
	<bean id="exporter" class="org.springframework.jmx.export.MBeanExporter">
		<property name="beans">
			<map>
				<entry key="bean:name=testBean1" value-ref="testBean"/>
			</map>
		</property>
		<property name="server" ref="mbeanServer"/>
	</bean>

	<bean id="testBean" class="org.springframework.jmx.JmxTestBean">
		<property name="name" value="TEST"/>
		<property name="age" value="100"/>
	</bean>

</beans>
```

In the preceding example, an instance of `MBeanServer` is created by the `MBeanServerFactoryBean` and is
supplied to the `MBeanExporter` through the `server` property. When you supply your own
`MBeanServer` instance, the `MBeanExporter` does not try to locate a running
`MBeanServer` and uses the supplied `MBeanServer` instance. For this to work
correctly, you must have a JMX implementation on your classpath.

<a id="jmx-mbean-server"></a>

## Reusing an Existing `MBeanServer`

If no server is specified, the `MBeanExporter` tries to automatically detect a running
`MBeanServer`. This works in most environments, where only one `MBeanServer` instance is
used. However, when multiple instances exist, the exporter might pick the wrong server.
In such cases, you should use the `MBeanServer` `agentId` to indicate which instance to
be used, as the following example shows:

```xml
<beans>
	<bean id="mbeanServer" class="org.springframework.jmx.support.MBeanServerFactoryBean">
		<!-- indicate to first look for a server -->
		<property name="locateExistingServerIfPossible" value="true"/>
		<!-- search for the MBeanServer instance with the given agentId -->
		<property name="agentId" value="MBeanServer_instance_agentId>"/>
	</bean>
	<bean id="exporter" class="org.springframework.jmx.export.MBeanExporter">
		<property name="server" ref="mbeanServer"/>
		...
	</bean>
</beans>
```

For platforms or cases where the existing `MBeanServer` has a dynamic (or unknown)
`agentId` that is retrieved through lookup methods, you should use
[factory-method](../../core/beans/definition.md#beans-factory-class-static-factory-method),
as the following example shows:

```xml
<beans>
	<bean id="exporter" class="org.springframework.jmx.export.MBeanExporter">
		<property name="server">
			<!-- Custom MBeanServerLocator -->
			<bean class="platform.package.MBeanServerLocator" factory-method="locateMBeanServer"/>
		</property>
	</bean>

	<!-- other beans here -->

</beans>
```

<a id="jmx-exporting-lazy"></a>

## Lazily Initialized MBeans

If you configure a bean with an `MBeanExporter` that is also configured for lazy
initialization, the `MBeanExporter` does not break this contract and avoids
instantiating the bean. Instead, it registers a proxy with the `MBeanServer` and defers
obtaining the bean from the container until the first invocation on the proxy occurs.

This also affects `FactoryBean` resolution where `MBeanExporter` will regularly
introspect the produced object, effectively triggering `FactoryBean.getObject()`.
In order to avoid this, mark the corresponding bean definition as lazy-init.

<a id="jmx-exporting-auto"></a>

## Automatic Registration of MBeans

Any beans that are exported through the `MBeanExporter` and are already valid MBeans
are registered as-is with the `MBeanServer` without further intervention from Spring.
You can cause MBeans to be automatically detected by the `MBeanExporter` by setting
the `autodetect` property to `true`, as the following example shows:

```xml
<bean id="exporter" class="org.springframework.jmx.export.MBeanExporter">
	<property name="autodetect" value="true"/>
</bean>

<bean name="spring:mbean=true" class="org.springframework.jmx.export.TestDynamicMBean"/>
```

In the preceding example, the bean called `spring:mbean=true` is already a valid JMX MBean
and is automatically registered by Spring. By default, a bean that is autodetected for JMX
registration has its bean name used as the `ObjectName`. You can override this behavior,
as detailed in [Controlling  `ObjectName` Instances for Your Beans](naming.md).

<a id="jmx-exporting-registration-behavior"></a>

## Controlling the Registration Behavior

Consider the scenario where a Spring `MBeanExporter` attempts to register an `MBean`
with an `MBeanServer` by using the `ObjectName` `bean:name=testBean1`. If an `MBean`
instance has already been registered under that same `ObjectName`, the default behavior
is to fail (and throw an `InstanceAlreadyExistsException`).

You can control exactly what happens when an `MBean` is
registered with an `MBeanServer`. Spring’s JMX support allows for three different
registration behaviors to control the registration behavior when the registration
process finds that an `MBean` has already been registered under the same `ObjectName`.
The following table summarizes these registration behaviors:

<a id="jmx-registration-behaviors"></a>

| Registration behavior | Explanation |
| --- | --- |
| `FAIL_ON_EXISTING` | This is the default registration behavior. If an `MBean` instance has already been registered under the same `ObjectName`, the `MBean` that is being registered is not registered, and an `InstanceAlreadyExistsException` is thrown. The existing `MBean` is unaffected. |
| `IGNORE_EXISTING` | If an `MBean` instance has already been registered under the same `ObjectName`, the `MBean` that is being registered is not registered. The existing `MBean` is unaffected, and no `Exception` is thrown. This is useful in settings where multiple applications want to share a common `MBean` in a shared `MBeanServer`. |
| `REPLACE_EXISTING` | If an `MBean` instance has already been registered under the same `ObjectName`, the existing `MBean` that was previously registered is unregistered, and the new `MBean` is registered in its place (the new `MBean` effectively replaces the previous instance). |

The values in the preceding table are defined as enums on the `RegistrationPolicy` class.
If you want to change the default registration behavior, you need to set the value of the
`registrationPolicy` property on your `MBeanExporter` definition to one of those
values.

The following example shows how to change from the default registration
behavior to the `REPLACE_EXISTING` behavior:

```xml
<beans>

	<bean id="exporter" class="org.springframework.jmx.export.MBeanExporter">
		<property name="beans">
			<map>
				<entry key="bean:name=testBean1" value-ref="testBean"/>
			</map>
		</property>
		<property name="registrationPolicy" value="REPLACE_EXISTING"/>
	</bean>

	<bean id="testBean" class="org.springframework.jmx.JmxTestBean">
		<property name="name" value="TEST"/>
		<property name="age" value="100"/>
	</bean>

</beans>
```
