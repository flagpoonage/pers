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

async function agentLoop(
  controller: PersController,
  last_status: PersAgentStatus,
  last_state: ChatWsAgentState,
  incoming_command: string,
  command_args: string[]
): Promise<AgentLoopResult> {
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
    value:
      '[chat-ws] agent started. Control it with `agent-ctl chat-ws [command]',
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
