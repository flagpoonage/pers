import {
  getCurrentConversationFromController,
  isUserAuthenticated,
  PersController,
  sendCommandToAgent,
  setChatServer,
} from '../controller';
import { insertMessageInConversation } from '../conversation';
import { createMessage } from '../message';
import { PersProgramGenerator } from '../program';
import { SystemUser } from '../system';
import { getJsonErrorMessage, getJsonHttp, JsonError } from './program-utils';

export interface InfoOutputDto {
  data: {
    socket_host: string;
    is_secure: boolean;
  };
}

export async function* setServer(
  controller: PersController
): PersProgramGenerator {
  const conversation = getCurrentConversationFromController(controller);

  if (!conversation) {
    return {
      message: 'Unable to load current conversation',
      isValidYield: true,
    };
  }

  if (isUserAuthenticated(controller)) {
    return {
      message: 'You must logout before you can connect to a different server',
      isValidYield: true,
    };
  }

  const serverAddress = yield {
    message: 'Enter the server domain that you want to connect to',
    isValidYield: true,
    nextEntryOptions: {
      mask: false,
      label: 'Server domain',
    },
  };

  insertMessageInConversation(
    conversation,
    createMessage(SystemUser.userId, 'Fetching server metadata...')
  );

  try {
    // TODO: Be able to support both http and https
    const result = await getJsonHttp<InfoOutputDto>(
      `http://${serverAddress}/info`
    );

    sendCommandToAgent(
      controller,
      conversation,
      `chat-ws change-server ${result.data.socket_host} ${
        result.data.is_secure ? 'secure' : 'not-secure'
      }`
    );

    return {
      message: `Server changed successfully:\n\nSocket host: ${
        result.data.socket_host
      }\nSecure: ${result.data.is_secure ? 'Yes' : 'No'}`,
      isValidYield: true,
    };
  } catch (exception) {
    if (exception instanceof JsonError) {
      return {
        message: getJsonErrorMessage(exception),
        isValidYield: true,
      };
    } else {
      return {
        message: `Unable to fetch server connection information..\n\n${exception}`,
        isValidYield: true,
      };
    }
  }
}
