import { PersController, setSelfUserProperties } from '../controller';
import { PersProgramGenerator } from '../program';
import { isValidColor } from './program-utils';

export async function* setColor(
  controller: PersController
): PersProgramGenerator {
  let color = yield {
    message: 'Please choose a colour for the your own user messages',
    isValidYield: true,
  };

  while (!isValidColor(color)) {
    color = yield {
      message: 'Colour is invalid, please choose another colour',
      isValidYield: false,
    };
  }

  setSelfUserProperties(controller, { userColor: color });

  return {
    message: `Your display colour is set to ${color}`,
    isValidYield: true,
  };
}
