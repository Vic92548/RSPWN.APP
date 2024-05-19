function makeImageBig(img) {
    img.classList.remove("normal_image");
    img.classList.add("big_image");
    window.analytics.track('image_zoom_out', { post: current_post });
}

function makeImageNormal(img) {
    img.classList.remove("big_image");
    img.classList.add("normal_image");
    window.analytics.track('image_zoom_in', { post: current_post });
}

function switchImage(img) {
    if(img.classList.contains("big_image")){
        makeImageNormal(img);
    }else{
        makeImageBig(img);
    }
}