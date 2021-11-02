let s: array<Message.t> = [
  {
    text: "hello",
    from: "James",
    time: Js.Date.make(),
  },
]

@react.component
let make = () => {
  let (messages, setMessages) = React.useState(() => s)
  let items = messages->Js_array2.map(message => {
    <Message message />
  })

  <div className="wh"> {React.array(items)} </div>
}
