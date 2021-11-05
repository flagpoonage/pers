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
import { addHandler, EmitterHandler, removeHandler } from '../emitter';
import { LocalUser } from '../system';
import { getUsersAgentState } from './users.agent';

export const RemoteServerAgentName = 'remote-server';
export interface RemoteServerAgentState {
  connection: WebSocket | null;
  authentication: {
    access_token: string;
    refresh_token: string;
    user_id: string;
  } | null;
  host_settings: {
    api: string;
    socket: string;
  } | null;
}

type LoopResult = PersAgentLoopResult<RemoteServerAgentState>;

export function getCurrentUser(controller: PersController) {
  const remote_server_state = getRemoteServerAgentState(controller);
  if (
    !remote_server_state ||
    !remote_server_state.authentication ||
    !remote_server_state.authentication.user_id
  ) {
    return LocalUser;
  }

  const users_state = getUsersAgentState(controller);

  if (!users_state) {
    console.warn('Users agent state is not available');
    return LocalUser;
  }

  const sending_user = users_state.users.get(
    remote_server_state.authentication.user_id
  );

  if (!sending_user) {
    console.warn(
      `User is authenticated but no mapping to to a user state was found`
    );
    return LocalUser;
  }

  return sending_user;
}

function cmd_changeServer(
  controller: PersController,
  last_state: RemoteServerAgentState,
  command_args: string[]
): LoopResult {
  const [api_host, socket_host] = command_args;

  const makeError = (message: string) => ({
    next_message: message,
    next_state: last_state,
  });

  if (!api_host) {
    return makeError(`Missing API host address`);
  }

  if (!socket_host) {
    return makeError(`Missing socket host address`);
  }

  const next_state: RemoteServerAgentState = {
    ...last_state,
    host_settings: {
      api: api_host,
      socket: socket_host,
    },
  };

  return {
    next_message: 'Remote server settings updated',
    next_state,
  };
}

async function cmd_connect(
  controller: PersController,
  last_state: RemoteServerAgentState,
  command_args: string[]
) {
  const [user_id, access_token, refresh_token] = command_args;

  const makeError = (message: string) => ({
    next_message: message,
    next_state: last_state,
  });

  if (!last_state.host_settings?.socket) {
    return makeError('Missing host settings for socket');
  }

  if (!user_id) {
    return makeError(`Missing user ID`);
  }

  if (!access_token) {
    return makeError(`Missing access token`);
  }

  if (!refresh_token) {
    return makeError(`Missing refresh token`);
  }

  return makeError('Connect doesnt do anthing');

  // const ws = new WebSocket(`${last_state.hostSettings.socket}/${access_token}`);

  // ws.onclose((ev) => {
  //   send;
  // });
}

async function agentLoop(
  controller: PersController,
  last_state: RemoteServerAgentState,
  incoming_command: string,
  command_args: string[]
): Promise<LoopResult> {
  switch (incoming_command) {
    case 'change-server':
      return cmd_changeServer(controller, last_state, command_args);
    case 'connect':
      return cmd_connect(controller, last_state, command_args);
  }

  return {
    next_message: null,
    next_state: last_state,
  };
}

export interface RemoteServerCommandInputChangeServer {
  api_host: string;
  socket_host: string;
}

export function changeServer(
  controller: PersController,
  host_info: RemoteServerCommandInputChangeServer
) {
  return sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${RemoteServerAgentName} change-server ${host_info.api_host} ${host_info.socket_host}`
  );
}

export interface RemoteServerCommandInputConnect {
  access_token: string;
  refresh_token: string;
  user_id: string;
}

export function connect(
  controller: PersController,
  authentication_info: RemoteServerCommandInputConnect
) {
  return sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${RemoteServerAgentName} connect ${authentication_info.user_id} ${authentication_info.access_token} ${authentication_info.refresh_token}`
  );
}

export function getRemoteServerAgentState(
  controller: PersController
): RemoteServerAgentState | null | undefined {
  const agent = getRemoteServerAgent(controller);

  if (!agent) {
    return;
  }

  // This is pretty bad form, but it should be reasonably correct.
  return agent.state as RemoteServerAgentState;
}

export function getRemoteServerAgent(controller: PersController) {
  return controller.agents.get(RemoteServerAgentName);
}

export function getDefaultRemoteServerAgentState(): RemoteServerAgentState {
  return {
    connection: null,
    host_settings: null,
    authentication: null,
  };
}

export async function* remoteServerAgent(
  controller: PersController
): PersAgentGenerator {
  let agent_state = getDefaultRemoteServerAgentState();

  const message: {
    value: string | null;
  } = {
    value: 'Remote server agent started successfully',
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

export function createRemoteServerAgentController(): PersAgentController<RemoteServerAgentState> {
  return {
    name: RemoteServerAgentName,
    init: remoteServerAgent,
    executor: null,
    state: null,
    emitter: {
      handlers: new Map(),
    },
  };
}

export function watchRemoteServerAgentState(
  controller: PersController,
  handler: EmitterHandler<RemoteServerAgentState>
) {
  const agent = getAgent(controller, RemoteServerAgentName);
  addHandler(agent.emitter, 'state-change', handler);
}

export function unwatchRemoteServerAgentState(
  controller: PersController,
  handler: EmitterHandler<RemoteServerAgentState>
) {
  const agent = getAgent(controller, RemoteServerAgentName);
  removeHandler(agent.emitter, 'state-change', handler);
}
