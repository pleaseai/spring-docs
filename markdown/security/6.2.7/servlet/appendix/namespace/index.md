---
title: "The Security Namespace"
source: "ROOT:servlet/appendix/namespace/index.adoc"
---

<a id="appendix-namespace"></a>

# The Security Namespace

This appendix provides a reference to the elements available in the security namespace and information on the underlying beans they create (a knowledge of the individual classes and how they work together is assumed - you can find more information in the project Javadoc and elsewhere in this document).
If you haven’t used the namespace before, please read the [introductory chapter](../../configuration/xml-namespace.md#ns-config) on namespace configuration, as this is intended as a supplement to the information there.
Using a good quality XML editor while editing a configuration based on the schema is recommended as this will provide contextual information on which elements and attributes are available as well as comments explaining their purpose.
The namespace is written in [RELAX NG](https://relaxng.org/) Compact format and later converted into an XSD schema.
If you are familiar with this format, you may wish to examine the [schema file](https://raw.githubusercontent.com/spring-projects/spring-security/main/config/src/main/resources/org/springframework/security/config/spring-security-6.2.rnc) directly.
