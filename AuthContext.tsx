import React, { createContext, useContext, useState, useEffect } from "react";
// IMPORTANT : On importe 'auth' et 'db' depuis notre fichier firebase, PAS depuis la librairie directement
import { auth, db } from "../services/firebase"; 
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: React.PropsWithChildren<{}>) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // 'admin', 'organizer', 'user'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On utilise l'instance 'auth' importée de services/firebase.ts
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Récupérer le rôle
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role);
          } else if (user.email === 'benjibikamwa@gmail.com') {
            setUserRole('admin');
          }
        } catch (e) {
          console.error("Erreur récupération rôle", e);
        }
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = { currentUser, userRole, login, logout, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
}