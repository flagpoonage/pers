import { ProgramOutput } from '../domain/program';
import { getSystemIntroductionText } from '../domain/system';

export async function intro(): Promise<ProgramOutput> {
  return {
    message: getSystemIntroductionText(),
    is_valid_yield: true,
  };
}
