import { PersController } from '../controller';

interface RemoteServerAgentState extends Record<string, unknown> {
  connection: WebSocket | null;
  hostSettings: {
    api: string;
    socket: string;
  } | null;
}

interface PersAgentResponse {
  message: string | null;
  state: unknown;
}

export type PersAgentGenerator = AsyncGenerator<
  PersAgentResponse,
  PersAgentResponse,
  string[]
>;

interface AgentLoopResult {
  next_message: string | null;
  next_state: RemoteServerAgentState;
}

function changeServer(
  controller: PersController,
  last_state: RemoteServerAgentState,
  command_args: string[]
): AgentLoopResult {
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
    hostSettings: {
      api: api_host,
      socket: socket_host,
    },
  };

  return {
    next_message: 'Remote server settings updated',
    next_state,
  };
}

async function agentLoop(
  controller: PersController,
  last_state: RemoteServerAgentState,
  incoming_command: string,
  command_args: string[]
): Promise<AgentLoopResult> {
  switch (incoming_command) {
    case 'change-server':
      return changeServer(controller, last_state, command_args);
  }

  return {
    next_message: null,
    next_state: last_state,
  };
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
  return controller.agents.get('remote-server');
}

export async function* remoteServerAgent(
  controller: PersController
): PersAgentGenerator {
  let agent_state: RemoteServerAgentState = {
    connection: null,
    hostSettings: null,
  };

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
