import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatMessageTime } from './domain/message';
import {
  useAvailableUsers,
  useCommandColor,
  useCurrentConversationMessageGroups,
  useSelf,
} from './ControllerContext';

export function Content() {
  const messageGroups = useCurrentConversationMessageGroups();
  const commandColor = useCommandColor();
  const users = useAvailableUsers();
  const self = useSelf();

  const isMaximumScroll = useRef(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentFitsInScreen, setContentFitsInScreen] = useState(true);

  useLayoutEffect(() => {
    if (
      containerRef.current &&
      contentRef.current &&
      containerRef.current.clientHeight < contentRef.current.scrollHeight
    ) {
      if (contentFitsInScreen) {
        setContentFitsInScreen(false);
      }
    } else {
      setContentFitsInScreen(true);
    }
  }, [contentFitsInScreen, messageGroups]);

  useEffect(() => {
    if (containerRef.current && !contentFitsInScreen) {
      // If the class hasn't yet been removed by React we need to remove
      // it manually so that we can trigger the scroll.
      containerRef.current.classList.remove('justify-end');
      isMaximumScroll.current && containerRef.current.scrollTo({ top: 10000 });
    }
  }, [contentFitsInScreen, messageGroups]);

  const containerClass = `flex abs pad-x scroll-y h w col ${
    contentFitsInScreen ? 'justify-end' : ''
  }`;

  const handleScroll = () => {
    if (!containerRef.current) {
      return;
    }

    if (
      containerRef.current.clientHeight + containerRef.current.scrollTop >=
      containerRef.current.scrollHeight - 10
    ) {
      isMaximumScroll.current = true;
    } else {
      isMaximumScroll.current = false;
    }
  };

  return (
    <div className="shrink grow h w rel lh">
      <style type="text/css">
        {`.message-margin {
          margin-left: calc(var(--size) - 1px);
        }`}
      </style>
      <div className="bg-clr-dark-d1 w-16 abs h"></div>
      <div
        ref={containerRef}
        className={containerClass}
        onScroll={handleScroll}
      >
        <div ref={contentRef}>
          {messageGroups.map((group) => {
            const user =
              group.userId === self.userId ? self : users.get(group.userId);
            return (
              <div key={group.id} className={`pad-y2 clr-white-d5`}>
                <div
                  className={`no-shrink no-grow w-14 ${
                    group.userId === self.userId ? 'clr-trim' : ''
                  } ellipsis`}
                  style={
                    group.userId === self.userId
                      ? { color: self.userColor }
                      : { color: users.get(group.userId)?.userColor }
                  }
                >
                  {user?.userName}
                </div>
                {group.messages.map((message) => (
                  <div key={message.id} className="flex row">
                    <div className="no-shrink no-grow w-14 clr-white-d5 ellipsis">
                      {formatMessageTime(message)}
                    </div>
                    <div
                      className="message-margin pad-l ws-preserve"
                      style={{
                        borderLeft: `dashed 1px ${
                          user?.userColor ?? 'transparent'
                        }`,
                        color: message.isCommand ? commandColor : 'inherit',
                      }}
                    >
                      {message.message}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
