import { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
  User
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "firebase/firestore";

type UserProfile = {
  uid: string;
  email: string | null;
  fullName: string;
  role: string;
  premium: boolean;
  credits: number;
  createdAt: any;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= AUTH LISTENER ================= */

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

      // 🔥 Create Firestore user if missing
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

  const signUp = async (email: string, password: string, fullName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(cred.user, { displayName: fullName });

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

  return {
    user,        // Firebase Auth user
    profile,    // Firestore user data
    signUp,
    signIn,
    logout,
    loading
  };
}
