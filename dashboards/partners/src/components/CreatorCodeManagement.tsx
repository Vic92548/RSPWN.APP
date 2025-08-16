import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { UserCheck, UserX, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import apiClient from "@/lib/api-client";

interface Creator {
    creatorId: string;
    username: string;
    creatorCode: string;
    avatar: string | null;
    isAddedToTebex: boolean;
    confirmedAt: string | null;
}

export default function CreatorCodeManagement() {
    const [loading, setLoading] = useState(true);
    const [creators, setCreators] = useState<Creator[]>([]);
    const [compliance, setCompliance] = useState<any>(null);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [creatorsData, complianceData] = await Promise.all([
                apiClient.getPartnerCreators(),
                apiClient.checkPartnerCompliance()
            ]);
            setCreators(creatorsData.creators);
            setCompliance(complianceData);
        } catch (error) {
            console.error('Failed to load creator data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCreator = async (creator: Creator) => {
        try {
            setUpdating(creator.creatorId);
            if (creator.isAddedToTebex) {
                await apiClient.removeCreatorConfirmation(creator.creatorId);
            } else {
                await apiClient.confirmCreatorAdded(creator.creatorId);
            }
            await loadData();
        } catch (error) {
            console.error('Failed to update creator:', error);
        } finally {
            setUpdating(null);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {compliance && !compliance.isCompliant && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        You need to add {compliance.missingCreators} more creator{compliance.missingCreators !== 1 ? 's' : ''} to your Tebex store before you can make your games public.
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Creator Code Management</CardTitle>
                            <CardDescription>
                                Track which creators you've added to your Tebex store
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadData}
                            disabled={loading}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div>
                            <p className="text-sm font-medium">Compliance Status</p>
                            <p className="text-2xl font-bold">
                                {compliance?.confirmedCreators || 0} / {compliance?.totalCreators || 0}
                            </p>
                        </div>
                        <Badge variant={compliance?.isCompliant ? "secondary" : "destructive"}>
                            {compliance?.isCompliant ? "Compliant" : "Non-Compliant"}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        {creators.map((creator) => (
                            <div
                                key={creator.creatorId}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className={undefined}>
                                        <AvatarImage
                                            src={creator.avatar ? `https://cdn.discordapp.com/avatars/${creator.creatorId}/${creator.avatar}.png` : undefined}
                                            className={undefined}                                        />
                                        <AvatarFallback className={undefined}>{creator.username[0].toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{creator.username}</p>
                                        <p className="text-sm text-muted-foreground">Code: {creator.creatorCode}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {creator.isAddedToTebex ? (
                                        <Badge variant="secondary" className="gap-1">
                                            <UserCheck className="h-3 w-3" />
                                            Added
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="gap-1">
                                            <UserX className="h-3 w-3" />
                                            Not Added
                                        </Badge>
                                    )}
                                    <Checkbox
                                        checked={creator.isAddedToTebex}
                                        onCheckedChange={() => handleToggleCreator(creator)}
                                        disabled={updating === creator.creatorId} className={undefined}                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">
                            <strong>Instructions:</strong> Add each creator code to your Tebex store, then mark them as added here.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            asChild
                        >
                        <a
                            href="https://creators.tebex.io/settings/creator-codes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2"
                            >
                            Go to Tebex Creator Codes
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    </Button>
        </div>
</CardContent>
</Card>
</div>
);
}