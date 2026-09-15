---
title: "XML Marshalling"
source: "ROOT:web/webmvc-view/mvc-xml-marshalling.adoc"
---

<a id="mvc-view-xml-marshalling"></a>

# XML Marshalling

The `MarshallingView` uses an XML `Marshaller` (defined in the `org.springframework.oxm`
package) to render the response content as XML. You can explicitly set the object to be
marshalled by using a `MarshallingView` instance’s `modelKey` bean property. Alternatively,
the view iterates over all model properties and marshals the first type that is supported
by the `Marshaller`. For more information on the functionality in the
`org.springframework.oxm` package, see [Marshalling XML using O/X Mappers](../../data-access/oxm.md).
