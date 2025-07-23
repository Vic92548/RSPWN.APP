class API {
    constructor() {
        this.baseURL = '';
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
    }

    // Get auth headers
    getAuthHeaders() {
        const jwt = localStorage.getItem('jwt');
        return jwt ? { Authorization: `Bearer ${jwt}` } : {};
    }

    // Main request method
    async request(path, options = {}) {
        const {
            method = 'GET',
            body = null,
            requireAuth = true,
            headers = {},
            isFormData = false
        } = options;

        const jwt = localStorage.getItem('jwt');
        if (requireAuth && !jwt) {
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
                body: isFormData ? body : (body ? JSON.stringify(body) : null)
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Unauthorized');
                }
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    }

    // Convenience methods
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

    // Specific API calls
    async getMe() {
        return this.get('/me');
    }

    async getFeed() {
        return this.get('/feed', false);
    }

    async getPost(id) {
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
        return this.get(`/like/${postId}`);
    }

    async dislikePost(postId) {
        return this.get(`/dislike/${postId}`);
    }

    async skipPost(postId) {
        return this.get(`/skip/${postId}`);
    }

    async followPost(postId) {
        return this.get(`/manage-follow?action=follow&postId=${postId}`);
    }

    async unfollowPost(postId) {
        return this.get(`/manage-follow?action=unfollow&postId=${postId}`);
    }

    async checkFollowStatus(creatorId) {
        const data = await this.get(`/check-follow/${creatorId}`);
        console.log({data});
        return data.isFollowing || false;
    }

    async addReaction(postId, emoji) {
        return this.get(`/add-reaction?postId=${postId}&emoji=${encodeURIComponent(emoji)}`);
    }

    async getReactions(postId) {
        return this.get(`/get-reactions?postId=${postId}`, false);
    }

    async registerView(postId) {
        return this.get(`/register-view?postId=${postId}`, false);
    }

    async clickLink(postId) {
        return this.get(`/click-link?postId=${postId}`, false);
    }

    async getMyPosts() {
        return this.get('/me/posts');
    }

    async updateBackground(backgroundId) {
        return this.get(`/me/update-background?backgroundId=${encodeURIComponent(backgroundId)}`);
    }

    async acceptInvitation(ambassadorUserId) {
        return this.get(`/accept-invitation?ambassadorUserId=${ambassadorUserId}`);
    }

    async getAnalytics(range = 7) {
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

// Create singleton instance
const api = new API();

// Export for use
window.api = api;

// Migration helper - replace old makeApiRequest calls
window.makeApiRequest = function(path, requireAuth = true) {
    return api.get(path, requireAuth);
};