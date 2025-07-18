window.analytics = {};

function isOnMainePage(){
    if(document.getElementById("sign_in")){
        return true;
    }

    return false;
}

window.MainPage = isOnMainePage();