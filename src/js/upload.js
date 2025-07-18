if(MainPage){
    document.getElementById('file').addEventListener('change', function() {
        if (this.files && this.files[0]) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var fileType = this.files[0].type;
                var previewImage = document.getElementById('preview_img');
                var previewVideo = document.getElementById('preview_video');

                if (fileType.startsWith('video/')) {
                    previewVideo.src = e.target.result;
                    previewVideo.style.display = "block";
                    previewVideo.controls = true;
                    previewImage.style.display = "none";
                    document.querySelector('.upload-text').textContent = 'Click to replace the video';
                } else if (fileType.startsWith('image/')) {
                    previewImage.src = e.target.result;
                    previewImage.style.display = "block";
                    previewVideo.style.display = "none";
                    document.querySelector('.upload-text').textContent = 'Click to replace the image';
                } else {
                    alert('Unsupported file type. Please upload an image or video.');
                    return;
                }

                document.getElementById('upload-icon').hidden = true;
            }.bind(this);
            reader.readAsDataURL(this.files[0]);
        }
    });

    document.getElementById('postForm').addEventListener('submit', async function(event) {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const link = document.getElementById('link').value;
        const file = document.getElementById('file').files[0];

        const formData = new FormData();
        formData.append('title', title);
        formData.append('link', link);

        if (file) {
            const fileExtension = file.name.split('.').pop(); // Extract the file extension
            const fileName = `${new Date().getTime()}.${fileExtension}`; // Create a unique file name using a timestamp
            const fileContentType = file.type || 'application/octet-stream'; // Default to a binary type if unknown

            // Create a new Blob from the file with the specified content type
            const blob = new Blob([file], { type: fileContentType });

            // Append the blob to formData with the custom filename
            formData.append("file", blob, fileName);
        }

        const jwt = localStorage.getItem('jwt');

        // Prepare the request headers
        const headers = new Headers({
            "Authorization": `Bearer ${jwt}`
        });

        try {
            document.getElementById("add-post").style.display = "none";
            hidePost();
            hideMenu();

            const response = await fetch('/posts', {
                method: 'POST',
                body: formData,
                headers: headers
            });

            const result = await response.json();
            if (response.ok) {
                if(result.success){

                    document.getElementById("add-post").style.display = "none";
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                    displayPost(result.id);

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
                        icon: "success",
                        title: "Post created successfully!"
                    });
                    // Optionally clear the form or handle according to your needs

                    // Clear post
                    document.getElementById('title').value = '';
                    document.getElementById('file').value = '';
                    document.getElementById('link').value = '';
                    document.getElementById('preview_img').style.display = 'none';
                    document.getElementById('preview_video').style.display = 'none';
                    document.querySelector('.upload-text').textContent = 'Click to upload an image';

                    const oldUser = {
                        xp: window.user.xp,
                        level: window.user.level,
                        xp_required: window.user.xp_required
                    };

                    window.user = result.user;

                    setXPProgress(oldUser);
                } else {
                    Swal.fire({
                        title: "Error submitting your post :/",
                        text: result.msg,
                        icon: "error"
                    });
                }
            } else {
                alert('Failed to create post. Please try again with another image.');
                displayPost();
            }
        } catch (error) {
            console.error('Failed to submit post:', error);
            alert('Error submitting post.');
        }
    });

}