function drawPost(data){
    displayReactions();

    makeApiRequest("/register-view?postId=" + data.id, false).then(data => {
        console.log(data);
        console.log("Views updated");
    });

    post_seen++;
    showPost();
    console.log("Post DATA:");
    console.log(data);

    updateFollowButton();

    document.getElementById("post_title").textContent = data.title;
    document.getElementById("post_username").textContent = "@" + data.username;
    document.getElementById("post_time").textContent = timeAgo(data.timestamp);

    document.getElementById("post_views").textContent = formatViews(data.views);

    if(!data.content){
        data.content = "https://vapr.b-cdn.net/posts/200w.gif";
    }

    if(data.content.split("/posts/")[0] === "https://vapr.b-cdn.net"){
        document.getElementById("post_image").src = data.content;
        document.getElementById("post_image").style.display = "block";
        document.getElementById("post_content").style.display = "none";
        document.getElementById("post_video").style.display = "none";
    }else if(data.content.includes("iframe.mediadelivery.net")){
        document.getElementById("post_video").style.display = "block";
        setTimeout(() => {
            document.getElementById("post_video").children[0].src = data.content;
        }, 100);
        document.getElementById("post_content").style.display = "none";
        document.getElementById("post_image").style.display = "none";
    }

    document.getElementById("post_image").onclick = function () {
        switchImage(document.getElementById("post_image"));
    }

    const links = document.getElementById("post_link").children;
    for(let i = 0; i < links.length;i++){
        links[i].style.display = "none";
    }


    if(data.link){
        const url = new URL(data.link);

        if(url.hostname.includes("itch.io")){
            setupSocialLink("post_itch", data.link);
        }

        switch(url.hostname){
            case 'discord.gg':
                setupSocialLink("post_discord", data.link);
                break;
            case 'www.reddit.com':
                setupSocialLink("post_reddit", data.link);
                break;
            case 'store.steampowered.com':
                setupSocialLink("post_steam", data.link);
                break;
            case 'x.com':
                setupSocialLink("post_x", data.link);
                break;
            case 'twitter.com':
                setupSocialLink("post_x", data.link);
                break;
            case 'www.threads.net':
                setupSocialLink("post_threads", data.link);
                break;
            case 'www.pinterest.fr':
                setupSocialLink("post_pinterest", data.link);
                break;
            case 'www.twitch.tv':
                setupSocialLink("post_twitch", data.link);
                break;
            case 'www.youtube.com':
                setupSocialLink("post_youtube", data.link);
                break;
            case 'www.instagram.com':
                setupSocialLink("post_instagram", data.link);
                break;
            case 'store.epicgames.com':
                setupSocialLink("post_epic", data.link);
                break;
            case 'www.kickstarter.com':
                setupSocialLink("post_kickstarter", data.link);
                break;
            case 'kick.com':
                setupSocialLink("post_kick", data.link);
                break;
            case 'www.patreon.com':
                setupSocialLink("post_patreon", data.link);
                break;
            case 'www.fortnite.com':
                setupSocialLink("post_fortnite", data.link);
                break;
            default:
                break;
        }
    }
}