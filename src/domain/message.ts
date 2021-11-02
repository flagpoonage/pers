import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';

export interface PersMessage {
  id: string;
  userId: string;
  message: string;
  time: Date;
  isCommand: boolean;
}

export function createMessage(
  userId: string,
  message: string,
  isCommand = false
): PersMessage {
  return {
    id: uuid(),
    time: new Date(),
    userId,
    message,
    isCommand,
  };
}

export function formatMessageTime(message: PersMessage): string {
  return format(message.time, 'MMM dd yyyy h:mma');
}
