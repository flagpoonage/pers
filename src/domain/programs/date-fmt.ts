import { format } from 'date-fns';
import { TalkProgramGenerator } from '../program';

export async function* dateFmt(): TalkProgramGenerator {
  const content = yield {
    message: 'Enter the date format you want to use',
    isValidYield: true,
    nextEntryOptions: {
      mask: false,
      label: 'Date Format',
    },
  };

  try {
    const output = format(new Date(), content);
    return {
      message: output,
      isValidYield: true,
    };
  } catch (exception) {
    if (exception instanceof Error) {
      return {
        message: `Invalid format, date could not be written:\n\n ${exception.message}`,
        isValidYield: true,
      };
    }

    return {
      message: `Unknown exception`,
      isValidYield: true,
    };
  }
}
