// import React, { useCallback, useEffect, useState } from 'react';
// import { useContext } from 'react';
// import { PersMessage } from './domain/message';
// import {
//   addConversationChangeListener,
//   insertMessageInConversation,
//   PersConversation,
//   removeConversationChangeListener,
// } from './domain/conversation';
// import { PersMessageGroup } from './domain/message-group';

// const ConversationContext = React.createContext<PersConversation | null>(null);

// export function ConversationProvider({
//   children,
//   value,
// }: React.PropsWithChildren<{ value: PersConversation }>) {
//   return (
//     <ConversationContext.Provider value={value}>
//       {children}
//     </ConversationContext.Provider>
//   );
// }

// export function useConversation() {
//   const conversation = useContext(ConversationContext);

//   if (!conversation) {
//     throw new Error(
//       'Using [useMessageController] outside of <MessageControllerProvider>'
//     );
//   }

//   const insertMessage = useCallback(
//     (message: PersMessage) => {
//       insertMessageInConversation(conversation, message);
//     },
//     [conversation]
//   );

//   return {
//     conversation,
//     insertMessage,
//   };
// }

// export function useConversationMessageGroups() {
//   const { conversation } = useConversation();
//   const [messageGroups, setMessageGroups] = useState<PersMessageGroup[]>(
//     conversation.messageGroups
//   );

//   useEffect(() => {
//     const changeListener = (c: PersConversation) =>
//       setMessageGroups(c.messageGroups);

//     addConversationChangeListener(conversation, changeListener);

//     return () => {
//       removeConversationChangeListener(conversation, changeListener);
//     };
//   }, [conversation]);

//   return messageGroups;
// }
