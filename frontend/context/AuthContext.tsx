"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../app/firebase";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
    user: any | null; // Support both Firebase User and DB User
    loading: boolean;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refreshSession: async () => { } });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    const refreshSession = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                // Map backend user to expected format if needed
                setUser({
                    uid: userData.id,
                    email: userData.email,
                    displayName: userData.display_name,
                    photoURL: userData.photoURL,
                    isFromToken: true
                });

                // Invalidate all queries to force a refresh of everything
                queryClient.invalidateQueries();
            } else {
                console.error("Token invalid or expired");
                localStorage.removeItem('token');
                setUser(null);
            }
        } catch (err) {
            console.error("Failed to refresh session from token:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial bootstrap from token if exists
        const token = localStorage.getItem('token');
        if (token) {
            refreshSession();
        }

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                const currentToken = localStorage.getItem('token');

                // If we already have a user from token, check if it matches fbUser
                // If not, we might be in a "switched" state, so we don't automatically overwrite
                // unless it's the SAME user (then we refresh token).
                if (user && user.uid !== fbUser.uid && user.isFromToken) {
                    console.log("Firebase user changed but we are in a switched session. Ignoring Firebase sync.");
                    return;
                }

                // Firebase user logged in, sync with backend
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/sync`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            uid: fbUser.uid,
                            email: fbUser.email,
                            display_name: fbUser.displayName,
                            photoURL: fbUser.photoURL
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        localStorage.setItem('token', data.access_token);
                        console.log("✅ Synced with backend");
                        setUser(fbUser);
                    } else {
                        console.error("Failed to sync with backend");
                    }
                } catch (err) {
                    console.error("Backend sync error:", err);
                }
            } else {
                // No Firebase user. 
                // We keep the current user if it was loaded from a token.
                if (user && user.isFromToken) {
                    // Keep token-based user
                } else {
                    setUser(null);
                }
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refreshSession }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
