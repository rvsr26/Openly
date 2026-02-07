import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getAbsUrl = (path?: string | null) => {
    if (!path) return "/assets/default_avatar.png";
    if (path.startsWith("http") || path.startsWith("https") || path.startsWith("data:")) return path;
    if (path.startsWith("/uploads")) {
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
