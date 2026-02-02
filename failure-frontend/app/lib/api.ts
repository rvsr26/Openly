import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getAbsUrl = (path?: string | null) => {
    if (!path) return "/assets/default_avatar.png";
    if (path.startsWith("http") || path.startsWith("https") || path.startsWith("data:")) return path;
    if (path.startsWith("/uploads")) {
        const base = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, "");
        return `${base}${path}`;
    }
    return path;
};

export default api;
