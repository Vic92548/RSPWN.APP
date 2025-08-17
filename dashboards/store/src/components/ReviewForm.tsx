import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

interface ReviewFormProps {
    gameId: string;
    onSubmit: (rating: number, content: string) => Promise<void>;
    onCancel: () => void;
}

export default function ReviewForm({ onSubmit, onCancel }: ReviewFormProps) {
    const [rating, setRating] = useState(5);
    const [content, setContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || rating < 1) return;

        setSubmitting(true);
        try {
            await onSubmit(rating, content);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Write a Review</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label>Rating</Label>
                        <div className="flex items-center gap-1 mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="p-1 transition-colors"
                                >
                                    <Star
                                        className={`h-6 w-6 ${
                                            star <= (hoveredRating || rating)
                                                ? 'fill-yellow-500 text-yellow-500'
                                                : 'text-muted-foreground'
                                        }`}
                                    />
                                </button>
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                                {rating} out of 5 stars
                            </span>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="review-content">Your Review</Label>
                        <Textarea
                            id="review-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share your thoughts about this game..."
                            rows={5}
                            required
                            className="mt-2"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Minimum 20 characters
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button type="submit" disabled={submitting || content.length < 20}>
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onCancel}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}