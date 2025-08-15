const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface Post {
    id: string;
    title: string;
    content: string;
    timestamp: string;
    userId: string;
    username?: string;
    userAvatar?: string;
    userLevel?: number;
    views?: number;
    mediaType?: 'image' | 'video';
    taggedGame?: {
        id: string;
        title: string;
        coverImage: string;
    } | null;
}

interface EngagedFollower {
    id: string;
    username: string;
    avatar: string;
    level: number;
    followedAt: string;
    engagementScore: number;
    engagementStats: {
        likes: number;
        views: number;
        reactions: number;
        follows: number;
    };
}

interface PostWithStats extends Post {
    viewsCount: number;
    likesCount: number;
    dislikesCount: number;
    followersCount: number;
    linkClicksCount: number;
}

interface Analytics {
    success: boolean;
    timeRange: string;
    posts: PostWithStats[];
    totals: {
        views: number;
        likes: number;
        dislikes: number;
        follows: number;
        clicks: number;
        reactions: Record<string, number>;
        followers: number;
        newFollowers: number;
    };
    charts: {
        timeSeries: {
            date: string;
            views: number;
            likes: number;
            clicks: number;
        }[];
        followerGrowth: {
            date: string;
            followers: number;
        }[];
    };
    comparison: {
        views: { current: number; previous: number; change: string };
        likes: { current: number; previous: number; change: string };
        follows: { current: number; previous: number; change: string };
    } | null;
}

interface Game {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    externalLink?: string;
    downloadUrl?: string;
    isHidden: boolean;
    ownerId: string;
    currentVersion?: string;
    slug?: string;
}

interface GameKey {
    key: string;
    createdAt: string;
    usedBy: string | null;
    usedAt: string | null;
    tag?: string;
    userInfo?: {
        id: string;
        username: string;
        avatar: string;
    } | null;
}

interface Follower {
    id: string;
    username: string;
    avatar: string;
    level: number;
    followedAt: string;
}

interface PopularPost {
    id: string;
    title: string;
    content: string;
    mediaType: 'image' | 'video';
    timestamp: string;
    creator: {
        id: string;
        username: string;
        avatar: string;
        level: number;
    };
    metrics: {
        followerLikePercentage: any;
        followerLikes: any;
        totalLikes: number;
        totalViews: number;
        likes: number;
        views: number;
        reactions: number;
        followers: number;
        engagement: string;
    };
    engagementScore: number;
    taggedGame?: {
        id: string;
        title: string;
        coverImage: string;
    } | null;
}

interface PopularPostWithFollowers {
    id: string;
    title: string;
    content: string;
    mediaType: 'image' | 'video';
    timestamp: string;
    creator: {
        id: string;
        username: string;
        avatar: string;
        level: number;
    };
    metrics: {
        totalLikes: number;
        totalViews: number;
        totalReactions: number;
        followerLikes: number;
        followerLikePercentage: string;
    };
    taggedGame?: {
        id: string;
        title: string;
        coverImage: string;
    } | null;
}

class ApiClient {
    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        try {
            const response = await fetch(url, {
                ...options,
                headers,
                credentials: 'include',
            });

            if (!response.ok) {
                if (response.status === 401) {
                    //window.location.href = '/login';
                    throw new Error('Unauthorized');
                }
                throw new Error(`API error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    async login(): Promise<void> {
        window.location.href = `/login`;
    }

    logout() {
        fetch('/logout', { method: 'POST', credentials: 'include' })
            .then(() => {
                window.location.href = '/';
            });
    }

    async getMe() {
        return this.request<{
            id: string;
            username: string;
            email: string;
            avatar: string;
            level: number;
            xp: number;
            xp_required: number;
            backgroundId?: string;
        }>('/me');
    }

    async getMyPosts() {
        return this.request<PostWithStats[]>('/me/posts');
    }

    async getPost(postId: string) {
        return this.request<Post>(`/posts/${postId}`);
    }

    async createPost(formData: FormData) {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to create post');
        }

        return response.json();
    }

    async deletePost(postId: string) {
        return this.request<{ success: boolean }>(`/posts/${postId}`, {
            method: 'DELETE',
        });
    }

    async getAnalytics(range: string = '7') {
        return this.request<Analytics>(`/api/analytics?range=${range}`);
    }

    async getAllGames() {
        return this.request<{ success: boolean; games: Game[] }>('/api/games');
    }

    async getPopularContentLovedByFollowers(creatorId: string, limit: number = 20, timeRange: number = 30) {
        return this.request<{
            success: boolean;
            posts: PopularPostWithFollowers[];
            totalFollowers: number;
            message?: string;
        }>(`/api/creators/${creatorId}/popular-with-followers?limit=${limit}&timeRange=${timeRange}`);
    }

    async getMyGames() {
        return this.request<{ success: boolean; games: Game[] }>('/api/my-games');
    }

    async getGameKeys(gameId: string) {
        return this.request<{ success: boolean; keys: GameKey[] }>(`/api/games/${gameId}/keys`);
    }

    async generateGameKeys(gameId: string, count: number, tag?: string) {
        return this.request<{ success: boolean; keys: string[] }>(`/api/games/${gameId}/generate-keys`, {
            method: 'POST',
            body: JSON.stringify({ count, tag }),
        });
    }

    async downloadGameKeys(gameId: string, tag?: string) {
        const url = tag
            ? `${API_BASE_URL}/api/games/${gameId}/keys/download?tag=${tag}`
            : `${API_BASE_URL}/api/games/${gameId}/keys/download`;

        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Failed to download keys');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `game_keys_${gameId}${tag ? `_${tag}` : ''}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    }

    async createGameVersion(gameId: string, versionData: {
        version: string;
        downloadUrl: string;
        changelog?: string;
        releaseNotes?: string;
        size?: number;
        isRequired?: boolean;
    }) {
        return this.request<{ success: boolean }>(`/api/games/${gameId}/versions`, {
            method: 'POST',
            body: JSON.stringify(versionData),
        });
    }

    async getGameVersions(gameId: string) {
        return this.request<{ success: boolean; versions: any[] }>(`/api/games/${gameId}/versions`);
    }

    async getUserCount() {
        return this.request<{ count: number }>('/api/user-count');
    }

    async getCreatorStatus() {
        return this.request<{
            success: boolean;
            isCreator: boolean;
            creatorCode?: string;
            application?: {
                status: string;
                createdAt: string;
                message?: string;
            };
        }>('/api/creators/status');
    }

    async getTopEngagedFollowers(creatorId: string, limit: number = 10, timeRange: number = 30) {
        return this.request<{
            success: boolean;
            followers: EngagedFollower[];
            timeRange: number;
            message?: string;
        }>(`/api/creators/${creatorId}/top-engaged-followers?limit=${limit}&timeRange=${timeRange}`);
    }



    async applyForCreatorProgram(tebexWalletId: string) {
        return this.request<{
            success: boolean;
            message: string;
            application?: { id: string; status: string };
        }>('/api/creators/apply', {
            method: 'POST',
            body: JSON.stringify({ tebexWalletId }),
        });
    }

    async getCreatorStats() {
        return this.request<{
            success: boolean;
            stats: {
                totalClicks: number;
                totalSales: number;
                totalRevenue: number;
            };
            recentClicks: number;
            creatorCode: string;
        }>('/api/creators/stats');
    }

    async getCreatorFollowers(creatorId: string, limit: number = 50, offset: number = 0) {
        return this.request<{
            success: boolean;
            followers: Follower[];
            total: number;
            hasMore: boolean;
        }>(`/api/creators/${creatorId}/followers?limit=${limit}&offset=${offset}`);
    }

    async getPopularContentFromFollowing(limit: number = 20) {
        return this.request<{
            success: boolean;
            posts: PopularPost[];
            message?: string;
        }>(`/api/creators/following/popular-content?limit=${limit}`);
    }
}

export const apiClient = new ApiClient();
export default apiClient;
export type { Post, PostWithStats, Analytics, Game, GameKey, Follower, PopularPost, PopularPostWithFollowers };