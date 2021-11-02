import { OtherUser } from './user';

export const SystemUser: OtherUser = {
  userName: 'System',
  userColor: '#ff5050',
  userId: 'system',
};

export function getSystemIntroductionText() {
  return `
Welcome to Talk.

Here is a list of commands that you may find useful.
If you are in a chat with another user, these commands can be run by prepending the command with the command flag '\\c [command]'. 

* 'clear' clears the current conversation on screen
* 'intro' displays this text
* 'epoch' generates a millisecond timestamp epoch
* 'date-fmt [format]' displays the current date time in a given format (date-fns style)
* 'pretty-json [json]' pretty prints a string of JSON
* 'uuid [count]' generates the specified number of V4 UUID's
* 'set-clr [color]' changes your display color. 
* 'set-sys-clr [color]' changes the system display color. 
* 'set-cmd-clr [color]' changes the command display color. 
  `.trimStart();
}
