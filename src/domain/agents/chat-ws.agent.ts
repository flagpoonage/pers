import { ChatServerSettings } from '../chat-server';
import { PersController } from '../controller';
import { insertMessageInConversation } from '../conversation';

export interface PersAgentStatus {
  name: string;
  running: boolean;
  state: Record<string, unknown>;
}

interface ChatWsAgentState extends Record<string, unknown> {
  connection: WebSocket | null;
  serverSettings: ChatServerSettings | null;
}

interface PersAgentResponse {
  message: string | null;
  status: PersAgentStatus;
}

export type PersAgentGenerator = AsyncGenerator<
  PersAgentResponse,
  PersAgentResponse,
  string[]
>;

interface AgentLoopResult {
  next_message: string | null;
  next_status: Omit<PersAgentStatus, 'state'>;
  next_state: ChatWsAgentState;
}

function changeServer(
  controller: PersController,
  last_status: PersAgentStatus,
  last_state: ChatWsAgentState,
  command_args: string[]
): AgentLoopResult {
  const [socket_host, is_secure] = command_args;

  const makeError = (message: string) => ({
    next_message: message,
    next_state: last_state,
    next_status: last_status,
  });

  if (!socket_host) {
    return makeError(`Missing socket host address`);
  }

  if (!is_secure) {
    return makeError(`Missing is_secure flag`);
  }

  if (!['secure', 'not-secure'].includes(is_secure)) {
    return makeError(
      `Expected is_secure flag with value 'secure' or 'not-secure' but received '${is_secure}'`
    );
  }

  const next_state: ChatWsAgentState = {
    ...last_state,
    serverSettings: {
      socket_host: socket_host,
      is_secure: is_secure === 'secure',
    },
  };

  return {
    next_message: 'Server settings updated',
    next_status: last_status,
    next_state,
  };
}

async function agentLoop(
  controller: PersController,
  last_status: PersAgentStatus,
  last_state: ChatWsAgentState,
  incoming_command: string,
  command_args: string[]
): Promise<AgentLoopResult> {
  switch (incoming_command) {
    case 'change-server':
      return changeServer(controller, last_status, last_state, command_args);
  }

  return {
    next_message: null,
    next_state: last_state,
    next_status: last_status,
  };
}

export async function* chatWsAgent(
  controller: PersController
): PersAgentGenerator {
  let agent_state: ChatWsAgentState = {
    connection: null,
    serverSettings: null,
  };

  let agent_status: PersAgentStatus = {
    name: 'chat-ws',
    running: true,
    state: agent_state,
  };

  const message: {
    value: string | null;
  } = {
    value: 'Chat websocket agent started successfully',
  };

  do {
    const [incoming_command, ...command_args] = yield {
      message: message.value,
      status: agent_status,
    };

    message.value = null;

    try {
      const { next_state, next_status, next_message } = await agentLoop(
        controller,
        agent_status,
        agent_state,
        incoming_command,
        command_args
      );

      agent_state = next_state;

      agent_status = {
        ...next_status,
        state: next_state,
      };

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
