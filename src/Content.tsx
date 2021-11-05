import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { formatMessageTime } from './domain/message';
import {
  useController,
  useCurrentConversationMessageGroups,
  useDisplayState,
  useUsersState,
} from './ControllerContext';
import { getCurrentUser } from './domain/agents/remote-server.agent';
import { SystemUser } from './domain/system';

export function Content() {
  const { controller } = useController();
  const messageGroups = useCurrentConversationMessageGroups();

  const cmd_color = useDisplayState((state) => state.cmd_color);
  const sys_color = useDisplayState((state) => state.sys_color);
  const my_color = useDisplayState((state) => state.my_color);

  const users = useUsersState((state) => state.users);
  const self = getCurrentUser(controller);

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
              group.user_id === self.user_id ? self : users.get(group.user_id);

            const user_color =
              group.user_id === self.user_id
                ? my_color
                : group.user_id === SystemUser.user_id
                ? sys_color
                : users.get(group.user_id)?.user_color ?? 'white';

            return (
              <div key={group.id} className={`pad-y2 clr-white-d5`}>
                <div
                  className={`no-shrink no-grow w-14 ellipsis`}
                  style={{ color: user_color }}
                >
                  {user?.username}
                </div>
                {group.messages.map((message) => (
                  <div key={message.id} className="flex row">
                    <div className="no-shrink no-grow w-14 clr-white-d5 ellipsis">
                      {formatMessageTime(message)}
                    </div>
                    <div
                      className="message-margin pad-l ws-preserve"
                      style={{
                        borderLeft: `dashed 1px ${user_color ?? 'transparent'}`,
                        color: message.is_command ? cmd_color : 'inherit',
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
