import React, { createContext, useState, useEffect, useContext } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    deleteUser,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword
} from 'firebase/auth';
import { doc, setDoc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { auth } from '../services/firebase';
import { db } from '../services/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        // Listen for authentication state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);

            if (firebaseUser) {
                // Set online status on startup if they were already logged in
                const userRef = doc(db, 'users', firebaseUser.uid);
                try {
                    await updateDoc(userRef, {
                        isOnline: true,
                        lastSeen: serverTimestamp()
                    });
                } catch (err) {
                    // Silent status update expected on sign-up before doc creation
                }
            }
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    const login = async (email, password) => {
        try {
            setIsNewUser(false); // Ensure it's false on login
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Update online status in Firestore (creating if missing)
            const userRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userRef, {
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                isOnline: true,
                lastSeen: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            throw error;
        }
    };

    const register = async (email, password, basicInfo, setupInfo) => {
        try {
            setIsNewUser(true);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            const { displayName, username, location } = basicInfo;
            const { platforms, games, ranks, gameNames } = setupInfo;

            // Create full user profile in Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                uid: userCredential.user.uid,
                email,
                displayName: displayName || '',
                username: username || '',
                location: location || '',
                platforms: platforms || [],
                games: games || [],
                ranks: ranks || {},
                gameNames: gameNames || {},
                isProfileSetup: true,
                isOnline: true,
                createdAt: serverTimestamp(),
                lastSeen: serverTimestamp()
            });

            if (displayName) {
                await updateProfile(userCredential.user, { displayName });
            }

            return userCredential.user;
        } catch (error) {
            throw error;
        }
    };

    const googleLogin = async () => {
        // Placeholder for Google Login
        // Google Sign-In is temporarily disabled for Expo Go compatibility.
        console.log("Google Login button pressed (Logic disabled)");
        // You might want to throw an error or return specifically to let the UI show an alert
        throw new Error("Google Sign-In is currently disabled.");
    };

    const deleteAccount = async () => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                // 1. Delete user data from Firestore
                await deleteDoc(doc(db, 'users', currentUser.uid));

                // 2. Delete user from Firebase Auth
                await deleteUser(currentUser);

                // 3. Reset local state
                setUser(null);
                setIsNewUser(false);
            }
        } catch (error) {
            console.error("Error deleting account:", error);
            throw error;
        }
    };

    const updateUserPassword = async (currentPassword, newPassword) => {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser) throw new Error("No user is currently signed in.");

            // Re-authenticate the user first (required for security-sensitive operations like password change)
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Update the password
            await updatePassword(currentUser, newPassword);
        } catch (error) {
            console.error("Error updating password:", error);
            throw error;
        }
    };

    const completeSetup = () => {
        setIsNewUser(false);
    };

    const logout = async () => {
        try {
            const currentUser = auth.currentUser;
            if (currentUser) {
                // Update status - MUST await while user is still authenticated
                const userRef = doc(db, 'users', currentUser.uid);
                try {
                    await updateDoc(userRef, {
                        isOnline: false,
                        lastSeen: serverTimestamp()
                    });
                } catch (dbError) {
                    console.error("Failed to update status on logout:", dbError);
                }
            }
            await signOut(auth);
            setIsNewUser(false);
        } catch (error) {
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isNewUser,
            login,
            register,
            googleLogin,
            logout,
            deleteAccount,
            completeSetup,
            updateUserPassword
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
