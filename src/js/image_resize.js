function makeImageBig(img) {
    img.classList.remove("normal_image");
    img.classList.add("big_image");
}

function makeImageNormal(img) {
    img.classList.remove("big_image");
    img.classList.add("normal_image");
}

function switchImage(img) {
    if(img.classList.contains("big_image")){
        makeImageNormal(img);
    }else{
        makeImageBig(img);
    }
}