export interface SocketSettings {
  socket_host: string;
  is_secure: boolean;
}

export function createSocketSettings(
  socket_host: string,
  is_secure: boolean
): SocketSettings {
  return {
    socket_host,
    is_secure,
  };
}

export function createSocketConnection(
  settings: SocketSettings,
  token: string
) {
  const protocol = settings.is_secure ? 'wss' : 'ws';

  const connection = new WebSocket(
    `${protocol}://${settings.socket_host}/${token}`
  );

  return connection;
}
