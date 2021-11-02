import React, { useCallback, useRef, useState } from 'react';
import {
  useCommandColor,
  useCommandEntryOptions,
  useController,
  useCurrentConversation,
  useSelf,
} from './ControllerContext';

export function Input() {
  const self = useSelf();
  const { controller } = useController();
  const commandColor = useCommandColor();
  const entryOptions = useCommandEntryOptions();
  const { conversation, sendMessage } = useCurrentConversation();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!e.shiftKey && e.key === 'Enter' && inputRef.current) {
        sendMessage(inputRef.current.value);
        setText('');
        return;
      }

      if (e.shiftKey && e.key === 'ArrowUp' && controller.history.length > 0) {
        let newIndex = historyIndex ?? 0;

        if (historyIndex === null) {
          newIndex = controller.history.length - 1;
        } else if (historyIndex > 0) {
          newIndex = historyIndex - 1;
        }

        setHistoryIndex(newIndex);
        setText(controller.history[newIndex]);

        // Stop the cursor from moving to the start of the line
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      if (e.shiftKey && e.key === 'ArrowDown' && historyIndex !== null) {
        if (historyIndex === controller.history.length - 1) {
          return;
        }

        setHistoryIndex(historyIndex + 1);
        setText(controller.history[historyIndex + 1]);

        // Stop the cursor from moving to the end of the line
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      setHistoryIndex(null);
    },
    [controller, conversation, sendMessage, historyIndex]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setText(value);
  }, []);

  const isCommand =
    conversation.type === 'command' ||
    text.indexOf('\\c ') === 0 ||
    !!controller.commandExecution;

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
