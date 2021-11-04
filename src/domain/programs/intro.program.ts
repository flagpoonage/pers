import {
  getCurrentConversationFromController,
  PersController,
} from '../controller';
import { ProgramOutput } from '../program';
import { getSystemIntroductionText } from '../system';

export async function intro(
  controller: PersController
): Promise<ProgramOutput> {
  const conversation = getCurrentConversationFromController(controller);

  if (!conversation) {
    return {
      message: 'Unable to find current conversation',
      isValidYield: true,
    };
  }

  return {
    message: getSystemIntroductionText(),
    isValidYield: true,
  };
}
