let analyticsData = {
    posts: [],
    fullData: null
};

cardManager.register('analytics-card', {
    onLoad: async () => {
        resetAnalyticsUI();
        await loadAnalyticsData();
    }
});

async function openAnalytics() {
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }

    await cardManager.show('analytics-card');
}

function closeAnalyticsCard() {
    cardManager.hide('analytics-card');
}

function resetAnalyticsUI() {
    const analyticsCard = DOM.get('analytics-card');
    if (analyticsCard) {
        DOM.setText(analyticsCard.querySelector('#total_views'), "0");
        DOM.setText(analyticsCard.querySelector('#total_likes'), "0");
        DOM.setText(analyticsCard.querySelector('#total_followers'), "0");
        DOM.setText(analyticsCard.querySelector('#total_clicks'), "0");
    }
}

async function loadAnalyticsData() {
    try {
        const fallbackData = await api.getMyPosts();
        console.log('Loaded posts data:', fallbackData);

        if (!fallbackData || fallbackData.length === 0) {
            DOM.setHTML("posts_list", '<div style="text-align: center; padding: 20px;">No posts found</div>');
            return;
        }

        analyticsData.posts = fallbackData;

        setTimeout(() => {
            calculateOverviewMetrics();
            populatePostsList();
            setupEventListeners();
        }, 100);
    } catch (error) {
        console.error("Error loading analytics data:", error);
        DOM.setHTML("posts_list", '<div style="text-align: center; padding: 20px; color: #e74c3c;">Failed to load analytics data</div>');
    }
}

function calculateOverviewMetrics() {
    const posts = analyticsData.posts;

    let totalViews = 0;
    let totalLikes = 0;
    let totalDislikes = 0;
    let totalFollows = 0;
    let totalClicks = 0;

    posts.forEach(post => {
        totalViews += post.viewsCount || 0;
        totalLikes += post.likesCount || 0;
        totalDislikes += post.dislikesCount || 0;
        totalFollows += post.followersCount || 0;
        totalClicks += post.linkClicksCount || 0;
    });

    console.log('Total views calculated:', totalViews);

    const analyticsCard = DOM.get('analytics-card');
    if (!analyticsCard) {
        console.error('Analytics card not found!');
        return;
    }

    const elements = {
        views: analyticsCard.querySelector('#total_views'),
        likes: analyticsCard.querySelector('#total_likes'),
        followers: analyticsCard.querySelector('#total_followers'),
        clicks: analyticsCard.querySelector('#total_clicks')
    };

    if (elements.views) animateCounter(elements.views, 0, totalViews, 1000);
    if (elements.likes) animateCounter(elements.likes, 0, totalLikes, 1000);
    if (elements.followers) animateCounter(elements.followers, 0, totalFollows, 1000);
    if (elements.clicks) animateCounter(elements.clicks, 0, totalClicks, 1000);
}

function populatePostsList(sortBy = 'views') {
    const container = DOM.get("posts_list");
    container.innerHTML = '';

    const posts = analyticsData.posts;
    if (!posts || posts.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px;">No posts found</div>';
        return;
    }

    let sortedPosts = [...posts];
    switch(sortBy) {
        case 'views':
            sortedPosts.sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
            break;
        case 'likes':
            sortedPosts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
            break;
        case 'engagement':
            sortedPosts.sort((a, b) => {
                const engA = calculatePostEngagement(a);
                const engB = calculatePostEngagement(b);
                return parseFloat(engB) - parseFloat(engA);
            });
            break;
        case 'recent':
            sortedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            break;
    }

    sortedPosts.forEach((post, index) => {
        const postItem = DOM.create('div', {
            class: 'post-item',
            style: {
                opacity: '0',
                transform: 'translateY(10px)'
            }
        });

        const engagement = calculatePostEngagement(post);

        postItem.innerHTML = `
            <div class="post-item-header">
                <h4 class="post-title">${escapeHtml(post.title)}</h4>
                <span class="post-engagement-badge">${engagement}%</span>
            </div>
            <div class="post-metrics">
                <div class="post-metric">
                    <span class="post-metric-value">${formatNumber(post.viewsCount || 0)}</span>
                    <span class="post-metric-label"><i class="fa-solid fa-eye"></i> Views</span>
                </div>
                <div class="post-metric">
                    <span class="post-metric-value">${formatNumber(post.likesCount || 0)}</span>
                    <span class="post-metric-label"><i class="fa-solid fa-heart"></i> Likes</span>
                </div>
                <div class="post-metric">
                    <span class="post-metric-value">${formatNumber(post.followersCount || 0)}</span>
                    <span class="post-metric-label"><i class="fa-solid fa-user-plus"></i> Follows</span>
                </div>
                <div class="post-metric">
                    <span class="post-metric-value">${formatNumber(post.linkClicksCount || 0)}</span>
                    <span class="post-metric-label"><i class="fa-solid fa-link"></i> Clicks</span>
                </div>
            </div>
            <div class="post-item-footer">
                <span class="post-date">${timeAgo(post.timestamp)}</span>
                <a href="/post/${post.id}" class="view-post-link" target="_blank">
                    View Post <i class="fa-solid fa-external-link-alt"></i>
                </a>
            </div>
        `;

        postItem.onclick = (e) => {
            if (!e.target.classList.contains('view-post-link') && !e.target.parentElement.classList.contains('view-post-link')) {
                window.open(`/post/${post.id}`, '_blank');
            }
        };

        container.appendChild(postItem);

        setTimeout(() => {
            postItem.style.transition = 'all 0.3s ease';
            postItem.style.opacity = '1';
            postItem.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

function calculatePostEngagement(post) {
    const views = post.viewsCount || 0;
    if (views === 0) return 0;

    const likes = post.likesCount || 0;
    const dislikes = post.dislikesCount || 0;
    const follows = post.followersCount || 0;

    const engagements = likes + dislikes + follows;
    return ((engagements / views) * 100).toFixed(1);
}

function setupEventListeners() {
    const sortDropdown = DOM.get('sort_posts');

    if (sortDropdown) {
        const newDropdown = sortDropdown.cloneNode(true);
        sortDropdown.parentNode.replaceChild(newDropdown, sortDropdown);

        newDropdown.addEventListener('change', (e) => {
            populatePostsList(e.target.value);
        });
    }
}

window.closeAnalytics = closeAnalyticsCard;