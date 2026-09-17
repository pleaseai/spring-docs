---
title: "Understanding Vectors"
source: "ROOT:api/vectordbs/understand-vectordbs.adoc"
---

<a id="understand-vector-databases"></a>

# Understanding Vectors

![vector 2d coordinates](https://raw.githubusercontent.com/spring-projects/spring-ai/v2.0.1/spring-ai-docs/src/main/antora/modules/ROOT/images/vector_2d_coordinates.png)

Vectors have dimensionality and a direction.
For example, the following image depicts a two-dimensional vector $\vec{a}$ in the cartesian coordinate system pictured as an arrow.

The head of the vector $\vec{a}$ is at the point $(a_1, a_2)$.
The **x** coordinate value is $a_1$ and the **y** coordinate value is $a_2$. The coordinates are also referred to as the components of the vector.

<a id="vectordbs-similarity"></a>

## Similarity

Several mathematical formulas can be used to determine if two vectors are similar.
One of the most intuitive to visualize and understand is cosine similarity.
Consider the following images that show three sets of graphs:

![vector similarity](https://raw.githubusercontent.com/spring-projects/spring-ai/v2.0.1/spring-ai-docs/src/main/antora/modules/ROOT/images/vector_similarity.png)

The vectors $\vec{A}$ and $\vec{B}$ are considered similar, when they are pointing close to each other, as in the first diagram.
The vectors are considered unrelated when pointing perpendicular to each other and opposite when they point away from each other.

The angle between them, $\theta$, is a good measure of their similarity.
How can the angle $\theta$ be computed?

![pythagorean triangle](https://raw.githubusercontent.com/spring-projects/spring-ai/v2.0.1/spring-ai-docs/src/main/antora/modules/ROOT/images/pythagorean-triangle.png)

We are all familiar with the [Pythagorean Theorem](https://en.wikipedia.org/wiki/Pythagorean_theorem#History).

What about when the angle between **a** and **b** is not 90 degrees?

Enter the [Law of cosines](https://en.wikipedia.org/wiki/Law_of_cosines).

#### Law of Cosines

> $a^2 + b^2 - 2ab\cos\theta = c^2$

The following image shows this approach as a vector diagram:
![lawofcosines](https://raw.githubusercontent.com/spring-projects/spring-ai/v2.0.1/spring-ai-docs/src/main/antora/modules/ROOT/images/lawofcosines.png)

The magnitude of this vector is defined in terms of its components as:

#### Magnitude

> $\vec{A} * \vec{A} = ||\vec{A}||^2 = A_1^2 + A_2^2 $

The dot product between two vectors $\vec{A}$ and $\vec{B}$ is defined in terms of its components as:

#### Dot Product

> $\vec{A} * \vec{B} = A_1B_1 + A_2B_2$

Rewriting the Law of Cosines with vector magnitudes and dot products gives the following:

#### Law of Cosines in Vector form

> $||\vec{A}||^2 + ||\vec{B}||^2 - 2||\vec{A}||||\vec{B}||\cos\theta = ||\vec{C}||^2$

Replacing $||\vec{C}||^2$ with $||\vec{B} - \vec{A}||^2$ gives the following:

#### Law of Cosines in Vector form only in terms of $\vec{A}$ and $\vec{B}$

> $||\vec{A}||^2 + ||\vec{B}||^2 - 2||\vec{A}||||\vec{B}||\cos\theta = ||\vec{B} - \vec{A}||^2$

[Expanding this out](https://towardsdatascience.com/cosine-similarity-how-does-it-measure-the-similarity-maths-behind-and-usage-in-python-50ad30aad7db) gives us the formula for [Cosine Similarity](https://en.wikipedia.org/wiki/Cosine_similarity).

#### Cosine Similarity

> $similarity(vec{A},vec{B}) = \cos(\theta) = \frac{\vec{A}\cdot\vec{B}}{||\vec{A}\||\cdot||\vec{B}||$

This formula works for dimensions higher than 2 or 3, though it is hard to visualize. However, [it can be visualized to some extent](https://projector.tensorflow.org/).
It is common for vectors in AI/ML applications to have hundreds or even thousands of dimensions.

The similarity function in higher dimensions using the components of the vector is shown below.
It expands the two-dimensional definitions of Magnitude and Dot Product given previously to **N** dimensions by using [Summation mathematical syntax](https://en.wikipedia.org/wiki/Summation).

#### Cosine Similarity with vector components

> $similarity(vec{A},vec{B}) = \cos(\theta) = \frac{ \sum_{i=1}^{n} {A_i  B_i} }{ \sqrt{\sum_{i=1}^{n}{A_i^2} \cdot \sum_{i=1}^{n}{B_i^2}}$

This is the key formula used in the simple implementation of a vector store and can be found in the `SimpleVectorStore` implementation - applicable for testing and demonstration purposes only.
