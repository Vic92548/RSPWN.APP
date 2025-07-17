async function openLeaderboardModal() {
    if(!isUserLoggedIn()){
        openRegisterModal();
        return;
    }
    const modal = document.getElementById("leaderboard_modal");
    const xpTodayEl = document.getElementById("xp_today");
    const listEl = document.getElementById("leaderboard_list");

    modal.style.display = "flex";
    xpTodayEl.innerHTML = "Loading...";
    listEl.innerHTML = "";

    const jwt = localStorage.getItem("jwt");
    if (!jwt) {
        xpTodayEl.innerHTML = "You must be logged in to view the leaderboard.";
        return;
    }

    const headers = new Headers({
        "Authorization": `Bearer ${jwt}`
    });

    try {
        const [xpRes, leaderboardRes] = await Promise.all([
            fetch("/api/xp-today", { headers }),
            fetch("/api/leaderboard", { headers })
        ]);

        if (!xpRes.ok || !leaderboardRes.ok) {
            throw new Error("Unauthorized or failed request");
        }

        const xpData = await xpRes.json();
        const leaderboard = await leaderboardRes.json();

        xpTodayEl.innerHTML = `You earned <span style="color:#27ae60;">+${xpData.xp}</span> XP today.`;

        leaderboard.forEach((entry, index) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>#${index + 1} @${entry.username}</strong> 
                (Lvl ${entry.level}) — 
                <span style="color:#2ecc71;">+${entry.ownXp}</span> own XP + 
                <span style="color:#3498db;">+${entry.inviteesXp}</span> from invites 
                = <b>${entry.score}</b> total
            `;
            listEl.appendChild(li);
        });


    } catch (err) {
        xpTodayEl.innerHTML = "Failed to load leaderboard. Are you logged in?";
        console.warn("Leaderboard load error:", err);
    }
}
