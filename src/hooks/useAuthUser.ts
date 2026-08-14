import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export function useAuthUser() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthGateOpen, setIsAuthGateOpen] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user || user.isAnonymous) {
        setIsAuthGateOpen(true);
      } else {
        setIsAuthGateOpen(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    setIsAuthGateOpen(true);
  };

  const openAuthModal = () => setIsAuthGateOpen(true);
  const closeAuthModal = () => setIsAuthGateOpen(false);

  return {
    currentUser,
    isAuthGateOpen,
    openAuthModal,
    closeAuthModal,
    handleSignOut,
  };
}
