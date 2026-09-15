---
title: "Bean References"
source: "ROOT:core/expressions/language-ref/bean-references.adoc"
---

<a id="expressions-bean-references"></a>

# Bean References

If the evaluation context has been configured with a bean resolver, you can look up beans
from an expression by using the `@` symbol as a prefix. The following example shows how
to do so:

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
StandardEvaluationContext context = new StandardEvaluationContext();
context.setBeanResolver(new MyBeanResolver());

// This will end up calling resolve(context, "someBean") on MyBeanResolver
// during evaluation.
Object bean = parser.parseExpression("@someBean").getValue(context);
```

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val context = StandardEvaluationContext()
context.setBeanResolver(MyBeanResolver())

// This will end up calling resolve(context, "someBean") on MyBeanResolver
// during evaluation.
val bean = parser.parseExpression("@someBean").getValue(context)
```

> [!NOTE]
> If a bean name contains a dot (`.`) or other special characters, you must provide the
> name of the bean as a *string literal* – for example, `@'order.service'`.

To access a factory bean itself, you should instead prefix the bean name with an `&`
symbol. The following example shows how to do so:

#### Java

```java
ExpressionParser parser = new SpelExpressionParser();
StandardEvaluationContext context = new StandardEvaluationContext();
context.setBeanResolver(new MyBeanResolver());

// This will end up calling resolve(context, "&someFactoryBean") on
// MyBeanResolver during evaluation.
Object factoryBean = parser.parseExpression("&someFactoryBean").getValue(context);
```

#### Kotlin

```kotlin
val parser = SpelExpressionParser()
val context = StandardEvaluationContext()
context.setBeanResolver(MyBeanResolver())

// This will end up calling resolve(context, "&someFactoryBean") on
// MyBeanResolver during evaluation.
val factoryBean = parser.parseExpression("&someFactoryBean").getValue(context)
```
