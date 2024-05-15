function equipBackground(url, save = true) {
    const saved_background = localStorage.getItem('background_url');
    closeCustomizationMenu();
    hideMenu();

    if(!saved_background){
        localStorage.setItem('background_url', url);
    }else if(saved_background !== url){
        localStorage.setItem('background_url', url);
    }else{
        return;
    }
    document.body.style.backgroundImage = 'url(' + url + ')';

}

function updateBackgroundId(newBackgroundId) {

    window.analytics.track('update_background', {newBackground: background_images[newBackgroundId], newBackgroundId});

    if (!isUserLoggedIn()) {
        alert('You must be logged in to update your background.');
        return;
    }

    const path = `/me/update-background?backgroundId=${encodeURIComponent(newBackgroundId)}`;
    makeApiRequest(path, true)
        .then(response => {
            console.log('Background updated successfully:', response);
            // Optionally refresh user data or UI components if necessary
        })
        .catch(error => {
            console.error('Failed to update background:', error);
            alert('Failed to update background. Please try again.');
        });
}

function openCustomizationMenu() {
    displayBackgroundImages();
    document.getElementById("background_images").style.display = "flex";
}

function closeCustomizationMenu() {
    document.getElementById("background_images").style.display = "none";
}

function displayBackgroundImages() {
    if(isUserLoggedIn()){
        const background_images_container = document.getElementById("background_images_container");
        background_images_container.innerHTML = '';

        for (let i = 0; i < background_images.length; i++) {
            const img = background_images[i];

            if(user.level >= img.unlock){
                background_images_container.innerHTML += '<li class="background_image_div">\n' +
                    '                        <div onclick="updateBackgroundId(\'' + img.id + '\');equipBackground(\'https://vapr.b-cdn.net/background_images/' + img.id + '.webp\')" class="background_image_overlay">\n' +
                    '                            <h5>' + img.title + '</h5>\n' +
                    '                        </div>\n' +
                    '                        <img src="https://vapr.b-cdn.net/background_images/' + img.id + '.webp">\n' +
                    '                    </li>';
            }else{
                background_images_container.innerHTML += '<li class="background_image_div">\n' +
                    '                        <div class="background_image_overlay">\n' +
                    '                            <p><i class="fa-solid fa-lock"></i></p>\n' +
                    '                            <h5>Unlock at level ' + img.unlock + '</h5>\n' +
                    '                        </div>\n' +
                    '                        <img src="https://vapr.b-cdn.net/background_images/' + img.id + '.webp">\n' +
                    '\n' +
                    '                    </li>';
            }
        }
    }else{
        openRegisterModal();
    }

}