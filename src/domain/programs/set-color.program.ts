import { setMyDisplayColor } from '../agents/display.agent';
import { PersController } from '../controller';
import { PersProgramGenerator } from '../program';
import { isValidColor } from './program-utils';

export async function* setColor(
  controller: PersController
): PersProgramGenerator {
  let color = yield {
    message: 'Please choose a colour for the your own user messages',
    is_valid_yield: true,
  };

  while (!isValidColor(color)) {
    color = yield {
      message: 'Colour is invalid, please choose another colour',
      is_valid_yield: false,
    };
  }

  setMyDisplayColor(controller, color);

  return {
    message: null,
    is_valid_yield: true,
  };
}
