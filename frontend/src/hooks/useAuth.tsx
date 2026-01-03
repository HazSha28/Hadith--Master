import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendEmailVerification,
  User
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

/* ================= TYPES ================= */

export type UserProfile = {
  uid: string;
  email: string | null;
  fullName: string;
  role: "user" | "admin";
  premium: boolean;
  credits: number;
  createdAt: any;
};

/* ================= HOOK ================= */

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= AUTH STATE LISTENER ================= */

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const ref = doc(db, "users", currentUser.uid);
      const snap = await getDoc(ref);

      // Create Firestore profile if missing
      if (!snap.exists()) {
        await setDoc(ref, {
          uid: currentUser.uid,
          email: currentUser.email,
          fullName: currentUser.displayName || "",
          role: "user",
          premium: false,
          credits: 5,
          createdAt: serverTimestamp()
        });
      }

      const latest = await getDoc(ref);
      setProfile(latest.data() as UserProfile);

      setLoading(false);
    });

    return () => unsub();
  }, []);

  /* ================= SIGN UP ================= */

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Set display name
    await updateProfile(cred.user, { displayName: fullName });

    // 🔥 SEND WELCOME / VERIFICATION EMAIL
    await sendEmailVerification(cred.user);

    // Create Firestore user
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      fullName,
      role: "user",
      premium: false,
      credits: 5,
      createdAt: serverTimestamp()
    });

    return cred.user;
  };

  /* ================= SIGN IN ================= */

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  /* ================= LOGOUT ================= */

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

  /* ================= EXPORT ================= */

  return {
    user,       // Firebase Auth user
    profile,    // Firestore profile
    loading,
    signUp,
    signIn,
    logout,
    resetPassword
  };
}
