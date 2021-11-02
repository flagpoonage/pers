import { PersController, setCommandColor } from '../controller';
import { TalkProgramGenerator } from '../program';
import { isValidColor } from './program-utils';
import { v4 as uuid } from 'uuid';

export async function* createUuid(
  controller: PersController
): TalkProgramGenerator {
  let countStr = yield {
    message: 'How many UUIDs do you want to generate?',
    isValidYield: true,
    nextEntryOptions: {
      mask: false,
      label: 'UUID Count',
    },
  };

  let count = Number(countStr);

  while (isNaN(Number(count))) {
    countStr = yield {
      message: 'Please enter a number of UUIDs to generate',
      isValidYield: false,
      nextEntryOptions: {
        mask: false,
        label: 'UUID Count',
      },
    };

    count = Number(countStr);
  }

  const uuids: string[] = [];

  for (let i = 0; i < count; i++) {
    uuids.push(uuid());
  }

  const message = `Generated ${count} UUIDs:\n\n${uuids
    .map((a) => `* ${a}`)
    .join('\n')}`;

  return {
    message,
    isValidYield: true,
  };
}
