function createAddPostPage(content) {
    return `
    <section id="add-post-page" class="add-post-page-container" style="display:none;">
        <button id="add_post_menu_btn" class="create-post-btn glass_bt" onclick="openMenu()"><i class="fa-solid fa-bars"></i></button>

        <div class="add-post-page-header">
            <div class="add-post-page-header-content">
                <button class="add-post-back-btn" onclick="closeAddPostPage()">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="add-post-title-section">
                    <h1 class="add-post-title">Create New Post</h1>
                    <p class="add-post-subtitle">Share your content with the RSPWN community</p>
                </div>
            </div>
        </div>

        <div class="add-post-page-body">
            <div class="add-post-page-content">
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
                <div class="post-section">
                    <div class="section-header">
                        <i class="fa-solid fa-heading"></i>
                        <span>Post Details</span>
                    </div>

                    <div class="input-group">
                        <label for="title">
                            Title <span class="required">*</span>
                        </label>
                        <input type="text" id="title" name="title" placeholder="Give your post an eye-catching title..." required maxlength="100" class="glass-input">
                        <div class="character-count">
                            <span id="title-count">0</span>/100
                        </div>
                    </div>
                </div>

                <div class="post-section">
                    <div class="section-header">
                        <i class="fa-solid fa-photo-film"></i>
                        <span>Media Content</span>
                    </div>

                    <div class="upload-area" onclick="document.getElementById('file').click()">
                        <div class="upload-placeholder" id="upload-placeholder">
                            <div class="upload-icon">
                                <i class="fa-solid fa-cloud-arrow-up"></i>
                            </div>
                            <h3>Drop your media here or click to browse</h3>
                            <p>Supports: JPG, PNG, GIF, MP4, WEBM • Max 50MB</p>
                        </div>
                        <div class="upload-preview" id="upload-preview" style="display:none;">
                            <img id="preview_img" src="" alt="Preview">
                            <video id="preview_video" src="" controls></video>
                            <div class="preview-overlay">
                                <button type="button" class="change-media-btn glass-button" onclick="document.getElementById('file').click()">
                                    <i class="fa-solid fa-camera"></i> Change Media
                                </button>
                            </div>
                        </div>
                        <input type="file" id="file" name="file" hidden accept="image/*,video/*">
                    </div>
                </div>

                <div class="post-section">
                    <div class="section-header">
                        <i class="fa-solid fa-gamepad"></i>
                        <span>Game Tag</span>
                        <span class="optional">(Optional)</span>
                    </div>

                    <div class="game-tag-selector">
                        <button type="button" class="game-tag-button glass-button" id="game-tag-button" onclick="openGameTagModal()">
                            <i class="fa-solid fa-plus"></i> Select a game
                        </button>
                        <div class="selected-game" id="selected-game" style="display:none;">
                            <img class="selected-game-cover" id="selected-game-cover" src="" alt="">
                            <span class="selected-game-title" id="selected-game-title"></span>
                            <button type="button" class="remove-game-tag glass-close-btn" onclick="removeGameTag()">
                                <i class="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                    <p class="input-hint">Tag a game from RSPWN to let users discover it</p>
                </div>

                <div class="post-section submit-section">
                    <div class="submit-actions">
                        <button type="button" class="cancel-btn glass-button" onclick="closeAddPostPage()">
                            <i class="fa-solid fa-xmark"></i> Cancel
                        </button>
                        <button type="submit" class="submit-btn glass-button primary" id="submit-post-btn" onclick="submitPost(event)">
                            <i class="fa-solid fa-paper-plane"></i>
                            <span>Publish Post</span>
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

        <div id="game-tag-modal" class="glass_modal" style="display:none;">
            <div class="game-tag-modal-container">
                <div class="game-tag-modal-header">
                    <div class="header-content">
                        <div class="header-brand">
                            <div class="header-icon">
                                <i class="fa-solid fa-gamepad"></i>
                            </div>
                            <div class="header-text">
                                <h3>Select a Game</h3>
                                <p>Choose a game to tag with your post</p>
                            </div>
                        </div>
                    </div>
                    <button type="button" class="glass-close-btn" onclick="closeGameTagModal()">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="game-tag-content">
                    <div class="game-tag-search">
                        <input type="text" id="game-tag-search" placeholder="Search games..." class="glass-input" oninput="searchGamesForTag()">
                    </div>
                    <div class="game-tag-list" id="game-tag-list"></div>
                </div>
            </div>
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

        // Reset game tag
        const selectedGame = DOM.get('selected-game');
        const gameTagButton = DOM.get('game-tag-button');
        if (selectedGame && gameTagButton) {
            selectedGame.style.display = 'none';
            gameTagButton.style.display = 'inline-flex';
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