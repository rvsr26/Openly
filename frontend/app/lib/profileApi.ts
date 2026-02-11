import api from './api';

export const profileApi = {
    // Get user profile
    getProfile: async (userId: string) => {
        const response = await api.get(`/users/${userId}/profile`);
        return response.data;
    },

    // Update user profile (display name, bio, photo)
    updateProfile: async (userId: string, data: { display_name?: string; bio?: string; photoURL?: string; visibility?: string }) => {
        const response = await api.put(`/users/${userId}`, data);
        return response.data;
    },

    // Get account activity log
    getActivity: async () => {
        const response = await api.get('/api/v1/user/activity');
        return response.data;
    },

    // Deactivate account (soft delete)
    deactivateAccount: async () => {
        const response = await api.post('/api/v1/user/deactivate');
        return response.data;
    },

    // Permanently delete account
    deleteAccount: async () => {
        const response = await api.delete('/api/v1/user');
        return response.data;
    }
};
