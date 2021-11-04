import { PersController, setCommandColor } from '../controller';
import { PersProgramGenerator } from '../program';
import { isValidColor } from './program-utils';

export async function* setCmdColor(
  controller: PersController
): PersProgramGenerator {
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
