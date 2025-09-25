function setXPProgress(old_user, disable_xp_notif = false, force_update = false) {
    if (!user.xp) user.xp = 0;
    if (!user.level) user.level = 0;

    const total_xp = user.xp;
    const xp = Math.min(total_xp - old_user.xp, old_user.xp_required);

    updateLevel();
    updateXPDisplay();

    if (xp > 0 || force_update) {
        const diff = (xp / old_user.xp_required) * 100;
        const new_value = (total_xp / old_user.xp_required) * 100;

        const xp_bar_progress_visual = DOM.get("xp_bar_progress_visual");
        const xp_bar_progress = DOM.get("xp_bar_progress");

        xp_bar_progress_visual.style.width = diff + "%";
        xp_bar_progress_visual.style.left = (new_value - diff) + "%";

        if (!disable_xp_notif) {
            notify.showXP(xp);

            setTimeout(() => {
                if (old_user.level < user.level) {
                    notify.levelUp(user.level);
                    setXPProgress(window.user, true, true);
                }
            }, 1500);
        }

        setTimeout(() => {
            xp_bar_progress.style.width = new_value + "%";
            xp_bar_progress_visual.style.width = "0%";
            xp_bar_progress_visual.style.left = new_value + "%";
        }, 300);
    }
}

function updateLevel() {
    const level_elements = document.getElementsByClassName("xp_level");
    for (let i = 0; i < level_elements.length; i++) {
        level_elements[i].textContent = user.level;
    }

    const xp_level_elements = document.getElementsByClassName("xp-level");
    for (let i = 0; i < xp_level_elements.length; i++) {
        xp_level_elements[i].textContent = user.level;
    }
}

function updateXPDisplay() {
    const username = DOM.query('.xp-username');
    if (username) username.textContent = user.username || 'username';

    const oldUsername = DOM.query('.username');
    if (oldUsername) oldUsername.textContent = user.username || 'username';
}