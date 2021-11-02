open Web

let get_root = () => {
  let existing_el = Document.getElementById(Document.document, "root")

  switch existing_el {
  | None => {
      let new_element = Document.createElement(Document.document, "div")
      Element.setAttribute(new_element, "id", "root")
      Element.appendChild(Document.document->Document.body, new_element)
      new_element
    }
  | Some(el) => el
  }
}

ReactDOM.render(<Main />, get_root())
