module Document = {
  @val external document: Dom.document = "document"
  @get external body: Dom.document => Dom.element = "body"

  @send @return(nullable)
  external getElementById: (Dom.document, string) => option<Dom.element> = "getElementById"

  @send external createElement: (Dom.document, string) => Dom.element = "createElement"
}

module Element = {
  @val external element: Dom.element = "element"

  @send external setAttribute: (Dom.element, string, string) => unit = "setAttribute"
  @send external appendChild: (Dom.element, Dom.element) => unit = "appendChild"
}
