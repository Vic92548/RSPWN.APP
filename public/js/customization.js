function equipBackground(url) {
    document.body.style.backgroundImage = 'url(' + url + ')';
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
                    '                        <div onclick="equipBackground(\'https://vapr.b-cdn.net/background_images/' + img.id + '.webp\')" class="background_image_overlay">\n' +
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