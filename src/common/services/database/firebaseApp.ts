import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** The single Firebase app instance, shared by the auth and database services. */
export const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

let databaseInstance: Database | null = null;

/** Lazily create the Realtime Database handle (needs a configured databaseURL). */
export function getDb(): Database {
  if (!databaseInstance) {
    databaseInstance = getDatabase(firebaseApp);
  }
  return databaseInstance;
}
