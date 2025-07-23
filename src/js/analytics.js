let analyticsData = {
    posts: [],
    timeRange: 7,
    charts: {
        performance: null,
        reactions: null
    },
    fullData: null
};

cardManager.register('analytics-card', {
    onLoad: async () => {
        resetAnalyticsUI();
        await loadAnalyticsData();
    },
    onHide: () => {
        if (analyticsData.charts.performance) {
            analyticsData.charts.performance.destroy();
            analyticsData.charts.performance = null;
        }
        if (analyticsData.charts.reactions) {
            analyticsData.charts.reactions.destroy();
            analyticsData.charts.reactions = null;
        }
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

function showAnalyticsLoading() {
    const loading = document.getElementById("analytics-loading");
    const content = document.querySelector(".analytics-body");

    if (loading) loading.style.display = "block";
    if (content) content.style.opacity = "0.3";
}

function hideAnalyticsLoading() {
    const loading = document.getElementById("analytics-loading");
    const content = document.querySelector(".analytics-body");

    if (loading) loading.style.display = "none";
    if (content) content.style.opacity = "1";
}

function resetAnalyticsUI() {
    document.getElementById("total_views").textContent = "0";
    document.getElementById("total_likes").textContent = "0";
    document.getElementById("total_followers").textContent = "0";
    document.getElementById("total_clicks").textContent = "0";
    document.getElementById("engagement_rate").textContent = "0%";
    document.getElementById("ctr_rate").textContent = "0%";
    document.getElementById("posts_table_body").innerHTML = '<tr><td colspan="8" style="text-align: center;">Loading posts...</td></tr>';
}

async function loadAnalyticsData() {
    try {
        const data = await api.getAnalytics(analyticsData.timeRange);

        if (!data.success) {
            throw new Error(data.error || 'Failed to load analytics');
        }

        analyticsData.fullData = data;
        analyticsData.posts = data.posts;

        updateOverviewMetrics(data);

        populatePostsTable();

        setTimeout(() => {
            initializeCharts(data);
        }, 300);

        setupAnalyticsEventListeners();

    } catch (error) {
        console.error("Error loading analytics data:", error);

        try {
            const fallbackData = await api.getMyPosts();
            analyticsData.posts = fallbackData;
            calculateOverviewMetrics();
            populatePostsTable();
            setTimeout(() => {
                initializeChartsWithFallback();
            }, 300);
            setupAnalyticsEventListeners();
        } catch (fallbackError) {
            document.getElementById("posts_table_body").innerHTML = '<tr><td colspan="8" style="text-align: center; color: #e74c3c;">Failed to load analytics data</td></tr>';
        }
    }
}

function updateOverviewMetrics(data) {
    const totals = data.totals;
    const comparison = data.comparison;

    animateCounter(document.getElementById("total_views"), 0, totals.views, 1000);
    animateCounter(document.getElementById("total_likes"), 0, totals.likes, 1000);
    animateCounter(document.getElementById("total_followers"), 0, totals.followers, 1000);
    animateCounter(document.getElementById("total_clicks"), 0, totals.clicks, 1000);

    const totalEngagements = totals.likes + totals.dislikes + totals.follows;
    const engagementRate = totals.views > 0 ? ((totalEngagements / totals.views) * 100).toFixed(2) : 0;

    setTimeout(() => {
        document.getElementById("engagement_rate").textContent = engagementRate + "%";
        document.getElementById("engagement_bar").style.width = Math.min(engagementRate, 100) + "%";
    }, 500);

    const ctr = totals.views > 0 ? ((totals.clicks / totals.views) * 100).toFixed(2) : 0;

    setTimeout(() => {
        document.getElementById("ctr_rate").textContent = ctr + "%";
        document.getElementById("ctr_bar").style.width = Math.min(ctr * 10, 100) + "%";
    }, 700);

    if (comparison) {
        updateChangeIndicators(comparison);
    }
}

function animateCounter(element, start, end, duration) {
    if (!element) return;

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

function updateChangeIndicators(comparison) {
    const statChanges = document.querySelectorAll('.stat-change');

    const changes = {
        0: comparison.views ? comparison.views.change : 0,
        1: comparison.likes ? comparison.likes.change : 0,
        2: comparison.follows ? comparison.follows.change : 0,
        3: 0
    };

    statChanges.forEach((el, index) => {
        const change = parseFloat(changes[index] || 0);
        setTimeout(() => {
            el.textContent = (change >= 0 ? '+' : '') + change + '%';
            el.className = 'stat-change ' + (change >= 0 ? 'positive' : 'negative');
        }, 1200 + (index * 100));
    });
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

    animateCounter(document.getElementById("total_views"), 0, totalViews, 1000);
    animateCounter(document.getElementById("total_likes"), 0, totalLikes, 1000);
    animateCounter(document.getElementById("total_followers"), 0, totalFollows, 1000);
    animateCounter(document.getElementById("total_clicks"), 0, totalClicks, 1000);

    const totalEngagements = totalLikes + totalDislikes + totalFollows;
    const engagementRate = totalViews > 0 ? ((totalEngagements / totalViews) * 100).toFixed(2) : 0;

    setTimeout(() => {
        document.getElementById("engagement_rate").textContent = engagementRate + "%";
        document.getElementById("engagement_bar").style.width = Math.min(engagementRate, 100) + "%";
    }, 500);

    const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : 0;

    setTimeout(() => {
        document.getElementById("ctr_rate").textContent = ctr + "%";
        document.getElementById("ctr_bar").style.width = Math.min(ctr * 10, 100) + "%";
    }, 700);
}

function populatePostsTable(sortBy = 'views') {
    const tbody = document.getElementById("posts_table_body");
    tbody.innerHTML = '';

    const posts = analyticsData.posts;
    if (!posts || posts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No posts found</td></tr>';
        return;
    }

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

    sortedPosts.forEach((post, index) => {
        const metrics = post.metrics || {
            views: post.viewsCount || 0,
            likes: post.likesCount || 0,
            dislikes: post.dislikesCount || 0,
            follows: post.followersCount || 0,
            clicks: post.linkClicksCount || 0,
            engagement: calculatePostEngagement(post)
        };

        const row = document.createElement('tr');
        row.style.opacity = '0';
        row.style.transform = 'translateY(10px)';

        row.innerHTML = `
            <td><div class="post-title" title="${escapeHtml(post.title)}">${escapeHtml(post.title)}</div></td>
            <td>${formatNumber(metrics.views)}</td>
            <td>${formatNumber(metrics.likes)}</td>
            <td>${formatNumber(metrics.dislikes)}</td>
            <td>${formatNumber(metrics.follows)}</td>
            <td>${formatNumber(metrics.clicks)}</td>
            <td><span class="engagement-rate">${metrics.engagement}%</span></td>
            <td><a href="/post/${post.id}" class="view-post-btn" target="_blank">View</a></td>
        `;

        tbody.appendChild(row);

        setTimeout(() => {
            row.style.transition = 'all 0.3s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

function calculatePostEngagement(post) {
    const views = post.metrics ? post.metrics.views : (post.viewsCount || 0);
    if (views === 0) return 0;

    const likes = post.metrics ? post.metrics.likes : (post.likesCount || 0);
    const dislikes = post.metrics ? post.metrics.dislikes : (post.dislikesCount || 0);
    const follows = post.metrics ? post.metrics.follows : (post.followersCount || 0);

    const engagements = likes + dislikes + follows;
    return ((engagements / views) * 100).toFixed(1);
}

function initializeCharts(data) {
    if (analyticsData.charts.performance) {
        analyticsData.charts.performance.destroy();
        analyticsData.charts.performance = null;
    }
    if (analyticsData.charts.reactions) {
        analyticsData.charts.reactions.destroy();
        analyticsData.charts.reactions = null;
    }

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
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

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
                    position: 'bottom',
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

function initializeChartsWithFallback() {
    if (analyticsData.charts.performance) {
        analyticsData.charts.performance.destroy();
        analyticsData.charts.performance = null;
    }
    if (analyticsData.charts.reactions) {
        analyticsData.charts.reactions.destroy();
        analyticsData.charts.reactions = null;
    }

    const perfCtx = document.getElementById('performance_chart').getContext('2d');
    const reactCtx = document.getElementById('reactions_chart').getContext('2d');

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
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });

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
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)'
                    }
                }
            }
        }
    });
}

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
            backgroundColor: colors,
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1
        }]
    };
}

function setupAnalyticsEventListeners() {
    const rangeButtons = document.querySelectorAll('.range-btn');
    const sortDropdown = document.getElementById('sort_posts');

    rangeButtons.forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', async (e) => {
            document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            const range = e.target.dataset.range;
            analyticsData.timeRange = range === 'all' ? 'all' : parseInt(range);

            showAnalyticsLoading();

            resetAnalyticsUI();
            await loadAnalyticsData();

            hideAnalyticsLoading();
        });
    });

    if (sortDropdown) {
        const newDropdown = sortDropdown.cloneNode(true);
        sortDropdown.parentNode.replaceChild(newDropdown, sortDropdown);

        newDropdown.addEventListener('change', (e) => {
            populatePostsTable(e.target.value);
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

window.closeAnalytics = closeAnalyticsCard;