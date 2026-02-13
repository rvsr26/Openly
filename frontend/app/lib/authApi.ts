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

    // Toggle 2FA (Legacy/Simple)
    toggle2FA: async (enabled: boolean) => {
        const response = await api.post('/api/v1/auth/2fa/toggle', {
            enabled
        });
        return response.data;
    },

    // MFA Setup
    setup2FA: async () => {
        const response = await api.post('/api/v1/auth/2fa/setup');
        return response.data;
    },

    // Enable MFA
    enable2FA: async (code: string) => {
        const response = await api.post('/api/v1/auth/2fa/enable', { code });
        return response.data;
    },

    // Disable MFA
    disable2FA: async () => {
        const response = await api.post('/api/v1/auth/2fa/disable');
        return response.data;
    }
};
