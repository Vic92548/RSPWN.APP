if(MainPage){
    // Enhanced file upload with drag and drop
    const uploadArea = document.querySelector('.upload-area');
    const fileInput = document.getElementById('file');

    // Drag and drop functionality
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

    // File input change handler
    fileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleFileSelect(this.files[0]);
        }
    });

    function handleFileSelect(file) {
        const fileType = file.type;
        const placeholder = document.getElementById('upload-placeholder');
        const preview = document.getElementById('upload-preview');
        const previewImage = document.getElementById('preview_img');
        const previewVideo = document.getElementById('preview_video');

        // Validate file size
        if (file.size > 50 * 1024 * 1024) {
            Swal.fire({
                icon: 'error',
                title: 'File too large',
                text: 'Please select a file under 50MB'
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            placeholder.style.display = 'none';
            preview.style.display = 'block';

            if (fileType.startsWith('video/')) {
                previewVideo.src = e.target.result;
                previewVideo.style.display = 'block';
                previewImage.style.display = 'none';
            } else if (fileType.startsWith('image/')) {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
                previewVideo.style.display = 'none';
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid file type',
                    text: 'Please upload an image or video file'
                });
                placeholder.style.display = 'flex';
                preview.style.display = 'none';
                return;
            }
        };
        reader.readAsDataURL(file);
    }

    // Character counter
    const titleInput = document.getElementById('title');
    const titleCount = document.getElementById('title-count');

    if (titleInput && titleCount) {
        titleInput.addEventListener('input', function() {
            titleCount.textContent = this.value.length;
        });
    }

    // Enhanced form submission
    document.getElementById('postForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const submitBtn = document.getElementById('submit-post-btn');
        const uploadProgress = document.getElementById('upload-progress');
        const progressFill = document.getElementById('progress-fill');

        const title = document.getElementById('title').value;
        const link = document.getElementById('link').value;
        const file = document.getElementById('file').files[0];

        if (!file) {
            Swal.fire({
                icon: 'warning',
                title: 'No media selected',
                text: 'Please select an image or video to upload'
            });
            return;
        }

        // Disable submit button
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

        const jwt = localStorage.getItem('jwt');
        const headers = new Headers({
            "Authorization": `Bearer ${jwt}`
        });

        try {
            // Show progress bar
            uploadProgress.style.display = 'block';

            // Simulate progress (since we can't track actual upload progress with fetch)
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress > 90) progress = 90;
                progressFill.style.width = progress + '%';
            }, 200);

            const response = await fetch('/posts', {
                method: 'POST',
                body: formData,
                headers: headers
            });

            clearInterval(progressInterval);
            progressFill.style.width = '100%';

            const result = await response.json();

            if (response.ok && result.success) {
                // Success animation
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });

                // Close the add post card
                closeAddPostCard();

                // Reset form
                document.getElementById('title').value = '';
                document.getElementById('link').value = '';
                document.getElementById('file').value = '';
                document.getElementById('upload-placeholder').style.display = 'flex';
                document.getElementById('upload-preview').style.display = 'none';
                titleCount.textContent = '0';

                // Show success notification
                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });

                Toast.fire({
                    icon: "success",
                    title: "Post published successfully!"
                });

                // Update XP
                const oldUser = {
                    xp: window.user.xp,
                    level: window.user.level,
                    xp_required: window.user.xp_required
                };

                window.user = result.user;
                setXPProgress(oldUser);

                // Display the new post
                setTimeout(() => {
                    displayPost(result.id);
                }, 500);

            } else {
                throw new Error(result.error || 'Failed to create post');
            }

        } catch (error) {
            console.error('Failed to submit post:', error);

            Swal.fire({
                icon: 'error',
                title: 'Upload failed',
                text: error.message || 'Failed to create post. Please try again.'
            });

        } finally {
            // Reset button and hide progress
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Publish Post</span>';
            uploadProgress.style.display = 'none';
            progressFill.style.width = '0%';
        }
    });
}