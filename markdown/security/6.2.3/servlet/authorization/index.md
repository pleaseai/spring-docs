---
title: "Authorization"
source: "ROOT:servlet/authorization/index.adoc"
---

<a id="servlet-authorization"></a>

# Authorization

Having established [how users will authenticate](../authentication/index.md), you also need to configure your application’s authorization rules.

The advanced authorization capabilities within Spring Security represent one of the most compelling reasons for its popularity.
Irrespective of how you choose to authenticate (whether using a Spring Security-provided mechanism and provider or integrating with a container or other non-Spring Security authentication authority), the authorization services can be used within your application in a consistent and simple way.

You should consider attaching authorization rules to [request URIs](authorize-http-requests.md) and [methods](method-security.md) to begin.
Below there is also wealth of detail about [how Spring Security authorization works](architecture.md) and how, having established a basic model, it can be fine-tuned.
