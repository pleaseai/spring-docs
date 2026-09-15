---
title: "View Technologies"
source: "ROOT:web/webmvc-view.adoc"
---

<a id="mvc-view"></a>

# View Technologies

[See equivalent in the Reactive stack](webflux-view.md)

The rendering of views in Spring MVC is pluggable. Whether you decide to use
Thymeleaf, Groovy Markup Templates, JSPs, or other technologies is primarily a matter of
a configuration change. This chapter covers view technologies integrated with Spring MVC.

For more context on view rendering, please see [View Resolution](webmvc/mvc-servlet/viewresolver.md).

> [!WARNING]
> The views of a Spring MVC application live within the internal trust boundaries
> of that application. Views have access to all the beans of your application context. As
> such, it is not recommended to use Spring MVC’s template support in applications where
> the templates are editable by external sources, since this can have security implications.
