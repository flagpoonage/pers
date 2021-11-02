import { OtherUser } from './user';

export const SystemUser: OtherUser = {
  userName: 'System',
  userColor: '#ff5050',
  userId: 'system',
};

export function getSystemIntroductionText() {
  return `
Welcome to Talk.

Here is a list of commands that you may find useful. If you are in a chat with another user, these commands can be run by prepending the command with the command flag '\\c [command]'. 

* 'login [username] [password]' authenticates with the server
* 'register [username] [password]' creates a new account on the server
* 'logout' unauthenticate from the server and close any open chats 
* 'set-name [name]' changes your display name. This does not change your username
* 'set-color [hex color | web color name]' changes your display color. If another user has overwritten your display color on their side, this change will not affect them.
* 'add-user [username] [?optional greeting]' adds a friend you can chat with. They must accept you as a friend before you can send them messages
* 'acc-user [username]' accepts a friend who has added you.
* 'chat [username]' opens your chat with the user.
* 'root' returns you from any open chat to the root system chat.
* 'notif' takes you to the notifications list 
  `.trimStart();
}
