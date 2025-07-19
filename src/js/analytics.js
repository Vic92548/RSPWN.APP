// analytics.js

let analyticsData = {
    posts: [],
    timeRange: 7,
    charts: {
        performance: null,
        reactions: null
    },
    fullData: null
};

// Open analytics modal with data loading
async function openAnalytics() {
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }

    document.getElementById("analytics_modal").style.display = "flex";

    // Reset UI
    resetAnalyticsUI();

    // Load analytics data
    await loadAnalyticsData();
}

// Close analytics modal
function closeAnalytics() {
    document.getElementById("analytics_modal").style.display = "none";

    // Destroy charts to prevent memory leaks
    if (analyticsData.charts.performance) {
        analyticsData.charts.performance.destroy();
        analyticsData.charts.performance = null;
    }
    if (analyticsData.charts.reactions) {
        analyticsData.charts.reactions.destroy();
        analyticsData.charts.reactions = null;
    }
}

// Reset UI to loading state
function resetAnalyticsUI() {
    document.getElementById("total_views").textContent = "Loading...";
    document.getElementById("total_likes").textContent = "Loading...";
    document.getElementById("total_followers").textContent = "Loading...";
    document.getElementById("total_clicks").textContent = "Loading...";
    document.getElementById("engagement_rate").textContent = "0%";
    document.getElementById("ctr_rate").textContent = "0%";
    document.getElementById("posts_table_body").innerHTML = '<tr><td colspan="8" style="text-align: center;">Loading posts...</td></tr>';
}

// Load analytics data from new endpoint
async function loadAnalyticsData() {
    try {
        // Get analytics data from new endpoint
        const data = await makeApiRequest(`/api/analytics?range=${analyticsData.timeRange}`, true);

        if (!data.success) {
            throw new Error(data.error || 'Failed to load analytics');
        }

        analyticsData.fullData = data;
        analyticsData.posts = data.posts;

        // Update overview metrics
        updateOverviewMetrics(data);

        // Populate posts table
        populatePostsTable();

        // Initialize charts with real data
        initializeCharts(data);

        // Setup event listeners
        setupAnalyticsEventListeners();

    } catch (error) {
        console.error("Error loading analytics data:", error);

        // Fallback to old endpoint if new one fails
        try {
            const fallbackData = await makeApiRequest("/me/posts", true);
            analyticsData.posts = fallbackData;
            calculateOverviewMetrics(); // Use old calculation method
            populatePostsTable();
            initializeChartsWithFallback();
            setupAnalyticsEventListeners();
        } catch (fallbackError) {
            document.getElementById("posts_table_body").innerHTML = '<tr><td colspan="8" style="text-align: center; color: #e74c3c;">Failed to load analytics data</td></tr>';
        }
    }
}

// Update overview metrics with real data
function updateOverviewMetrics(data) {
    const totals = data.totals;
    const comparison = data.comparison;

    // Update counts
    document.getElementById("total_views").textContent = formatNumber(totals.views);
    document.getElementById("total_likes").textContent = formatNumber(totals.likes);
    document.getElementById("total_followers").textContent = formatNumber(totals.followers);
    document.getElementById("total_clicks").textContent = formatNumber(totals.clicks);

    // Calculate engagement rate
    const totalEngagements = totals.likes + totals.dislikes + totals.follows;
    const engagementRate = totals.views > 0 ? ((totalEngagements / totals.views) * 100).toFixed(2) : 0;
    document.getElementById("engagement_rate").textContent = engagementRate + "%";
    document.getElementById("engagement_bar").style.width = Math.min(engagementRate, 100) + "%";

    // Calculate CTR
    const ctr = totals.views > 0 ? ((totals.clicks / totals.views) * 100).toFixed(2) : 0;
    document.getElementById("ctr_rate").textContent = ctr + "%";
    document.getElementById("ctr_bar").style.width = Math.min(ctr * 10, 100) + "%"; // Scale for visibility

    // Update change indicators with real comparison data
    if (comparison) {
        updateChangeIndicators(comparison);
    }
}

// Update change indicators with real data
function updateChangeIndicators(comparison) {
    const statChanges = document.querySelectorAll('.stat-change');

    // Map stat changes to their respective metrics
    const changes = {
        0: comparison.views ? comparison.views.change : 0,      // Views
        1: comparison.likes ? comparison.likes.change : 0,      // Likes
        2: comparison.follows ? comparison.follows.change : 0,  // Followers
        3: 0  // Clicks (not in comparison yet, could be added)
    };

    statChanges.forEach((el, index) => {
        const change = parseFloat(changes[index] || 0);
        el.textContent = (change >= 0 ? '+' : '') + change + '%';
        el.className = 'stat-change ' + (change >= 0 ? 'positive' : 'negative');
    });
}

// Fallback to calculate overview metrics from posts data
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

    // Update UI
    document.getElementById("total_views").textContent = formatNumber(totalViews);
    document.getElementById("total_likes").textContent = formatNumber(totalLikes);
    document.getElementById("total_followers").textContent = formatNumber(totalFollows);
    document.getElementById("total_clicks").textContent = formatNumber(totalClicks);

    // Calculate engagement rate
    const totalEngagements = totalLikes + totalDislikes + totalFollows;
    const engagementRate = totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(2) : 0;
    document.getElementById("engagement_rate").textContent = engagementRate + "%";
    document.getElementById("engagement_bar").style.width = Math.min(engagementRate, 100) + "%";

    // Calculate CTR
    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;
    document.getElementById("ctr_rate").textContent = ctr + "%";
    document.getElementById("ctr_bar").style.width = Math.min(ctr * 10, 100) + "%";
}

// Populate posts table
function populatePostsTable(sortBy = 'views') {
    const tbody = document.getElementById("posts_table_body");
    tbody.innerHTML = '';

    const posts = analyticsData.posts;
    if (!posts || posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No posts found</td></tr>';
        return;
    }

    // Sort posts
    let sortedPosts = [...posts];
    switch(sortBy) {
        case 'views':
            sortedPosts.sort((a, b) => {
                const viewsA = a.metrics ? a.metrics.views : (a.viewsCount || 0);
                const viewsB = b.metrics ? b.metrics.views : (b.viewsCount || 0);
                return viewsB - viewsA;
            });
            break;
        case 'likes':
            sortedPosts.sort((a, b) => {
                const likesA = a.metrics ? a.metrics.likes : (a.likesCount || 0);
                const likesB = b.metrics ? b.metrics.likes : (b.likesCount || 0);
                return likesB - likesA;
            });
            break;
        case 'engagement':
            sortedPosts.sort((a, b) => {
                const engA = a.metrics ? parseFloat(a.metrics.engagement) : calculatePostEngagement(a);
                const engB = b.metrics ? parseFloat(b.metrics.engagement) : calculatePostEngagement(b);
                return engB - engA;
            });
            break;
        case 'recent':
            sortedPosts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            break;
    }

    // Populate table
    sortedPosts.forEach(post => {
        const metrics = post.metrics || {
            views: post.viewsCount || 0,
            likes: post.likesCount || 0,
            dislikes: post.dislikesCount || 0,
            follows: post.followersCount || 0,
            clicks: post.linkClicksCount || 0,
            engagement: calculatePostEngagement(post)
        };

        const row = document.createElement('tr');

        row.innerHTML = `
            <td><div class="post-title" title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</div></td>
            <td>${formatNumber(metrics.views)}</td>
            <td>${formatNumber(metrics.likes)}</td>
            <td>${formatNumber(metrics.dislikes)}</td>
            <td>${formatNumber(metrics.follows)}</td>
            <td>${formatNumber(metrics.clicks)}</td>
            <td><span class="engagement-rate">${metrics.engagement}%</span></td>
            <td><a href="/post/${post.id}" class="glass_bt view-post-btn" target="_blank">View</a></td>
        `;

        tbody.appendChild(row);
    });
}

// Calculate post engagement rate
function calculatePostEngagement(post) {
    const views = post.metrics ? post.metrics.views : (post.viewsCount || 0);
    if (views === 0) return 0;

    const likes = post.metrics ? post.metrics.likes : (post.likesCount || 0);
    const dislikes = post.metrics ? post.metrics.dislikes : (post.dislikesCount || 0);
    const follows = post.metrics ? post.metrics.follows : (post.followersCount || 0);

    const engagements = likes + dislikes + follows;
    return ((engagements / views) * 100).toFixed(1);
}

// Initialize charts with real data
function initializeCharts(data) {
    // Destroy existing charts first
    if (analyticsData.charts.performance) {
        analyticsData.charts.performance.destroy();
        analyticsData.charts.performance = null;
    }
    if (analyticsData.charts.reactions) {
        analyticsData.charts.reactions.destroy();
        analyticsData.charts.reactions = null;
    }

    // Performance Chart
    const perfCtx = document.getElementById('performance_chart').getContext('2d');
    const perfData = generatePerformanceData(data.charts.timeSeries);

    analyticsData.charts.performance = new Chart(perfCtx, {
        type: 'line',
        data: perfData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Reactions Chart
    const reactCtx = document.getElementById('reactions_chart').getContext('2d');
    const reactData = generateReactionsData(data.totals.reactions);

    analyticsData.charts.reactions = new Chart(reactCtx, {
        type: 'doughnut',
        data: reactData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

// Initialize charts with fallback data
function initializeChartsWithFallback() {
    // Destroy existing charts first
    if (analyticsData.charts.performance) {
        analyticsData.charts.performance.destroy();
        analyticsData.charts.performance = null;
    }
    if (analyticsData.charts.reactions) {
        analyticsData.charts.reactions.destroy();
        analyticsData.charts.reactions = null;
    }

    // Create empty/minimal charts when API data isn't available
    const perfCtx = document.getElementById('performance_chart').getContext('2d');
    const reactCtx = document.getElementById('reactions_chart').getContext('2d');

    // Simple line chart
    analyticsData.charts.performance = new Chart(perfCtx, {
        type: 'line',
        data: {
            labels: ['No data available'],
            datasets: [{
                label: 'Views',
                data: [0],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Simple doughnut chart
    analyticsData.charts.reactions = new Chart(reactCtx, {
        type: 'doughnut',
        data: {
            labels: ['No reactions data'],
            datasets: [{
                data: [1],
                backgroundColor: ['#95a5a6']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// Generate performance chart data from real time series
function generatePerformanceData(timeSeries) {
    if (!timeSeries || timeSeries.length === 0) {
        return {
            labels: ['No data'],
            datasets: [{
                label: 'Views',
                data: [0],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)'
            }]
        };
    }

    const labels = timeSeries.map(point => {
        const date = new Date(point.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    const viewsData = timeSeries.map(point => point.views);
    const likesData = timeSeries.map(point => point.likes);
    const clicksData = timeSeries.map(point => point.clicks);

    return {
        labels: labels,
        datasets: [
            {
                label: 'Views',
                data: viewsData,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.3
            },
            {
                label: 'Likes',
                data: likesData,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.3
            },
            {
                label: 'Link Clicks',
                data: clicksData,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.3
            }
        ]
    };
}

// Generate reactions chart data from real reactions
function generateReactionsData(reactions) {
    if (!reactions || Object.keys(reactions).length === 0) {
        return {
            labels: ['No reactions yet'],
            datasets: [{
                data: [1],
                backgroundColor: ['#95a5a6']
            }]
        };
    }

    const emojiMap = {
        '❤️': { label: 'Love', color: '#e74c3c' },
        '😂': { label: 'Funny', color: '#f39c12' },
        '👀': { label: 'Wow', color: '#3498db' },
        '💯': { label: 'Perfect', color: '#2ecc71' },
        '💩': { label: 'Bad', color: '#95a5a6' }
    };

    const labels = [];
    const data = [];
    const colors = [];

    Object.entries(reactions).forEach(([emoji, count]) => {
        const info = emojiMap[emoji] || { label: emoji, color: '#7f8c8d' };
        labels.push(`${emoji} ${info.label}`);
        data.push(count);
        colors.push(info.color);
    });

    return {
        labels: labels,
        datasets: [{
            data: data,
            backgroundColor: colors
        }]
    };
}

// Setup event listeners
function setupAnalyticsEventListeners() {
    // Remove existing listeners first to prevent duplicates
    const rangeButtons = document.querySelectorAll('.range-btn');
    const sortDropdown = document.getElementById('sort_posts');

    // Date range buttons
    rangeButtons.forEach(btn => {
        // Clone node to remove all event listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', async (e) => {
            document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const range = e.target.dataset.range;
            analyticsData.timeRange = range === 'all' ? 'all' : parseInt(range);

            // Reload data for the selected range
            resetAnalyticsUI();
            await loadAnalyticsData();
        });
    });

    // Sort dropdown
    if (sortDropdown) {
        // Clone to remove existing listeners
        const newDropdown = sortDropdown.cloneNode(true);
        sortDropdown.parentNode.replaceChild(newDropdown, sortDropdown);

        newDropdown.addEventListener('change', (e) => {
            populatePostsTable(e.target.value);
        });
    }
}

// Utility functions
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

// Export analytics data function
function exportAnalyticsData() {
    const data = {
        overview: {
            totalViews: document.getElementById("total_views").textContent,
            totalLikes: document.getElementById("total_likes").textContent,
            totalFollowers: document.getElementById("total_followers").textContent,
            totalClicks: document.getElementById("total_clicks").textContent,
            engagementRate: document.getElementById("engagement_rate").textContent,
            ctr: document.getElementById("ctr_rate").textContent
        },
        posts: analyticsData.posts,
        timeRange: analyticsData.timeRange,
        fullData: analyticsData.fullData,
        exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vapr-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}