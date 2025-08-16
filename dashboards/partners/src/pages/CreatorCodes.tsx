import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import Layout from "@/components/Layout";
import {
    UserCheck,
    UserX,
    AlertTriangle,
    ExternalLink,
    RefreshCw,
    ArrowLeft,
    Search,
    CheckCircle2,
    Copy,
    Users
} from "lucide-react";
import apiClient from "@/lib/api-client";

interface Creator {
    creatorId: string;
    username: string;
    creatorCode: string;
    avatar: string | null;
    isAddedToTebex: boolean;
    confirmedAt: string | null;
}

export default function CreatorCodes() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creators, setCreators] = useState<Creator[]>([]);
    const [compliance, setCompliance] = useState<any>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [userData, creatorsData, complianceData] = await Promise.all([
                apiClient.getMe(),
                apiClient.getPartnerCreators(),
                apiClient.checkPartnerCompliance()
            ]);
            setUser(userData);
            setCreators(creatorsData.creators);
            setCompliance(complianceData);
        } catch (error) {
            console.error('Failed to load data:', error);
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

    const handleCopyCode = async (code: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const filteredCreators = creators.filter(creator =>
        creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        creator.creatorCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addedCreators = creators.filter(c => c.isAddedToTebex);
    const pendingCreators = creators.filter(c => !c.isAddedToTebex);

    if (loading) {
        return (
            <Layout user={user}>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading creator codes...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    const progressPercentage = compliance ? (compliance.confirmedCreators / compliance.totalCreators) * 100 : 0;

    return (
        <Layout user={user}>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center gap-4 mb-8">
                    <Link to="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Users className="h-8 w-8" />
                            Creator Code Management
                        </h1>
                        <p className="text-muted-foreground">
                            Track and manage creator codes for your Tebex store
                        </p>
                    </div>
                </div>

                {compliance && !compliance.isCompliant && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Action Required</AlertTitle>
                        <AlertDescription>
                            You must add all {compliance.totalCreators} creators to your Tebex store before your games can be made public.
                            You have {compliance.missingCreators} creator{compliance.missingCreators !== 1 ? 's' : ''} remaining.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Total Creators</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{compliance?.totalCreators || 0}</div>
                            <p className="text-xs text-muted-foreground">In the VAPR network</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Added to Tebex</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{compliance?.confirmedCreators || 0}</div>
                            <p className="text-xs text-muted-foreground">Confirmed creators</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Remaining</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{compliance?.missingCreators || 0}</div>
                            <p className="text-xs text-muted-foreground">Need to be added</p>
                        </CardContent>
                    </Card>
                </div>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Compliance Progress</CardTitle>
                        <CardDescription>Your progress towards full creator code compliance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                            </div>
                            <Progress value={progressPercentage} className="h-3" />
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{compliance?.confirmedCreators || 0} creators added</span>
                                <Badge variant={compliance?.isCompliant ? "secondary" : "destructive"}>
                                    {compliance?.isCompliant ? "Compliant" : "Non-Compliant"}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>How to Add Creator Codes</CardTitle>
                        <CardDescription>Follow these steps to add creator codes to your Tebex store</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                                <h4 className="font-medium">Steps to add creators:</h4>
                                <ol className="space-y-2 text-sm">
                                    <li className="flex gap-2">
                                        <span className="font-medium text-primary">1.</span>
                                        Copy the creator code from the list below
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-medium text-primary">2.</span>
                                        Go to your Tebex creator codes page
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-medium text-primary">3.</span>
                                        Add the creator code to your store
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="font-medium text-primary">4.</span>
                                        Return here and check the box to confirm
                                    </li>
                                </ol>
                            </div>
                            <div className="bg-muted rounded-lg p-4 space-y-3">
                                <p className="text-sm font-medium">Quick Actions:</p>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    asChild
                                >
                                <a
                                    href="https://creator.tebex.io/creator-codes"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Tebex Creator Codes
                                </a>
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={loadData}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Refresh Status
                            </Button>
                        </div>
            </div>
        </CardContent>
</Card>

    <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Creator List</CardTitle>
                    <CardDescription>All creators in the VAPR network</CardDescription>
                </div>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search creators..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-6">
                {pendingCreators.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm text-orange-600">
                            Pending ({pendingCreators.filter(c =>
                            c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.creatorCode.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length})
                        </h3>
                        <div className="space-y-2">
                            {pendingCreators
                                .filter(c =>
                                    c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    c.creatorCode.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((creator) => (
                                    <CreatorRow
                                        key={creator.creatorId}
                                        creator={creator}
                                        updating={updating === creator.creatorId}
                                        onToggle={() => handleToggleCreator(creator)}
                                        onCopyCode={handleCopyCode}
                                        copiedCode={copiedCode}
                                    />
                                ))}
                        </div>
                    </div>
                )}

                {addedCreators.length > 0 && (
                    <div className="space-y-3">
                        <h3 className="font-medium text-sm text-green-600">
                            Confirmed ({addedCreators.filter(c =>
                            c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.creatorCode.toLowerCase().includes(searchTerm.toLowerCase())
                        ).length})
                        </h3>
                        <div className="space-y-2">
                            {addedCreators
                                .filter(c =>
                                    c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    c.creatorCode.toLowerCase().includes(searchTerm.toLowerCase())
                                )
                                .map((creator) => (
                                    <CreatorRow
                                        key={creator.creatorId}
                                        creator={creator}
                                        updating={updating === creator.creatorId}
                                        onToggle={() => handleToggleCreator(creator)}
                                        onCopyCode={handleCopyCode}
                                        copiedCode={copiedCode}
                                    />
                                ))}
                        </div>
                    </div>
                )}

                {filteredCreators.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No creators found matching "{searchTerm}"
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
</div>
</Layout>
);
}

function CreatorRow({ creator, updating, onToggle, onCopyCode, copiedCode }: {
    creator: Creator;
    updating: boolean;
    onToggle: () => void;
    onCopyCode: (code: string) => void;
    copiedCode: string | null;
}) {
    return (
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
                <Checkbox
                    checked={creator.isAddedToTebex}
                    onCheckedChange={onToggle}
                    disabled={updating}
                    className="ml-1"
                />
                <Avatar className={undefined}>
                    <AvatarImage
                        src={creator.avatar ? `https://cdn.discordapp.com/avatars/${creator.creatorId}/${creator.avatar}.png` : undefined}
                        className={undefined}                    />
                    <AvatarFallback className={undefined}>{creator.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium">{creator.username}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <code className="bg-muted px-2 py-0.5 rounded">{creator.creatorCode}</code>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => onCopyCode(creator.creatorCode)}
                        >
                            {copiedCode === creator.creatorCode ? (
                                <CheckCircle2 className="h-3 w-3" />
                            ) : (
                                <Copy className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
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
            </div>
        </div>
    );
}