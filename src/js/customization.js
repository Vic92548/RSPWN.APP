async function equipBackground(postId, save = true) {
    let imageUrl = null;

    if (window.currentPostId === postId && window.currentPostImageUrl) {
        imageUrl = window.currentPostImageUrl;
    } else {
        imageUrl = await loadBackgroundFromPost(postId);
    }

    if (imageUrl) {
        document.body.style.backgroundImage = 'url(' + imageUrl + ')';

        localStorage.setItem('background_url', imageUrl);
        localStorage.setItem('background_id', postId);

        if (save && isUserLoggedIn() && navigator.onLine) {
            api.updateBackground(postId)
                .then(response => {
                    console.log('Background synced successfully:', response);
                    if (window.user) {
                        window.user.backgroundId = postId;
                    }
                })
                .catch(error => {
                    console.error('Failed to sync background:', error);
                });
        }
    }
}

async function loadBackgroundFromPost(postId) {
    try {
        const post = await api.resolvePost(postId);
        if (post && post.media) {
            document.body.style.backgroundImage = 'url(' + post.media + ')';
            return post.media;
        }
    } catch (error) {
        console.error('Failed to load background from post:', error);
    }
    return null;
}

function setDefaultBackground() {
    const defaultBgUrl = "2133e675-b741-4da0-9bd9-d519bfb72e1e";
    equipBackground(defaultBgUrl, true);
}