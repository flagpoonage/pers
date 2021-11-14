import { WithOptional } from '../../utils/types';
import {
  PersAgentController,
  PersAgentGenerator,
  PersAgentLoopResult,
} from '../agent';
import {
  getAgent,
  getCurrentConversationFromController,
  PersController,
  sendCommandToAgent,
} from '../controller';
import { EmitterHandler, addHandler, removeHandler } from '../emitter';
import { getRandomColor } from '../programs/program-utils';
import { LocalUser, SystemUser } from '../system';
import { User } from '../user';

export const UsersAgentName = 'users';

export interface UsersAgentState extends Record<string, unknown> {
  users: Map<string, User>;
}

type LoopResult = PersAgentLoopResult<UsersAgentState>;

export function getUsersAgentState(
  controller: PersController
): UsersAgentState | null | undefined {
  const agent = getUsersAgent(controller);

  if (!agent) {
    return;
  }

  // This is pretty bad form, but it should be reasonably correct.
  return agent.state as UsersAgentState;
}

export function getUsersAgent(controller: PersController) {
  return controller.agents.get(UsersAgentName);
}

function cmd_addUser(
  last_state: UsersAgentState,
  command_args: string[]
): LoopResult {
  const [user_id, username, display_color] = command_args;

  const makeError = (message: string) => ({
    next_message: message,
    next_state: last_state,
  });

  if (!user_id) {
    return makeError('Missing user ID');
  }

  if (!username) {
    return makeError('Missing username');
  }

  if (!display_color) {
    return makeError('Missing user display color');
  }

  if (last_state.users.get(user_id)) {
    return {
      next_message: `User [${username}] exists in the users list`,
      next_state: last_state,
    };
  }

  const new_users = new Map(last_state.users);

  new_users.set(user_id, {
    username,
    user_id,
    user_color: display_color,
  });

  return {
    next_message: `User [${username}] added to user list.`,
    next_state: {
      ...last_state,
      users: new_users,
    },
  };
}

async function agentLoop(
  controller: PersController,
  last_state: UsersAgentState,
  incoming_command: string,
  command_args: string[]
): Promise<LoopResult> {
  switch (incoming_command) {
    case 'add-user':
      return cmd_addUser(last_state, command_args);
  }

  return {
    next_message: `Command '${incoming_command} is unknown. No action was performed`,
    next_state: last_state,
  };
}

export function getDefaultUsersAgentState(): UsersAgentState {
  return {
    users: new Map([
      [SystemUser.user_id, SystemUser],
      [LocalUser.user_id, LocalUser],
    ]),
  };
}

export async function* usersAgent(
  controller: PersController
): PersAgentGenerator {
  let agent_state = getDefaultUsersAgentState();

  const message: {
    value: string | null;
  } = {
    value: 'Users agent started successfully',
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

export async function addUser(
  controller: PersController,
  user: WithOptional<User, 'user_color'>
) {
  const display_color = user.user_color ?? getRandomColor('hex');

  return sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${UsersAgentName} add-user ${user.user_id} ${user.username} ${display_color}`
  );
}

export function getUser(controller: PersController, user_id: string) {
  const state = getUsersAgentState(controller);

  if (!state || !state.users) {
    return;
  }

  return state.users.get(user_id);
}

export function createUsersAgentController(): PersAgentController<UsersAgentState> {
  return {
    name: UsersAgentName,
    init: usersAgent,
    executor: null,
    state: null,
    emitter: {
      handlers: new Map(),
    },
  };
}

export function watchUsersAgentState(
  controller: PersController,
  handler: EmitterHandler<UsersAgentState>
) {
  const agent = getAgent(controller, UsersAgentName);
  addHandler(agent.emitter, 'state-change', handler);
}

export function unwatchUsersAgentState(
  controller: PersController,
  handler: EmitterHandler<UsersAgentState>
) {
  const agent = getAgent(controller, UsersAgentName);
  removeHandler(agent.emitter, 'state-change', handler);
}
