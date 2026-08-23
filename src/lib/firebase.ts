import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

// Point the SDKs at the local Firebase Emulator Suite instead of the real
// project when running `next dev` against `firebase emulators:start`.
// Guarded so a hot-reloaded module doesn't try to connect twice.
// Note: image uploads go straight to Cloudinary (see ImageUploader.tsx),
// not through Firebase Storage, so there's no Storage emulator to wire up
// here — Storage requires the paid Blaze plan just to provision a bucket,
// which this app deliberately avoids.
const globalForEmulators = globalThis as unknown as { __firebaseEmulatorsConnected?: boolean };

if (
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" &&
  typeof window !== "undefined" &&
  !globalForEmulators.__firebaseEmulatorsConnected
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  globalForEmulators.__firebaseEmulatorsConnected = true;
}
