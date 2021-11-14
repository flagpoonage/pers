import {
  getCurrentUser,
  getRemoteServerAgentState,
  RemoteServerAgentName,
} from '../agents/remote-server.agent';
import { addUser, getUser } from '../agents/users.agent';
import {
  addConversation,
  PersController,
  switchConversation,
} from '../controller';
import { createConversation } from '../conversation';
import { PersProgramGenerator } from '../program';

export async function* chat(controller: PersController): PersProgramGenerator {
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
        'You must be connected to a server before you can login. Run the `set-svr` command to correct this.',
      is_valid_yield: true,
    };
  }

  if (!agent_state.authentication) {
    return {
      message:
        'You must be logged into the server before you can chat with other users. Run the `login` command to correct this.',
      is_valid_yield: true,
    };
  }

  if (!agent_state.profile) {
    return {
      message:
        'Your profile is not available. Try logging in again to reset your profile',
      is_valid_yield: true,
    };
  }

  let username = '';

  while (!username) {
    username = yield {
      message: 'Enter the username of the user you want to chat to',
      is_valid_yield: true,
      next_entry_options: {
        mask: false,
        label: 'Friends username',
      },
    };
  }

  const friend = agent_state.profile.friends.find(
    (a) => a.username === username
  );

  if (!friend) {
    return {
      message:
        'The username enteres is not in your friends list. Run the `add-friend` command to correct this.',
      is_valid_yield: true,
    };
  }

  await addUser(controller, friend);

  const user = getUser(controller, friend.user_id);

  if (!user) {
    return {
      message: 'Couldnt obtain the user from the users service',
      is_valid_yield: true,
    };
  }

  const conversation = createConversation([getCurrentUser(controller), user]);
  addConversation(controller, conversation);
  switchConversation(controller, conversation);

  return {
    message: 'Conversation created',
    is_valid_yield: true,
  };
}
