import { PersController } from './controller';

export type TalkProgram = (controller: PersController) => TalkProgramGenerator;
export type TalkCommand = (
  controller: PersController
) => Promise<ProgramOutput>;
export type TalkProgramGenerator = AsyncGenerator<
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
