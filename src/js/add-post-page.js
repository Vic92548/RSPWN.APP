function createAddPostPage(content) {
    return `
    <section id="add-post-page" class="page-container add-post-page-container" style="display:none;">
        <button id="add_post_menu_btn" class="create-post-btn glass_bt" onclick="openMenu()"><i class="fa-solid fa-bars"></i></button>

        <div class="page-header">
            <div class="page-header-content">
                <div class="page-header-title-section">
                    <h1 class="page-header-title">Create Post</h1>
                    <p class="page-header-subtitle">Share your content with the RSPWN community</p>
                </div>
            </div>
        </div>

        <div class="add-post-body">
            <div class="add-post-content">
                ${content}
            </div>
        </div>
    </section>`;
}

function openAddPostPage() {
    let addPostPage = DOM.get('add-post-page');
    const feed = DOM.get('feed');

    // If add-post page doesn't exist, create it like other pages do
    if (!addPostPage) {
        const addPostContent = createAddPostContent();
        const addPostPageHTML = createAddPostPage(addPostContent);

        // Insert the page into the main element as a sibling to feed
        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('beforeend', addPostPageHTML);
            addPostPage = DOM.get('add-post-page');
        }
    }

    if (addPostPage && feed) {
        // Hide the feed and show add-post page (like other pages do)
        feed.style.display = 'none';
        addPostPage.style.display = 'flex';

        // Scroll to top
        const addPostBody = addPostPage.querySelector('.add-post-page-body');
        if (addPostBody) {
            addPostBody.scrollTop = 0;
        }

        // Update URL without page reload
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'add-post'}, 'Create New Post - RSPWN', '/create');
        }

        // Update page title
        document.title = 'Create New Post - RSPWN';

        // Apply user's background image if they have one
        if (window.user && window.user.backgroundId) {
            equipBackground(window.user.backgroundId, false);
        }

        // Initialize character counter
        setupCharacterCounter();
    }
}

function closeAddPostPage() {
    const addPostPage = DOM.get('add-post-page');
    const feed = DOM.get('feed');

    if (addPostPage && feed) {
        // Hide add-post page and show feed (like other pages do)
        addPostPage.style.display = 'none';
        feed.style.display = 'block';

        // Update URL back to home
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'home'}, 'RSPWN', '/');
        }

        // Update page title
        document.title = 'RSPWN';

        // Clear any form data if needed
        clearAddPostForm();
    }
}

function createAddPostContent() {
    return `
        <div class="add-post-form-container">
            <form id="postForm" class="add-post-form">
                <div class="quick-post-section">
                    <div class="title-input-group">
                        <input type="text" id="title" name="title" placeholder="What's on your mind?" required maxlength="100" class="quick-title-input">
                        <div class="character-count">
                            <span id="title-count">0</span>/100
                        </div>
                    </div>

                    <div class="upload-area" onclick="document.getElementById('file').click()">
                        <div class="upload-placeholder" id="upload-placeholder">
                            <div class="upload-content">
                                <div class="upload-icon">
                                    <i class="fa-solid fa-plus"></i>
                                </div>
                                <span>Add media</span>
                            </div>
                        </div>
                        <div class="upload-preview" id="upload-preview" style="display:none;">
                            <img id="preview_img" src="" alt="Preview">
                            <video id="preview_video" src="" controls></video>
                            <div class="preview-overlay">
                                <button type="button" class="change-media-btn glass-button" onclick="document.getElementById('file').click()">
                                    <i class="fa-solid fa-camera"></i>
                                </button>
                            </div>
                        </div>
                        <input type="file" id="file" name="file" hidden accept="image/*,video/*">
                    </div>

                    <div class="quick-actions">
                        <button type="submit" class="submit-btn glass-button primary" id="submit-post-btn" onclick="submitPost(event)">
                            <i class="fa-solid fa-paper-plane"></i>
                            Post
                        </button>
                    </div>
                </div>

                <div class="upload-progress" id="upload-progress" style="display:none;">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progress-fill"></div>
                    </div>
                    <p class="progress-text">Uploading your content...</p>
                </div>
            </form>
        </div>
    `;
}

function setupCharacterCounter() {
    const titleInput = DOM.get('title');
    const titleCount = DOM.get('title-count');

    if (titleInput && titleCount) {
        titleInput.addEventListener('input', function() {
            titleCount.textContent = this.value.length;
        });
    }
}

function clearAddPostForm() {
    const form = DOM.get('postForm');
    if (form) {
        form.reset();

        // Reset character counter
        const titleCount = DOM.get('title-count');
        if (titleCount) {
            titleCount.textContent = '0';
        }

        // Reset upload preview
        const uploadPreview = DOM.get('upload-preview');
        const uploadPlaceholder = DOM.get('upload-placeholder');
        if (uploadPreview && uploadPlaceholder) {
            uploadPreview.style.display = 'none';
            uploadPlaceholder.style.display = 'flex';
        }
    }
}

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    const path = window.location.pathname;

    if (path === '/create' || path === '/new-post') {
        openAddPostPage();
    } else {
        const addPostPage = DOM.get('add-post-page');
        if (addPostPage && addPostPage.style.display !== 'none') {
            closeAddPostPage();
        }
    }
});

// Handle direct navigation to add-post page
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path === '/create' || path === '/new-post') {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            openAddPostPage();
        }, 100);
    }
});

// Export functions for global access
if (typeof window !== 'undefined') {
    window.openAddPostPage = openAddPostPage;
    window.closeAddPostPage = closeAddPostPage;
    window.clearAddPostForm = clearAddPostForm;
}