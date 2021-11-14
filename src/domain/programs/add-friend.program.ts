import {
  getRemoteServerAgentState,
  RemoteServerAgentName,
  addFriend as addFriendCmd,
  UserFriend,
} from '../agents/remote-server.agent';
import { PersController } from '../controller';
import { PersProgramGenerator } from '../program';
import { getJsonErrorMessage, JsonError, postJsonHttp } from './program-utils';

interface ExpectedAddFriendResult {
  type: 'success';
  data: {
    friend_data: UserFriend;
    is_reciprocal: boolean;
  };
}

interface AddFriendInput {
  username: string;
}

export async function* addFriend(
  controller: PersController
): PersProgramGenerator {
  const agent_state = getRemoteServerAgentState(controller);

  if (!agent_state) {
    return {
      message: `The '${RemoteServerAgentName}' agent is not currently started`,
      is_valid_yield: true,
    };
  }

  if (!agent_state.host_settings) {
    return {
      message:
        'You must be connected to a server before you can login. Run the `set-svr` command to connect.',
      is_valid_yield: true,
    };
  }

  if (!agent_state.authentication) {
    return {
      message:
        'You must be logged in to the server before you can add friends. Run the `login` command to log in to your account',
      is_valid_yield: true,
    };
  }

  let username = '';

  while (!username) {
    username = yield {
      message: 'Enter the username of friend you want to add',
      is_valid_yield: true,
      next_entry_options: {
        mask: false,
        label: 'Friends username',
      },
    };
  }

  try {
    const {
      data: { is_reciprocal, friend_data },
    } = await postJsonHttp<AddFriendInput, ExpectedAddFriendResult>(
      `${agent_state.host_settings.api}/add-friend`,
      {
        username,
      },
      agent_state.authentication.access_token
    );

    addFriendCmd(controller, friend_data);

    if (is_reciprocal) {
      return {
        message: `You are now friends with ${friend_data.username}. Start a chat with 'chat ${friend_data.username}'.`,
        is_valid_yield: true,
      };
    }
    return {
      message: `A connection invite has been sent to ${friend_data.username}. Once they have accepted you will be able to chat`,
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
        message: `Something went wrong while making the request, please try again later.\n\n${exception}`,
        is_valid_yield: true,
      };
    }
  }
}
