import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

/**
 * State abstraction over Zustand. Feature stores are created with
 * `createStore<State>()(initializer)` and never import zustand directly.
 */
export const createStore = create;
export { useShallow };
export type { StoreApi, UseBoundStore } from 'zustand';
