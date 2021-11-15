import { PersProgramGenerator } from '../domain/program';
import { v4 as generateUuid } from 'uuid';

export async function* uuid(): PersProgramGenerator {
  let countStr = yield {
    message: 'How many UUIDs do you want to generate?',
    is_valid_yield: true,
    next_entry_options: {
      mask: false,
      label: 'UUID Count',
    },
  };

  let count = Number(countStr);

  while (isNaN(Number(count))) {
    countStr = yield {
      message: 'Please enter a number of UUIDs to generate',
      is_valid_yield: false,
      next_entry_options: {
        mask: false,
        label: 'UUID Count',
      },
    };

    count = Number(countStr);
  }

  const uuids: string[] = [];

  for (let i = 0; i < count; i++) {
    uuids.push(generateUuid());
  }

  const message = `Generated ${count} UUIDs:\n\n${uuids.join('\n')}`;

  return {
    message,
    is_valid_yield: true,
  };
}
