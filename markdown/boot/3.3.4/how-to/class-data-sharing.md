---
title: "Class Data Sharing"
source: "how-to:class-data-sharing.adoc"
---

<a id="howto.class-data-sharing"></a>

# Class Data Sharing

This section includes information about using Class Data Sharing (CDS) with Spring Boot applications.
For an overview of Spring Boot support for CDS, see [reference:packaging/class-data-sharing.adoc](../reference/packaging/class-data-sharing.md).

<a id="howto.class-data-sharing.buildpacks"></a>

## Packaging an Application Using CDS and Buildpacks

Spring Boot’s [support for Cloud Native Buildpacks](../reference/packaging/container-images/cloud-native-buildpacks.md) along with the [Paketo Java buildpack](https://paketo.io/docs/reference/java-reference) and its [Spring Boot support](https://paketo.io/docs/reference/java-reference/#spring-boot-applications) can be used to generate a Docker image containing a CDS-optimized application.

To enable CDS optimization in a generated Docker image, the buildpack environment variable `BP_JVM_CDS_ENABLED` should be set to `true` when building the image as described in the [Maven plugin](https://docs.spring.io/spring-boot/3.3.4/maven-plugin/build-image.html#build-image.examples.builder-configuration) and [Gradle plugin](https://docs.spring.io/spring-boot/3.3.4/gradle-plugin/packaging-oci-image.html#build-image.examples.builder-configuration) documentation.
This will cause the buildpack to do a training run of the application, save the CDS archive in the image, and use the CDS archive when launching the application.

The Paketo Buildpack for Spring Boot [documentation](https://github.com/paketo-buildpacks/spring-boot?tab=readme-ov-file#configuration) has information on other configuration options that can be enabled with builder environment variables, like `CDS_TRAINING_JAVA_TOOL_OPTIONS` that allows to override the default `JAVA_TOOL_OPTIONS`, only for the CDS training run.

<a id="howto.class-data-sharing.dockerfiles"></a>

## Packaging an Application Using CDS and Dockerfiles

If you don’t want to use Cloud Native Buildpacks, it is also possible to use CDS with a `Dockerfile`.
For more information about that, please see the [Dockerfiles reference documentation](../reference/packaging/container-images/dockerfiles.md#packaging.container-images.dockerfiles.cds).

<a id="howto.class-data-sharing.training-run-configuration"></a>

## Preventing Remote Services Interaction During the Training Run

When performing the training run, it may be needed to customize the Spring Boot application configuration to prevent connections to remote services that may happen before the Spring lifecycle is started.
This can typically happen with early database interactions and can be handled via related configuration that can be applied by default to your application (or specifically to the training run) to prevent such interactions, see [related documentation](https://github.com/spring-projects/spring-lifecycle-smoke-tests/blob/main/README.adoc#training-run-configuration).
