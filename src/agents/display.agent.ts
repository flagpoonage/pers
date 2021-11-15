import {
  PersAgentController,
  PersAgentGenerator,
  PersAgentLoopResult,
} from '../domain/agent';
import {
  getAgent,
  getCurrentConversationFromController,
  maybeGetAgent,
  PersController,
  sendCommandToAgent,
} from '../domain/controller';
import { addHandler, EmitterHandler, removeHandler } from '../domain/emitter';
import { isValidColor } from '../programs/program-utils';

export const DisplayAgentName = 'display';

export interface DisplayAgentState extends Record<string, unknown> {
  my_display_name: string;
  my_color: string;
  sys_color: string;
  cmd_color: string;
}

type LoopResult = PersAgentLoopResult<DisplayAgentState>;

function setMyColor(
  last_state: DisplayAgentState,
  command_args: string[]
): LoopResult {
  const [color] = command_args;

  if (!isValidColor(color)) {
    return {
      next_message: `Unable to set color. '${color}' is not a recognized color`,
      next_state: last_state,
    };
  }

  return {
    next_message: `Your display color has been set to '${color}'`,
    next_state: {
      ...last_state,
      my_color: color,
    },
  };
}

function setCmdColor(
  last_state: DisplayAgentState,
  command_args: string[]
): LoopResult {
  const [color] = command_args;

  if (!isValidColor(color)) {
    return {
      next_message: `Unable to set color. '${color}' is not a recognized color`,
      next_state: last_state,
    };
  }

  return {
    next_message: `Command display color has been set to '${color}'`,
    next_state: {
      ...last_state,
      cmd_color: color,
    },
  };
}

function setSysColor(
  last_state: DisplayAgentState,
  command_args: string[]
): LoopResult {
  const [color] = command_args;

  if (!isValidColor(color)) {
    return {
      next_message: `Unable to set color. '${color}' is not a recognized color`,
      next_state: last_state,
    };
  }

  return {
    next_message: `System display color has been set to '${color}'`,
    next_state: {
      ...last_state,
      sys_color: color,
    },
  };
}

async function agentLoop(
  controller: PersController,
  last_state: DisplayAgentState,
  incoming_command: string,
  command_args: string[]
): Promise<LoopResult> {
  switch (incoming_command) {
    case 'set-my-color':
      return setMyColor(last_state, command_args);
    case 'set-sys-color':
      return setSysColor(last_state, command_args);
    case 'set-cmd-color':
      return setCmdColor(last_state, command_args);
  }

  return {
    next_message: `Command '${incoming_command} is unknown. No action was performed`,
    next_state: last_state,
  };
}

export function setSystemColor(controller: PersController, color: string) {
  sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${DisplayAgentName} set-sys-color ${color}`
  );
}

export function setCommandColor(controller: PersController, color: string) {
  sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${DisplayAgentName} set-cmd-color ${color}`
  );
}

export function setMyDisplayColor(controller: PersController, color: string) {
  sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${DisplayAgentName} set-my-color ${color}`
  );
}

export function getDefaultDisplayAgentState(): DisplayAgentState {
  return {
    my_display_name: 'Anonymous',
    my_color: 'lime',
    sys_color: '#ff5050',
    cmd_color: '#00cfff',
  };
}

async function* displayAgent(controller: PersController): PersAgentGenerator {
  let agent_state: DisplayAgentState = getDefaultDisplayAgentState();

  const message: {
    value: string | null;
  } = {
    value: 'Display agent started successfully',
  };

  do {
    const [incoming_command, ...command_args] = yield {
      message: message.value,
      state: agent_state,
    };

    message.value = null;

    try {
      const { next_state, next_message } = await agentLoop(
        controller,
        agent_state,
        incoming_command,
        command_args
      );

      agent_state = next_state;

      message.value = next_message;
    } catch (exception) {
      console.error(exception);
    }
  } while (
    // Disable the constant loop. This generator acts something like
    // a mailbox in erlang where it loops indefinitely as it receives
    // each command.
    // eslint-disable-next-line no-constant-condition
    true
  );
}

export function createDisplayAgentController(): PersAgentController<DisplayAgentState> {
  return {
    name: DisplayAgentName,
    init: displayAgent,
    executor: null,
    state: null,
    emitter: {
      handlers: new Map(),
    },
  };
}

export function getDisplayAgentState(
  controller: PersController
): DisplayAgentState | null | undefined {
  const agent = maybeGetAgent(controller, DisplayAgentName);

  if (!agent) {
    return;
  }

  // This is pretty bad form, but it should be reasonably correct.
  return agent.state as DisplayAgentState;
}

export function watchDisplayAgentState(
  controller: PersController,
  handler: EmitterHandler<DisplayAgentState>
) {
  const agent = getAgent(controller, DisplayAgentName);
  addHandler(agent.emitter, 'state-change', handler);
}

export function unwatchDisplayAgentState(
  controller: PersController,
  handler: EmitterHandler<DisplayAgentState>
) {
  const agent = getAgent(controller, DisplayAgentName);
  removeHandler(agent.emitter, 'state-change', handler);
}
