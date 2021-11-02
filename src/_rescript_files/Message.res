type rec t = {
  text: string,
  from: string,
  time: Js.Date.t,
}

@react.component
let make = (~message: t) => {
  <div className="xf"> {React.string(message.text)} </div>
}
