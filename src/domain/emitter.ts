export type EmitterHandler<T> = (v: T) => void;

export interface Emitter<T> {
  handlers: Map<string, EmitterHandler<T>[]>;
}

export function createEmitter<T>(): Emitter<T> {
  return {
    handlers: new Map<string, EmitterHandler<T>[]>(),
  };
}

export function addHandler<T>(
  emitter: Emitter<T>,
  key: string,
  handler: EmitterHandler<T>
) {
  const handlers = emitter.handlers.get(key) ?? ([] as EmitterHandler<T>[]);
  handlers.push(handler);
  emitter.handlers.set(key, handlers);
}

export function removeHandler<T>(
  emitter: Emitter<T>,
  key: string,
  handler: EmitterHandler<T>
) {
  const handlers = emitter.handlers.get(key);
  if (!handlers || handlers.length === 0) {
    return;
  }

  const handlerIndex = handlers.indexOf(handler);

  if (handlerIndex !== -1) {
    handlers.splice(handlerIndex, 1);
  }
}
