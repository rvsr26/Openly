export interface Post {
    id: string;
    content: string;
    author?: string; // Some places use author, usage in page.tsx
    user_id: string; // Used in PostItem
    user_name: string; // Used in PostItem
    username?: string; // Used in PostItem
    user_pic?: string; // Used in PostItem
    author_pic?: string; // Used in page.tsx
    category: string;
    view_count?: number;
    reaction_count?: number;
    report_count?: number;
    image_url?: string;
    is_anonymous?: boolean;
    is_flagged?: boolean;  // Added for admin/flag tracking
    is_rejected?: boolean; // Added for AI rejection tracking
    created_at?: string;
}

export interface Comment {
    id: string;
    user_id?: string;
    user_name: string;
    user_pic: string;
    content: string;
    created_at?: string;
}

export interface SearchResult {
    id: string;
    type: 'user' | 'post';
    user_pic?: string;
    username?: string;
    display_name?: string;
    content?: string;
}

export interface ConnectionRequest {
    id: string;
    requester_id: string;
    username: string;
    display_name: string;
    user_pic: string;
    created_at: string;
}

export interface Connection {
    user_id: string;
    username: string;
    display_name: string;
    user_pic: string;
    headline?: string;
}
