export type MaybeJSON<T> =
  | {
      valid: true;
      data: T;
    }
  | {
      valid: false;
    };

export function maybeJSON<T>(value: string): MaybeJSON<T> {
  try {
    const result = JSON.parse(value) as T;
    return {
      valid: true,
      data: result,
    };
  } catch {
    return {
      valid: false,
    };
  }
}
