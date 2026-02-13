import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
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
    if (path.startsWith("http") || path.startsWith("https") || path.startsWith("data:")) return path;
    if (path.startsWith("/")) {
        const base = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, "");
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
