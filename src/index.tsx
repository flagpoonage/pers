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

ReactDOM.render(<App />, getRoot());
