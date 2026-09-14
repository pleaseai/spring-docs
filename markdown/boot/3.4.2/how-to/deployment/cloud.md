---
title: "Deploying to the Cloud"
source: "how-to:deployment/cloud.adoc"
---

<a id="howto.deployment.cloud"></a>

# Deploying to the Cloud

Spring Boot’s executable jars are ready-made for most popular cloud PaaS (Platform-as-a-Service) providers.
These providers tend to require that you “bring your own container”.
They manage application processes (not Java applications specifically), so they need an intermediary layer that adapts *your* application to the *cloud’s* notion of a running process.

Two popular cloud providers, Heroku and Cloud Foundry, employ a “buildpack” approach.
The buildpack wraps your deployed code in whatever is needed to *start* your application.
It might be a JDK and a call to `java`, an embedded web server, or a full-fledged application server.
A buildpack is pluggable, but ideally you should be able to get by with as few customizations to it as possible.
This reduces the footprint of functionality that is not under your control.
It minimizes divergence between development and production environments.

Ideally, your application, like a Spring Boot executable jar, has everything that it needs to run packaged within it.

In this section, we look at what it takes to get the [application that we developed](../../tutorial/first-application/index.md) in the “Getting Started” section up and running in the Cloud.

<a id="howto.deployment.cloud.cloud-foundry"></a>

## Cloud Foundry

Cloud Foundry provides default buildpacks that come into play if no other buildpack is specified.
The Cloud Foundry [Java buildpack](https://github.com/cloudfoundry/java-buildpack) has excellent support for Spring applications, including Spring Boot.
You can deploy stand-alone executable jar applications as well as traditional `.war` packaged applications.

Once you have built your application (by using, for example, `mvn clean package`) and have [installed the `cf` command line tool](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html), deploy your application by using the `cf push` command, substituting the path to your compiled `.jar`.
Be sure to have [logged in with your `cf` command line client](https://docs.cloudfoundry.org/cf-cli/getting-started.html#login) before pushing an application.
The following line shows using the `cf push` command to deploy an application:

```shell
$ cf push acloudyspringtime -p target/demo-0.0.1-SNAPSHOT.jar
```

> [!NOTE]
> In the preceding example, we substitute `acloudyspringtime` for whatever value you give `cf` as the name of your application.

See the [`cf push` documentation](https://docs.cloudfoundry.org/cf-cli/getting-started.html#push) for more options.
If there is a Cloud Foundry [`manifest.yml`](https://docs.cloudfoundry.org/devguide/deploy-apps/manifest.html) file present in the same directory, it is considered.

At this point, `cf` starts uploading your application, producing output similar to the following example:

```
Uploading acloudyspringtime... *OK*
Preparing to start acloudyspringtime... *OK*
-----> Downloaded app package (*8.9M*)
-----> Java Buildpack Version: v3.12 (offline) | https://github.com/cloudfoundry/java-buildpack.git#6f25b7e
-----> Downloading Open Jdk JRE
       Expanding Open Jdk JRE to .java-buildpack/open_jdk_jre (1.6s)
-----> Downloading Open JDK Like Memory Calculator 2.0.2_RELEASE from https://java-buildpack.cloudfoundry.org/memory-calculator/trusty/x86_64/memory-calculator-2.0.2_RELEASE.tar.gz (found in cache)
       Memory Settings: -Xss349K -Xmx681574K -XX:MaxMetaspaceSize=104857K -Xms681574K -XX:MetaspaceSize=104857K
-----> Downloading Container Certificate Trust Store 1.0.0_RELEASE from https://java-buildpack.cloudfoundry.org/container-certificate-trust-store/container-certificate-trust-store-1.0.0_RELEASE.jar (found in cache)
       Adding certificates to .java-buildpack/container_certificate_trust_store/truststore.jks (0.6s)
-----> Downloading Spring Auto Reconfiguration 1.10.0_RELEASE from https://java-buildpack.cloudfoundry.org/auto-reconfiguration/auto-reconfiguration-1.10.0_RELEASE.jar (found in cache)
Checking status of app 'acloudyspringtime'...
  0 of 1 instances running (1 starting)
  ...
  0 of 1 instances running (1 starting)
  ...
  0 of 1 instances running (1 starting)
  ...
  1 of 1 instances running (1 running)

App started
```

Congratulations! The application is now live!

Once your application is live, you can verify the status of the deployed application by using the `cf apps` command, as shown in the following example:

```shell
$ cf apps
Getting applications in ...
OK

name                 requested state   instances   memory   disk   urls
...
acloudyspringtime    started           1/1         512M     1G     acloudyspringtime.cfapps.io
...
```

Once Cloud Foundry acknowledges that your application has been deployed, you should be able to find the application at the URI given.
In the preceding example, you could find it at `https://acloudyspringtime.cfapps.io/`.

<a id="howto.deployment.cloud.cloud-foundry.binding-to-services"></a>

### Binding to Services

By default, metadata about the running application as well as service connection information is exposed to the application as environment variables (for example: `$VCAP_SERVICES`).
This architecture decision is due to Cloud Foundry’s polyglot (any language and platform can be supported as a buildpack) nature.
Process-scoped environment variables are language agnostic.

Environment variables do not always make for the easiest API, so Spring Boot automatically extracts them and flattens the data into properties that can be accessed through Spring’s [`Environment`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/env/Environment.html) abstraction, as shown in the following example:

#### Java

```java
import org.springframework.context.EnvironmentAware;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class MyBean implements EnvironmentAware {

	private String instanceId;

	@Override
	public void setEnvironment(Environment environment) {
		this.instanceId = environment.getProperty("vcap.application.instance_id");
	}

	// ...

}
```

#### Kotlin

```kotlin
import org.springframework.context.EnvironmentAware
import org.springframework.core.env.Environment
import org.springframework.stereotype.Component

@Component
class MyBean : EnvironmentAware {

	private var instanceId: String? = null

	override fun setEnvironment(environment: Environment) {
		instanceId = environment.getProperty("vcap.application.instance_id")
	}

	// ...

}
```

All Cloud Foundry properties are prefixed with `vcap`.
You can use `vcap` properties to access application information (such as the public URL of the application) and service information (such as database credentials).
See the [`CloudFoundryVcapEnvironmentPostProcessor`](https://docs.spring.io/spring-boot/3.4.2/api/java/org/springframework/boot/cloud/CloudFoundryVcapEnvironmentPostProcessor.html) API documentation for complete details.

> [!TIP]
> The [Java CFEnv](https://github.com/pivotal-cf/java-cfenv/) project is a better fit for tasks such as configuring a DataSource.

<a id="howto.deployment.cloud.kubernetes"></a>

## Kubernetes

Spring Boot auto-detects Kubernetes deployment environments by checking the environment for `"*_SERVICE_HOST"` and `"*_SERVICE_PORT"` variables.
You can override this detection with the `spring.main.cloud-platform` configuration property.

Spring Boot helps you to [manage the state of your application](../../reference/features/spring-application.md#features.spring-application.application-availability) and export it with [HTTP Kubernetes Probes using Actuator](../../reference/actuator/endpoints.md#actuator.endpoints.kubernetes-probes).

<a id="howto.deployment.cloud.kubernetes.container-lifecycle"></a>

### Kubernetes Container Lifecycle

When Kubernetes deletes an application instance, the shutdown process involves several subsystems concurrently: shutdown hooks, unregistering the service, removing the instance from the load-balancer…​
Because this shutdown processing happens in parallel (and due to the nature of distributed systems), there is a window during which traffic can be routed to a pod that has also begun its shutdown processing.

You can configure a sleep execution in a preStop handler to avoid requests being routed to a pod that has already begun shutting down.
This sleep should be long enough for new requests to stop being routed to the pod and its duration will vary from deployment to deployment.
The preStop handler can be configured by using the PodSpec in the pod’s configuration file as follows:

```yaml
spec:
  containers:
  - name: "example-container"
    image: "example-image"
    lifecycle:
      preStop:
        exec:
          command: ["sh", "-c", "sleep 10"]
```

Once the pre-stop hook has completed, SIGTERM will be sent to the container and [graceful shutdown](../../reference/web/graceful-shutdown.md) will begin, allowing any remaining in-flight requests to complete.

> [!NOTE]
> When Kubernetes sends a SIGTERM signal to the pod, it waits for a specified time called the termination grace period (the default for which is 30 seconds).
> If the containers are still running after the grace period, they are sent the SIGKILL signal and forcibly removed.
> If the pod takes longer than 30 seconds to shut down, which could be because you have increased `spring.lifecycle.timeout-per-shutdown-phase`, make sure to increase the termination grace period by setting the `terminationGracePeriodSeconds` option in the Pod YAML.

<a id="howto.deployment.cloud.heroku"></a>

## Heroku

Heroku is another popular PaaS platform.
To customize Heroku builds, you provide a `Procfile`, which provides the incantation required to deploy an application.
Heroku assigns a `port` for the Java application to use and then ensures that routing to the external URI works.

You must configure your application to listen on the correct port.
The following example shows the `Procfile` for our starter REST application:

```
web: java -Dserver.port=$PORT -jar target/demo-0.0.1-SNAPSHOT.jar
```

Spring Boot makes `-D` arguments available as properties accessible from a Spring [`Environment`](https://docs.spring.io/spring-framework/docs/6.2.x/javadoc-api/org/springframework/core/env/Environment.html) instance.
The `server.port` configuration property is fed to the embedded Tomcat, Jetty, or Undertow instance, which then uses the port when it starts up.
The `$PORT` environment variable is assigned to us by the Heroku PaaS.

This should be everything you need.
The most common deployment workflow for Heroku deployments is to `git push` the code to production, as shown in the following example:

```shell
$ git push heroku main
```

Which will result in the following:

```
Initializing repository, *done*.
Counting objects: 95, *done*.
Delta compression using up to 8 threads.
Compressing objects: 100% (78/78), *done*.
Writing objects: 100% (95/95), 8.66 MiB | 606.00 KiB/s, *done*.
Total 95 (delta 31), reused 0 (delta 0)

-----> Java app detected
-----> Installing OpenJDK... *done*
-----> Installing Maven... *done*
-----> Installing settings.xml... *done*
-----> Executing: mvn -B -DskipTests=true clean install

       [INFO] Scanning for projects...
       Downloading: https://repo.spring.io/...
       Downloaded: https://repo.spring.io/... (818 B at 1.8 KB/sec)
		....
       Downloaded: https://s3pository.heroku.com/jvm/... (152 KB at 595.3 KB/sec)
       [INFO] Installing /tmp/build_0c35a5d2-a067-4abc-a232-14b1fb7a8229/target/...
       [INFO] Installing /tmp/build_0c35a5d2-a067-4abc-a232-14b1fb7a8229/pom.xml ...
       [INFO] ------------------------------------------------------------------------
       [INFO] *BUILD SUCCESS*
       [INFO] ------------------------------------------------------------------------
       [INFO] Total time: 59.358s
       [INFO] Finished at: Fri Mar 07 07:28:25 UTC 2014
       [INFO] Final Memory: 20M/493M
       [INFO] ------------------------------------------------------------------------

-----> Discovering process types
       Procfile declares types -> *web*

-----> Compressing... *done*, 70.4MB
-----> Launching... *done*, v6
       https://agile-sierra-1405.herokuapp.com/ *deployed to Heroku*

To git@heroku.com:agile-sierra-1405.git
 * [new branch]      main -> main
```

Your application should now be up and running on Heroku.
For more details, see [Deploying Spring Boot Applications to Heroku](https://devcenter.heroku.com/articles/deploying-spring-boot-apps-to-heroku).

<a id="howto.deployment.cloud.openshift"></a>

## OpenShift

[OpenShift](https://www.openshift.com/) has many resources describing how to deploy Spring Boot applications, including:

- [Using the S2I builder](https://blog.openshift.com/using-openshift-enterprise-grade-spring-boot-deployments/)
- [Architecture guide](https://access.redhat.com/documentation/en-us/reference_architectures/2017/html-single/spring_boot_microservices_on_red_hat_openshift_container_platform_3/)
- [Running as a traditional web application on Wildfly](https://blog.openshift.com/using-spring-boot-on-openshift/)
- [OpenShift Commons Briefing](https://blog.openshift.com/openshift-commons-briefing-96-cloud-native-applications-spring-rhoar/)

<a id="howto.deployment.cloud.aws"></a>

## Amazon Web Services (AWS)

Amazon Web Services offers multiple ways to install Spring Boot-based applications, either as traditional web applications (war) or as executable jar files with an embedded web server.
The options include:

- AWS Elastic Beanstalk
- AWS Code Deploy
- AWS OPS Works
- AWS Cloud Formation
- AWS Container Registry

Each has different features and pricing models.
In this document, we describe to approach using AWS Elastic Beanstalk.

<a id="howto.deployment.cloud.aws.beanstalk"></a>

### AWS Elastic Beanstalk

As described in the official [Elastic Beanstalk Java guide](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_Java.html), there are two main options to deploy a Java application.
You can either use the “Tomcat Platform” or the “Java SE platform”.

<a id="howto.deployment.cloud.aws.beanstalk.tomcat-platform"></a>

#### Using the Tomcat Platform

This option applies to Spring Boot projects that produce a war file.
No special configuration is required.
You need only follow the official guide.

<a id="howto.deployment.cloud.aws.beanstalk.java-se-platform"></a>

#### Using the Java SE Platform

This option applies to Spring Boot projects that produce a jar file and run an embedded web container.
Elastic Beanstalk environments run an nginx instance on port 80 to proxy the actual application, running on port 5000.
To configure it, add the following line to your `application.properties` file:

#### Properties

```properties
server.port=5000
```

#### YAML

```yaml
server:
  port: 5000
```

> [!TIP]
> By default, Elastic Beanstalk uploads sources and compiles them in AWS.
> However, it is best to upload the binaries instead.
> To do so, add lines similar to the following to your `.elasticbeanstalk/config.yml` file:
>
> ```xml
> deploy:
> 	artifact: target/demo-0.0.1-SNAPSHOT.jar
> ```

> [!TIP]
> By default an Elastic Beanstalk environment is load balanced.
> The load balancer has a significant cost.
> To avoid that cost, set the environment type to “Single instance”, as described in [the Amazon documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/environments-create-wizard.html#environments-create-wizard-capacity).
> You can also create single instance environments by using the CLI and the following command:
>
> ```
> eb create -s
> ```

<a id="howto.deployment.cloud.aws.summary"></a>

### Summary

This is one of the easiest ways to get to AWS, but there are more things to cover, such as how to integrate Elastic Beanstalk into any CI / CD tool, use the Elastic Beanstalk Maven plugin instead of the CLI, and others.
There is a [blog post](https://exampledriven.wordpress.com/2017/01/09/spring-boot-aws-elastic-beanstalk-example/) covering these topics more in detail.

<a id="howto.deployment.cloud.boxfuse"></a>

## CloudCaptain and Amazon Web Services

[CloudCaptain](https://cloudcaptain.sh/) works by turning your Spring Boot executable jar or war into a minimal VM image that can be deployed unchanged either on VirtualBox or on AWS.
CloudCaptain comes with deep integration for Spring Boot and uses the information from your Spring Boot configuration file to automatically configure ports and health check URLs.
CloudCaptain leverages this information both for the images it produces as well as for all the resources it provisions (instances, security groups, elastic load balancers, and so on).

Once you have created a [CloudCaptain account](https://console.cloudcaptain.sh), connected it to your AWS account, installed the latest version of the CloudCaptain Client, and ensured that the application has been built by Maven or Gradle (by using, for example, `mvn clean package`), you can deploy your Spring Boot application to AWS with a command similar to the following:

```shell
$ boxfuse run myapp-1.0.jar -env=prod
```

See the [`boxfuse run` documentation](https://cloudcaptain.sh/docs/commandline/run.html) for more options.
If there is a [`boxfuse.conf`](https://cloudcaptain.sh/docs/commandline/#configuration) file present in the current directory, it is considered.

> [!TIP]
> By default, CloudCaptain activates a Spring profile named `boxfuse` on startup.
> If your executable jar or war contains an [`application-boxfuse.properties`](https://cloudcaptain.sh/docs/payloads/springboot.html#configuration) file, CloudCaptain bases its configuration on the properties it contains.

At this point, CloudCaptain creates an image for your application, uploads it, and configures and starts the necessary resources on AWS, resulting in output similar to the following example:

```
Fusing Image for myapp-1.0.jar ...
Image fused in 00:06.838s (53937 K) -> axelfontaine/myapp:1.0
Creating axelfontaine/myapp ...
Pushing axelfontaine/myapp:1.0 ...
Verifying axelfontaine/myapp:1.0 ...
Creating Elastic IP ...
Mapping myapp-axelfontaine.boxfuse.io to 52.28.233.167 ...
Waiting for AWS to create an AMI for axelfontaine/myapp:1.0 in eu-central-1 (this may take up to 50 seconds) ...
AMI created in 00:23.557s -> ami-d23f38cf
Creating security group boxfuse-sg_axelfontaine/myapp:1.0 ...
Launching t2.micro instance of axelfontaine/myapp:1.0 (ami-d23f38cf) in eu-central-1 ...
Instance launched in 00:30.306s -> i-92ef9f53
Waiting for AWS to boot Instance i-92ef9f53 and Payload to start at https://52.28.235.61/ ...
Payload started in 00:29.266s -> https://52.28.235.61/
Remapping Elastic IP 52.28.233.167 to i-92ef9f53 ...
Waiting 15s for AWS to complete Elastic IP Zero Downtime transition ...
Deployment completed successfully. axelfontaine/myapp:1.0 is up and running at https://myapp-axelfontaine.boxfuse.io/
```

Your application should now be up and running on AWS.

See the blog post on [deploying Spring Boot apps on EC2](https://cloudcaptain.sh/blog/spring-boot-ec2.html) as well as the [documentation for the CloudCaptain Spring Boot integration](https://cloudcaptain.sh/docs/payloads/springboot.html) to get started with a Maven build to run the app.

<a id="howto.deployment.cloud.azure"></a>

## Azure

This [Getting Started guide](https://spring.io/guides/gs/spring-boot-for-azure/) walks you through deploying your Spring Boot application to either [Azure Spring Cloud](https://azure.microsoft.com/en-us/services/spring-cloud/) or [Azure App Service](https://docs.microsoft.com/en-us/azure/app-service/overview).

<a id="howto.deployment.cloud.google"></a>

## Google Cloud

Google Cloud has several options that can be used to launch Spring Boot applications.
The easiest to get started with is probably App Engine, but you could also find ways to run Spring Boot in a container with Container Engine or on a virtual machine with Compute Engine.

To deploy your first app to App Engine standard environment, follow [this tutorial](https://codelabs.developers.google.com/codelabs/cloud-app-engine-springboot#0).

Alternatively, App Engine Flex requires you to create an `app.yaml` file to describe the resources your app requires.
Normally, you put this file in `src/main/appengine`, and it should resemble the following file:

```yaml
service: "default"

runtime: "java17"
env: "flex"

handlers:
- url: "/.*"
  script: "this field is required, but ignored"

manual_scaling:
  instances: 1

health_check:
  enable_health_check: false

env_variables:
  ENCRYPT_KEY: "your_encryption_key_here"
```

You can deploy the app (for example, with a Maven plugin) by adding the project ID to the build configuration, as shown in the following example:

```xml
<plugin>
	<groupId>com.google.cloud.tools</groupId>
	<artifactId>appengine-maven-plugin</artifactId>
	<version>2.4.4</version>
	<configuration>
		<project>myproject</project>
	</configuration>
</plugin>
```

Then deploy with `mvn appengine:deploy` (you need to authenticate first, otherwise the build fails).
