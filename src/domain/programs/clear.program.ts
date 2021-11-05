import {
  getCurrentConversationFromController,
  PersController,
} from '../controller';
import { clearConversation } from '../conversation';
import { ProgramOutput } from '../program';

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
