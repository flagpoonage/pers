import { PersController, setCommandColor } from '../controller';
import { TalkProgramGenerator } from '../program';
import { isValidColor } from './program-utils';

export async function* setCmdColor(
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

  setCommandColor(controller, color);

  return {
    message: `Command colour is set to ${color}`,
    isValidYield: true,
  };
}
