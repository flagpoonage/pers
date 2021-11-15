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
import { User } from './user';
import { v4 as generateUuid } from 'uuid';
import {
  CommandEntryOptions,
  createDefaultCommandEntryOptions,
  PersCommand,
  PersProgram,
  PersProgramGenerator,
} from './program';
import { setColor } from '../programs/set-color.program';
import { setCmdColor } from '../programs/set-cmd-color.program';
import { setSysColor } from '../programs/set-sys-color.program';
import { uuid } from '../programs/uuid.program';
import { epoch } from '../programs/epoch.program';
import { prettyJson } from '../programs/pretty-json.program';
import { dateFmt } from '../programs/date-fmt.program';
import { clear } from '../programs/clear.program';
import { chat } from '../programs/chat.program';
import { intro } from '../programs/intro.program';
import { register } from '../programs/register.program';
import { setServer } from '../programs/set-svr.program';
import { createRemoteServerAgentController } from '../agents/remote-server.agent';
import { login } from '../programs/login.program';
import { PersAgentController } from './agent';
import { createDisplayAgentController } from '../agents/display.agent';
import { createUsersAgentController } from '../agents/users.agent';
import { addFriend } from '../programs/add-friend.program';

export interface PersController {
  conversations: Map<string, PersConversation>;
  systemConversation: PersConversation;
  currentConversation: string;
  emitter: Emitter<PersController>;
  programs: Record<string, PersProgram | PersCommand>;
  commandExecution: PersProgramGenerator | null;
  commandEntryOptions: CommandEntryOptions;
  history: string[];
  agents: Map<string, PersAgentController>;
}

export function createSelfUser(): User {
  return {
    username: 'Anonymous',
    user_color: 'lime',
    user_id: generateUuid(),
  };
}

export function triggerChange(controller: PersController, key: string) {
  const handlers = controller.emitter.handlers.get(key);

  if (handlers && handlers.length > 0) {
    handlers.forEach((handler) => handler(controller));
  }
}

// export function triggerSelfChange(controller: PersController) {
//   triggerChange(controller, 'change_self');
// }

// export function triggerUsersChange(controller: PersController) {
//   triggerChange(controller, 'change_users');
// }

// export function triggerCommandColorChange(controller: PersController) {
//   triggerChange(controller, 'change_command_color');
// }

export function triggerCommandEntryChange(controller: PersController) {
  triggerChange(controller, 'change_command_entry');
}

// export function setCommandColor(controller: PersController, color: string) {
//   controller.commandColor = color;
//   triggerCommandColorChange(controller);
// }

// export function setSystemUserProperties(
//   controller: PersController,
//   data: Partial<BaseUser>
// ) {
//   const systemUser = controller.users.get(SystemUser.user_id);

//   if (!systemUser) {
//     throw new Error('Unable to find system user');
//   }

//   controller.users.set(SystemUser.user_id, {
//     ...systemUser,
//     ...data,
//   });

//   triggerUsersChange(controller);
// }

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
    conversations: new Map<string, PersConversation>([
      [rootConversation.id, rootConversation],
    ]),
    systemConversation: rootConversation,
    currentConversation: rootConversation.id,
    // users: new Map<string, User>([[SystemUser.user_id, SystemUser]]),
    // commandColor: '#00cfff',
    commandExecution: null,
    emitter: createEmitter(),
    commandEntryOptions: createDefaultCommandEntryOptions(),
    history: [],
    programs: createDefaultPrograms(),
  };
}

export function addConversation(
  controller: PersController,
  conversation: PersConversation
) {
  if (controller.conversations.get(conversation.id)) {
    return;
  }

  const conversations = new Map(controller.conversations);

  conversations.set(conversation.id, conversation);

  controller.conversations = conversations;

  triggerChange(controller, 'add_conversation');
}

export function switchConversation(
  controller: PersController,
  conversation: PersConversation | string
) {
  const conversation_id =
    typeof conversation === 'string' ? conversation : conversation.id;

  controller.currentConversation = conversation_id;

  triggerChange(controller, 'change_conversation');
}

export function createDefaultAgents(): Map<string, PersAgentController> {
  const remoteServerAgent = createRemoteServerAgentController();
  const displayAgent = createDisplayAgentController();
  const usersAgent = createUsersAgentController();

  return new Map([
    [remoteServerAgent.name, remoteServerAgent as PersAgentController<unknown>],
    [displayAgent.name, displayAgent as PersAgentController<unknown>],
    [usersAgent.name, usersAgent as PersAgentController<unknown>],
  ]);
}

export function createDefaultPrograms() {
  return {
    'set-clr': setColor,
    'set-sys-clr': setSysColor,
    'set-cmd-clr': setCmdColor,
    'pretty-json': prettyJson,
    'set-svr': setServer,
    'date-fmt': dateFmt,
    'add-friend': addFriend,
    chat,
    clear,
    register,
    login,
    intro,
    epoch,
    uuid,
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
  const current_conversation = getConversationFromController(
    controller,
    controller.currentConversation
  );

  if (!current_conversation) {
    console.error(
      'Unable to find current conversation, defaulting to system conversation'
    );
    return controller.systemConversation;
  }

  return current_conversation;
}

export function startAgent(controller: PersController, agentName: string) {
  sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${agentName} start`
  );
}

export function stopAgent(controller: PersController, agentName: string) {
  sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${agentName} start`
  );
}

export function isAgentRunning(controller: PersController, agent_name: string) {
  const agent = controller.agents.get(agent_name);
  return !!(agent && agent.executor);
}

export function getAgentState(controller: PersController, agent_name: string) {
  const agent = maybeGetAgent(controller, agent_name);

  if (!agent) {
    return;
  }

  return agent.state;
}

export async function sendAgentMessageToController(
  controller: PersController,
  message: string,
  agent_name: string
) {
  return sendMessageToController(
    controller,
    `[${agent_name}] - ${message}`,
    SystemUser.user_id
  );
}

export async function sendMessageToController(
  controller: PersController,
  message: string,
  from_id: string
) {
  if (message.trim().length === 0) {
    return;
  }
  const conversation = getCurrentConversationFromController(controller);

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
      createMessage(SystemUser.user_id, displayValue, true)
    );

    sendCommandToController(controller, conversation, command);
  } else {
    insertMessageInConversation(conversation, createMessage(from_id, message));
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

  if (value?.message) {
    insertMessageInConversation(
      conversation,
      createMessage(SystemUser.user_id, value.message)
    );
  }

  if (done) {
    controller.commandExecution = null;
    controller.commandEntryOptions = createDefaultCommandEntryOptions();
  } else {
    controller.commandEntryOptions =
      value.next_entry_options ?? createDefaultCommandEntryOptions();
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
        SystemUser.user_id,
        "Invalid command. Type 'commands' for a list of available commands"
      )
    );

    return;
  }

  const programIteration = program(controller);

  if ('then' in programIteration) {
    const { message } = await programIteration;

    if (message) {
      insertMessageInConversation(
        conversation,
        createMessage(SystemUser.user_id, message)
      );
    }
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
      !value.is_valid_yield ||
      !nextArgument ||
      value.next_entry_options?.mask
    ) {
      if (value?.message) {
        insertMessageInConversation(
          conversation,
          createMessage(SystemUser.user_id, value.message)
        );
      }

      if (done) {
        controller.commandExecution = null;
        controller.commandEntryOptions = createDefaultCommandEntryOptions();
      } else {
        controller.commandEntryOptions =
          value.next_entry_options ?? createDefaultCommandEntryOptions();
      }

      triggerCommandEntryChange(controller);

      return;
    }
  } while (
    (executionArgs.length > 0 || !!nextArgument) &&
    !controller.commandEntryOptions.mask
  );
}

export function getAgent(
  controller: PersController,
  agent_name: string
): PersAgentController {
  const agent = maybeGetAgent(controller, agent_name);

  if (!agent) {
    throw new Error(`Agent '${agent_name}'' is missing from the controller`);
  }

  return agent;
}

export function maybeGetAgent(
  controller: PersController,
  agent_name: string
): PersAgentController | undefined {
  return controller.agents.get(agent_name);
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
        SystemUser.user_id,
        `Unrecognized agent name [${agentName}]. You may need to load the agent manually`
      )
    );
  }

  const [agentCommand, argumentFlag, ...agentRest] = commandRest;

  // If the --json flag is parsed, the next argument will come in as a whole, regardless
  // of spaces.
  const commandArguments =
    argumentFlag === '--json'
      ? [agentRest.join(' ')]
      : parseArguments(
          [argumentFlag, ...agentRest]
            .filter((a) => typeof a === 'string')
            .join(' ')
        );

  if (agentCommand === 'start') {
    if (agent.executor) {
      return insertMessageInConversation(
        conversation,
        createMessage(
          SystemUser.user_id,
          `Agent [${agentName}] is already running.`
        )
      );
    } else {
      insertMessageInConversation(
        conversation,
        createMessage(SystemUser.user_id, `Starting agent [${agentName}]...`)
      );

      agent.executor = agent.init(controller);
      const agent_response = await agent.executor.next([
        'start',
        ...commandArguments,
      ]);

      if (agent_response.value.message) {
        insertMessageInConversation(
          conversation,
          createMessage(
            SystemUser.user_id,
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

        if (agent.state !== agent_response.value.state) {
          agent.emitter.handlers
            .get('state-change')
            ?.forEach((h) => h(agent.state));
        }
      }
    }
  } else if (agentCommand === 'stop') {
    if (!agent.executor) {
      return insertMessageInConversation(
        conversation,
        createMessage(
          SystemUser.user_id,
          `Agent [${agentName}] is already stopped.`
        )
      );
    } else {
      insertMessageInConversation(
        conversation,
        createMessage(SystemUser.user_id, `Stopping agent [${agentName}]...`)
      );

      const agent_response = await agent.executor.next([
        'stop',
        ...commandArguments,
      ]);

      if (agent_response.value.message) {
        insertMessageInConversation(
          conversation,
          createMessage(
            SystemUser.user_id,
            `[${agent.name}] - ${agent_response.value.message}`
          )
        );
      }

      agent.executor = null;
      agent.state = null;

      agent.emitter.handlers
        .get('state-change')
        ?.forEach((h) => h(agent.state));
    }
  } else if (agent.executor) {
    const agent_response = await agent.executor.next([
      agentCommand,
      ...commandArguments,
    ]);

    if (agent_response.value.message) {
      insertMessageInConversation(
        conversation,
        createMessage(
          SystemUser.user_id,
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

    agent.emitter.handlers.get('state-change')?.forEach((h) => h(agent.state));
  } else {
    return insertMessageInConversation(
      conversation,
      createMessage(
        SystemUser.user_id,
        `Command [${agentCommand}] could not be sent. Agent [${agentName}] is stopped`
      )
    );
  }

  if (!agent.executor) {
    insertMessageInConversation(
      conversation,
      createMessage(SystemUser.user_id, `Agent [${agentName}] has stopped`)
    );
  }
}
