const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface Game {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    externalLink?: string | null;
    downloadUrl?: string | null;
    ownerId: string;
    isHidden?: boolean;
    slug?: string;
    createdAt?: string;
    tags?: string[];
    price?: number;
    currency?: string;
    publisher?: string;
    developer?: string;
    currentVersion?: string;
    changelog?: string;
    isTebexProduct?: boolean;
    tebexId?: number;
    onSale?: boolean;
    originalPrice?: number;
    discount?: number;
    webstoreToken?: string;
}

interface TebexConfig {
    userId: string;
    username: string;
    storeName: string;
    webstoreToken: string;
}

interface TebexPackage {
    id: number;
    name: string;
    description: string;
    image?: string;
    total_price: number;
    base_price: number;
    currency: string;
    discount: number;
    category?: { name: string };
    storeInfo?: {
        userId: string;
        username: string;
        storeName: string;
        webstoreToken: string;
    };
}

interface GameReview {
    id: string;
    userId: string;
    username: string;
    avatar?: string;
    rating: number;
    content: string;
    createdAt: string;
    helpful: number;
}

class ApiClient {
    private tebexGamesCache: Game[] | null = null;
    private tebexConfigs: TebexConfig[] = [];
    private vaprGamesCache: Game[] | null = null;
    private visibleGameTitles: Set<string> = new Set();

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
        fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        }).then(() => {
            window.location.href = '/store';
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
        }>('/me');
    }

    private async getVAPRGames() {
        if (!this.vaprGamesCache) {
            const response = await this.request<{
                success: boolean;
                games: Game[];
            }>('/api/games');
            this.vaprGamesCache = response.games;

            // Build a set of visible game titles for quick lookup
            this.visibleGameTitles.clear();
            response.games.forEach(game => {
                this.visibleGameTitles.add(game.title.toLowerCase());
            });
        }
        return this.vaprGamesCache;
    }

    async loadTebexConfigs() {
        try {
            const response = await this.request<{
                success: boolean;
                configs: TebexConfig[];
            }>('/api/tebex-configs');
            if (response.success) {
                this.tebexConfigs = response.configs;
            }
        } catch (error) {
            console.error('Failed to load Tebex configurations:', error);
        }
    }

    async getTebexPackages(): Promise<TebexPackage[]> {
        if (this.tebexConfigs.length === 0) {
            await this.loadTebexConfigs();
        }

        const allPackages: TebexPackage[] = [];

        for (const config of this.tebexConfigs) {
            try {
                const response = await fetch(`https://headless.tebex.io/api/accounts/${config.webstoreToken}/packages`);
                if (response.ok) {
                    const data = await response.json();
                    const packages = data.data || [];

                    const packagesWithStore = packages.map((pkg: any) => ({
                        ...pkg,
                        storeInfo: {
                            userId: config.userId,
                            username: config.username,
                            storeName: config.storeName,
                            webstoreToken: config.webstoreToken
                        }
                    }));

                    allPackages.push(...packagesWithStore);
                }
            } catch (error) {
                console.error(`Failed to load packages for store ${config.storeName}:`, error);
            }
        }

        return allPackages;
    }

    async transformTebexGames(tebexPackages: TebexPackage[]): Promise<Game[]> {
        const vaprGames = await this.getVAPRGames();

        return tebexPackages.map(pkg => {
            const vaprGame = vaprGames.find(g =>
                g.title.toLowerCase() === pkg.name.toLowerCase()
            );

            return {
                id: `tebex-${pkg.id}`,
                title: pkg.name,
                description: pkg.description || vaprGame?.description || 'No description available',
                coverImage: pkg.image || vaprGame?.coverImage || 'https://via.placeholder.com/300x400?text=No+Image',
                price: pkg.total_price,
                currency: pkg.currency,
                isTebexProduct: true,
                tebexId: pkg.id,
                tags: [pkg.category?.name || 'Games'],
                onSale: pkg.discount > 0,
                originalPrice: pkg.base_price,
                discount: pkg.discount,
                developer: pkg.storeInfo?.username || 'Unknown Developer',
                publisher: pkg.storeInfo?.username || 'Unknown Publisher',
                ownerId: pkg.storeInfo?.userId || vaprGame?.ownerId || '',
                createdAt: vaprGame?.createdAt || new Date().toISOString(),
                currentVersion: vaprGame?.currentVersion,
                changelog: vaprGame?.changelog,
                webstoreToken: pkg.storeInfo?.webstoreToken,
                isHidden: vaprGame?.isHidden
            };
        });
    }

    async getAllGames() {
        // First, get the list of games that the backend says are visible
        // This populates both vaprGamesCache and visibleGameTitles
        await this.getVAPRGames();

        // Then get Tebex packages
        const tebexPackages = await this.getTebexPackages();
        const tebexGames = await this.transformTebexGames(tebexPackages);

        // SAFETY GUARD: Only show Tebex games that have a matching VAPR game in the visible list
        const visibleTebexGames = tebexGames.filter(tebexGame => {
            // Check if this game title exists in our visible games set
            return this.visibleGameTitles.has(tebexGame.title.toLowerCase());
        });

        // Log for debugging
        console.log(`Filtered Tebex games: ${tebexGames.length} -> ${visibleTebexGames.length} visible`);

        this.tebexGamesCache = visibleTebexGames;

        return { success: true, games: this.tebexGamesCache };
    }

    async getGame(gameId: string) {
        if (!this.tebexGamesCache) {
            await this.getAllGames();
        }

        const game = this.tebexGamesCache?.find(g => g.id === gameId);

        // Double-check: ensure the game is in our visible list
        if (game && !this.visibleGameTitles.has(game.title.toLowerCase())) {
            console.warn(`Game ${game.title} was requested but is not in visible list`);
            return { success: false, game: null };
        }

        return { success: !!game, game };
    }

    async searchGames(query: string) {
        const { games } = await this.getAllGames();

        const searchResults = games.filter(game =>
            game.title.toLowerCase().includes(query.toLowerCase()) ||
            game.description.toLowerCase().includes(query.toLowerCase()) ||
            game.tags?.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        );

        return { success: true, games: searchResults };
    }

    async getGameKeys(gameId: string) {
        if (gameId.startsWith('tebex-')) {
            const vaprGames = await this.getVAPRGames();
            const tebexGame = this.tebexGamesCache?.find(g => g.id === gameId);

            if (tebexGame) {
                const vaprGame = vaprGames.find(g =>
                    g.title.toLowerCase() === tebexGame.title.toLowerCase()
                );

                if (vaprGame) {
                    return this.request<{
                        success: boolean;
                        keys: Array<{
                            key: string;
                            usedBy?: string;
                            userInfo?: {
                                id: string;
                                username: string;
                                avatar?: string;
                            };
                            usedAt?: string;
                        }>;
                    }>(`/api/games/${vaprGame.id}/keys`);
                }
            }

            return { success: true, keys: [] };
        } else {
            return this.request<{
                success: boolean;
                keys: Array<{
                    key: string;
                    usedBy?: string;
                    userInfo?: {
                        id: string;
                        username: string;
                        avatar?: string;
                    };
                    usedAt?: string;
                }>;
            }>(`/api/games/${gameId}/keys`);
        }
    }

    async getMyLibrary() {
        return this.request<{
            success: boolean;
            games: Game[];
        }>('/api/my-games');
    }

    async redeemKey(key: string) {
        return this.request<{
            success: boolean;
            game: Game;
        }>('/api/games/redeem-key', {
            method: 'POST',
            body: JSON.stringify({ key }),
        });
    }

    async createTebexBasket(_packageId: number, webstoreToken: string) {
        const response = await fetch(`https://headless.tebex.io/api/accounts/${webstoreToken}/baskets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                complete_url: `${window.location.origin}/store/checkout/success`,
                cancel_url: `${window.location.origin}/store/checkout/cancel`,
                complete_auto_redirect: true
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create basket');
        }

        return response.json();
    }

    async addToTebexBasket(basketIdent: string, packageId: number) {
        const response = await fetch(`https://headless.tebex.io/api/baskets/${basketIdent}/packages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                package_id: packageId,
                quantity: 1
            })
        });

        if (!response.ok) {
            throw new Error('Failed to add to basket');
        }

        return response.json();
    }

    async applyCreatorCode(basketIdent: string, creatorCode: string, webstoreToken: string) {
        try {
            const response = await fetch(`https://headless.tebex.io/api/accounts/${webstoreToken}/baskets/${basketIdent}/creator-codes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    creator_code: creatorCode
                })
            });

            if (!response.ok) {
                console.error('Failed to apply creator code');
            }
        } catch (error) {
            console.error('Error applying creator code:', error);
        }
    }

    async getTebexBasket(basketIdent: string, webstoreToken: string) {
        const response = await fetch(`https://headless.tebex.io/api/accounts/${webstoreToken}/baskets/${basketIdent}`);
        if (!response.ok) {
            throw new Error('Failed to get basket');
        }
        return response.json();
    }

    async checkoutTebexGame(gameId: string) {
        const game = this.tebexGamesCache?.find(g => g.id === gameId);
        if (!game || !game.isTebexProduct || !game.tebexId || !game.webstoreToken) {
            throw new Error('Invalid game for Tebex checkout');
        }

        const basketResponse = await this.createTebexBasket(game.tebexId, game.webstoreToken);
        const basketIdent = basketResponse.data.ident;

        await this.addToTebexBasket(basketIdent, game.tebexId);

        try {
            const vaprGames = await this.getVAPRGames();
            const vaprGame = vaprGames.find(g =>
                g.title.toLowerCase() === game.title.toLowerCase()
            );

            if (vaprGame) {
                const creatorResponse = await this.request<{
                    success: boolean;
                    hasCreatorCode: boolean;
                    creatorCode?: string;
                }>(`/api/creators/code-for-purchase/${vaprGame.id}`);

                if (creatorResponse.success && creatorResponse.hasCreatorCode && creatorResponse.creatorCode) {
                    await this.applyCreatorCode(basketIdent, creatorResponse.creatorCode, game.webstoreToken);
                }
            }
        } catch (error) {
            console.error('Failed to apply creator code:', error);
        }

        const basketData = await this.getTebexBasket(basketIdent, game.webstoreToken);

        window.location.href = basketData.data.links.checkout;
    }

    async trackGameClick(gameId: string, postId?: string) {
        if (!postId) return;

        try {
            const vaprGames = await this.getVAPRGames();
            const tebexGame = this.tebexGamesCache?.find(g => g.id === gameId);

            if (tebexGame) {
                const vaprGame = vaprGames.find(g =>
                    g.title.toLowerCase() === tebexGame.title.toLowerCase()
                );

                if (vaprGame) {
                    await this.request('/api/creators/track-game-click', {
                        method: 'POST',
                        body: JSON.stringify({
                            gameId: vaprGame.id,
                            postId
                        })
                    });
                }
            }
        } catch (error) {
            console.error('Failed to track game click:', error);
        }
    }

    async getUser(userId: string) {
        return this.request<{
            id: string;
            username: string;
            avatar?: string;
            level?: number;
        }>(`/api/user/${userId}`);
    }

    getCart(): string[] {
        return [];
    }

    getWishlist(): string[] {
        const saved = localStorage.getItem('vapr_wishlist');
        return saved ? JSON.parse(saved) : [];
    }

    async getWishlistGames() {
        const wishlistIds = this.getWishlist();
        const { games } = await this.getAllGames();
        const wishlistGames = games.filter(game => wishlistIds.includes(game.id));
        return { success: true, games: wishlistGames };
    }

    async addToWishlist(gameId: string) {
        const wishlist = this.getWishlist();
        if (!wishlist.includes(gameId)) {
            wishlist.push(gameId);
            localStorage.setItem('vapr_wishlist', JSON.stringify(wishlist));
        }
        return { success: true };
    }

    async removeFromWishlist(gameId: string) {
        const wishlist = this.getWishlist().filter(id => id !== gameId);
        localStorage.setItem('vapr_wishlist', JSON.stringify(wishlist));
        return { success: true };
    }

    isInWishlist(gameId: string): boolean {
        return this.getWishlist().includes(gameId);
    }

    async getGameReviews(gameId: string): Promise<{ success: boolean; reviews: GameReview[] }> {
        const reviews = JSON.parse(localStorage.getItem(`reviews_${gameId}`) || '[]');
        return { success: true, reviews };
    }

    async submitReview(gameId: string, rating: number, content: string) {
        const user = await this.getMe();
        const review: GameReview = {
            id: Date.now().toString(),
            userId: user.id,
            username: user.username,
            avatar: user.avatar,
            rating,
            content,
            createdAt: new Date().toISOString(),
            helpful: 0
        };

        const reviews = JSON.parse(localStorage.getItem(`reviews_${gameId}`) || '[]');
        reviews.push(review);
        localStorage.setItem(`reviews_${gameId}`, JSON.stringify(reviews));

        return { success: true };
    }
}

export const apiClient = new ApiClient();
export default apiClient;