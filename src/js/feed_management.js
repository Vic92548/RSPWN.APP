// src/js/feed_management.js

let selectedFeeds = [];
let userFeeds = [];

// Initialize feed system
async function initFeedSystem() {
    if (!isUserLoggedIn()) return;

    // Load user's feeds
    await loadUserFeeds();

    // Add feed selection to post form
    setupFeedSelection();
}

// Load user's feeds
async function loadUserFeeds() {
    try {
        const response = await makeApiRequest('/feeds/mine', true);
        userFeeds = response;

        // Update menu with feed count
        updateFeedCount();
    } catch (error) {
        console.error('Error loading user feeds:', error);
    }
}

// Setup feed selection in post creation
function setupFeedSelection() {
    // Add hidden input to form
    const postForm = document.getElementById('postForm');
    if (postForm && !document.getElementById('selectedFeedsInput')) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.id = 'selectedFeedsInput';
        input.name = 'selectedFeeds';
        postForm.appendChild(input);
    }
}

// Open feed selector modal
function openFeedSelector() {
    document.getElementById('feed_selector_modal').style.display = 'flex';
    renderUserFeeds();
}

// Close feed selector modal
function closeFeedSelector() {
    document.getElementById('feed_selector_modal').style.display = 'none';
}

// Render user's feeds in selector
function renderUserFeeds() {
    const container = document.getElementById('user-feeds-list');

    if (userFeeds.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>You haven't joined any feeds yet.</p>
                <button class="glass_bt" onclick="openFeedDiscovery()">
                    <i class="fa-solid fa-compass"></i> Discover Feeds
                </button>
                <button class="glass_bt" onclick="openCreateFeedModal()">
                    <i class="fa-solid fa-plus"></i> Create Feed
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = userFeeds.map(feed => `
        <div class="feed-item ${selectedFeeds.includes(feed.id) ? 'selected' : ''}" 
             onclick="toggleFeedSelection('${feed.id}')"
             data-feed-id="${feed.id}">
            <div class="feed-icon-wrapper">${feed.icon}</div>
            <div class="feed-info">
                <h4>${escapeHtml(feed.name)}</h4>
                <p>${escapeHtml(feed.description || 'No description')}</p>
                <div class="feed-stats">
                    <span><i class="fa-solid fa-users"></i> ${feed.memberCount}</span>
                    <span><i class="fa-solid fa-file"></i> ${feed.postCount}</span>
                    <span><i class="fa-solid ${feed.isPrivate ? 'fa-lock' : 'fa-globe'}"></i> ${feed.isPrivate ? 'Private' : 'Public'}</span>
                </div>
            </div>
            ${feed.membership.canPost ? '' : '<span class="no-post-badge">Cannot Post</span>'}
        </div>
    `).join('');
}

// Toggle feed selection
function toggleFeedSelection(feedId) {
    const feed = userFeeds.find(f => f.id === feedId);
    if (!feed || !feed.membership.canPost) return;

    const index = selectedFeeds.indexOf(feedId);
    if (index > -1) {
        selectedFeeds.splice(index, 1);
    } else {
        selectedFeeds.push(feedId);
    }

    // Update UI
    const feedElement = document.querySelector(`[data-feed-id="${feedId}"]`);
    if (feedElement) {
        feedElement.classList.toggle('selected');
    }

    updateSelectedFeedsDisplay();
}

// Update selected feeds display
function updateSelectedFeedsDisplay() {
    const container = document.getElementById('selected-feeds');

    if (selectedFeeds.length === 0) {
        container.innerHTML = '<span class="no-feeds-selected">No feeds selected (will post to general feed)</span>';
        return;
    }

    const selectedFeedObjects = userFeeds.filter(f => selectedFeeds.includes(f.id));

    container.innerHTML = selectedFeedObjects.map(feed => `
        <span class="feed-chip">
            <span>${feed.icon}</span>
            <span>${escapeHtml(feed.name)}</span>
            <i class="fa-solid fa-xmark remove-btn" onclick="removeFeedFromSelection('${feed.id}')"></i>
        </span>
    `).join('');
}

// Remove feed from selection
function removeFeedFromSelection(feedId) {
    selectedFeeds = selectedFeeds.filter(id => id !== feedId);
    updateSelectedFeedsDisplay();

    // Update modal if open
    const feedElement = document.querySelector(`[data-feed-id="${feedId}"]`);
    if (feedElement) {
        feedElement.classList.remove('selected');
    }
}

// Confirm feed selection
function confirmFeedSelection() {
    // Update hidden input
    const input = document.getElementById('selectedFeedsInput');
    if (input) {
        input.value = JSON.stringify(selectedFeeds);
    }

    closeFeedSelector();
}

// Create new feed
async function createFeed() {
    const form = document.getElementById('createFeedForm');
    const formData = new FormData(form);

    const feedData = {
        name: formData.get('name'),
        description: formData.get('description'),
        icon: formData.get('icon') || '🌐',
        isPrivate: formData.get('isPrivate') === 'on',
        tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t)
    };

    try {
        const response = await fetch('/feeds', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            },
            body: JSON.stringify(feedData)
        });

        const result = await response.json();

        if (result.success) {
            // Show success message
            showToast('Feed created successfully!', 'success');

            // Reload user feeds
            await loadUserFeeds();

            // Close modal
            closeCreateFeedModal();

            // Clear form
            form.reset();

            // Auto-select the new feed
            selectedFeeds.push(result.feed.id);
            updateSelectedFeedsDisplay();
        } else {
            showToast(result.error || 'Failed to create feed', 'error');
        }
    } catch (error) {
        console.error('Error creating feed:', error);
        showToast('Error creating feed', 'error');
    }
}

// Open create feed modal
function openCreateFeedModal() {
    document.getElementById('create_feed_modal').style.display = 'flex';
}

// Close create feed modal
function closeCreateFeedModal() {
    document.getElementById('create_feed_modal').style.display = 'none';
}

// Open feed discovery
function openFeedDiscovery() {
    document.getElementById('feed_discovery_modal').style.display = 'flex';
    loadPublicFeeds();
}

// Close feed discovery
function closeFeedDiscovery() {
    document.getElementById('feed_discovery_modal').style.display = 'none';
}

// Load public feeds
async function loadPublicFeeds(type = 'popular') {
    const container = document.getElementById('discovered-feeds');
    container.innerHTML = '<div class="loading">Loading feeds...</div>';

    try {
        const response = await makeApiRequest('/feeds/public?limit=20', false);

        container.innerHTML = response.map(feed => `
            <div class="discover-feed-card" onclick="viewFeedDetails('${feed.id}')">
                <div class="discover-feed-icon">${feed.icon}</div>
                <h4>${escapeHtml(feed.name)}</h4>
                <p>${escapeHtml(feed.description || '')}</p>
                <div class="member-count">
                    <i class="fa-solid fa-users"></i> ${feed.memberCount} members
                </div>
                <button class="join-btn" onclick="event.stopPropagation(); joinFeed('${feed.id}')">
                    <i class="fa-solid fa-plus"></i> Join
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading public feeds:', error);
        container.innerHTML = '<p>Error loading feeds</p>';
    }
}

// Join a feed
async function joinFeed(feedId) {
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }

    try {
        const response = await fetch(`/feeds/${feedId}/join`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('jwt')}`
            }
        });

        const result = await response.json();

        if (result.success) {
            showToast('Successfully joined feed!', 'success');

            // Reload user feeds
            await loadUserFeeds();

            // Update UI
            const joinBtn = event.target;
            joinBtn.textContent = 'Joined';
            joinBtn.disabled = true;
            joinBtn.classList.add('joined');
        } else {
            showToast(result.error || 'Failed to join feed', 'error');
        }
    } catch (error) {
        console.error('Error joining feed:', error);
        showToast('Error joining feed', 'error');
    }
}

// Update post display to show feeds
function enhancePostDisplay() {
    const originalDrawPost = window.drawPost;

    window.drawPost = function(data) {
        // Call original function
        originalDrawPost(data);

        // Add feed badges if present
        if (data.feeds && data.feeds.length > 0) {
            const postHeader = document.querySelector('.post-header');
            const feedBadges = document.createElement('div');
            feedBadges.className = 'post-feed-badges';

            feedBadges.innerHTML = data.feeds.map(feed => `
                <span class="feed-badge">
                    <span class="feed-icon">${feed.icon}</span>
                    <span class="feed-name">${escapeHtml(feed.name)}</span>
                </span>
            `).join('');

            postHeader.appendChild(feedBadges);
        }
    };
}

// Search feeds
async function searchPublicFeeds() {
    const query = document.getElementById('discovery-search-input').value;

    if (!query) {
        loadPublicFeeds();
        return;
    }

    const container = document.getElementById('discovered-feeds');
    container.innerHTML = '<div class="loading">Searching...</div>';

    try {
        const response = await makeApiRequest(`/feeds/search?q=${encodeURIComponent(query)}`, false);

        if (response.length === 0) {
            container.innerHTML = '<p>No feeds found</p>';
            return;
        }

        container.innerHTML = response.map(feed => `
            <div class="discover-feed-card" onclick="viewFeedDetails('${feed.id}')">
                <div class="discover-feed-icon">${feed.icon}</div>
                <h4>${escapeHtml(feed.name)}</h4>
                <p>${escapeHtml(feed.description || '')}</p>
                <div class="member-count">
                    <i class="fa-solid fa-users"></i> ${feed.memberCount} members
                </div>
                <button class="join-btn" onclick="event.stopPropagation(); joinFeed('${feed.id}')">
                    <i class="fa-solid fa-plus"></i> Join
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error searching feeds:', error);
        container.innerHTML = '<p>Error searching feeds</p>';
    }
}

// Helper to show toast notifications
function showToast(message, type = 'info') {
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            }
        });
        Toast.fire({
            icon: type,
            title: message
        });
    } else {
        alert(message);
    }
}

// Initialize feed system when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (MainPage) {
            initFeedSystem();
            enhancePostDisplay();
        }
    });

    // Setup create feed form
    const createFeedForm = document.getElementById('createFeedForm');
    if (createFeedForm) {
        createFeedForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await createFeed();
        });
    }
}

// Update feed count in menu
function updateFeedCount() {
    // You can add a feed count display in the menu if desired
    const feedCountEl = document.getElementById('feed_count');
    if (feedCountEl) {
        feedCountEl.textContent = userFeeds.length;
    }
}