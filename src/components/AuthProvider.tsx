"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { DEFAULT_CHARACTER, UserProfile } from "@/lib/types";

type AuthContextValue = {
  firebaseUser: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (opts: {
    email: string;
    password: string;
    username: string;
    characterName: string;
    race: string;
    klass: string;
  }) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthLoading(false);
      if (!user) {
        setProfile(null);
        setProfileLoading(false);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser) return;
    setProfileLoading(true);
    const unsub = onSnapshot(doc(db, "users", firebaseUser.uid), (snap) => {
      setProfile(snap.exists() ? (snap.data() as UserProfile) : null);
      setProfileLoading(false);
    });
    return unsub;
  }, [firebaseUser]);

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function signUp(opts: {
    email: string;
    password: string;
    username: string;
    characterName: string;
    race: string;
    klass: string;
  }) {
    const cred = await createUserWithEmailAndPassword(auth, opts.email, opts.password);
    await updateProfile(cred.user, { displayName: opts.username });

    const userProfile: UserProfile = {
      uid: cred.user.uid,
      email: opts.email.toLowerCase().trim(),
      username: opts.username.trim(),
      role: "PLAYER",
      isScribe: false,
      createdAt: Date.now(),
    };
    await setDoc(doc(db, "users", cred.user.uid), userProfile);

    await setDoc(doc(db, "characters", cred.user.uid), {
      ...DEFAULT_CHARACTER,
      id: cred.user.uid,
      userId: cred.user.uid,
      ownerUsername: opts.username.trim(),
      name: opts.characterName.trim(),
      race: opts.race.trim(),
      class: opts.klass.trim(),
      updatedAt: serverTimestamp(),
    });
  }

  async function signOutUser() {
    await signOut(auth);
  }

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      loading: authLoading || profileLoading,
      signIn,
      signUp,
      signOutUser,
    }),
    [firebaseUser, profile, authLoading, profileLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
