---
title: "Coroutines"
source: "ROOT:kotlin/coroutines.adoc"
---

<a id="kotlin.coroutines"></a>

# Coroutines

Kotlin [Coroutines](https://kotlinlang.org/docs/reference/coroutines-overview.html) are instances of suspendable computations allowing to write non-blocking code imperatively.
On language side, `suspend` functions provides an abstraction for asynchronous operations while on library side [kotlinx.coroutines](https://github.com/Kotlin/kotlinx.coroutines) provides functions like [`async { }`](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/async.html) and types like [`Flow`](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow/index.html).

Spring Data modules provide support for Coroutines on the following scope:

- [Deferred](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-deferred/index.html) and [Flow](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow/index.html) return values support in Kotlin extensions

<a id="kotlin.coroutines.dependencies"></a>

## Dependencies

Coroutines support is enabled when `kotlinx-coroutines-core`, `kotlinx-coroutines-reactive` and `kotlinx-coroutines-reactor` dependencies are in the classpath:

#### Dependencies to add in Maven pom.xml

```xml
<dependency>
	<groupId>org.jetbrains.kotlinx</groupId>
	<artifactId>kotlinx-coroutines-core</artifactId>
</dependency>

<dependency>
	<groupId>org.jetbrains.kotlinx</groupId>
	<artifactId>kotlinx-coroutines-reactive</artifactId>
</dependency>

<dependency>
	<groupId>org.jetbrains.kotlinx</groupId>
	<artifactId>kotlinx-coroutines-reactor</artifactId>
</dependency>
```

> [!NOTE]
> Supported versions `1.3.0` and above.

<a id="kotlin.coroutines.reactive"></a>

## How Reactive translates to Coroutines?

For return values, the translation from Reactive to Coroutines APIs is the following:

- `fun handler(): Mono<Void>` becomes `suspend fun handler()`
- `fun handler(): Mono<T>` becomes `suspend fun handler(): T` or `suspend fun handler(): T?` depending on if the `Mono` can be empty or not (with the advantage of being more statically typed)
- `fun handler(): Flux<T>` becomes `fun handler(): Flow<T>`

[`Flow`](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow/index.html) is `Flux` equivalent in Coroutines world, suitable for hot or cold stream, finite or infinite streams, with the following main differences:

- `Flow` is push-based while `Flux` is push-pull hybrid
- Backpressure is implemented via suspending functions
- `Flow` has only a [single suspending `collect` method](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/-flow/collect.html) and operators are implemented as [extensions](https://kotlinlang.org/docs/reference/extensions.html)
- [Operators are easy to implement](https://github.com/Kotlin/kotlinx.coroutines/tree/master/kotlinx-coroutines-core/common/src/flow/operators) thanks to Coroutines
- Extensions allow adding custom operators to `Flow`
- Collect operations are suspending functions
- [`map` operator](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines.flow/map.html) supports asynchronous operation (no need for `flatMap`) since it takes a suspending function parameter

Read this blog post about [Going Reactive with Spring, Coroutines and Kotlin Flow](https://spring.io/blog/2019/04/12/going-reactive-with-spring-coroutines-and-kotlin-flow) for more details, including how to run code concurrently with Coroutines.

<a id="kotlin.coroutines.repositories"></a>

## Repositories

Here is an example of a Coroutines repository:

```kotlin
interface CoroutineRepository : CoroutineCrudRepository<User, String> {

    suspend fun findOne(id: String): User

    fun findByFirstname(firstname: String): Flow<User>

    suspend fun findAllByFirstname(id: String): List<User>
}
```

Coroutines repositories are built on reactive repositories to expose the non-blocking nature of data access through Kotlin’s Coroutines.
Methods on a Coroutines repository can be backed either by a query method or a custom implementation.
Invoking a custom implementation method propagates the Coroutines invocation to the actual implementation method if the custom method is `suspend`-able without requiring the implementation method to return a reactive type such as `Mono` or `Flux`.

Note that depending on the method declaration the coroutine context may or may not be available.
To retain access to the context, either declare your method using `suspend` or return a type that enables context propagation such as `Flow`.

- `suspend fun findOne(id: String): User`: Retrieve the data once and synchronously by suspending.
- `fun findByFirstname(firstname: String): Flow<User>`: Retrieve a stream of data.
The `Flow` is created eagerly while data is fetched upon `Flow` interaction (`Flow.collect(…)`).
- `fun getUser(): User`: Retrieve data once **blocking the thread** and without context propagation.
This should be avoided.

> [!NOTE]
> Coroutines repositories are only discovered when the repository extends the `CoroutineCrudRepository` interface.
