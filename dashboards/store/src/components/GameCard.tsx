// dashboards/store/src/components/GameCard.tsx
import { Link } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart } from "lucide-react";
import DOMPurify from 'dompurify';

interface GameCardProps {
    game: {
        id: string;
        title: string;
        description: string;
        coverImage: string;
        price?: number;
        currency?: string;
        tags?: string[];
        publisher?: string;
        onSale?: boolean;
        originalPrice?: number;
        discount?: number;
        isEarlyAccess?: boolean;
    };
    onBuyNow: (gameId: string) => void;
    onAddToWishlist?: (gameId: string) => void;
    isAuthenticated?: boolean;
}

export default function GameCard({ game, onBuyNow, onAddToWishlist, isAuthenticated }: GameCardProps) {
    const formatPrice = (price?: number, currency?: string) => {
        const curr = currency || 'USD';
        const currencySymbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : curr + ' ';
        return `${currencySymbol}${price?.toFixed(2) || '0.00'}`;
    };

    // Strip HTML tags from description for preview
    const getPlainTextDescription = (html: string) => {
        const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
        return clean.length > 100 ? clean.substring(0, 100) + '...' : clean;
    };

    return (
        <Card className="overflow-hidden hover:ring-2 hover:ring-primary transition-all h-full flex flex-col">
            <Link to={`/game/${game.id}`} className="flex-1 flex flex-col">
                <div className="relative bg-background overflow-hidden">
                    <img
                        src={game.coverImage || '/default-game-cover.png'}
                        alt={game.title}
                        className="w-full h-auto"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                    />
                    {/* Badge container - position badges in top corners */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                        {/* Early Access badge on the left */}
                        {game.isEarlyAccess && (
                            <Badge className="bg-blue-600 text-white border-blue-600">
                                Early Access
                            </Badge>
                        )}
                        {/* Sale badge on the right */}
                        {game.onSale && game.discount && (
                            <Badge className="ml-auto" variant="destructive">
                                -{game.discount}%
                            </Badge>
                        )}
                    </div>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold mb-1 line-clamp-1">{game.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{game.publisher || 'VAPR Developer'}</p>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2 flex-1">
                        {getPlainTextDescription(game.description)}
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
                        {game.onSale && game.originalPrice ? (
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground line-through">
                                    {formatPrice(game.originalPrice, game.currency)}
                                </span>
                                <span className="text-lg font-bold text-primary">
                                    {formatPrice(game.price, game.currency)}
                                </span>
                            </div>
                        ) : (
                            <span className="text-lg font-bold">
                                {formatPrice(game.price, game.currency)}
                            </span>
                        )}
                        <div className="flex gap-1">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                    e.preventDefault();
                                    onBuyNow(game.id);
                                }}
                                title="Buy Now"
                            >
                                <ShoppingCart className="h-4 w-4" />
                            </Button>
                            {isAuthenticated && onAddToWishlist && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onAddToWishlist(game.id);
                                    }}
                                    title="Add to wishlist"
                                >
                                    <Heart className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}