import {
  connect,
  getRemoteServerAgentState,
  RemoteServerAgentName,
} from '../agents/remote-server.agent';
import { PersController } from '../controller';
import { PersProgramGenerator } from '../program';
import { getJsonErrorMessage, JsonError, postJsonHttp } from './program-utils';

interface ExpectedLoginResult {
  type: 'success';
  data: {
    user_id: string;
    access_token: string;
    refresh_token: string;
  };
}

interface LoginInput {
  username: string;
  password: string;
}

export async function* login(controller: PersController): PersProgramGenerator {
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

  const username = yield {
    message: 'Enter your username',
    is_valid_yield: true,
    next_entry_options: {
      mask: false,
      label: 'Username',
    },
  };

  const password = yield {
    message: 'Enter your password',
    is_valid_yield: true,
    next_entry_options: {
      mask: true,
      label: 'Password',
    },
  };

  try {
    const result = await postJsonHttp<LoginInput, ExpectedLoginResult>(
      `${agent_state.host_settings.api}/login`,
      {
        username,
        password,
      }
    );

    connect(controller, result.data);

    return {
      message:
        'Login was successful. Please use the login command to log in to your account',
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
