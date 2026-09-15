---
title: "Plugging-in Different Back-end Caches"
source: "ROOT:integration/cache/plug.adoc"
---

<a id="cache-plug"></a>

# Plugging-in Different Back-end Caches

Clearly, there are plenty of caching products out there that you can use as a backing
store. For those that do not support JSR-107 you need to provide a `CacheManager` and a
`Cache` implementation. This may sound harder than it is, since, in practice, the classes
tend to be simple [adapters](https://en.wikipedia.org/wiki/Adapter_pattern) that map the
caching abstraction framework on top of the storage API, as the *Caffeine* classes do.
Most `CacheManager` classes can use the classes in the
`org.springframework.cache.support` package (such as `AbstractCacheManager` which takes
care of the boiler-plate code, leaving only the actual mapping to be completed).
