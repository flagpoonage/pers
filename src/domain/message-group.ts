import { PersMessage } from './message';
import { v4 as uuid } from 'uuid';

export interface PersMessageGroup {
  id: string;
  userId: string;
  messages: PersMessage[];
}

export function createMessageGroup(
  user: string,
  messages?: PersMessage[]
): PersMessageGroup {
  if (messages?.find((a) => a.userId !== user)) {
    throw new Error(
      'Trying to create a message group with messages from multiple users'
    );
  }

  return {
    id: uuid(),
    userId: user,
    messages: messages ?? [],
  };
}

export function getGroupsEarliestMessage(
  messageGroup: PersMessageGroup
): PersMessage {
  return messageGroup.messages[0];
}

export function getGroupsLatestMessage(
  messageGroup: PersMessageGroup
): PersMessage {
  const messagesCount = messageGroup.messages.length;
  return messageGroup.messages[messagesCount - 1];
}

export function getGroupsLatestMessageTime(
  messageGroup: PersMessageGroup
): Date {
  return getGroupsLatestMessage(messageGroup).time;
}

export function getGroupsEarliestMessageTime(
  messageGroup: PersMessageGroup
): Date {
  return getGroupsEarliestMessage(messageGroup).time;
}

export function insertMessageInGroup(
  messageGroup: PersMessageGroup,
  messageToInsert: PersMessage
): PersMessageGroup {
  const messages = messageGroup.messages;
  for (let i = 0; i < messages.length; i++) {
    const existingMessage = messages[i];

    if (existingMessage.time > messageToInsert.time) {
      messageGroup.messages.splice(i, 0, messageToInsert);
      return messageGroup;
    }
  }

  messageGroup.messages.push(messageToInsert);
  return messageGroup;
}
