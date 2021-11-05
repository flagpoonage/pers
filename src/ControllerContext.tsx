import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DisplayAgentName,
  DisplayAgentState,
  getDefaultDisplayAgentState,
  unwatchDisplayAgentState,
  watchDisplayAgentState,
} from './domain/agents/display.agent';
import {
  getCurrentUser,
  getDefaultRemoteServerAgentState,
  RemoteServerAgentName,
  RemoteServerAgentState,
  unwatchRemoteServerAgentState,
  watchRemoteServerAgentState,
} from './domain/agents/remote-server.agent';
import {
  getDefaultUsersAgentState,
  unwatchUsersAgentState,
  UsersAgentName,
  UsersAgentState,
  watchUsersAgentState,
} from './domain/agents/users.agent';
import {
  PersController,
  createController,
  unwatchControllerEvent,
  watchControllerEvent,
  getCurrentConversationFromController,
  sendMessageToController,
  startAgent,
} from './domain/controller';
import {
  addConversationChangeListener,
  PersConversation,
  removeConversationChangeListener,
} from './domain/conversation';
import { EmitterHandler } from './domain/emitter';
import { PersMessageGroup } from './domain/message-group';
import { LocalUser } from './domain/system';

const ControllerContext = React.createContext<PersController | null>(null);

export function ControllerProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const controller = useRef(createController());

  useEffect(() => {
    startAgent(controller.current, RemoteServerAgentName);
    startAgent(controller.current, DisplayAgentName);
    startAgent(controller.current, UsersAgentName);
  }, []);

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
      sendMessageToController(
        controller,
        message,
        getCurrentUser(controller).user_id
      );
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
      currentConversation &&
        sendMessageToController(
          controller,
          message,
          getCurrentUser(controller).user_id
        );
    },
    [controller, currentConversation]
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

// export function useAvailableUsers() {
//   const { controller } = useController();
//   const [users, setUsers] = useState(controller.users);

//   useEffect(() => {
//     const handler = (controller: PersController) =>
//       setUsers(new Map(controller.users));

//     watchControllerEvent(controller, 'change_users', handler);

//     return () => {
//       unwatchControllerEvent(controller, 'change_users', handler);
//     };
//   }, [controller]);

//   return users;
// }

export function useStateValue<I, O>(
  attachListener: (
    controller: PersController,
    handler: EmitterHandler<I>
  ) => void,
  removeListener: (
    controller: PersController,
    handler: EmitterHandler<I>
  ) => void,
  selectorFn: (state: I) => O,
  initialValue: I
) {
  const selector = useRef(selectorFn);
  const { controller } = useController();
  const initValue = useRef(initialValue);
  const [selectedState, setSelectedState] = useState<O>(
    selector.current(initValue.current)
  );

  useEffect(() => {
    const handler = (state: I) => {
      setSelectedState(
        selector.current(state === null ? initValue.current : state)
      );
    };

    attachListener(controller, handler);

    return () => {
      removeListener(controller, handler);
    };
  }, [attachListener, removeListener, controller]);

  return selectedState;
}

export function useUsersState<T>(selectorFn: (state: UsersAgentState) => T) {
  return useStateValue(
    watchUsersAgentState,
    unwatchUsersAgentState,
    selectorFn,
    getDefaultUsersAgentState()
  );
}

export function useDisplayState<T>(
  selectorFn: (state: DisplayAgentState) => T
) {
  return useStateValue(
    watchDisplayAgentState,
    unwatchDisplayAgentState,
    selectorFn,
    getDefaultDisplayAgentState()
  );
}

export function useRemoteServerState<T>(
  selectorFn: (state: RemoteServerAgentState) => T
) {
  return useStateValue(
    watchRemoteServerAgentState,
    unwatchRemoteServerAgentState,
    selectorFn,
    getDefaultRemoteServerAgentState()
  );
}

export function useCurrentUser() {
  const current_user_id = useRemoteServerState(
    (state) => state.authentication?.user_id
  );
  const users = useUsersState((state) => state.users);

  const current_user = current_user_id ? users.get(current_user_id) : undefined;

  return current_user ?? LocalUser;
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
