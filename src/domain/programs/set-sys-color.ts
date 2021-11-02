import { PersController, setSystemUserProperties } from '../controller';
import { TalkProgramGenerator } from '../program';
import { isValidColor } from './program-utils';

export async function* setSysColor(
  controller: PersController
): TalkProgramGenerator {
  let color = yield {
    message: 'Please choose a colour for the system user',
    isValidYield: true,
  };

  while (!isValidColor(color)) {
    color = yield {
      message: 'Colour is invalid, please choose another colour',
      isValidYield: false,
    };
  }

  setSystemUserProperties(controller, { userColor: color });

  return {
    message: `System display colour is set to ${color}`,
    isValidYield: true,
  };
}
