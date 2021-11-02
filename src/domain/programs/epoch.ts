import { PersController, setCommandColor } from '../controller';
import { TalkProgramGenerator } from '../program';
import { isValidColor } from './program-utils';

export async function* epoch(controller: PersController): TalkProgramGenerator {
  yield {
    message: new Date().getTime().toString(),
    isValidYield: true,
  };
}
