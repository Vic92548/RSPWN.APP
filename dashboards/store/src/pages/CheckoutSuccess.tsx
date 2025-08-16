import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StoreLayout from "@/components/StoreLayout";
import { CheckCircle, ArrowRight } from "lucide-react";

export default function CheckoutSuccess() {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect after 5 seconds
        const timer = setTimeout(() => {
            navigate('/library');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <StoreLayout isAuthenticated={true}>
            <div className="container mx-auto px-4 py-16">
                <Card className="max-w-md mx-auto">
                    <CardContent className="text-center py-12">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Purchase Successful!</h2>
                        <p className="text-muted-foreground mb-6">
                            Your game key has been sent to your email. Check your inbox (including spam folder) for the activation key.
                        </p>
                        <div className="space-y-2">
                            <Button onClick={() => window.location.href = '/library'} className="w-full">
                                <ArrowRight className="h-4 w-4 mr-2" />
                                Go to Library to Redeem
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                                Continue Shopping
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">
                            Redirecting to library in 5 seconds...
                        </p>
                    </CardContent>
                </Card>
            </div>
        </StoreLayout>
    );
}