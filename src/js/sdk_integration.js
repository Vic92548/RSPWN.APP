async function updateSDKUserInfo() {
    if (!isRunningInTauri() || !window.user) return;

    try {
        let avatarHash = null;
        if (window.user.avatar) {
            avatarHash = window.user.avatar;
        } else if (window.user.avatar_url) {
            const match = window.user.avatar_url.match(/avatars\/\d+\/([^.]+)/);
            if (match) {
                avatarHash = match[1];
            }
        }

        await window.__TAURI__.core.invoke('update_sdk_user_info', {
            userId: window.user.id,
            username: window.user.username,
            level: window.user.level || 0,
            xp: window.user.xp || 0,
            xpRequired: window.user.xp_required || 700,
            avatar: avatarHash
        });

        console.log('SDK user info updated');
    } catch (error) {
        console.error('Failed to update SDK user info:', error);
    }
}

async function clearSDKUserInfo() {
    if (!isRunningInTauri()) return;

    try {
        await window.__TAURI__.core.invoke('clear_sdk_user_info');
        console.log('SDK user info cleared');
    } catch (error) {
        console.error('Failed to clear SDK user info:', error);
    }
}

async function getSDKConnectedSessions() {
    if (!isRunningInTauri()) return [];

    try {
        const sessions = await window.__TAURI__.core.invoke('get_sdk_connected_sessions');
        return sessions;
    } catch (error) {
        console.error('Failed to get connected sessions:', error);
        return [];
    }
}

async function monitorSDKConnections() {
    if (!isRunningInTauri()) return;

    setInterval(async () => {
        const sessions = await getSDKConnectedSessions();
        if (sessions.length > 0) {
            console.log(`Games connected via SDK: ${sessions.length}`);
        }
    }, 30000);
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        monitorSDKConnections();
    });
}