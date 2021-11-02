import { TalkProgramGenerator } from '../program';

export async function* setPassword(): TalkProgramGenerator {
  const password = yield {
    message: 'Please enter a password',
    isValidYield: true,
    nextEntryOptions: {
      mask: true,
      label: 'Password',
    },
  };

  return {
    message: `Password received ${password}`,
    isValidYield: true,
  };
}
