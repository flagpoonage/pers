import React from 'react';
import * as ReactDOM from 'react-dom';
import { App } from './App';

const root_id = 'root';

function getRoot() {
  const existing_el = document.getElementById(root_id);

  if (existing_el) {
    return existing_el;
  }

  const el = document.createElement('div');
  el.id = root_id;
  document.body.appendChild(el);

  return el;
}

const Ws = new WebSocket('ws://localhost:4444');

Ws.onerror = function (e) {
  console.error(e);
};

Ws.onmessage = function (ev) {
  console.log('Message', ev);
};

Ws.onclose = function (ev) {
  console.log('Closing', ev);
};

ReactDOM.render(<App />, getRoot());
