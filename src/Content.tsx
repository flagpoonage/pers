import React from 'react';
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
  // const userList = useMemo(() => Array.from(users.values()), [users]);

  return (
    <div className="shrink grow h w rel lh">
      <style type="text/css">
        {`.message-margin {
          margin-left: calc(var(--size) - 1px);
        }`}
      </style>
      <div className="bg-clr-dark-d1 w-16 abs h"></div>
      <div className="flex abs shrink grow scroll-y h w col pad justify-end">
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
  );
}
