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
  PersCommand,
  PersProgram,
  PersProgramGenerator,
} from './program';
import { setColor } from './programs/set-color.program';
import { setCmdColor } from './programs/set-cmd-color.program';
import { setSysColor } from './programs/set-sys-color.program';
import { createUuid } from './programs/uuid.program';
import { epoch } from './programs/epoch.program';
import { prettyJson } from './programs/pretty-json.program';
import { dateFmt } from './programs/date-fmt.program';
import { clear } from './programs/clear.program';
import { intro } from './programs/intro.program';
import { register } from './programs/register.program';
import { setServer } from './programs/set-svr.program';
import {
  remoteServerAgent,
  PersAgentGenerator,
} from './agents/remote-server.agent';

export interface PersController {
  currentUser: SelfUser;
  conversations: Map<string, PersConversation>;
  currentConversation: string;
  commandColor: string;
  users: Map<string, OtherUser>;
  emitter: Emitter<PersController>;
  programs: Record<string, PersProgram | PersCommand>;
  commandExecution: PersProgramGenerator | null;
  commandEntryOptions: CommandEntryOptions;
  history: string[];
  agents: Map<string, PersAgentController>;
}

export interface PersAgentController {
  name: string;
  init: (controller: PersController) => PersAgentGenerator;
  executor: PersAgentGenerator | null;
  state: unknown;
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

export function isUserAuthenticated(controller: PersController) {
  return controller.currentUser.authenticated;
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
    agents: createDefaultAgents(),
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
    programs: createDefaultPrograms(),
  };
}

export function createDefaultAgents(): Map<string, PersAgentController> {
  return new Map([
    [
      'remote-server',
      {
        name: 'remote-server',
        init: remoteServerAgent,
        executor: null,
        state: null,
      },
    ],
  ]);
}

export function createDefaultPrograms() {
  return {
    uuid: createUuid,
    'set-clr': setColor,
    'set-sys-clr': setSysColor,
    'set-cmd-clr': setCmdColor,
    'pretty-json': prettyJson,
    epoch: epoch,
    'date-fmt': dateFmt,
    clear: clear,
    register: register,
    intro: intro,
    'set-svr': setServer,
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

export function startAgent(controller: PersController, agentName: string) {
  const conversation = getCurrentConversationFromController(controller);

  if (!conversation) {
    throw new Error('Unable to start agent, cannot find conversation');
  }

  sendCommandToAgent(controller, conversation, `${agentName} start`);
}

export function stopAgent(controller: PersController, agentName: string) {
  const conversation = getCurrentConversationFromController(controller);

  if (!conversation) {
    throw new Error('Unable to start agent, cannot find conversation');
  }

  sendCommandToAgent(controller, conversation, `${agentName} start`);
}

export function isAgentRunning(controller: PersController, agent_name: string) {
  const agent = controller.agents.get(agent_name);
  return !!(agent && agent.executor);
}

export function getAgentState(controller: PersController, agent_name: string) {
  const agent = getAgent(controller, agent_name);

  if (!agent) {
    return;
  }

  return agent.state;
}

export function getAgent(controller: PersController, agent_name: string) {
  return controller.agents.get(agent_name);
}

export async function sendMessageToController(
  controller: PersController,
  message: string
) {
  if (message.trim().length === 0) {
    return;
  }
  const conversation = getCurrentConversationFromController(controller);

  if (!conversation) {
    throw new Error('Unable to send message, cannot find conversation');
  }

  const isCommandMode =
    conversation.type === 'command' || !!controller.commandExecution;
  const isCommandMessage = message.indexOf('\\c ') === 0;

  const command =
    !isCommandMode && isCommandMessage ? message.split('\\c ')[1] : message;

  if (!controller.commandEntryOptions.mask) {
    controller.history.push(message);
  }

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
  currentProgram: PersProgramGenerator,
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

  if (programName === 'agent-ctl') {
    return sendCommandToAgent(controller, conversation, rest.join(' '));
  }

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

    if (
      done ||
      !value.isValidYield ||
      !nextArgument ||
      value.nextEntryOptions?.mask
    ) {
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
  } while (
    (executionArgs.length > 0 || !!nextArgument) &&
    !controller.commandEntryOptions.mask
  );
}

export async function sendCommandToAgent(
  controller: PersController,
  conversation: PersConversation,
  command: string
) {
  const [agentName, ...commandRest] = command.split(' ');

  const agent = controller.agents.get(agentName);

  if (!agent) {
    return insertMessageInConversation(
      conversation,
      createMessage(
        SystemUser.userId,
        `Unrecognized agent name [${agentName}]. You may need to load the agent manually`
      )
    );
  }

  const [agentCommand, ...agentRest] = commandRest;

  if (agentCommand === 'start') {
    if (agent.executor) {
      return insertMessageInConversation(
        conversation,
        createMessage(
          SystemUser.userId,
          `Agent [${agentName}] is already running.`
        )
      );
    } else {
      insertMessageInConversation(
        conversation,
        createMessage(SystemUser.userId, `Starting agent [${agentName}]...`)
      );

      agent.executor = agent.init(controller);
      const agent_response = await agent.executor.next([
        'start',
        ...parseArguments(agentRest.join(' ')),
      ]);

      if (agent_response.value.message) {
        insertMessageInConversation(
          conversation,
          createMessage(
            SystemUser.userId,
            `[${agent.name}] - ${agent_response.value.message}`
          )
        );
      }

      if (agent_response.done) {
        // This stops the agent and will trigger a message at the end of the function
        agent.executor = null;
        agent.state = null;
      } else {
        agent.state = agent_response.value.state;
      }
    }
  } else if (agentCommand === 'stop') {
    if (!agent.executor) {
      return insertMessageInConversation(
        conversation,
        createMessage(
          SystemUser.userId,
          `Agent [${agentName}] is already stopped.`
        )
      );
    } else {
      insertMessageInConversation(
        conversation,
        createMessage(SystemUser.userId, `Stopping agent [${agentName}]...`)
      );

      const agent_response = await agent.executor.next([
        'stop',
        ...parseArguments(agentRest.join(' ')),
      ]);

      if (agent_response.value.message) {
        insertMessageInConversation(
          conversation,
          createMessage(
            SystemUser.userId,
            `[${agent.name}] - ${agent_response.value.message}`
          )
        );
      }

      agent.executor = null;
      agent.state = null;
    }
  } else if (agent.executor) {
    const agent_response = await agent.executor.next([
      agentCommand,
      ...parseArguments(agentRest.join(' ')),
    ]);

    if (agent_response.value.message) {
      insertMessageInConversation(
        conversation,
        createMessage(
          SystemUser.userId,
          `[${agent.name}] - ${agent_response.value.message}`
        )
      );
    }

    if (agent_response.done) {
      agent.executor = null;
      agent.state = null;
    } else {
      agent.state = agent_response.value.state;
    }
  } else {
    return insertMessageInConversation(
      conversation,
      createMessage(
        SystemUser.userId,
        `Command [${agentCommand}] could not be sent. Agent [${agentName}] is stopped`
      )
    );
  }

  if (!agent.executor) {
    insertMessageInConversation(
      conversation,
      createMessage(SystemUser.userId, `Agent [${agentName}] has stopped`)
    );
  }
}
