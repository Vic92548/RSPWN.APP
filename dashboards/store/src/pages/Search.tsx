// dashboards/store/src/pages/Search.tsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StoreLayout from "@/components/StoreLayout";
import GameCard from "@/components/GameCard";
import { Search as SearchIcon } from "lucide-react";
import apiClient from "@/lib/api-client";

interface SearchProps {
    isAuthenticated?: boolean | null;
}

export default function Search({ isAuthenticated }: SearchProps) {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [games, setGames] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query) {
            searchGames();
        }
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

    const handleBuyNow = async (gameId: string) => {
        try {
            await apiClient.checkoutTebexGame(gameId);
        } catch (error) {
            console.error('Failed to start checkout:', error);
        }
    };

    const handleAddToWishlist = async (gameId: string) => {
        if (!isAuthenticated) {
            apiClient.login();
            return;
        }
        try {
            await apiClient.addToWishlist(gameId);
        } catch (error) {
            console.error('Failed to add to wishlist:', error);
        }
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
                                Try searching with different keywords.
                            </p>
                            <Link to="/">
                                <Button>Browse All Games</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {games.map((game) => (
                            <GameCard
                                key={game.id}
                                game={game}
                                onBuyNow={handleBuyNow}
                                onAddToWishlist={handleAddToWishlist}
                                //@ts-ignore
                                isAuthenticated={isAuthenticated}
                            />
                        ))}
                    </div>
                )}
            </div>
        </StoreLayout>
    );
}