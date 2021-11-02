import { TalkProgramGenerator } from '../program';

export async function* multiYield(): TalkProgramGenerator {
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

  return {
    message: `Finished ${one} ${two} ${thr}`,
    isValidYield: true,
  };
}
