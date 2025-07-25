class API {
    constructor() {
        this.baseURL = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
        this.tokenRefreshPromise = null;
    }

    getAuthHeaders() {
        const jwt = this.getStoredToken();
        return jwt ? { Authorization: `Bearer ${jwt}` } : {};
    }

    getStoredToken() {
        try {
            const token = localStorage.getItem('jwt');
            if (!token) return null;

            const payload = this.parseJwt(token);
            if (!payload || !payload.exp) return null;

            const now = Date.now() / 1000;
            if (payload.exp < now) {
                this.clearAuth();
                return null;
            }

            return token;
        } catch (error) {
            this.clearAuth();
            return null;
        }
    }

    parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (error) {
            return null;
        }
    }

    clearAuth() {
        localStorage.removeItem('jwt');
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

        const jwt = this.getStoredToken();
        if (requireAuth && !jwt) {
            this.clearAuth();
            throw new Error('Authentication required');
        }

        const requestHeaders = {
            ...(!isFormData ? this.defaultHeaders : {}),
            ...this.getAuthHeaders(),
            ...headers
        };

        try {
            const response = await fetch(path, {
                method,
                headers: requestHeaders,
                body: isFormData ? body : (body ? JSON.stringify(body) : null),
                credentials: 'same-origin'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.clearAuth();
                    window.location.href = '/login';
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
        const allowedEmojis = ['💩', '👀', '😂', '❤️', '💯'];
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

    async updateBackground(backgroundId) {
        if (!/^[a-zA-Z0-9_-]+$/.test(backgroundId)) {
            throw new Error('Invalid background ID format');
        }
        return this.get(`/me/update-background?backgroundId=${encodeURIComponent(backgroundId)}`);
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
        const response = await fetch('/api/user-count');
        return response.json();
    }

    async getUser(userId) {
        return this.get(`/api/user/${userId}`, false);
    }
}

const api = new API();

window.api = api;

window.makeApiRequest = function(path, requireAuth = true) {
    return api.get(path, requireAuth);
};