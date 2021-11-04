import { isChatServerAssigned, PersController } from '../controller';
import { PersProgramGenerator } from '../program';
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
  if (!isChatServerAssigned(controller)) {
    return {
      message:
        'You must be connected to a server before you can register. Run the `set-svr` command to connect.',
      isValidYield: true,
    };
  }

  const username = yield {
    message:
      'Enter a new username. Your username should consistent of uppercase and lowercase letters, numbers from 0 to 9, as well as _ and - characters.',
    isValidYield: true,
    nextEntryOptions: {
      mask: false,
      label: 'Username',
    },
  };

  const password = yield {
    message:
      'Enter a new password. Your password must be at least 16 characters long.',
    isValidYield: true,
    nextEntryOptions: {
      mask: true,
      label: 'Password',
    },
  };

  try {
    await postJsonHttp<RegistrationInput, ExpectedRegistrationResult>(
      'http://localhost:5555/register',
      {
        username,
        password,
      }
    );

    return {
      message:
        'Registration was successful. Please use the login command to log in to your account',
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
        message: `Something went wrong while making the request, please try again later.\n\n${exception}`,
        isValidYield: true,
      };
    }
  }
}
