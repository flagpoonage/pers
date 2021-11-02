import { ProgramOutput } from '../program';

export async function epoch(): Promise<ProgramOutput> {
  return {
    message: new Date().getTime().toString(),
    isValidYield: true,
  };
}
