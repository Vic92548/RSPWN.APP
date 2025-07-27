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
    const analyticsCard = document.getElementById('analytics-card');
    if (analyticsCard) {
        analyticsCard.querySelector('#total_views').textContent = "0";
        analyticsCard.querySelector('#total_likes').textContent = "0";
        analyticsCard.querySelector('#total_followers').textContent = "0";
        analyticsCard.querySelector('#total_clicks').textContent = "0";
    }
    document.getElementById("engagement_rate").textContent = "0%";
    document.getElementById("ctr_rate").textContent = "0%";
    document.getElementById("posts_list").innerHTML = '<div style="text-align: center; padding: 20px;">Loading posts...</div>';
}

async function loadAnalyticsData() {
    try {
        const fallbackData = await api.getMyPosts();
        console.log('Loaded posts data:', fallbackData);

        if (!fallbackData || fallbackData.length === 0) {
            document.getElementById("posts_list").innerHTML = '<div style="text-align: center; padding: 20px;">No posts found</div>';
            return;
        }

        analyticsData.posts = fallbackData;

        // Wait for DOM to be ready
        setTimeout(() => {
            calculateOverviewMetrics();
            populatePostsList();
            setupEventListeners();
        }, 100);
    } catch (error) {
        console.error("Error loading analytics data:", error);
        document.getElementById("posts_list").innerHTML = '<div style="text-align: center; padding: 20px; color: #e74c3c;">Failed to load analytics data</div>';
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

    // Be more specific - look for elements inside the analytics card
    const analyticsCard = document.getElementById('analytics-card');
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

    // Animate the counters
    if (elements.views) animateCounter(elements.views, 0, totalViews, 1000);
    if (elements.likes) animateCounter(elements.likes, 0, totalLikes, 1000);
    if (elements.followers) animateCounter(elements.followers, 0, totalFollows, 1000);
    if (elements.clicks) animateCounter(elements.clicks, 0, totalClicks, 1000);

    const totalEngagements = totalLikes + totalDislikes + totalFollows;
    const engagementRate = totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(2) : 0;

    setTimeout(() => {
        document.getElementById("engagement_rate").textContent = engagementRate + "%";
        document.getElementById("engagement_bar").style.width = Math.min(engagementRate, 100) + "%";
    }, 500);

    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;

    setTimeout(() => {
        document.getElementById("ctr_rate").textContent = ctr + "%";
    }, 700);

    document.getElementById("reaction_pills").innerHTML = '<span style="font-size: 12px; color: rgba(255, 255, 255, 0.5);">No reactions data available</span>';
}

function animateCounter(element, start, end, duration) {
    if (!element) {
        console.error('Element not found for counter animation');
        return;
    }

    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOutQuart = 1 - Math.pow(1 - progress, 4);

        const currentValue = Math.floor(start + (end - start) * easeOutQuart);

        element.textContent = formatNumber(currentValue);

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }

    requestAnimationFrame(updateCounter);
}

function populatePostsList(sortBy = 'views') {
    const container = document.getElementById("posts_list");
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
        const postItem = document.createElement('div');
        postItem.className = 'post-item';
        postItem.style.opacity = '0';
        postItem.style.transform = 'translateY(10px)';

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
    const sortDropdown = document.getElementById('sort_posts');

    if (sortDropdown) {
        const newDropdown = sortDropdown.cloneNode(true);
        sortDropdown.parentNode.replaceChild(newDropdown, sortDropdown);

        newDropdown.addEventListener('change', (e) => {
            populatePostsList(e.target.value);
        });
    }
}

function formatNumber(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
    if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
    return (num / 1000000000).toFixed(1) + 'B';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function timeAgo(dateParam) {
    if (!dateParam) return null;

    const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
    const today = new Date();
    const seconds = Math.round((today - date) / 1000);
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30.4);
    const years = Math.round(days / 365);

    if (seconds < 60) {
        return `${seconds}s ago`;
    } else if (minutes < 60) {
        return `${minutes}m ago`;
    } else if (hours < 24) {
        return `${hours}h ago`;
    } else if (days < 30) {
        return `${days}d ago`;
    } else if (months < 12) {
        return `${months}mo ago`;
    } else {
        return `${years}y ago`;
    }
}

window.closeAnalytics = closeAnalyticsCard;