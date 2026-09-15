---
title: "Using Generics as Autowiring Qualifiers"
source: "ROOT:core/beans/annotation-config/generics-as-qualifiers.adoc"
---

<a id="beans-generics-as-qualifiers"></a>

# Using Generics as Autowiring Qualifiers

In addition to the `@Qualifier` annotation, you can use Java generic types
as an implicit form of qualification. For example, suppose you have the following
configuration:

#### Java

```java
@Configuration
public class MyConfiguration {

	@Bean
	public StringStore stringStore() {
		return new StringStore();
	}

	@Bean
	public IntegerStore integerStore() {
		return new IntegerStore();
	}
}
```

#### Kotlin

```kotlin
@Configuration
class MyConfiguration {

	@Bean
	fun stringStore() = StringStore()

	@Bean
	fun integerStore() = IntegerStore()
}
```

Assuming that the preceding beans implement a generic interface, (that is, `Store<String>` and
`Store<Integer>`), you can `@Autowire` the `Store` interface and the generic is
used as a qualifier, as the following example shows:

#### Java

```java
@Autowired
private Store<String> s1; // <String> qualifier, injects the stringStore bean

@Autowired
private Store<Integer> s2; // <Integer> qualifier, injects the integerStore bean
```

#### Kotlin

```kotlin
@Autowired
private lateinit var s1: Store<String> // <String> qualifier, injects the stringStore bean

@Autowired
private lateinit var s2: Store<Integer> // <Integer> qualifier, injects the integerStore bean
```

Generic qualifiers also apply when autowiring lists, `Map` instances and arrays. The
following example autowires a generic `List`:

#### Java

```java
// Inject all Store beans as long as they have an <Integer> generic
// Store<String> beans will not appear in this list
@Autowired
private List<Store<Integer>> s;
```

#### Kotlin

```kotlin
// Inject all Store beans as long as they have an <Integer> generic
// Store<String> beans will not appear in this list
@Autowired
private lateinit var s: List<Store<Integer>>
```
