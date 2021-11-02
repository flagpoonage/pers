import React, { useCallback, useRef, useState } from 'react';
import {
  useCommandColor,
  useCommandEntryOptions,
  useCurrentConversation,
  useSelf,
} from './ControllerContext';
import { createMessage } from './domain/message';

export function Input() {
  const commandColor = useCommandColor();
  const entryOptions = useCommandEntryOptions();
  const { conversation, sendMessage } = useCurrentConversation();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // const [isMasked] = useState(false);
  const self = useSelf();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!e.shiftKey && e.key === 'Enter' && inputRef.current) {
        sendMessage(inputRef.current.value);
        setText('');
      }
    },
    [conversation, sendMessage]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setText(value);
  }, []);

  const isCommand =
    conversation.type === 'command' || text.indexOf('\\c ') === 0;

  return (
    <div className="w bg-clr-dark-d2 row flex no-grow no-shrink">
      <div
        className="lh bg-clr-dark-d5 pad w-16 pad-r no-grow no-shrink ellipsis"
        style={{ color: isCommand ? commandColor : self.userColor }}
      >
        {isCommand ? entryOptions.label ?? 'Command' : self.userName}
      </div>
      <input
        style={isCommand ? { color: commandColor } : {}}
        ref={inputRef}
        type={entryOptions.mask ? 'password' : 'text'}
        className="ff w lh pad bg-clr-dark-d1 fsz font clr-white no-border no-outline"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
