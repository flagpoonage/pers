import {
  changeServer,
  getRemoteServerAgentState,
} from '../agents/remote-server.agent';
import {
  getCurrentConversationFromController,
  PersController,
} from '../domain/controller';
import { insertMessageInConversation } from '../domain/conversation';
import { createMessage } from '../domain/message';
import { PersProgramGenerator } from '../domain/program';
import { SystemUser } from '../domain/system';
import { getJsonErrorMessage, getJsonHttp, JsonError } from './program-utils';

export interface InfoOutputDto {
  data: {
    api_host: string;
    socket_host: string;
  };
}

export async function* setServer(
  controller: PersController
): PersProgramGenerator {
  const conversation = getCurrentConversationFromController(controller);
  const remote_server_state = getRemoteServerAgentState(controller);

  if (remote_server_state && remote_server_state.authentication) {
    return {
      message: 'You must logout before you can connect to a different server',
      is_valid_yield: true,
    };
  }

  const serverAddress = yield {
    message: 'Enter the server domain that you want to connect to',
    is_valid_yield: true,
    next_entry_options: {
      mask: false,
      label: 'Server domain',
    },
  };

  insertMessageInConversation(
    conversation,
    createMessage(SystemUser.user_id, 'Fetching server metadata...')
  );

  try {
    // TODO: Be able to support both http and https
    const result = await getJsonHttp<InfoOutputDto>(
      `http://${serverAddress}/info`
    );

    changeServer(controller, {
      ...result.data,
    });

    return {
      message: `Server changed successfully:\n\nAPI host: ${result.data.api_host}\nSocket host: ${result.data.socket_host}`,
      is_valid_yield: true,
    };
  } catch (exception) {
    if (exception instanceof JsonError) {
      return {
        message: getJsonErrorMessage(exception),
        is_valid_yield: true,
      };
    } else {
      return {
        message: `Unable to fetch server connection information..\n\n${exception}`,
        is_valid_yield: true,
      };
    }
  }
}
