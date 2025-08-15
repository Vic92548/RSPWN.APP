class API {
    constructor() {
        this.baseURL = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    clearAuth() {
        localStorage.removeItem('userData');
        window.user = null;
    }

    async request(path, options = {}) {
        const {
            method = 'GET',
            body = null,
            requireAuth = true,
            headers = {},
            isFormData = false
        } = options;

        const requestHeaders = {
            ...(!isFormData ? this.defaultHeaders : {}),
            ...headers
        };

        try {
            const response = await fetch(path, {
                method,
                headers: requestHeaders,
                body: isFormData ? body : (body ? JSON.stringify(body) : null),
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401 && requireAuth) {
                    this.clearAuth();
                    //window.location.href = '/login';
                    throw new Error('Unauthorized');
                }
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    get(path, requireAuth = true) {
        return this.request(path, { requireAuth });
    }

    post(path, body, options = {}) {
        return this.request(path, {
            method: 'POST',
            body,
            ...options
        });
    }

    async getMe() {
        return this.get('/me');
    }

    async getFeed() {
        return this.get('/feed', false);
    }

    async getPost(id) {
        if (!/^[a-f0-9-]{36}$/.test(id)) {
            throw new Error('Invalid post ID format');
        }
        return this.get(`/posts/${id}`, false);
    }

    async createPost(formData) {
        return this.request('/posts', {
            method: 'POST',
            body: formData,
            isFormData: true,
            requireAuth: true
        });
    }

    async likePost(postId) {
        if (!/^[a-f0-9-]{36}$/.test(postId)) {
            throw new Error('Invalid post ID format');
        }
        return this.get(`/like/${postId}`);
    }

    async dislikePost(postId) {
        if (!/^[a-f0-9-]{36}$/.test(postId)) {
            throw new Error('Invalid post ID format');
        }
        return this.get(`/dislike/${postId}`);
    }

    async skipPost(postId) {
        if (!/^[a-f0-9-]{36}$/.test(postId)) {
            throw new Error('Invalid post ID format');
        }
        return this.get(`/skip/${postId}`);
    }

    async followPost(postId) {
        if (!/^[a-f0-9-]{36}$/.test(postId)) {
            throw new Error('Invalid post ID format');
        }
        return this.get(`/manage-follow?action=follow&postId=${postId}`);
    }

    async unfollowPost(postId) {
        if (!/^[a-f0-9-]{36}$/.test(postId)) {
            throw new Error('Invalid post ID format');
        }
        return this.get(`/manage-follow?action=unfollow&postId=${postId}`);
    }

    async checkFollowStatus(creatorId) {
        const data = await this.get(`/check-follow/${creatorId}`);
        return data.isFollowing || false;
    }

    async addReaction(postId, emoji) {
        if (!/^[a-f0-9-]{36}$/.test(postId)) {
            throw new Error('Invalid post ID format');
        }
        const allowedEmojis = ['💩', '👀', '😂', '❤️', '💯', 'null'];
        if (!allowedEmojis.includes(emoji)) {
            throw new Error('Invalid emoji');
        }
        return this.get(`/add-reaction?postId=${postId}&emoji=${encodeURIComponent(emoji)}`);
    }

    async getReactions(postId) {
        if (!/^[a-f0-9-]{36}$/.test(postId)) {
            throw new Error('Invalid post ID format');
        }
        return this.get(`/get-reactions?postId=${postId}`, false);
    }

    async registerView(postId) {
        if (!/^[a-f0-9-]{36}$/.test(postId)) {
            throw new Error('Invalid post ID format');
        }
        return this.get(`/register-view?postId=${postId}`, false);
    }

    async clickLink(postId) {
        if (!/^[a-f0-9-]{36}$/.test(postId)) {
            throw new Error('Invalid post ID format');
        }
        return this.get(`/click-link?postId=${postId}`, false);
    }

    async getMyPosts() {
        return this.get('/me/posts');
    }

    async updateBackground(backgroundUrl) {
        return this.get(`/me/update-background?backgroundId=${encodeURIComponent(backgroundUrl)}`);
    }

    async acceptInvitation(ambassadorUserId) {
        return this.get(`/accept-invitation?ambassadorUserId=${ambassadorUserId}`);
    }

    async getAnalytics(range = 7) {
        if (!['7', '30', 'all'].includes(String(range))) {
            range = 7;
        }
        return this.get(`/api/analytics?range=${range}`);
    }

    async getDailyXP() {
        return this.get('/api/xp-today');
    }

    async getUserCount() {
        const response = await fetch('/api/user-count', {
            credentials: 'include'
        });
        return response.json();
    }

    async getUser(userId) {
        return this.get(`/api/user/${userId}`, false);
    }

    async getUserPosts(userId) {
        if (!userId) {
            throw new Error('userId required');
        }
        return this.get(`/api/user/${userId}/posts`, false);
    }

    // Resolve post info (title, media, tagged game) by ID or URL
    async resolvePost(input) {
        if (!input) {
            throw new Error('id or url required');
        }
        if (typeof input === 'object') {
            if (input.id) {
                return this.get(`/api/post/resolve?id=${encodeURIComponent(input.id)}`, false);
            }
            if (input.url) {
                return this.get(`/api/post/resolve?url=${encodeURIComponent(input.url)}`, false);
            }
        }
        const str = String(input);
        if (/^[a-f0-9-]{36}$/i.test(str)) {
            return this.get(`/api/post/resolve?id=${encodeURIComponent(str)}`, false);
        }
        return this.get(`/api/post/resolve?url=${encodeURIComponent(str)}`, false);
    }

    // Playtime APIs
    async recordPlaytimeSession({ gameId, startedAt, endedAt, durationSeconds, executablePath }) {
        return this.post('/api/playtime/session', { gameId, startedAt, endedAt, durationSeconds, executablePath });
    }

    async getPlaytimeTotals() {
        return this.get('/api/playtime/totals');
    }
}

class APIHandler {
    static async handle(apiCall, options = {}) {
        const {
            onSuccess = () => {},
            onError = null,
            showLoading = false,
            successMessage = null,
            errorMessage = 'An error occurred',
            updateXP = false
        } = options;

        if (showLoading) showLoading();

        try {
            const data = await apiCall();

            if (updateXP && window.user && data.user) {
                const oldUser = {
                    xp: window.user.xp,
                    level: window.user.level,
                    xp_required: window.user.xp_required
                };
                window.user = data.user;
                setXPProgress(oldUser);
            }

            if (successMessage && window.notify) {
                window.notify.success(successMessage);
            }

            await onSuccess(data);
            return data;

        } catch (error) {
            console.error(error);

            if (onError) {
                await onError(error);
            } else if (window.notify) {
                window.notify.error('Error', errorMessage);
            }

            throw error;
        } finally {
            if (showLoading) hideLoading();
        }
    }
}

const api = new API();
window.api = api;
window.APIHandler = APIHandler;

window.makeApiRequest = function(path, requireAuth = true) {
    return api.get(path, requireAuth);
};

// Tauri desktop bridge: listen for sdk-request and fulfill via API, then invoke sdk_response
if (typeof window !== 'undefined' && window.__TAURI__ && window.__TAURI__.event && window.__TAURI__.core) {
    try {
        window.__TAURI__.event.listen('sdk-request', async (event) => {
            const { id, name, payload } = event.payload || {};
            if (!id || !name) return;
            try {
                let data;
                switch (name) {
                    case 'getFeed':
                        data = await api.getFeed();
                        break;
                    case 'getUserPosts':
                        data = await api.getUserPosts(payload && payload.userId);
                        break;
                    case 'resolvePost':
                        data = await api.resolvePost(payload);
                        break;
                    default:
                        throw new Error('Unknown sdk-request: ' + name);
                }
                await window.__TAURI__.core.invoke('sdk_response', { id, ok: true, data });
            } catch (err) {
                await window.__TAURI__.core.invoke('sdk_response', { id, ok: false, error: String(err && err.message || err) });
            }
        });
    } catch (e) {
        console.error('Failed to setup Tauri sdk-request listener', e);
    }
}