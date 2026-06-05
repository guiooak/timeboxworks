import {
  observeAuth,
  signInWithGoogle,
  signOutUser,
  type AuthUser,
} from '../../common/services/auth';
import { createStore } from '../../common/services/state';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  initialized: boolean;
  init: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = createStore<AuthState>()((set, get) => ({
  user: null,
  status: 'loading',
  initialized: false,
  init: () => {
    if (get().initialized) {
      return;
    }
    set({ initialized: true });
    observeAuth((user) =>
      set({ user, status: user ? 'authenticated' : 'unauthenticated' }),
    );
  },
  signIn: async () => {
    await signInWithGoogle();
  },
  signOut: async () => {
    await signOutUser();
  },
}));
