import { PersProgramGenerator } from '../program';

export async function* prettyJson(): PersProgramGenerator {
  const content = yield {
    message: 'Enter your JSON content',
    isValidYield: true,
    nextEntryOptions: {
      mask: false,
      label: 'JSON Content',
    },
  };

  try {
    const result = JSON.parse(content);
    const output = JSON.stringify(result, null, 2);
    return {
      message: `JSON Output:\n\n${output}`,
      isValidYield: true,
    };
  } catch (exception) {
    return {
      message: 'Invalid JSON, could not be parsed',
      isValidYield: true,
    };
  }
}
