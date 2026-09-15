---
title: "MockMvc integration"
source: "ROOT:testing/mockmvc/assertj/integration.adoc"
---

<a id="mockmvc-tester-integration"></a>

# MockMvc integration

If you want to use the AssertJ support but have invested in the original `MockMvc`
API, `MockMvcTester` offers several ways to integrate with it.

If you have your own `RequestBuilder` implementation, you can trigger the processing
of the request using `perform`. The example below showcases how the query can be
crafted with the original API:

```java
// Static import on MockMvcRequestBuilders.get
assertThat(mockMvc.perform(get("/hotels/{id}", 42)))
		.hasStatusOk();
```

Similarly, if you have crafted custom matchers that you use with the `.andExpect` feature
of `MockMvc` you can use them via `.matches`. In the example below, we rewrite the
preceding example to assert the status with  the `ResultMatcher` implementation that
`MockMvc` provides:

```java
// Static import on MockMvcResultMatchers.status
assertThat(mockMvc.get().uri("/hotels/{id}", 42))
		.matches(status().isOk());
```

`MockMvc` also defines a `ResultHandler` contract that lets you execute arbitrary actions
on `MvcResult`. If you have implemented this contract you can invoke it using `.apply`.
