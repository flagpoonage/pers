import { PersProgramGenerator } from '../domain/program';

export async function* prettyJson(): PersProgramGenerator {
  const content = yield {
    message: 'Enter your JSON content',
    is_valid_yield: true,
    next_entry_options: {
      mask: false,
      label: 'JSON Content',
    },
  };

  try {
    const result = JSON.parse(content);
    const output = JSON.stringify(result, null, 2);
    return {
      message: `JSON Output:\n\n${output}`,
      is_valid_yield: true,
    };
  } catch (exception) {
    return {
      message: 'Invalid JSON, could not be parsed',
      is_valid_yield: true,
    };
  }
}
