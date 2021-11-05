import { setSystemColor } from '../agents/display.agent';
import { PersController } from '../controller';
import { PersProgramGenerator } from '../program';
import { isValidColor } from './program-utils';

export async function* setSysColor(
  controller: PersController
): PersProgramGenerator {
  let color = yield {
    message: 'Please choose a colour for the system user',
    is_valid_yield: true,
  };

  while (!isValidColor(color)) {
    color = yield {
      message: 'Colour is invalid, please choose another colour',
      is_valid_yield: false,
    };
  }

  setSystemColor(controller, color);

  return {
    message: null,
    is_valid_yield: true,
  };
}
