import { PersController } from './controller';

export type PersProgram = (controller: PersController) => PersProgramGenerator;
export type PersCommand = (
  controller: PersController
) => Promise<ProgramOutput>;

export type PersProgramGenerator = AsyncGenerator<
  ProgramOutput,
  ProgramOutput,
  string
>;

export interface CommandEntryOptions {
  mask: boolean;
  label?: string;
  placeholder?: string;
}

export interface ProgramOutput {
  message: string;
  isValidYield: boolean;
  nextEntryOptions?: CommandEntryOptions;
}

export function createDefaultCommandEntryOptions() {
  return {
    mask: false,
  };
}
