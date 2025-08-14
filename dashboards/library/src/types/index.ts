export interface Game {
    id: string;
    title: string;
    description: string;
    coverImage: string;
    downloadUrl?: string;
    currentVersion: string;
    createdAt: string;
    ownedAt?: string;
    totalPlaytimeSeconds?: number;
    isInstalled?: boolean;
    installedVersion?: string;
    hasUpdate?: boolean;
    latestVersion?: string;
    price?: number;
    currency?: string;
    tebexId?: number;
}

export interface User {
    id: string;
    username: string;
    email?: string;
    avatar: string;
    level: number;
    xp: number;
    xp_required: number;
}

export interface GameUpdate {
    gameId: string;
    fromVersion: string;
    toVersion: string;
    changelog: string;
    downloadUrl: string;
    isRequired: boolean;
}