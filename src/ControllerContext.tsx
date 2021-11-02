import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  PersController,
  createController,
  unwatchControllerEvent,
  watchControllerEvent,
  getCurrentConversationFromController,
  sendMessageToController,
} from './domain/controller';
import {
  addConversationChangeListener,
  PersConversation,
  removeConversationChangeListener,
} from './domain/conversation';
import { PersMessageGroup } from './domain/message-group';

const ControllerContext = React.createContext<PersController | null>(null);

export function ControllerProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const controller = useRef(createController());

  return (
    <ControllerContext.Provider value={controller.current}>
      {children}
    </ControllerContext.Provider>
  );
}

export function useController() {
  const controller = useContext(ControllerContext);

  if (!controller) {
    throw new Error(
      'Using [useCurrentConversation] outside of <ControllerProvider>'
    );
  }

  const sendMessage = useCallback(
    (message: string) => {
      sendMessageToController(controller, message);
    },
    [controller]
  );

  return { controller, sendMessage };
}

export function useCurrentConversation() {
  const { controller } = useController();

  const [currentConversation, setCurrentConversation] = useState(
    getCurrentConversationFromController(controller)
  );

  if (!currentConversation) {
    throw new Error('Somehow received an empty conversation');
  }

  const sendMessage = useCallback(
    (message: string) => {
      currentConversation && sendMessageToController(controller, message);
    },
    [currentConversation]
  );

  useEffect(() => {
    const handler = (controller: PersController) =>
      setCurrentConversation(getCurrentConversationFromController(controller));

    watchControllerEvent(controller, 'change_conversation', handler);

    return () => {
      unwatchControllerEvent(controller, 'change_conversation', handler);
    };
  }, [controller]);

  return {
    conversation: currentConversation,
    sendMessage,
  };
}

export function useCurrentConversationMessageGroups() {
  const { conversation } = useCurrentConversation();
  const [messageGroups, setMessageGroups] = useState<PersMessageGroup[]>(
    conversation.messageGroups
  );

  useEffect(() => {
    const changeListener = (c: PersConversation) =>
      setMessageGroups(c.messageGroups);

    addConversationChangeListener(conversation, changeListener);

    return () => {
      removeConversationChangeListener(conversation, changeListener);
    };
  }, [conversation]);

  return messageGroups;
}

export function useAvailableUsers() {
  const { controller } = useController();
  const [users, setUsers] = useState(controller.users);

  useEffect(() => {
    const handler = (controller: PersController) =>
      setUsers(new Map(controller.users));

    watchControllerEvent(controller, 'change_users', handler);

    return () => {
      unwatchControllerEvent(controller, 'change_users', handler);
    };
  }, [controller]);

  return users;
}

export function useCommandColor() {
  const { controller } = useController();
  const [commandColor, setCommandColor] = useState(controller.commandColor);

  useEffect(() => {
    const handler = (controller: PersController) =>
      setCommandColor(controller.commandColor);

    watchControllerEvent(controller, 'change_command_color', handler);

    return () => {
      unwatchControllerEvent(controller, 'change_command_color', handler);
    };
  }, [controller]);

  return commandColor;
}

export function useCommandEntryOptions() {
  const { controller } = useController();
  const [commandEntryOptions, setCommandEntryOptions] = useState(
    controller.commandEntryOptions
  );

  useEffect(() => {
    const handler = (controller: PersController) =>
      setCommandEntryOptions({ ...controller.commandEntryOptions });

    watchControllerEvent(controller, 'change_command_entry', handler);

    return () => {
      unwatchControllerEvent(controller, 'change_command_entry', handler);
    };
  }, [controller]);

  return commandEntryOptions;
}

export function useSelf() {
  const { controller } = useController();
  const [self, setSelf] = useState(controller.currentUser);

  useEffect(() => {
    const handler = (controller: PersController) =>
      setSelf({ ...controller.currentUser });

    watchControllerEvent(controller, 'change_self', handler);

    return () => {
      unwatchControllerEvent(controller, 'change_self', handler);
    };
  }, [controller]);

  return self;
}
