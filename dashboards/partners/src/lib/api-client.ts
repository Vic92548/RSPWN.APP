// API Client for VAPR Partners Dashboard

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
                credentials: 'include', // Use cookies for authentication
            });

            if (!response.ok) {
                if (response.status === 401) {
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

    // Auth methods
    async login(): Promise<void> {
        window.location.href = `/login`;
    }

    logout() {
        // Redirect to logout endpoint to clear session
        window.location.href = '/logout';
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
            isGameDev?: boolean;
        }>('/me');
    }

    // Games methods
    async getMyGames() {
        return this.request<{
            success: boolean;
            games: Array<{
                id: string;
                title: string;
                description: string;
                coverImage: string;
                downloadUrl: string;
                currentVersion: string;
                createdAt: string;
                ownedAt: string;
                totalPlaytimeSeconds: number;
                isHidden?: boolean;
                stats?: {
                    playerCount: number;
                    totalKeys: number;
                    usedKeys: number;
                    availableKeys: number;
                    totalPlaytimeSeconds: number;
                };
                personalPlaytimeSeconds?: number;
            }>;
        }>('/api/developer/games'); // Changed from '/api/my-games'
    }

    async getAllGames() {
        return this.request<{
            success: boolean;
            games: Array<{
                id: string;
                title: string;
                description: string;
                coverImage: string;
                price: number;
                ownerId: string;
            }>;
        }>('/api/games');
    }

    // Game keys methods
    async generateGameKeys(gameId: string, count: number, tag?: string) {
        return this.request<{
            success: boolean;
            keys: string[];
        }>(`/api/games/${gameId}/generate-keys`, {
            method: 'POST',
            body: JSON.stringify({ count, tag }),
        });
    }

    async getGameKeys(gameId: string) {
        return this.request<{
            success: boolean;
            keys: Array<{
                key: string;
                createdAt: string;
                usedBy: string | null;
                usedAt: string | null;
                tag: string | null;
                userInfo: {
                    id: string;
                    username: string;
                    avatar: string;
                } | null;
            }>;
        }>(`/api/games/${gameId}/keys`);
    }

    async downloadKeysCSV(gameId: string, tag?: string) {
        const url = `${API_BASE_URL}/api/games/${gameId}/keys/download${tag ? `?tag=${tag}` : ''}`;

        const response = await fetch(url, {
            credentials: 'include', // Use cookies for authentication
        });

        if (!response.ok) {
            throw new Error('Failed to download keys');
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `game_keys_${tag || 'all'}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
    }

    // Game versions methods
    async createGameVersion(gameId: string, versionData: {
        version: string;
        downloadUrl: string;
        size?: number;
        changelog?: string;
        releaseNotes?: string;
        isRequired?: boolean;
        minimumVersion?: string;
    }) {
        return this.request<{
            success: boolean;
            version: any;
        }>(`/api/games/${gameId}/versions`, {
            method: 'POST',
            body: JSON.stringify(versionData),
        });
    }

    async getGameVersions(gameId: string) {
        return this.request<{
            success: boolean;
            versions: Array<{
                id: string;
                version: string;
                downloadUrl: string;
                size: number | null;
                changelog: string;
                releaseNotes: string;
                isRequired: boolean;
                createdAt: string;
                downloads: number;
            }>;
        }>(`/api/games/${gameId}/versions`);
    }

    // Analytics
    async getAnalytics(range: string = '7') {
        return this.request<{
            success: boolean;
            timeRange: string;
            posts: any[];
            totals: {
                views: number;
                likes: number;
                dislikes: number;
                follows: number;
                clicks: number;
                reactions: Record<string, number>;
                followers: number;
            };
            charts: {
                timeSeries: any[];
                followerGrowth: any[];
            };
            comparison: any;
        }>(`/api/analytics?range=${range}`);
    }

    // Creator stats
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

    // Posts
    async getMyPosts() {
        return this.request<Array<{
            id: string;
            title: string;
            content: string;
            timestamp: string;
            viewsCount: number;
            likesCount: number;
            dislikesCount: number;
            followersCount: number;
            linkClicksCount: number;
            taggedGame: {
                id: string;
                title: string;
                coverImage: string;
            } | null;
        }>>('/me/posts');
    }

    // Get user count
    async getUserCount() {
        return this.request<{ count: number }>('/api/user-count');
    }
}

export const apiClient = new ApiClient();
export default apiClient;