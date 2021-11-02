import { PersController, setCommandColor } from '../controller';
import { TalkProgramGenerator } from '../program';
import { isValidColor } from './program-utils';

export async function* setPassword(
  controller: PersController
): TalkProgramGenerator {
  const password = yield {
    message: 'Please enter a password',
    isValidYield: true,
    nextEntryOptions: {
      mask: true,
      label: 'Password',
    },
  };

  return {
    message: `Password received ${password}`,
    isValidYield: true,
  };
}
