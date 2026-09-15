---
title: "Apache Groovy"
source: "ROOT:languages/groovy.adoc"
---

<a id="groovy"></a>

# Apache Groovy

Groovy is a powerful, optionally typed, and dynamic language, with static-typing and static
compilation capabilities. It offers a concise syntax and integrates smoothly with any
existing Java application.

<a id="beans-factory-groovy"></a>

## The Groovy Bean Definition DSL

The Spring Framework provides a dedicated `ApplicationContext` that supports a Groovy-based
Bean Definition DSL, as known from the Grails framework.

Typically, such configuration live in a ".groovy" file with the structure shown in the
following example:

```groovy
beans {
	dataSource(BasicDataSource) {
		driverClassName = "org.hsqldb.jdbcDriver"
		url = "jdbc:hsqldb:mem:grailsDB"
		username = "sa"
		password = ""
		settings = [mynew:"setting"]
	}
	sessionFactory(SessionFactory) {
		dataSource = dataSource
	}
	myService(MyService) {
		nestedBean = { AnotherBean bean ->
			dataSource = dataSource
		}
	}
}
```

This configuration style is largely equivalent to XML bean definitions and even
supports Spring’s XML configuration namespaces. It also allows for importing XML
bean definition files through an `importBeans` directive.
