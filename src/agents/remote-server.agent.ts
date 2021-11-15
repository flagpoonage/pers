import { maybeJSON } from '../utils/maybe-json';
import {
  PersAgentController,
  PersAgentGenerator,
  PersAgentLoopResult,
} from '../domain/agent';
import {
  getAgent,
  getCurrentConversationFromController,
  PersController,
  sendAgentMessageToController,
  sendCommandToAgent,
} from '../domain/controller';
import { addHandler, EmitterHandler, removeHandler } from '../domain/emitter';
import { LocalUser } from '../domain/system';
import { User } from '../domain/user';
import { getUsersAgentState } from './users.agent';

export type UserFriend = Pick<User, 'username' | 'user_id'>;

export const RemoteServerAgentName = 'remote-server';

export interface RemoteUserProfile {
  user_id: string;
  username: string;
  friends: UserFriend[];
}
export interface RemoteServerAgentState {
  connection: WebSocket | null;
  profile: RemoteUserProfile | null;
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

function sendAgentMessage(controller: PersController, message: string) {
  return sendAgentMessageToController(
    controller,
    message,
    RemoteServerAgentName
  );
}

function isValidFriendList(value: unknown): value is UserFriend[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return !value.some((a) => {
    Object.getOwnPropertyNames(a).length !== 2 ||
      !('username' in a && a.username && typeof a.username === 'string') ||
      !('user_id' in a && a.user_id && typeof a.user_id === 'string');
  });
}

function isValidProfile(value: unknown): value is RemoteUserProfile {
  if (!value) {
    return false;
  }

  const value_CAST = value as RemoteUserProfile;

  if (
    typeof value_CAST.username !== 'string' ||
    !value_CAST.username ||
    typeof value_CAST.user_id !== 'string' ||
    !value_CAST.user_id
  ) {
    return false;
  }

  return isValidFriendList(value_CAST.friends);
}

function cmd_setProfile(
  controller: PersController,
  last_state: RemoteServerAgentState,
  command_args: string[]
): LoopResult {
  const [profile_serialized] = command_args;

  const makeError = (message: string) => ({
    next_message: message,
    next_state: last_state,
  });

  if (!profile_serialized) {
    return makeError('Missing profile');
  }

  const maybe_profile = maybeJSON(profile_serialized);

  if (!maybe_profile.valid) {
    return makeError('Profile could not be parsed');
  }

  const profile = maybe_profile.data;

  if (!isValidProfile(profile)) {
    return makeError('Profile is not valid');
  }

  return {
    next_message: `Profile loaded successfully.`,
    next_state: {
      ...last_state,
      profile,
    },
  };
}

function cmd_setFriendsList(
  controller: PersController,
  last_state: RemoteServerAgentState,
  command_args: string[]
): LoopResult {
  const [friends_serialized] = command_args;

  const makeError = (message: string) => ({
    next_message: message,
    next_state: last_state,
  });

  if (!last_state.profile) {
    return makeError('Current profile is not valid');
  }

  if (!friends_serialized) {
    return makeError('Missing friends list');
  }

  const maybe_friends = maybeJSON(friends_serialized);

  if (!maybe_friends.valid) {
    return makeError('Friends list could not be parsed');
  }

  const friends_list = maybe_friends.data;

  if (!isValidFriendList(friends_list)) {
    return makeError('Friends list is not valid');
  }

  return {
    next_message: `Updated friends list:\n\n${
      friends_list.length === 0
        ? 'No friends.'
        : friends_list.map((a) => `- ${a.username}`).join('\n')
    }`,
    next_state: {
      ...last_state,
      profile: {
        ...last_state.profile,
        friends: friends_list,
      },
    },
  };
}

function cmd_connect(
  controller: PersController,
  last_state: RemoteServerAgentState,
  command_args: string[]
): LoopResult {
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

  const ws_address = `${last_state.host_settings.socket}/${access_token}`;

  console.log('ws address', ws_address, last_state.host_settings);

  const ws = new WebSocket(ws_address);

  ws.onclose = () => {
    sendAgentMessage(controller, 'Lost connection to server');
  };

  ws.onopen = () => {
    sendAgentMessage(controller, 'Connected to server');
  };

  ws.onmessage = () => {
    sendAgentMessage(controller, 'Message received from server');
  };

  ws.onerror = () => {
    sendAgentMessage(controller, 'Error received from server');
  };

  return {
    next_message: 'Connecting to server...',
    next_state: {
      ...last_state,
      connection: ws,
      authentication: {
        access_token,
        refresh_token,
        user_id,
      },
    },
  };
}

function cmd_addFriend(
  controller: PersController,
  last_state: RemoteServerAgentState,
  command_args: string[]
): LoopResult {
  const makeError = (message: string) => ({
    next_message: message,
    next_state: last_state,
  });

  if (!last_state.profile) {
    return makeError('Missing friends list');
  }

  const [friend_id, friend_username] = command_args;

  if (!friend_id) {
    return makeError(`Missing friend user ID`);
  }

  if (!friend_username) {
    return makeError(`Missing friend username`);
  }

  const friends = last_state.profile.friends.filter(
    (a) => a.user_id !== friend_id
  );

  friends.push({ user_id: friend_id, username: friend_username });

  return {
    next_message: `Added '${friend_username}' as friend`,
    next_state: {
      ...last_state,
      profile: {
        ...last_state.profile,
        friends,
      },
    },
  };
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
    case 'set-profile':
      return cmd_setProfile(controller, last_state, command_args);
    case 'set-friends-list':
      return cmd_setFriendsList(controller, last_state, command_args);
    case 'add-friend':
      return cmd_addFriend(controller, last_state, command_args);
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

export function setFriendsList(
  controller: PersController,
  friends_list: UserFriend[]
) {
  return sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${RemoteServerAgentName} set-friends-list --json ${JSON.stringify(
      friends_list
    )}`
  );
}

export function setProfile(
  controller: PersController,
  profile: RemoteUserProfile
) {
  return sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${RemoteServerAgentName} set-profile --json ${JSON.stringify(profile)}`
  );
}

export function addFriend(controller: PersController, friend: UserFriend) {
  return sendCommandToAgent(
    controller,
    getCurrentConversationFromController(controller),
    `${RemoteServerAgentName} add-friend ${friend.user_id} ${friend.username}`
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
    profile: null,
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
      sendAgentMessage(
        controller,
        `Failed to execute command '${incoming_command}':\n\n${
          exception instanceof Error
            ? `${exception.message}${
                exception.stack ? `\n${exception.stack}` : ''
              }`
            : exception
        }`
      );
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
