let analyticsData = null;
let currentTimeRange = '7';
let currentSortBy = 'views';
let chartInstances = {};
let analyticsPageElement = null;

function openAnalyticsPage() {
    console.log('openAnalyticsPage called');
    const feed = DOM.get('feed');
    console.log('Feed element:', feed);

    if (analyticsPageElement && analyticsPageElement.parentNode) {
        analyticsPageElement.remove();
        analyticsPageElement = null;
    }

    console.log('Creating analytics page using VAPR template engine...');

    analyticsPageElement = window.VAPR.createElement('analytics-page');
    analyticsPageElement.innerHTML = createAnalyticsContent();

    const main = document.querySelector('main');
    if (main) {
        main.appendChild(analyticsPageElement);
        window.VAPR.render(analyticsPageElement);

        analyticsPageElement = DOM.get('analytics-page');
        console.log('Analytics page created:', analyticsPageElement);

        if (analyticsPageElement) {
            setupTimeFilters();
            setupSortButton();
            loadAnalyticsData();
        }
    }

    if (analyticsPageElement) {
        console.log('Showing analytics page...');

        if (feed) feed.style.display = 'none';

        const pageContainers = document.querySelectorAll('.page-container');
        pageContainers.forEach(page => {
            if (page.id !== 'analytics-page') {
                page.style.display = 'none';
            }
        });

        analyticsPageElement.style.display = 'flex';
        console.log('Analytics page display set to flex');

        const analyticsBody = analyticsPageElement.querySelector('.analytics-body');
        if (analyticsBody) {
            analyticsBody.scrollTop = 0;
        }

        const currentPath = window.location.pathname;
        if (currentPath !== '/analytics') {
            if (window.history && window.history.pushState) {
                window.history.pushState({page: 'analytics'}, 'Analytics - RSPWN', '/analytics');
            }
        }

        document.title = 'Analytics - RSPWN';

        if (!analyticsData) {
            loadAnalyticsData();
        }
    } else {
        console.error('Failed to create or find analytics page');
    }
}

function closeAnalyticsPage() {
    if (analyticsPageElement && analyticsPageElement.parentNode) {
        analyticsPageElement.remove();
        analyticsPageElement = null;

        Object.values(chartInstances).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        chartInstances = {};
    }

    const feed = DOM.get('feed');
    if (feed) {
        feed.style.display = 'block';
    }

    if (window.history && window.history.pushState) {
        window.history.pushState({page: 'home'}, 'RSPWN', '/');
    }

    document.title = 'RSPWN';
}

function createAnalyticsContent() {
    return `
        <!-- Time Filter -->
        <div class="analytics-time-filter">
            <button class="time-filter-btn active" data-range="7">7 Days</button>
            <button class="time-filter-btn" data-range="30">30 Days</button>
            <button class="time-filter-btn" data-range="90">90 Days</button>
            <button class="time-filter-btn" data-range="all">All Time</button>
        </div>

        <!-- Overview Cards -->
        <div class="analytics-overview">
            <div class="stat-card" id="views-card">
                <div class="stat-header">
                    <span class="stat-label">Total Views</span>
                    <span class="stat-trend" id="views-trend"></span>
                </div>
                <div class="stat-value" id="total-views">0</div>
                <div class="stat-change" id="views-change"></div>
            </div>

            <div class="stat-card" id="engagement-card">
                <div class="stat-header">
                    <span class="stat-label">Engagement Rate</span>
                    <span class="stat-trend" id="engagement-trend"></span>
                </div>
                <div class="stat-value" id="engagement-rate">0%</div>
                <div class="stat-change" id="engagement-change"></div>
            </div>

            <div class="stat-card" id="followers-card">
                <div class="stat-header">
                    <span class="stat-label">Total Followers</span>
                    <span class="stat-trend" id="followers-trend"></span>
                </div>
                <div class="stat-value" id="total-followers">0</div>
                <div class="stat-change" id="followers-change"></div>
            </div>

            <div class="stat-card" id="ctr-card">
                <div class="stat-header">
                    <span class="stat-label">Click Rate</span>
                    <span class="stat-trend" id="ctr-trend"></span>
                </div>
                <div class="stat-value" id="click-rate">0%</div>
                <div class="stat-change" id="ctr-change"></div>
            </div>
        </div>

        <!-- Charts Section -->
        <div class="analytics-charts">
            <div class="chart-container">
                <div class="chart-header">
                    <h2 class="chart-title">Performance Over Time</h2>
                    <div class="chart-legend">
                        <span class="legend-item views">Views</span>
                        <span class="legend-item likes">Likes</span>
                        <span class="legend-item clicks">Clicks</span>
                    </div>
                </div>
                <div class="chart-body">
                    <canvas id="performance-chart"></canvas>
                </div>
            </div>

            <div class="chart-container">
                <div class="chart-header">
                    <h2 class="chart-title">Follower Growth</h2>
                </div>
                <div class="chart-body">
                    <canvas id="follower-chart"></canvas>
                </div>
            </div>
        </div>

        <!-- Top Posts Section -->
        <div class="analytics-posts">
            <div class="posts-header">
                <h2 class="section-title">Top Performing Posts</h2>
                <button class="sort-btn" id="sort-posts">
                    <i class="fa-solid fa-sort"></i>
                    Sort by Views
                </button>
            </div>
            <div class="posts-list" id="top-posts">
                <!-- Posts will be dynamically inserted here -->
            </div>
        </div>

        <!-- Reactions Summary -->
        <div class="analytics-reactions">
            <h2 class="section-title">Reactions Summary</h2>
            <div class="reactions-grid" id="reactions-summary">
                <!-- Reactions will be dynamically inserted here -->
            </div>
        </div>
    `;
}

function setupTimeFilters() {
    const filterButtons = document.querySelectorAll('.time-filter-btn');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentTimeRange = btn.dataset.range;
            await loadAnalyticsData();
        });
    });
}

function setupSortButton() {
    const sortBtn = document.getElementById('sort-posts');
    if (!sortBtn) return;

    sortBtn.addEventListener('click', () => {
        const sortOptions = ['views', 'likes', 'engagement', 'clicks'];
        const currentIndex = sortOptions.indexOf(currentSortBy);
        const nextIndex = (currentIndex + 1) % sortOptions.length;
        currentSortBy = sortOptions[nextIndex];

        const btnText = sortBtn.querySelector('i').nextSibling;
        btnText.textContent = ` Sort by ${currentSortBy.charAt(0).toUpperCase() + currentSortBy.slice(1)}`;

        renderTopPosts();
    });
}

async function loadAnalyticsData() {
    try {
        const response = await fetch(`/api/analytics?range=${currentTimeRange}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (data.success) {
            analyticsData = data;
            renderAnalytics();
        } else {
            console.error('Failed to load analytics data');
        }
    } catch (error) {
        console.error('Analytics error:', error);
    }
}

function renderAnalytics() {
    if (!analyticsData) return;

    renderOverviewCards();
    renderCharts();
    renderTopPosts();
    renderReactionsSummary();
}

function renderOverviewCards() {
    const { totals, comparison } = analyticsData;

    document.getElementById('total-views').textContent = formatNumber(totals.views);

    const engagementRate = totals.views > 0
        ? ((totals.likes + totals.follows) / totals.views * 100).toFixed(1)
        : 0;
    document.getElementById('engagement-rate').textContent = `${engagementRate}%`;

    document.getElementById('total-followers').textContent = formatNumber(totals.followers);

    const ctr = totals.views > 0
        ? (totals.clicks / totals.views * 100).toFixed(1)
        : 0;
    document.getElementById('click-rate').textContent = `${ctr}%`;

    if (comparison) {
        updateTrendIndicator('views', comparison.views);
        updateTrendIndicator('engagement', comparison.likes);
        updateTrendIndicator('followers', comparison.follows);
        updateTrendIndicator('ctr', comparison.views);
    }

    if (totals.newFollowers !== undefined) {
        const followersChange = document.getElementById('followers-change');
        followersChange.textContent = `+${formatNumber(totals.newFollowers)} new`;
        followersChange.className = 'stat-change positive';
    }
}

function updateTrendIndicator(metric, data) {
    const trend = document.getElementById(`${metric}-trend`);
    const change = document.getElementById(`${metric}-change`);

    if (!trend || !data) return;

    const changeValue = parseFloat(data.change);

    if (changeValue > 0) {
        trend.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
        trend.className = 'stat-trend positive';
        if (change) {
            change.textContent = `+${changeValue}% vs last period`;
            change.className = 'stat-change positive';
        }
    } else if (changeValue < 0) {
        trend.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
        trend.className = 'stat-trend negative';
        if (change) {
            change.textContent = `${changeValue}% vs last period`;
            change.className = 'stat-change negative';
        }
    } else {
        trend.innerHTML = '<i class="fa-solid fa-minus"></i>';
        trend.className = 'stat-trend neutral';
        if (change) {
            change.textContent = 'No change';
            change.className = 'stat-change';
        }
    }
}

function renderCharts() {
    const { charts } = analyticsData;
    if (!charts) return;

    if (window.Chart) {
        renderPerformanceChart(charts.timeSeries);
        renderFollowerChart(charts.followerGrowth);
    } else {
        loadChartJS(() => {
            renderPerformanceChart(charts.timeSeries);
            renderFollowerChart(charts.followerGrowth);
        });
    }
}

function loadChartJS(callback) {
    if (window.Chart) {
        callback();
        return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = callback;
    document.head.appendChild(script);
}

function renderPerformanceChart(data) {
    if (!data || data.length === 0) return;

    const ctx = document.getElementById('performance-chart');
    if (!ctx) return;

    if (chartInstances.performance) {
        chartInstances.performance.destroy();
    }

    const labels = data.map(d => formatDate(d.date));

    chartInstances.performance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Views',
                    data: data.map(d => d.views),
                    borderColor: '#4A9EFF',
                    backgroundColor: 'rgba(74, 158, 255, 0.1)',
                    tension: 0.3
                },
                {
                    label: 'Likes',
                    data: data.map(d => d.likes),
                    borderColor: '#2ecc71',
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.3
                },
                {
                    label: 'Clicks',
                    data: data.map(d => d.clicks),
                    borderColor: '#8B5CF6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    titleColor: '#FFFFFF',
                    bodyColor: '#CCCCCC',
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#888888'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#888888'
                    }
                }
            }
        }
    });
}

function renderFollowerChart(data) {
    if (!data || data.length === 0) return;

    const ctx = document.getElementById('follower-chart');
    if (!ctx) return;

    if (chartInstances.followers) {
        chartInstances.followers.destroy();
    }

    const labels = data.map(d => formatDate(d.date));

    chartInstances.followers = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Followers',
                    data: data.map(d => d.followers),
                    borderColor: '#4A9EFF',
                    backgroundColor: 'rgba(74, 158, 255, 0.1)',
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    titleColor: '#FFFFFF',
                    bodyColor: '#CCCCCC',
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    },
                    ticks: {
                        color: '#888888'
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#888888'
                    }
                }
            }
        }
    });
}

function renderTopPosts() {
    const { posts } = analyticsData;
    if (!posts || posts.length === 0) return;

    const sortedPosts = [...posts].sort((a, b) => {
        switch (currentSortBy) {
            case 'views':
                return b.metrics.views - a.metrics.views;
            case 'likes':
                return b.metrics.likes - a.metrics.likes;
            case 'engagement':
                return parseFloat(b.metrics.engagement) - parseFloat(a.metrics.engagement);
            case 'clicks':
                return b.metrics.clicks - a.metrics.clicks;
            default:
                return 0;
        }
    }).slice(0, 10);

    const container = document.getElementById('top-posts');
    if (!container) return;

    container.innerHTML = '';

    sortedPosts.forEach(post => {
        const postItem = window.VAPR.createElement('analytics-post-item', {
            thumbnail: post.media?.[0]?.url || '/assets/placeholder.jpg',
            title: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : ''),
            date: formatDate(post.timestamp)
        });

        postItem.innerHTML = `
            <div class="metric">
                <i class="fa-solid fa-eye"></i>
                <span>${formatNumber(post.metrics.views)}</span>
            </div>
            <div class="metric">
                <i class="fa-solid fa-heart"></i>
                <span>${formatNumber(post.metrics.likes)}</span>
            </div>
            <div class="metric">
                <i class="fa-solid fa-mouse-pointer"></i>
                <span>${formatNumber(post.metrics.clicks)}</span>
            </div>
            <div class="metric">
                <span class="engagement-badge">${post.metrics.engagement}%</span>
            </div>
        `;

        container.appendChild(postItem);
        window.VAPR.render(postItem);
    });
}

function renderReactionsSummary() {
    const { totals } = analyticsData;
    if (!totals || !totals.reactions) return;

    const container = document.getElementById('reactions-summary');
    if (!container) return;

    container.innerHTML = '';

    const sortedReactions = Object.entries(totals.reactions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);

    sortedReactions.forEach(([emoji, count]) => {
        const reactionItem = window.VAPR.createElement('analytics-reaction-item', {
            emoji: emoji,
            count: formatNumber(count)
        });

        container.appendChild(reactionItem);
        window.VAPR.render(reactionItem);
    });
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path === '/analytics') {
        setTimeout(() => {
            openAnalyticsPage();
        }, 100);
    }
});

if (typeof window !== 'undefined') {
    window.openAnalytics = openAnalyticsPage;
    window.openAnalyticsPage = openAnalyticsPage;
    window.closeAnalyticsPage = closeAnalyticsPage;
}