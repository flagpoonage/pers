import { PersMessage } from './message';
import { v4 as uuid } from 'uuid';

export interface PersMessageGroup {
  id: string;
  user_id: string;
  messages: PersMessage[];
}

export function createMessageGroup(
  user: string,
  messages?: PersMessage[]
): PersMessageGroup {
  if (messages?.find((a) => a.user_id !== user)) {
    throw new Error(
      'Trying to create a message group with messages from multiple users'
    );
  }

  return {
    id: uuid(),
    user_id: user,
    messages: messages ?? [],
  };
}

export function getGroupsEarliestMessage(
  message_group: PersMessageGroup
): PersMessage {
  return message_group.messages[0];
}

export function getGroupsLatestMessage(
  message_group: PersMessageGroup
): PersMessage {
  const messages_count = message_group.messages.length;
  return message_group.messages[messages_count - 1];
}

export function getGroupsLatestMessageTime(
  message_group: PersMessageGroup
): Date {
  return getGroupsLatestMessage(message_group).time;
}

export function getGroupsEarliestMessageTime(
  message_group: PersMessageGroup
): Date {
  return getGroupsEarliestMessage(message_group).time;
}

export function insertMessageInGroup(
  message_group: PersMessageGroup,
  message_to_insert: PersMessage
): PersMessageGroup {
  const messages = message_group.messages;
  for (let i = 0; i < messages.length; i++) {
    const existingMessage = messages[i];

    if (existingMessage.time > message_to_insert.time) {
      message_group.messages.splice(i, 0, message_to_insert);
      return message_group;
    }
  }

  message_group.messages.push(message_to_insert);
  return message_group;
}
