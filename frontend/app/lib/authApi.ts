import api from './api';

export const authApi = {
    // Change password
    changePassword: async (oldPassword: string, newPassword: string) => {
        const response = await api.post('/api/v1/auth/change-password', {
            old_password: oldPassword,
            new_password: newPassword
        });
        return response.data;
    },

    // Toggle 2FA
    toggle2FA: async (enabled: boolean) => {
        const response = await api.post('/api/v1/auth/2fa/toggle', {
            enabled
        });
        return response.data;
    }
};
