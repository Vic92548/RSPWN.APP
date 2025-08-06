const uploadArea = DOM.query('.upload-area');
const fileInput = DOM.get('file');

if (uploadArea) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('dragging');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('dragging');
        }, false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            fileInput.files = files;
            handleFileSelect(files[0]);
        }
    }
}

if (fileInput) {
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleFileSelect(this.files[0]);
        }
    });
}

function handleFileSelect(file) {
    const fileType = file.type;
    const placeholder = DOM.get('upload-placeholder');
    const preview = DOM.get('upload-preview');
    const previewImage = DOM.get('preview_img');
    const previewVideo = DOM.get('preview_video');

    if (file.size > 50 * 1024 * 1024) {
        notify.error('File too large', 'Please select a file under 50MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        DOM.hide(placeholder);
        DOM.show(preview);

        if (fileType.startsWith('video/')) {
            previewVideo.src = e.target.result;
            DOM.show(previewVideo);
            DOM.hide(previewImage);
        } else if (fileType.startsWith('image/')) {
            previewImage.src = e.target.result;
            DOM.show(previewImage);
            DOM.hide(previewVideo);
        } else {
            notify.error('Invalid file type', 'Please upload an image or video file');
            DOM.show(placeholder, 'flex');
            DOM.hide(preview);
            return;
        }
    };
    reader.readAsDataURL(file);
}

const titleInput = DOM.get('title');
const titleCount = DOM.get('title-count');

if (titleInput && titleCount) {
    titleInput.addEventListener('input', function() {
        titleCount.textContent = this.value.length;
    });
}

window.submitPost = async function(event) {
    event.preventDefault();

    const submitBtn = DOM.get('submit-post-btn');
    const uploadProgress = DOM.get('upload-progress');
    const progressFill = DOM.get('progress-fill');

    const title = DOM.get('title').value;
    const link = DOM.get('link').value;
    const file = DOM.get('file').files[0];

    if (!file) {
        notify.warning('No media selected', 'Please select an image or video to upload');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Publishing...</span>';

    const formData = new FormData();
    formData.append('title', title);
    formData.append('link', link);

    if (file) {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${new Date().getTime()}.${fileExtension}`;
        const fileContentType = file.type || 'application/octet-stream';
        const blob = new Blob([file], { type: fileContentType });
        formData.append("file", blob, fileName);
    }

    try {
        DOM.show(uploadProgress);

        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
        }, 200);

        const result = await api.createPost(formData);

        clearInterval(progressInterval);
        progressFill.style.width = '100%';

        if (result.success) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            closeAddPostCard();

            DOM.get('title').value = '';
            DOM.get('link').value = '';
            DOM.get('file').value = '';
            DOM.show('upload-placeholder', 'flex');
            DOM.hide('upload-preview');
            const titleCount = DOM.get('title-count');
            if (titleCount) {
                titleCount.textContent = '0';
            }

            notify.success("Post published successfully!");

            if (window.user && result.user) {
                const oldUser = {
                    xp: window.user.xp,
                    level: window.user.level,
                    xp_required: window.user.xp_required
                };

                window.user = result.user;
                setXPProgress(oldUser);
            }

            setTimeout(() => {
                displayPost(result.id);
            }, 500);

        } else {
            throw new Error(result.error || 'Failed to create post');
        }

    } catch (error) {
        console.error('Failed to submit post:', error);

        notify.error('Upload failed', error.message || 'Failed to create post. Please try again.');

    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Publish Post</span>';
        DOM.hide(uploadProgress);
        progressFill.style.width = '0%';
    }
}