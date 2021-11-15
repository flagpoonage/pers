import {
  getRemoteServerAgentState,
  RemoteServerAgentName,
} from '../agents/remote-server.agent';
import { PersController } from '../domain/controller';
import { PersProgramGenerator } from '../domain/program';
import { getJsonErrorMessage, JsonError, postJsonHttp } from './program-utils';

interface ExpectedRegistrationResult {
  type: 'success';
  data: {
    message: string;
    user_id: string;
    username: string;
    created_at: number;
    updated_at: number;
  };
}

interface RegistrationInput {
  username: string;
  password: string;
}

export async function* register(
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
        'You must be connected to a server before you can register. Run the `set-svr` command to connect.',
      is_valid_yield: true,
    };
  }

  const username = yield {
    message:
      'Enter a new username. Your username should consistent of uppercase and lowercase letters, numbers from 0 to 9, as well as _ and - characters.',
    is_valid_yield: true,
    next_entry_options: {
      mask: false,
      label: 'Username',
    },
  };

  const password = yield {
    message:
      'Enter a new password. Your password must be at least 16 characters long.',
    is_valid_yield: true,
    next_entry_options: {
      mask: true,
      label: 'Password',
    },
  };

  try {
    await postJsonHttp<RegistrationInput, ExpectedRegistrationResult>(
      `${agent_state.host_settings.api}/register`,
      {
        username,
        password,
      }
    );

    return {
      message:
        'Registration was successful. Please use the login command to log in to your account',
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
