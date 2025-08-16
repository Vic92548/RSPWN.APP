import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StoreLayout from "@/components/StoreLayout";
import { XCircle, ArrowLeft } from "lucide-react";

export default function CheckoutCancel() {
    const navigate = useNavigate();

    return (
        <StoreLayout>
            <div className="container mx-auto px-4 py-16">
                <Card className="max-w-md mx-auto">
                    <CardContent className="text-center py-12">
                        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Checkout Cancelled</h2>
                        <p className="text-muted-foreground mb-6">
                            Your checkout was cancelled. No charges were made.
                        </p>
                        <div className="space-y-2">
                            <Button onClick={() => navigate('/')} className="w-full">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Store
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </StoreLayout>
    );
}