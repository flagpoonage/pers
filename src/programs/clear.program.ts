import {
  getCurrentConversationFromController,
  PersController,
} from '../domain/controller';
import { clearConversation } from '../domain/conversation';
import { ProgramOutput } from '../domain/program';

export async function clear(
  controller: PersController
): Promise<ProgramOutput> {
  const conversation = getCurrentConversationFromController(controller);

  clearConversation(conversation);

  return {
    message: 'Conversation cleared',
    is_valid_yield: true,
  };
}
