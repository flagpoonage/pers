import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  useCommandEntryOptions,
  useController,
  useCurrentConversation,
  useCurrentUser,
  useDisplayState,
} from './ControllerContext';

export function Input() {
  const self = useCurrentUser();
  const { controller } = useController();
  const entryOptions = useCommandEntryOptions();
  const cmd_color = useDisplayState((state) => state.cmd_color);
  const my_color = useDisplayState((state) => state.my_color);

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
    [controller, sendMessage, historyIndex]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    setText(value);
  }, []);

  const is_command =
    conversation.type === 'command' ||
    text.indexOf('\\c ') === 0 ||
    !!controller.commandExecution;

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }

    inputRef.current.focus();
  }, []);

  return (
    <div className="w bg-clr-dark-d2 row flex no-grow no-shrink">
      <div
        className="lh bg-clr-dark-d4 pad w-16 pad-r no-grow no-shrink ellipsis"
        style={{ color: is_command ? cmd_color : my_color }}
      >
        {is_command ? entryOptions.label ?? 'Command' : self.username}
      </div>
      <input
        style={is_command ? { color: cmd_color } : {}}
        ref={inputRef}
        type={entryOptions.mask ? 'password' : 'text'}
        className="ff w lh pad bg-clr-dark-d3 fsz font clr-white no-border no-outline"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
