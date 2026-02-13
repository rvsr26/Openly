import api from './api';

export interface Timeline {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    status: 'active' | 'completed';
    created_at: string;
}

export interface TimelinePost {
    id: string;
    content: string;
    created_at: string;
    category?: string;
    image_url?: string;
    // Add other post fields as needed
}

export const timelineApi = {
    // Create a new timeline
    create: async (data: { title: string; description?: string; status?: string }) => {
        const response = await api.post('/api/v1/timelines/', data);
        return response.data;
    },

    // Get user timelines
    getUserTimelines: async (userId: string): Promise<Timeline[]> => {
        const response = await api.get(`/api/v1/timelines/user/${userId}`);
        return response.data;
    },

    // Get specific timeline
    getById: async (timelineId: string) => {
        const response = await api.get(`/api/v1/timelines/${timelineId}`);
        return response.data;
    },

    // Update timeline
    update: async (timelineId: string, data: { title?: string; description?: string; status?: string }) => {
        const response = await api.put(`/api/v1/timelines/${timelineId}`, data);
        return response.data;
    },

    // Get posts for a timeline
    getPosts: async (timelineId: string) => {
        const response = await api.get(`/api/v1/timelines/${timelineId}/posts`);
        return response.data;
    }
};
