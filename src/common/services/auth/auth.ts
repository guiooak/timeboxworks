import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { firebaseApp } from '../database';

const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export type AuthUser = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) {
    return null;
  }
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, googleProvider);
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

/** Observe auth state. Calls back with the user (or null) and returns an unsubscribe. */
export function observeAuth(callback: (user: AuthUser | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => callback(toAuthUser(user)));
}
