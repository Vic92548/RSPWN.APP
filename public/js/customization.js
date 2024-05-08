function equipBackground(url) {
    document.body.style.backgroundImage = 'url(' + url + ')';
}

function openCustomizationMenu() {
    document.getElementById("background_images").style.display = "flex";
}

function closeCustomizationMenu() {
    document.getElementById("background_images").style.display = "none";
}