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
                isEarlyAccess: boolean;
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

    async getTebexConfig() {
        return this.request<{
            success: boolean;
            config: {
                webstoreToken: string;
                storeName: string;
                hasConfig: boolean;
            } | null;
        }>('/api/developer/tebex-config');
    }

    async setTebexConfig(config: { webstoreToken: string; storeName?: string }) {
        return this.request<{
            success: boolean;
            message: string;
        }>('/api/developer/tebex-config', {
            method: 'POST',
            body: JSON.stringify(config),
        });
    }

    async removeTebexConfig() {
        return this.request<{
            success: boolean;
            message: string;
        }>('/api/developer/tebex-config', {
            method: 'DELETE',
        });
    }

    async getPartnerCreators() {
        return this.request<{
            success: boolean;
            creators: Array<{
                creatorId: string;
                username: string;
                creatorCode: string;
                tebexWalletId: string | null;
                avatar: string | null;
                isAddedToTebex: boolean;
                confirmedAt: string | null;
                revenueShare: number;
                customerDiscount: number;
            }>;
            totalCreators: number;
            addedCount: number;
        }>('/api/partner/creators');
    }

    async confirmCreatorAdded(creatorId: string) {
        return this.request<{
            success: boolean;
            message: string;
        }>(`/api/partner/creators/${creatorId}/confirm`, {
            method: 'POST'
        });
    }

    async removeCreatorConfirmation(creatorId: string) {
        return this.request<{
            success: boolean;
            message: string;
        }>(`/api/partner/creators/${creatorId}/confirm`, {
            method: 'DELETE'
        });
    }

    async checkPartnerCompliance() {
        return this.request<{
            success: boolean;
            isCompliant: boolean;
            totalCreators: number;
            confirmedCreators: number;
            missingCreators: number;
        }>('/api/partner/compliance');
    }

    // Buckets API
    async createBucket(bucketData: {
        name: string;
        description?: string;
        type?: string;
        visibility?: 'private' | 'public' | 'unlisted';
        metadata?: any;
    }) {
        return this.request<{
            success: boolean;
            bucket: any;
        }>('/api/buckets', {
            method: 'POST',
            body: JSON.stringify(bucketData)
        });
    }

    async getUserBuckets(includePublic: boolean = false) {
        return this.request<{
            success: boolean;
            buckets: any[];
        }>(`/api/buckets?includePublic=${includePublic}`);
    }

    async getBucket(bucketId: string) {
        return this.request<{
            success: boolean;
            bucket: any;
        }>(`/api/buckets/${bucketId}`);
    }

    async updateBucket(bucketId: string, updates: any) {
        return this.request<{
            success: boolean;
            message: string;
        }>(`/api/buckets/${bucketId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }

    async deleteBucket(bucketId: string) {
        return this.request<{
            success: boolean;
            message: string;
        }>(`/api/buckets/${bucketId}`, {
            method: 'DELETE'
        });
    }

    async addItemToBucket(bucketId: string, itemData: {
        itemId: string;
        itemType: string;
        notes?: string;
        metadata?: any;
    }) {
        return this.request<{
            success: boolean;
            item: any;
        }>(`/api/buckets/${bucketId}/items`, {
            method: 'POST',
            body: JSON.stringify(itemData)
        });
    }

    async removeItemFromBucket(bucketId: string, itemId: string) {
        return this.request<{
            success: boolean;
            message: string;
        }>(`/api/buckets/${bucketId}/items/${itemId}`, {
            method: 'DELETE'
        });
    }

    async getBucketItems(bucketId: string, options?: {
        limit?: number;
        offset?: number;
    }) {
        const params = new URLSearchParams();
        if (options?.limit) params.append('limit', options.limit.toString());
        if (options?.offset) params.append('offset', options.offset.toString());

        return this.request<{
            success: boolean;
            items: any[];
            totalCount: number;
            hasMore: boolean;
        }>(`/api/buckets/${bucketId}/items?${params}`);
    }

    async getPostsForGameManagement(gameId: string) {
        return this.request<{
            success: boolean;
            posts: any[];
            bucketId: string | null;
        }>(`/api/games/${gameId}/post-management`);
    }

    async updateGame(gameId: string, updates: {
        title?: string;
        description?: string;
        isHidden?: boolean;
        isEarlyAccess?: boolean;
    }) {
        return this.request<{
            success: boolean;
            game: any;
        }>(`/api/games/${gameId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
    }

    async getGameAnalytics(gameId: string, timeRange: number = 30) {
        return this.request<{
            success: boolean;
            analytics: {
                overview: {
                    totalPlayers: number;
                    activePlayers: number;
                    totalPlaytimeHours: number;
                    avgSessionMinutes: number;
                    totalSessions: number;
                };
                charts: {
                    daily: Array<{
                        date: string;
                        activeUsers: number;
                        totalPlaytimeHours: number;
                        sessions: number;
                        avgPlaytimeHours: number;
                    }>;
                    retention: Array<{
                        day: number;
                        retention: string;
                    }>;
                    playtimeDistribution: Array<{
                        range: string;
                        count: number;
                    }>;
                    peakHours: Array<{
                        hour: string;
                        sessions: number;
                    }>;
                };
                timeRange: number;
            };
        }>(`/api/games/${gameId}/analytics?timeRange=${timeRange}`);
    }
}

export const apiClient = new ApiClient();
export default apiClient;