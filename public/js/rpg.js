function setXPProgress(old_user, disable_xp_notif = false) {

    if(!user.xp){
        user.xp = 0;
    }

    if(!user.level){
        user.level = 0;
    }

    const total_xp = user.xp;
    const xp = total_xp - old_user.xp;

    updateLevel();

    if(xp > 0){
        const diff = (xp / old_user.xp_required) * 100;
        const new_value = (total_xp / old_user.xp_required) * 100;

        const xp_bar_progress_visual = document.getElementById("xp_bar_progress_visual");
        const xp_bar_progress = document.getElementById("xp_bar_progress");
        const notification = document.getElementById('xp-notification');

        xp_bar_progress_visual.style.width = diff + "%";
        xp_bar_progress_visual.style.left = (new_value - diff) + "%";

        if(!disable_xp_notif){
            notification.style.animation = 'xpNotificationAnimation 1.5s';
            notification.textContent = "+" + xp + "xp";

            setTimeout(() => {
                notification.style.animation = 'none';
            }, 1500);
        }

        setTimeout(() => {
            xp_bar_progress.style.width = new_value + "%";
            xp_bar_progress_visual.style.width = "0%";
            xp_bar_progress_visual.style.left = new_value + "%";
        }, 500);


    }
}

function updateLevel() {
    const level_elements = document.getElementsByClassName("xp_level");
    for (let i = 0; i < level_elements.length; i++) {
        level_elements[i].textContent = user.level;
    }
}