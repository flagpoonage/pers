import {
  createConversation,
  insertMessageInConversation,
  PersConversation,
} from './conversation';
import {
  addHandler,
  createEmitter,
  Emitter,
  EmitterHandler,
  removeHandler,
} from './emitter';
import { createMessage } from './message';
import { getSystemIntroductionText, SystemUser } from './system';
import { BaseUser, OtherUser, SelfUser } from './user';
import { v4 as uuid } from 'uuid';
import {
  CommandEntryOptions,
  createDefaultCommandEntryOptions,
  TalkCommand,
  TalkProgram,
  TalkProgramGenerator,
} from './program';
import { setColor } from './programs/set-color';
import { setCmdColor } from './programs/set-cmd-color';
import { setSysColor } from './programs/set-sys-color';
import { createUuid } from './programs/uuid';
import { epoch } from './programs/epoch';
import { prettyJson } from './programs/pretty-json';
import { dateFmt } from './programs/date-fmt';
import { clear } from './programs/clear';

export interface PersController {
  currentUser: SelfUser;
  conversations: Map<string, PersConversation>;
  currentConversation: string;
  commandColor: string;
  users: Map<string, OtherUser>;
  emitter: Emitter<PersController>;
  programs: Record<string, TalkProgram | TalkCommand>;
  commandExecution: TalkProgramGenerator | null;
  commandEntryOptions: CommandEntryOptions;
  history: string[];
}

export function createSelfUser(): SelfUser {
  return {
    userName: 'Anonymous',
    userColor: 'lime',
    authenticated: false,
    userId: uuid(),
  };
}

export function triggerChange(controller: PersController, key: string) {
  const handlers = controller.emitter.handlers.get(key);

  if (handlers && handlers.length > 0) {
    handlers.forEach((handler) => handler(controller));
  }
}

export function triggerSelfChange(controller: PersController) {
  triggerChange(controller, 'change_self');
}

export function triggerUsersChange(controller: PersController) {
  triggerChange(controller, 'change_users');
}

export function triggerCommandColorChange(controller: PersController) {
  triggerChange(controller, 'change_command_color');
}

export function triggerCommandEntryChange(controller: PersController) {
  triggerChange(controller, 'change_command_entry');
}

export function setCommandColor(controller: PersController, color: string) {
  controller.commandColor = color;
  triggerCommandColorChange(controller);
}

export function setSelfUserProperties(
  controller: PersController,
  data: Partial<BaseUser>
) {
  controller.currentUser = {
    ...controller.currentUser,
    ...data,
  };

  triggerSelfChange(controller);
}

export function setSystemUserProperties(
  controller: PersController,
  data: Partial<BaseUser>
) {
  const systemUser = controller.users.get(SystemUser.userId);

  if (!systemUser) {
    throw new Error('Unable to find system user');
  }

  controller.users.set(SystemUser.userId, {
    ...systemUser,
    ...data,
  });

  triggerUsersChange(controller);
}

export function createRootConversation(
  includeIntro: boolean
): PersConversation {
  const conversation = createConversation([SystemUser]);
  // setConversationType(conversation, 'command');

  if (includeIntro) {
    insertMessageInConversation(
      conversation,
      createMessage('system', getSystemIntroductionText())
    );
  }

  return conversation;
}

export function createController(): PersController {
  const rootConversation = createRootConversation(true);

  return {
    currentUser: createSelfUser(),
    conversations: new Map<string, PersConversation>([
      [rootConversation.id, rootConversation],
    ]),
    currentConversation: rootConversation.id,
    users: new Map<string, OtherUser>([[SystemUser.userId, SystemUser]]),
    commandColor: '#00cfff',
    commandExecution: null,
    emitter: createEmitter(),
    commandEntryOptions: createDefaultCommandEntryOptions(),
    history: [],
    programs: {
      uuid: createUuid,
      'set-color': setColor,
      'set-sys-color': setSysColor,
      'set-cmd-color': setCmdColor,
      'pretty-json': prettyJson,
      epoch: epoch,
      'date-fmt': dateFmt,
      clear: clear,
    },
  };
}

export function watchControllerEvent(
  controller: PersController,
  key: string,
  handler: EmitterHandler<PersController>
) {
  addHandler(controller.emitter, key, handler);
}

export function unwatchControllerEvent(
  controller: PersController,
  key: string,
  handler: EmitterHandler<PersController>
) {
  removeHandler(controller.emitter, key, handler);
}

export function getConversationFromController(
  controller: PersController,
  conversationId: string
) {
  return controller.conversations.get(conversationId);
}

export function getCurrentConversationFromController(
  controller: PersController
) {
  return getConversationFromController(
    controller,
    controller.currentConversation
  );
}

export async function sendMessageToController(
  controller: PersController,
  message: string
) {
  const conversation = getCurrentConversationFromController(controller);

  if (!conversation) {
    throw new Error('Unable to send message, cannot find conversation');
  }

  const isCommandMode =
    conversation.type === 'command' || !!controller.commandExecution;
  const isCommandMessage = message.indexOf('\\c ') === 0;

  const command =
    !isCommandMode && isCommandMessage ? message.split('\\c ')[1] : message;

  controller.history.push(message);

  if (isCommandMessage || isCommandMode) {
    controller.commandEntryOptions.mask;

    const displayValue = controller.commandEntryOptions.mask
      ? command.replaceAll(/./g, '*')
      : command;

    insertMessageInConversation(
      conversation,
      createMessage(SystemUser.userId, displayValue, true)
    );

    sendCommandToController(controller, conversation, command);
  } else {
    insertMessageInConversation(
      conversation,
      createMessage(controller.currentUser.userId, message)
    );
  }
}

export function parseArguments(command: string) {
  const argsRegex = /("[^"]+"|[^\s]+)/g;

  let nextMatch: RegExpExecArray | null = null;
  const matches: string[] = [];

  do {
    nextMatch = argsRegex.exec(command);

    if (nextMatch === null) {
      break;
    }

    const nextValue = nextMatch[0];

    matches.push(
      nextValue.startsWith('"')
        ? nextValue.slice(1, nextValue.length - 1)
        : nextValue
    );
  } while (nextMatch !== null);

  return matches;
}

export async function continueProgramExecution(
  controller: PersController,
  currentProgram: TalkProgramGenerator,
  conversation: PersConversation,
  command: string
) {
  const { done, value } = await currentProgram.next(command);

  insertMessageInConversation(
    conversation,
    createMessage(SystemUser.userId, value.message)
  );

  if (done) {
    controller.commandExecution = null;
    controller.commandEntryOptions = createDefaultCommandEntryOptions();
  } else {
    controller.commandEntryOptions =
      value.nextEntryOptions ?? createDefaultCommandEntryOptions();
  }

  return triggerCommandEntryChange(controller);
}

export async function sendCommandToController(
  controller: PersController,
  conversation: PersConversation,
  command: string
) {
  if (controller.commandExecution) {
    return continueProgramExecution(
      controller,
      controller.commandExecution,
      conversation,
      command
    );
  }

  const [programName, ...rest] = command.split(' ');
  const programArgs = parseArguments(rest.join(' '));

  console.log(programArgs);

  const program = controller.programs[programName];

  if (!program) {
    insertMessageInConversation(
      conversation,
      createMessage(
        SystemUser.userId,
        "Invalid command. Type 'commands' for a list of available commands"
      )
    );

    return;
  }

  const programIteration = program(controller);

  if ('then' in programIteration) {
    const { message } = await programIteration;

    insertMessageInConversation(
      conversation,
      createMessage(SystemUser.userId, message)
    );
    return;
  }

  controller.commandExecution = programIteration;

  const executionArgs = programArgs.slice();
  let nextArgument = '';
  let initialExecution = true;

  do {
    const { done, value } = await (initialExecution
      ? programIteration.next()
      : programIteration.next(nextArgument));

    initialExecution = false;

    if (executionArgs.length > 0) {
      [nextArgument] = executionArgs.splice(0, 1);
    } else {
      nextArgument = '';
    }

    if (done || !value.isValidYield || !nextArgument) {
      insertMessageInConversation(
        conversation,
        createMessage(SystemUser.userId, value.message)
      );

      if (done) {
        controller.commandExecution = null;
        controller.commandEntryOptions = createDefaultCommandEntryOptions();
      } else {
        controller.commandEntryOptions =
          value.nextEntryOptions ?? createDefaultCommandEntryOptions();
      }

      triggerCommandEntryChange(controller);

      return;
    }
  } while (executionArgs.length > 0 || !!nextArgument);
}
