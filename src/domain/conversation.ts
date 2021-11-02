import { v4 as uuid } from 'uuid';
import { addHandler, createEmitter, Emitter, removeHandler } from './emitter';
import { PersMessage } from './message';
import {
  createMessageGroup,
  getGroupsEarliestMessage,
  getGroupsEarliestMessageTime,
  getGroupsLatestMessage,
  getGroupsLatestMessageTime,
  insertMessageInGroup,
  PersMessageGroup,
} from './message-group';
import { OtherUser } from './user';

type PersConversationChangeListener = (conversation: PersConversation) => void;

export type ConversationType = 'command' | 'standard';

export interface PersConversation {
  id: string;
  type: ConversationType;
  users: OtherUser[];
  maskedInput: boolean;
  messageGroups: PersMessageGroup[];
  emitter: Emitter<PersConversation>;
  changeListeners: PersConversationChangeListener[];
}

const Ok = Symbol('OK');
const LaterThanAll = Symbol('LaterThanAll');
const MissingGroup = Symbol('MissingGroup');
const EarlierThanAll = Symbol('EarlierThanAll');

export function createConversation(users: OtherUser[]): PersConversation {
  return {
    id: uuid(),
    users: users,
    type: 'standard',
    maskedInput: false,
    messageGroups: [],
    changeListeners: [],
    emitter: createEmitter(),
  };
}

export function setConversationType(
  conversation: PersConversation,
  type: ConversationType
) {
  conversation.type = type;
}

export function addConversationChangeListener(
  conversation: PersConversation,
  listener: PersConversationChangeListener
): void {
  addHandler(conversation.emitter, 'change', listener);
}

export function removeConversationChangeListener(
  conversation: PersConversation,
  listener: PersConversationChangeListener
): void {
  removeHandler(conversation.emitter, 'change', listener);
}

export function triggerChange(conversation: PersConversation): void {
  conversation.messageGroups = [...conversation.messageGroups];
  conversation.emitter.handlers.get('change')?.forEach((a) => a(conversation));
}

export function fillConversation(
  conversation: PersConversation,
  messages: PersMessage[]
): void {
  const messagesCopy = [...messages];
  messagesCopy.sort((a, b) => {
    if (a.time < b.time) {
      return -1;
    }
    if (a.time > b.time) {
      return 1;
    }

    return 0;
  });

  conversation.messageGroups = messagesCopy.reduce(
    (acc, val) => {
      if (!acc.currentGroup || acc.currentGroup.userId !== val.userId) {
        acc.currentGroup = createMessageGroup(val.userId, [val]);
        acc.groups.push(acc.currentGroup);
        return acc;
      }

      insertMessageInGroup(acc.currentGroup, val);
      return acc;
    },
    {
      groups: [] as PersMessageGroup[],
      currentGroup: null as PersMessageGroup | null,
    }
  ).groups;

  triggerChange(conversation);
}

export function getConversationsEarliestMessageGroup(
  conversation: PersConversation
): PersMessageGroup {
  return conversation.messageGroups[0];
}

export function getConversationsLatestMessage(
  conversation: PersConversation
): PersMessage {
  return getGroupsLatestMessage(
    getConversationsLatestMessageGroup(conversation)
  );
}

export function getConversationsLatestMessageTime(
  conversation: PersConversation
): Date {
  return getConversationsLatestMessage(conversation).time;
}

export function getConversationsLatestMessageUser(
  conversation: PersConversation
): string {
  return getConversationsLatestMessageGroup(conversation).userId;
}

export function getConversationsLatestMessageGroup(
  conversation: PersConversation
): PersMessageGroup {
  const groupLength = conversation.messageGroups.length;
  return conversation.messageGroups[groupLength - 1];
}

export function getConversationsEarliestMessage(
  conversation: PersConversation
): PersMessage {
  const earliestGroup = getConversationsEarliestMessageGroup(conversation);
  return getGroupsEarliestMessage(earliestGroup);
}

export function getConversationsEarliestMessageTime(
  conversation: PersConversation
): Date {
  return getConversationsEarliestMessage(conversation).time;
}

export function getConversationsEarliestMessageUser(
  conversation: PersConversation
): string {
  return getConversationsEarliestMessageGroup(conversation).userId;
}

export function conversationHasMessages(
  conversation: PersConversation
): boolean {
  const group = getConversationsLatestMessageGroup(conversation);

  return !!group;
}

type GetMessageGroupAtTimeResult =
  | { state: typeof Ok; value: PersMessageGroup }
  | { state: typeof LaterThanAll; value: null }
  | { state: typeof EarlierThanAll; value: null }
  | { state: typeof MissingGroup; value: [number, number] };

export function getConversationMessageGroupAtTime(
  conversation: PersConversation,
  time: Date
): GetMessageGroupAtTimeResult {
  const latestConversationMessageTime =
    getConversationsLatestMessageTime(conversation);
  // The time can be equal if responses to commands are generated within the same
  // millisecond that the command itself was sent, which is possible ant not infrequent.
  if (time.getTime() >= latestConversationMessageTime.getTime()) {
    return { state: LaterThanAll, value: null };
  }

  for (let i = 0; i < conversation.messageGroups.length; i++) {
    const messageGroup = conversation.messageGroups[i];
    if (messageGroup.messages.length === 0) {
      continue;
    }

    const latestGroupMessageTime = getGroupsLatestMessageTime(messageGroup);

    if (time.getTime() > latestGroupMessageTime.getTime()) {
      return i === 0
        ? { state: LaterThanAll, value: null }
        : { state: MissingGroup, value: [i - 1, i] };
    }

    const earliestGroupMessageTime = getGroupsEarliestMessageTime(messageGroup);

    if (earliestGroupMessageTime > time) {
      continue;
    }

    return { state: Ok, value: messageGroup };
  }

  return { state: EarlierThanAll, value: null };
}

export function insertMessageInConversation(
  conversation: PersConversation,
  message: PersMessage
) {
  if (!conversationHasMessages(conversation)) {
    addLatestMessageGroupToConversation(
      conversation,
      createMessageGroup(message.userId, [message])
    );
  } else {
    const result = getConversationMessageGroupAtTime(
      conversation,
      message.time
    );

    switch (result.state) {
      case Ok:
        insertMessageInGroup(result.value, message);
        break;
      case LaterThanAll:
        insertLatestMessageInConversation(conversation, message);
        break;
      case EarlierThanAll:
        insertEarliestMessageInConversation(conversation, message);
        break;
      case MissingGroup: {
        const missingGroup = findMissingGroupInConversation(
          conversation,
          message,
          result.value
        );

        if (typeof missingGroup === 'number') {
          addMessageGroupToConversationAtIndex(
            conversation,
            createMessageGroup(message.userId, [message]),
            missingGroup
          );
        } else {
          insertMessageInGroup(missingGroup, message);
        }
        break;
      }
    }
  }

  triggerChange(conversation);
}

export function insertLatestMessageInConversation(
  conversation: PersConversation,
  message: PersMessage
): PersConversation {
  const latestGroup = getConversationsLatestMessageGroup(conversation);

  if (message.userId !== latestGroup.userId) {
    return addLatestMessageGroupToConversation(
      conversation,
      createMessageGroup(message.userId, [message])
    );
  }

  insertMessageInGroup(latestGroup, message);
  return conversation;
}

export function insertEarliestMessageInConversation(
  conversation: PersConversation,
  message: PersMessage
): PersConversation {
  const earliestGroup = getConversationsEarliestMessageGroup(conversation);

  if (earliestGroup.userId !== message.userId) {
    return addEarliestMessageGroupToConversation(
      conversation,
      createMessageGroup(message.userId, [message])
    );
  }

  insertMessageInGroup(earliestGroup, message);
  return conversation;
}

export function findMissingGroupInConversation(
  conversation: PersConversation,
  message: PersMessage,
  groupRangeHint: [number, number]
): PersMessageGroup | number {
  const laterGroup = conversation.messageGroups[groupRangeHint[0]];
  const earlierGroup = conversation.messageGroups[groupRangeHint[1]];

  if (laterGroup.userId === message.userId) {
    return laterGroup;
  }

  if (earlierGroup.userId === message.userId) {
    return earlierGroup;
  }

  return groupRangeHint[1];
}

export function insertMissingGroupMessageInConversation(
  conversation: PersConversation,
  message: PersMessage,
  between: [number, number]
): PersConversation {
  const laterGroup = conversation.messageGroups[between[0]];
  const earlierGroup = conversation.messageGroups[between[1]];

  if (laterGroup.userId === message.userId) {
    insertMessageInGroup(laterGroup, message);
    return conversation;
  }

  if (earlierGroup.userId === message.userId) {
    insertMessageInGroup(earlierGroup, message);
    return conversation;
  }

  const missingGroup = createMessageGroup(message.userId, [message]);

  conversation.messageGroups.splice(between[1], 0, missingGroup);
  return conversation;
}

export function addMessageGroupToConversationAtIndex(
  conversation: PersConversation,
  messageGroup: PersMessageGroup,
  index: number
): PersConversation {
  conversation.messageGroups.splice(index, 0, messageGroup);
  return conversation;
}

export function addLatestMessageGroupToConversation(
  conversation: PersConversation,
  messageGroup: PersMessageGroup
): PersConversation {
  conversation.messageGroups.push(messageGroup);
  return conversation;
}

export function addEarliestMessageGroupToConversation(
  conversation: PersConversation,
  messageGroup: PersMessageGroup
): PersConversation {
  conversation.messageGroups.unshift(messageGroup);
  return conversation;
}
