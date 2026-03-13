"use client";

import { User } from "firebase/auth";

export interface StoredAccount {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    token?: string | null;
    lastActive: number;
}

const STORAGE_KEY = "openly_accounts";

export const getStoredAccounts = (): StoredAccount[] => {
    if (typeof window === "undefined") return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to parse stored accounts", e);
        return [];
    }
};

export const saveAccount = (user: any, token?: string | null) => {
    if (typeof window === "undefined" || !user) return;

    const accounts = getStoredAccounts();
    const newAccount: StoredAccount = {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        token: token || localStorage.getItem('token'),
        lastActive: Date.now(),
    };

    // Remove existing if present (to update it)
    const filtered = accounts.filter((a) => a.uid !== user.uid);
    // Add to top
    const updated = [newAccount, ...filtered];

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const removeAccount = (uid: string) => {
    if (typeof window === "undefined") return;
    const accounts = getStoredAccounts();
    const updated = accounts.filter((a) => a.uid !== uid);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

/**
 * Returns a user-specific storage key to prevent data merging between accounts.
 * If no UID is provided, it returns the base key.
 */
export const getScopedKey = (key: string, uid?: string | null): string => {
    if (!uid) return key;
    return `${uid}_${key}`;
};
