import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StoreLayout from "@/components/StoreLayout";
import { ShoppingCart, Heart, Search as SearchIcon } from "lucide-react";
import apiClient from "@/lib/api-client";

interface SearchProps {
    isAuthenticated?: boolean | null;
}

export default function Search({ isAuthenticated }: SearchProps) {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState<string[]>([]);

    useEffect(() => {
        if (query) {
            searchGames();
        }
        updateCart();
    }, [query]);

    const searchGames = async () => {
        try {
            setLoading(true);
            const searchResults = await apiClient.searchGames(query);
            setGames(searchResults.games);
        } catch (error) {
            console.error('Failed to search games:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateCart = () => {
        const cartItems = apiClient.getCart();
        setCart(cartItems);
    };

    const handleAddToCart = (gameId: string) => {
        apiClient.addToCart(gameId);
        updateCart();
    };

    const handleAddToWishlist = async (gameId: string) => {
        if (!isAuthenticated) {
            apiClient.login();
            return;
        }
        try {
            await apiClient.addToWishlist(gameId);
            // Show success message or update UI
        } catch (error) {
            console.error('Failed to add to wishlist:', error);
        }
    };

    const formatPrice = (price?: number) => {
        return price === 0 || !price ? 'Free' : `$${price.toFixed(2)}`;
    };

    if (loading) {
        return (
            <StoreLayout isAuthenticated={isAuthenticated}>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Searching...</p>
                    </div>
                </div>
            </StoreLayout>
        );
    }

    return (
        <StoreLayout isAuthenticated={isAuthenticated}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Search Results</h1>
                    <p className="text-muted-foreground">
                        {games.length} result{games.length !== 1 ? 's' : ''} for "{query}"
                    </p>
                </div>

                {games.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground mb-2">
                                No games found matching your search.
                            </p>
                            <p className="text-sm text-muted-foreground mb-6">
                                Try searching with different keywords or browse our categories.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Link to="/">
                                    <Button>Browse All Games</Button>
                                </Link>
                                <Link to="/category/indie">
                                    <Button variant="outline">Browse Categories</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {games.map((game) => (
                            <Card key={game.id} className="overflow-hidden hover:ring-2 hover:ring-primary transition-all h-full flex flex-col">
                                <Link to={`/game/${game.id}`} className="flex-1 flex flex-col">
                                    <div className="aspect-[3/4] relative">
                                        <img
                                            src={game.coverImage || '/default-game-cover.png'}
                                            alt={game.title}
                                            className="object-cover w-full h-full"
                                        />
                                        {game.price === 0 && (
                                            <Badge className="absolute top-2 right-2" variant="secondary">
                                                Free
                                            </Badge>
                                        )}
                                    </div>
                                    <CardContent className="p-4 flex-1 flex flex-col">
                                        <h3 className="font-semibold mb-1 line-clamp-1">{game.title}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{game.publisher || 'VAPR Developer'}</p>
                                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
                                            {game.description}
                                        </p>
                                        {game.tags && game.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mb-3">
                                                {game.tags.slice(0, 2).map((tag: string) => (
                                                    <Badge key={tag} variant="secondary" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {game.tags.length > 2 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{game.tags.length - 2}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-lg font-bold">{formatPrice(game.price)}</span>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleAddToCart(game.id);
                                                    }}
                                                    disabled={cart.includes(game.id)}
                                                    title={cart.includes(game.id) ? "Already in cart" : "Add to cart"}
                                                >
                                                    <ShoppingCart className={`h-4 w-4 ${cart.includes(game.id) ? 'text-primary' : ''}`} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleAddToWishlist(game.id);
                                                    }}
                                                    title="Add to wishlist"
                                                >
                                                    <Heart className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Link>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Search Tips */}
                {query && games.length > 0 && games.length < 3 && (
                    <Card className="mt-8">
                        <CardContent className="pt-6">
                            <h3 className="font-semibold mb-2">Search Tips</h3>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Try using more general keywords</li>
                                <li>• Check your spelling</li>
                                <li>• Browse by category to discover similar games</li>
                                <li>• Use tags like "action", "adventure", or "indie"</li>
                            </ul>
                        </CardContent>
                    </Card>
                )}
            </div>
        </StoreLayout>
    );
}