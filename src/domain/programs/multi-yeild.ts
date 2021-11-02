import { PersController, setCommandColor } from '../controller';
import { TalkProgramGenerator } from '../program';
import { isValidColor } from './program-utils';

export async function* multiYield(
  controller: PersController
): TalkProgramGenerator {
  const one = yield {
    message: 'Yeild 1',
    isValidYield: true,
  };
  const two = yield {
    message: `Yeild 2 ${one}`,
    isValidYield: true,
  };
  const thr = yield {
    message: `Yeild 3 ${one} ${two}`,
    isValidYield: true,
  };
  const four = yield {
    message: `Yeild 4 ${one} ${two} ${thr}`,
    isValidYield: true,
  };
  const five = yield {
    message: `Yeild 5 ${one} ${two} ${thr} ${four}`,
    isValidYield: true,
  };

  return {
    message: `Finished`,
    isValidYield: true,
  };
}
