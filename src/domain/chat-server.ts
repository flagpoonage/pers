export interface ChatServerSettings {
  socket_host: string;
  is_secure: boolean;
}

export function createChatServerSettings(
  socket_host: string,
  is_secure: boolean
): ChatServerSettings {
  return {
    socket_host,
    is_secure,
  };
}

export function createChatServerConnection(
  settings: ChatServerSettings,
  token: string
) {
  const protocol = settings.is_secure ? 'wss' : 'ws';

  const connection = new WebSocket(
    `${protocol}://${settings.socket_host}/${token}`
  );

  return connection;
}
