---
title: "Classes and Interfaces"
source: "ROOT:languages/kotlin/classes-interfaces.adoc"
---

<a id="kotlin-classes-interfaces"></a>

# Classes and Interfaces

The Spring Framework supports various Kotlin constructs, such as instantiating Kotlin classes
through primary constructors, data binding for immutable classes, and optional parameters
with default values for functions.

Kotlin parameter names are recognized through a dedicated `KotlinReflectionParameterNameDiscoverer`,
which allows finding interface method parameter names without requiring the Java `-parameters`
compiler flag to be enabled during compilation.

> [!TIP]
> For completeness, we nevertheless recommend running the Kotlin compiler with its
> `-java-parameters` flag for standard Java parameter exposure.

You can declare configuration classes as
[top level or nested but not inner](https://kotlinlang.org/docs/nested-classes.html),
since the latter requires a reference to the outer class.
