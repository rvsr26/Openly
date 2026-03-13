"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../app/firebase";
import { useQueryClient } from "@tanstack/react-query";
import { saveAccount } from "../app/lib/accountUtils";

interface AuthContextType {
    user: any | null;
    loading: boolean;
    refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, refreshSession: async () => { } });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const queryClient = useQueryClient();

    // Stable reference to latest user state for closures
    const userRef = useRef<any | null>(null);

    // Update ref whenever user state changes
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    const refreshSession = async () => {
        const token = localStorage.getItem('token');
        if (!token || token === "undefined" || token === "null") {
            localStorage.removeItem('token');
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
                setUser({
                    uid: userData.id,
                    email: userData.email,
                    displayName: userData.display_name,
                    photoURL: userData.photoURL,
                    twoFactorEnabled: userData.two_factor_enabled,
                    role: userData.role,
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
        if (token && token !== "undefined" && token !== "null") {
            refreshSession();
        }

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                const currentToken = localStorage.getItem('token');

                // Prevent race condition on full page reload by checking the active JWT directly
                if (currentToken && currentToken !== "undefined" && currentToken !== "null") {
                    try {
                        const base64Url = currentToken.split('.')[1];
                        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                        }).join(''));
                        const payload = JSON.parse(jsonPayload);

                        // If the token belongs to a DIFFERENT user than Firebase, we are in a switched session!
                        if (payload.sub && payload.sub !== fbUser.uid) {
                            console.log("Firebase user differs from active JWT session. Ignoring Firebase sync.");
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.error("Error decoding JWT during auth state change", e);
                    }
                }

                const prev = userRef.current;

                if (prev && prev.uid !== fbUser.uid && prev.isFromToken) {
                    console.log("Firebase user changed but we are in a switched session. Ignoring Firebase sync.");
                    setLoading(false);
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

                        if (data['2fa_required']) {
                            const currentToken = localStorage.getItem('token');

                            // If a token already exists, the user is likely in an active session.
                            // We do not want to force an MFA redirect loop when Firebase re-syncs.
                            if (currentToken && currentToken !== "undefined" && currentToken !== "null") {
                                console.log("🔐 MFA is enabled, but user already has a backend token. Skipping redirect.");
                                setUser((prev: any) => prev ? { ...prev, twoFactorEnabled: true } : { ...fbUser, twoFactorEnabled: true });
                                return;
                            }

                            console.log("🔐 MFA Required");
                            if (!window.location.pathname.startsWith("/auth/mfa")) {
                                window.location.href = `/auth/mfa?uid=${data.user_id}`;
                            }
                            return;
                        }

                        if (data.access_token && data.access_token !== "undefined" && data.access_token !== "null") {
                            localStorage.setItem('token', data.access_token);
                        }
                        console.log("✅ Synced with backend");
                        setUser({
                            ...fbUser,
                            twoFactorEnabled: data.two_factor_enabled,
                            role: data.role
                        });

                        // Save this account for the switcher
                        saveAccount({
                            uid: fbUser.uid,
                            displayName: fbUser.displayName,
                            email: fbUser.email,
                            photoURL: fbUser.photoURL
                        }, data.access_token);
                    } else {
                        console.error("Failed to sync with backend");
                    }
                } catch (err) {
                    console.error("Backend sync error:", err);
                }
            } else {
                // No Firebase user. 
                // We keep the current user if it was loaded from a token.
                const prev = userRef.current;
                if (!prev || !prev.isFromToken) {
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
