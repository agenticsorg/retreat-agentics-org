import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCz6Rni3mZyyBzoKXKgtUnZtAbOzfzp7vE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "agenticsorg.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "agenticsorg",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:173957745326:web:65ed3e8014121c8dc17b3f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "agenticsorg.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "173957745326",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
googleProvider.setCustomParameters({ prompt: "select_account" });

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/popup-blocked" || code === "auth/popup-closed-by-browser") {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
};

getRedirectResult(auth).catch(() => {});

export const logOut = () => signOut(auth);

export const onAuthChange = (cb: (user: User | null) => void) => onAuthStateChanged(auth, cb);

export type { User };
