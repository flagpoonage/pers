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

  if (!conversation) {
    return {
      message: 'Unable to find current conversation',
      isValidYield: true,
    };
  }

  clearConversation(conversation);

  return {
    message: 'Conversation cleared',
    isValidYield: true,
  };
}
