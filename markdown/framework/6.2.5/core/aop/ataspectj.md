---
title: "@AspectJ support"
source: "ROOT:core/aop/ataspectj.adoc"
---

<a id="aop-ataspectj"></a>

# @AspectJ support

@AspectJ refers to a style of declaring aspects as regular Java classes annotated with
annotations. The @AspectJ style was introduced by the
[AspectJ project](https://www.eclipse.org/aspectj) as part of the AspectJ 5 release. Spring
interprets the same annotations as AspectJ 5, using a library supplied by AspectJ
for pointcut parsing and matching. The AOP runtime is still pure Spring AOP, though, and
there is no dependency on the AspectJ compiler or weaver.

> [!NOTE]
> Using the AspectJ compiler and weaver enables use of the full AspectJ language and
> is discussed in [Using AspectJ with Spring Applications](using-aspectj.md).
