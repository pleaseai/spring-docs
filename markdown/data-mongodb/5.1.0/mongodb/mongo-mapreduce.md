---
title: "Map-Reduce Operations"
source: "ROOT:mongodb/mongo-mapreduce.adoc"
---

<a id="mongo.mapreduce"></a>

# Map-Reduce Operations

You can query MongoDB by using Map-Reduce, which is useful for batch processing, for data aggregation, and for when the query language does not fulfill your needs.

Spring provides integration with MongoDB’s Map-Reduce by providing methods on `MongoOperations` to simplify the creation and running of Map-Reduce operations.It can convert the results of a Map-Reduce operation to a POJO and integrates with Spring’s [Resource abstraction](https://docs.spring.io/spring-framework/reference/7.0/core.html#resources).This lets you place your JavaScript files on the file system, classpath, HTTP server, or any other Spring Resource implementation and then reference the JavaScript resources through an easy URI style syntax — for example, `classpath:reduce.js;`.Externalizing JavaScript code in files is often preferable to embedding them as Java strings in your code.Note that you can still pass JavaScript code as Java strings if you prefer.

<a id="mongo.mapreduce.example"></a>

## Example Usage

To understand how to perform Map-Reduce operations, we use an example from the book, *MongoDB - The Definitive Guide* <sup>\[[1](#_footnotedef_1)\]</sup>.In this example, we create three documents that have the values \[a,b\], \[b,c\], and \[c,d\], respectively.The values in each document are associated with the key, 'x', as the following example shows (assume these documents are in a collection named `jmr1`):

```
{ "_id" : ObjectId("4e5ff893c0277826074ec533"), "x" : [ "a", "b" ] }
{ "_id" : ObjectId("4e5ff893c0277826074ec534"), "x" : [ "b", "c" ] }
{ "_id" : ObjectId("4e5ff893c0277826074ec535"), "x" : [ "c", "d" ] }
```

The following map function counts the occurrence of each letter in the array for each document:

```java
function () {
    for (var i = 0; i < this.x.length; i++) {
        emit(this.x[i], 1);
    }
}
```

The following reduce function sums up the occurrence of each letter across all the documents:

```java
function (key, values) {
    var sum = 0;
    for (var i = 0; i < values.length; i++)
        sum += values[i];
    return sum;
}
```

Running the preceding functions result in the following collection:

```
{ "_id" : "a", "value" : 1 }
{ "_id" : "b", "value" : 2 }
{ "_id" : "c", "value" : 2 }
{ "_id" : "d", "value" : 1 }
```

Assuming that the map and reduce functions are located in `map.js` and `reduce.js` and bundled in your jar so they are available on the classpath, you can run a Map-Reduce operation as follows:

```java
MapReduceResults<ValueObject> results = mongoOperations.mapReduce("jmr1", "classpath:map.js", "classpath:reduce.js", ValueObject.class);
for (ValueObject valueObject : results) {
  System.out.println(valueObject);
}
```

The preceding example produces the following output:

```
ValueObject [id=a, value=1.0]
ValueObject [id=b, value=2.0]
ValueObject [id=c, value=2.0]
ValueObject [id=d, value=1.0]
```

The `MapReduceResults` class implements `Iterable` and provides access to the raw output and timing and count statistics.The following listing shows the `ValueObject` class:

```java
public class ValueObject {

  private String id;
  private float value;

  public String getId() {
    return id;
  }

  public float getValue() {
    return value;
  }

  public void setValue(float value) {
    this.value = value;
  }

  @Override
  public String toString() {
    return "ValueObject [id=" + id + ", value=" + value + "]";
  }
}
```

By default, the output type of `INLINE` is used so that you need not specify an output collection.To specify additional Map-Reduce options, use an overloaded method that takes an additional `MapReduceOptions` argument.The class `MapReduceOptions` has a fluent API, so adding additional options can be done in a compact syntax.The following example sets the output collection to `jmr1_out` (note that setting only the output collection assumes a default output type of `REPLACE`):

```java
MapReduceResults<ValueObject> results = mongoOperations.mapReduce("jmr1", "classpath:map.js", "classpath:reduce.js",
                                                                     new MapReduceOptions().outputCollection("jmr1_out"), ValueObject.class);
```

There is also a static import (`import static org.springframework.data.mongodb.core.mapreduce.MapReduceOptions.options;`) that can be used to make the syntax slightly more compact, as the following example shows:

```java
MapReduceResults<ValueObject> results = mongoOperations.mapReduce("jmr1", "classpath:map.js", "classpath:reduce.js",
                                                                     options().outputCollection("jmr1_out"), ValueObject.class);
```

You can also specify a query to reduce the set of data that is fed into the Map-Reduce operation.The following example removes the document that contains \[a,b\] from consideration for Map-Reduce operations:

```java
Query query = new Query(where("x").ne(new String[] { "a", "b" }));
MapReduceResults<ValueObject> results = mongoOperations.mapReduce(query, "jmr1", "classpath:map.js", "classpath:reduce.js",
                                                                     options().outputCollection("jmr1_out"), ValueObject.class);
```

Note that you can specify additional limit and sort values on the query, but you cannot skip values.
