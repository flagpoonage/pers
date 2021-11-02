import React from 'react';
import { Content } from './Content';
import { Input } from './Input';
import { ControllerProvider } from './ControllerContext';

export function App() {
  return (
    <ControllerProvider>
      <div className="flex col h">
        <Content />
        <Input />
      </div>
    </ControllerProvider>
  );
}
