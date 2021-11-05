import { format } from 'date-fns';
import { PersProgramGenerator } from '../program';

export async function* dateFmt(): PersProgramGenerator {
  const content = yield {
    message: 'Enter the date format you want to use',
    is_valid_yield: true,
    next_entry_options: {
      mask: false,
      label: 'Date Format',
    },
  };

  try {
    const output = format(new Date(), content);
    return {
      message: output,
      is_valid_yield: true,
    };
  } catch (exception) {
    if (exception instanceof Error) {
      return {
        message: `Invalid format, date could not be written:\n\n ${exception.message}`,
        is_valid_yield: true,
      };
    }

    return {
      message: `Unknown exception`,
      is_valid_yield: true,
    };
  }
}
