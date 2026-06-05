import { child, get, onValue, push, ref, remove, set, update } from 'firebase/database';
import { getDb } from './firebaseApp';

/** Read a value once; returns null when the path doesn't exist. */
export async function read<T>(path: string): Promise<T | null> {
  const snapshot = await get(ref(getDb(), path));
  return snapshot.exists() ? (snapshot.val() as T) : null;
}

/** Overwrite the value at a path. */
export async function write<T>(path: string, value: T): Promise<void> {
  await set(ref(getDb(), path), value);
}

/** Merge a partial object into the value at a path. */
export async function updateAt(
  path: string,
  value: Record<string, unknown>,
): Promise<void> {
  await update(ref(getDb(), path), value);
}

/** Delete the value at a path. */
export async function removeAt(path: string): Promise<void> {
  await remove(ref(getDb(), path));
}

/** Subscribe to live changes at a path. Returns an unsubscribe function. */
export function subscribe<T>(
  path: string,
  callback: (value: T | null) => void,
): () => void {
  return onValue(ref(getDb(), path), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.val() as T) : null);
  });
}

/** Generate a new push key under a path without writing anything. */
export function newKey(path: string): string {
  const key = push(child(ref(getDb()), path)).key;
  if (!key) {
    throw new Error('Failed to generate a database key');
  }
  return key;
}
