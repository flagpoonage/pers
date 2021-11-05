import { ProgramOutput } from '../program';
import { getSystemIntroductionText } from '../system';

export async function intro(): Promise<ProgramOutput> {
  return {
    message: getSystemIntroductionText(),
    is_valid_yield: true,
  };
}
