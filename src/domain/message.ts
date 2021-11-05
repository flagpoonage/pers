import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';

export interface PersMessage {
  id: string;
  user_id: string;
  message: string;
  time: Date;
  is_command: boolean;
}

export function createMessage(
  userId: string,
  message: string,
  isCommand = false
): PersMessage {
  return {
    id: uuid(),
    time: new Date(),
    user_id: userId,
    message,
    is_command: isCommand,
  };
}

export function formatMessageTime(message: PersMessage): string {
  return format(message.time, 'MMM dd yyyy h:mma');
}
