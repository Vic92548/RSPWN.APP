function setXPProgress(new_value, diff) {
    const xp_bar_progress_visual = document.getElementById("xp_bar_progress_visual");
    const xp_bar_progress = document.getElementById("xp_bar_progress");

    xp_bar_progress_visual.style.width = diff + "%";
    xp_bar_progress_visual.style.left = (new_value - diff) + "%";

    setTimeout(() => {
        xp_bar_progress.style.width = new_value + "%";
        xp_bar_progress_visual.style.width = "0%";
        xp_bar_progress_visual.style.left = new_value + "%";
    }, 500);
}