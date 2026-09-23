---
title: "Merging persistence units"
source: "ROOT:jpa/misc-merging-persistence-units.adoc"
---

<a id="jpa.misc.merging-persistence-units"></a>

# Merging persistence units

Spring supports having multiple persistence units. Sometimes, however, you might want to modularize your application but still make sure that all these modules run inside a single persistence unit. To enable that behavior, Spring Data JPA offers a `PersistenceUnitManager` implementation that automatically merges persistence units based on their name, as shown in the following example:

```xml
<bean class="….LocalContainerEntityManagerFactoryBean">
  <property name="persistenceUnitManager">
    <bean class="….MergingPersistenceUnitManager" />
  </property>
</bean>
```

<a id="jpa.misc.entity-scanning"></a>

## Classpath Scanning for @Entity Classes and JPA Mapping Files

A plain JPA setup requires all annotation-mapped entity classes to be listed in `orm.xml`. The same applies to XML mapping files. Spring Data JPA provides a `ClasspathScanningPersistenceUnitPostProcessor` that gets a base package configured and optionally takes a mapping filename pattern. It then scans the given package for classes annotated with `@Entity` or `@MappedSuperclass`, loads the configuration files that match the filename pattern, and hands them to the JPA configuration. The post-processor must be configured as follows:

```xml
<bean class="….LocalContainerEntityManagerFactoryBean">
  <property name="persistenceUnitPostProcessors">
    <list>
      <bean class="org.springframework.data.jpa.support.ClasspathScanningPersistenceUnitPostProcessor">
        <constructor-arg value="com.acme.domain" />
        <property name="mappingFileNamePattern" value="**/*Mapping.xml" />
      </bean>
    </list>
  </property>
</bean>
```

> [!NOTE]
> As of Spring 3.1, a package to scan can be configured on the `LocalContainerEntityManagerFactoryBean` directly to enable classpath scanning for entity classes. See the [JavaDoc](<https://docs.spring.io/spring-framework/docs/6.1.7/javadoc-apiorg/springframework/orm/jpa/LocalContainerEntityManagerFactoryBean.html#setPackagesToScan(java.lang.String…​)$$>) for details.
