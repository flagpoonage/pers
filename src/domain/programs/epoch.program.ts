import { ProgramOutput } from '../program';

export async function epoch(): Promise<ProgramOutput> {
  return {
    message: new Date().getTime().toString(),
    is_valid_yield: true,
  };
}
