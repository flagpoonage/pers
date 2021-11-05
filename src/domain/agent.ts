import { PersController } from './controller';
import { Emitter } from './emitter';

interface PersAgentResponse {
  message: string | null;
  state: unknown;
}

export type PersAgentGenerator = AsyncGenerator<
  PersAgentResponse,
  PersAgentResponse,
  string[]
>;

export interface PersAgentLoopResult<T> {
  next_message: string | null;
  next_state: T;
}

export interface PersAgentController<T = unknown> {
  name: string;
  init: (controller: PersController) => PersAgentGenerator;
  executor: PersAgentGenerator | null;
  emitter: Emitter<T>;
  state: unknown;
}
