window.analytics = {};

function isOnMainePage(){
    if(DOM.get("sign_in")){
        return true;
    }

    return false;
}

window.MainPage = isOnMainePage();