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
  message: string | null;
  is_valid_yield: boolean;
  next_entry_options?: CommandEntryOptions;
}

export function createDefaultCommandEntryOptions() {
  return {
    mask: false,
  };
}
