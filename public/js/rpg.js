function setXPProgress(xp, required_for_next_level) {

    if(!user.xp){
        user.xp = 0;
    }

    if(!user.level){
        user.level = 0;
    }

    const total_xp = user.xp;

    const diff = (xp / required_for_next_level) * 100;
    const new_value = (total_xp / required_for_next_level) * 100;

    const xp_bar_progress_visual = document.getElementById("xp_bar_progress_visual");
    const xp_bar_progress = document.getElementById("xp_bar_progress");
    const notification = document.getElementById('xp-notification');

    xp_bar_progress_visual.style.width = diff + "%";
    xp_bar_progress_visual.style.left = (new_value - diff) + "%";
    notification.style.animation = 'xpNotificationAnimation 1.5s';
    notification.textContent = "+" + xp + "xp";

    setTimeout(() => {
        xp_bar_progress.style.width = new_value + "%";
        xp_bar_progress_visual.style.width = "0%";
        xp_bar_progress_visual.style.left = new_value + "%";
    }, 500);

    setTimeout(() => {
        notification.style.animation = 'none';
    }, 1500);
}