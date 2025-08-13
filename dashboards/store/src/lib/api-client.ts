// API Client for VAPR Store

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
    publisher?: string;
}

class ApiClient {
    private gamesCache: Game[] | null = null;

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

    // Auth methods
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

    // Store methods - all work with the single /api/games endpoint
    async getAllGames() {
        const response = await this.request<{
            success: boolean;
            games: Game[];
        }>('/api/games');

        console.log(response);
        // Cache games and enhance with default values
        this.gamesCache = response.games.map(game => ({
            ...game,
            price: game.price || 0,
            tags: game.tags || ['indie'],
            publisher: game.publisher || 'VAPR Developer'
        }));

        return { success: true, games: this.gamesCache };
    }

    async getGame(gameId: string) {
        // Get from cache or fetch all games
        if (!this.gamesCache) {
            await this.getAllGames();
        }

        const game = this.gamesCache?.find(g => g.id === gameId);
        return { success: !!game, game };
    }

    async getFeaturedGames() {
        const { games } = await this.getAllGames();
        // Return first 3 games as featured
        return { success: true, games: games.slice(0, 3) };
    }

    async getGamesByCategory(category: string) {
        const { games } = await this.getAllGames();

        // Filter by tags or return all for certain categories
        if (category === 'new') {
            // Sort by creation date and return newest
            const sorted = [...games].sort((a, b) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });
            return { success: true, games: sorted };
        }

        if (category === 'top' || category === 'popular') {
            // For now, just return all games
            return { success: true, games };
        }

        // Filter by tag
        const filtered = games.filter(game =>
            game.tags?.some(tag => tag.toLowerCase() === category.toLowerCase())
        );

        return { success: true, games: filtered.length > 0 ? filtered : games };
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

    // Local storage methods for cart and wishlist
    getCart(): string[] {
        const savedCart = localStorage.getItem('vapr_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    }

    addToCart(gameId: string) {
        const cart = this.getCart();
        if (!cart.includes(gameId)) {
            cart.push(gameId);
            localStorage.setItem('vapr_cart', JSON.stringify(cart));
        }
        return cart;
    }

    removeFromCart(gameId: string) {
        const cart = this.getCart().filter(id => id !== gameId);
        localStorage.setItem('vapr_cart', JSON.stringify(cart));
        return cart;
    }

    clearCart() {
        localStorage.removeItem('vapr_cart');
        return [];
    }

    // Wishlist methods (using local storage)
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

    // Mock reviews (stored in local storage)
    async getGameReviews(gameId: string) {
        const reviews = JSON.parse(localStorage.getItem(`reviews_${gameId}`) || '[]');
        return { success: true, reviews };
    }

    async submitReview(gameId: string, rating: number, content: string) {
        const user = await this.getMe();
        const review = {
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