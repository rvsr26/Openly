export interface PollOption {
    id: string;       // e.g. "opt_0", "opt_1"...
    text: string;
    votes: number;
}

export interface Poll {
    question: string;
    type: "yesno" | "multiple";
    options: PollOption[];
    total_votes: number;
    ends_at?: string;           // ISO string, optional expiry
    allow_anonymous: boolean;
    voted_option_id?: string;   // filled in on the client after fetching user's vote
}

export interface Post {
    id: string;
    content: string;
    title?: string;
    author?: string;
    user_id: string;
    user_name: string;
    username?: string;
    user_pic?: string;
    author_pic?: string;
    category: string;
    hubs?: string[];
    view_count?: number;
    reaction_count?: number;
    downvote_count?: number;
    report_count?: number;
    image_url?: string;
    is_anonymous?: boolean;
    is_flagged?: boolean;
    is_rejected?: boolean;
    created_at?: string;
    edited_at?: string;
    comments?: Comment[];
    is_archived?: boolean;
    collaborators?: string[];
    content_warning?: string;
    tags?: string[];
    is_professional_inquiry?: boolean;
    poll?: Poll;
    community_id?: string;
    specific_reactions?: Record<string, number>;
    user_reactions?: Record<string, string>;
    user_reaction?: string;
    has_downvoted?: boolean;
    helped_count?: number;
    has_helped?: boolean;
}

export interface ProfessionalExperience {
    company: string;
    position: string;
    location?: string;
    start_date: string;
    end_date?: string;
    current?: boolean;
    description?: string;
}

export interface Education {
    school: string;
    degree?: string;
    field?: string;
    start_date: string;
    end_date?: string;
}

export interface Skill {
    name: string;
    level?: string;
    endorsements?: number;
    endorsers?: string[];
}

export interface User {
    id?: string;
    uid?: string;
    username: string;
    email?: string;
    display_name: string;
    photoURL?: string;
    headline?: string;
    bio?: string;
    website?: string;
    location?: string;
    phoenix_score?: number;
    badges?: string[];
    is_expert?: boolean;
    profession?: string;
    followed_hubs?: string[];
    experiences?: ProfessionalExperience[];
    education?: Education[];
    skills?: Skill[];
    role?: string;
    is_banned?: boolean;
}

export interface Story {
    id: string;
    user_id: string;
    user_name: string;
    user_pic: string;
    content?: string;
    image_url?: string;
    background_color?: string;
    created_at: string;
    viewers?: string[];
}

export interface StoryGroup {
    user_id: string;
    user_name: string;
    user_pic: string;
    has_unseen: boolean;
    stories: Story[];
}

export interface Comment {
    id: string;
    user_id?: string;
    user_name: string;
    user_pic: string;
    content: string;
    created_at?: string;
    parent_id?: string;
    replies?: Comment[];
}

export interface Notification {
    id: string;
    type: string;
    actor_name: string;
    actor_pic?: string;
    resource_id?: string;
    message?: string;
    is_read: boolean;
    created_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    sender_name: string;
    sender_pic?: string;
    content: string;
    type?: 'text' | 'image' | 'doc';
    media_url?: string;
    created_at: string;
    is_read: boolean;
    is_deleted: boolean;
    is_remote?: boolean;
    sender_community_url?: string;
}

export interface Conversation {
    id: string;
    participants: string[];
    participant_info: {
        id: string;
        username: string;
        display_name: string;
        photoURL?: string;
    }[];
    participant_instances?: Record<string, string>;
    last_message: string;
    last_message_at: string;
    unread_count: number;
    created_at: string;
}

export interface SearchResult {
    id: string;
    type: 'user' | 'post';
    user_pic?: string;
    username?: string;
    display_name?: string;
    content?: string;
    is_following?: boolean;
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
