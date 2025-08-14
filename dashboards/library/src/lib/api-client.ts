// API Client for VAPR Library Dashboard

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
            backgroundId?: string;
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
                installedVersion?: string;
                totalPlaytimeSeconds?: number;
            }>;
        }>('/api/my-games');
    }

    async getAllGames() {
        return this.request<{
            success: boolean;
            games: Array<{
                id: string;
                title: string;
                description: string;
                coverImage: string;
                price?: number;
                ownerId: string;
                currentVersion: string;
                createdAt: string;
            }>;
        }>('/api/games');
    }

    async getGame(gameId: string) {
        return this.request<{
            success: boolean;
            game: {
                id: string;
                title: string;
                description: string;
                coverImage: string;
                downloadUrl: string;
                currentVersion: string;
                ownerId: string;
                createdAt: string;
            };
        }>(`/api/games/${gameId}`);
    }

    // Game keys methods
    async redeemKey(key: string) {
        return this.request<{
            success: boolean;
            game: {
                id: string;
                title: string;
                coverImage: string;
            };
        }>('/api/games/redeem-key', {
            method: 'POST',
            body: JSON.stringify({ key }),
        });
    }

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
            credentials: 'include',
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

    // Game updates
    async checkForUpdates() {
        return this.request<{
            success: boolean;
            updates: Array<{
                gameId: string;
                fromVersion: string;
                toVersion: string;
                changelog: string;
                downloadUrl: string;
                isRequired: boolean;
                size?: number;
            }>;
        }>('/api/updates/check');
    }

    async markUpdateSeen(gameId: string) {
        return this.request<{
            success: boolean;
        }>(`/api/updates/${gameId}/seen`, {
            method: 'POST'
        });
    }

    async markUpdateDownloaded(gameId: string, version: string) {
        return this.request<{
            success: boolean;
        }>(`/api/updates/${gameId}/downloaded`, {
            method: 'POST',
            body: JSON.stringify({ version })
        });
    }

    // Playtime tracking
    async recordPlaytimeSession(data: {
        gameId: string;
        startedAt: string;
        endedAt: string;
        durationSeconds: number;
        executablePath?: string;
    }) {
        return this.request<{
            success: boolean;
        }>('/api/playtime/session', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getPlaytimeTotals() {
        return this.request<{
            success: boolean;
            totals: Array<{
                gameId: string;
                totalSeconds: number;
            }>;
        }>('/api/playtime/totals');
    }

    // Tebex integration
    async getTebexPackages() {
        return this.request<{
            data: Array<{
                id: number;
                name: string;
                description: string;
                image: string;
                price: number;
                currency: string;
                category: { name: string };
                discount: number;
                base_price: number;
                total_price: number;
            }>;
        }>('/api/tebex/packages');
    }

    async createTebexBasket(packageId: number, successUrl: string, cancelUrl: string) {
        return this.request<{
            success: boolean;
            basketId: string;
            checkoutUrl: string;
        }>('/api/tebex/create-basket', {
            method: 'POST',
            body: JSON.stringify({
                packageId,
                successUrl,
                cancelUrl
            })
        });
    }

    async addToTebexBasket(basketId: string, packageId: number, quantity: number = 1) {
        return this.request<{
            success: boolean;
        }>(`/api/tebex/baskets/${basketId}/add`, {
            method: 'POST',
            body: JSON.stringify({
                packageId,
                quantity
            })
        });
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

    async getCreatorCodeForPurchase(gameId: string) {
        return this.request<{
            success: boolean;
            hasCreatorCode: boolean;
            creatorCode?: string;
        }>(`/api/creators/code-for-purchase/${gameId}`);
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

    // User methods
    async getUser(userId: string) {
        return this.request<{
            id: string;
            username: string;
            avatar: string | null;
            level: number;
            xp: number;
            backgroundId: string | null;
        }>(`/api/user/${userId}`);
    }

    async getUserPosts(userId: string) {
        return this.request<Array<{
            id: string;
            title: string;
            content: string;
            timestamp: string;
            viewsCount: number;
            likesCount: number;
            taggedGame: {
                id: string;
                title: string;
                coverImage: string;
            } | null;
        }>>(`/api/user/${userId}/posts`);
    }

    // Get user count
    async getUserCount() {
        return this.request<{ count: number }>('/api/user-count');
    }

    // Desktop app integration
    async getInstalledGames() {
        // @ts-ignore
        if (typeof window.__TAURI__ === 'undefined') {
            return [];
        }

        try {
            // @ts-ignore
            const games = await window.__TAURI__.core.invoke('get_installed_games');
            return games || [];
        } catch (error) {
            console.error('Failed to get installed games:', error);
            return [];
        }
    }

    async downloadAndInstallGame(gameId: string, gameName: string, downloadUrl: string) {
        // @ts-ignore
        if (typeof window.__TAURI__ === 'undefined') {
            throw new Error('Desktop app required');
        }

        // @ts-ignore
        return window.__TAURI__.core.invoke('download_and_install_game', {
            gameId,
            gameName,
            downloadUrl
        });
    }

    async launchGame(executablePath: string) {
        // @ts-ignore
        if (typeof window.__TAURI__ === 'undefined') {
            throw new Error('Desktop app required');
        }

        // @ts-ignore
        return window.__TAURI__.core.invoke('launch_game', {
            executablePath
        });
    }

    async uninstallGame(gameId: string) {
        // @ts-ignore
        if (typeof window.__TAURI__ === 'undefined') {
            throw new Error('Desktop app required');
        }

        // @ts-ignore
        return window.__TAURI__.core.invoke('uninstall_game', {
            gameId
        });
    }

    // Backgrounds
    async updateBackground(backgroundId: string) {
        return this.request<{
            success: boolean;
        }>(`/me/update-background?backgroundId=${encodeURIComponent(backgroundId)}`);
    }

    // Feed and posts
    async getFeed() {
        return this.request<Array<{
            id: string;
            title: string;
            content: string;
            userId: string;
            username: string;
            userAvatar?: string;
            userLevel?: number;
            timestamp: string;
            views: number;
            taggedGame?: {
                id: string;
                title: string;
                coverImage: string;
            };
        }>>('/feed');
    }

    async getPost(postId: string) {
        return this.request<{
            id: string;
            title: string;
            content: string;
            userId: string;
            username: string;
            userAvatar?: string;
            userLevel?: number;
            timestamp: string;
            views: number;
            taggedGame?: {
                id: string;
                title: string;
                coverImage: string;
            };
        }>(`/posts/${postId}`);
    }

    // Interactions
    async likePost(postId: string) {
        return this.request<{
            success: boolean;
            user?: any;
        }>(`/like/${postId}`);
    }

    async dislikePost(postId: string) {
        return this.request<{
            success: boolean;
            user?: any;
        }>(`/dislike/${postId}`);
    }

    async skipPost(postId: string) {
        return this.request<{
            success: boolean;
            user?: any;
        }>(`/skip/${postId}`);
    }

    async followPost(postId: string) {
        return this.request<{
            success: boolean;
        }>(`/manage-follow?action=follow&postId=${postId}`);
    }

    async unfollowPost(postId: string) {
        return this.request<{
            success: boolean;
        }>(`/manage-follow?action=unfollow&postId=${postId}`);
    }

    async checkFollowStatus(creatorId: string) {
        return this.request<{
            isFollowing: boolean;
        }>(`/check-follow/${creatorId}`);
    }

    // Invitations
    async acceptInvitation(ambassadorUserId: string) {
        return this.request<{
            success: boolean;
        }>(`/accept-invitation?ambassadorUserId=${ambassadorUserId}`);
    }
}

export const apiClient = new ApiClient();
export default apiClient;