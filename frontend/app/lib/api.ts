import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add interceptor to attach token
api.interceptors.request.use((config) => {
    // Try to get token from localStorage (assuming it matches what backend expects)
    // If using Firebase Auth exclusively, we might need to get the token from firebase.auth().currentUser
    // But for the specific backend endpoints requiring 'get_current_user' (JWT), we look for a stored token.
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const getAbsUrl = (path?: string | null) => {
    if (!path) return "/assets/default_avatar.png";

    // 1. Full URLs or data URIs
    if (path.startsWith("http") || path.startsWith("https") || path.startsWith("data:")) return path;

    // 2. Local frontend assets (stay relative)
    if (path.startsWith("/assets/") || path.startsWith("assets/")) {
        return path.startsWith("/") ? path : `/${path}`;
    }

    // 3. Backend uploads
    const base = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, "");

    if (path.startsWith("/uploads/") || path.startsWith("uploads/")) {
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        return `${base}${cleanPath}`;
    }

    // 4. Fallback for other absolute paths (assume backend unless confirmed otherwise)
    if (path.startsWith("/")) {
        return `${base}${path}`;
    }

    return path;
};

export const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    });
    return res.data.url;
};

export default api;
