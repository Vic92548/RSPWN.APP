import {addXP, EXPERIENCE_TABLE} from "./rpg.js";


export async function createPost(request, userData) {
    if (!request.headers.get("Content-Type")?.includes("multipart/form-data")) {
        return new Response("Invalid content type", { status: 400 });
    }

    const formData = await request.formData();
    const title = formData.get("title");
    let content = formData.get("content");
    let link = formData.get("link");
    const file = formData.get("file");

    const userId = userData.id;

    if (typeof title !== "string" || typeof userId !== "string") {
        return new Response("Missing or invalid fields", { status: 400 });
    }

    const postId = crypto.randomUUID();

    let fileExtension = "";
    if (file) {
        const parts = file.name.split('.');
        fileExtension = parts.length > 1 ? parts.pop() : ""; // Safely extract the extension if present

        const mediaUrl = file ? await uploadToBunnyCDN(file, postId) : null;

        content = "https://vapr.b-cdn.net/posts/" + postId + "." + fileExtension;
    }



    const kv = await Deno.openKv();
    const post = {
        id: postId,
        title,
        content,
        userId,
        timestamp: Date.now(),
        link,
        views: 0
    };

    if(content){

        const userPosts = await kv.get(["users",userId, "posts"]);

        if(!userPosts.value){
            userPosts.value = [];
        }

        userPosts.value.push({
            id: post.id,
            title,
            timestamp: post.timestamp,
        });

        await Promise.all([
            kv.set(["posts", post.id], post),
            kv.set(["users",userId, "posts"], userPosts.value),
            kv.set(["trend", "posts", post.id], {
                timestamp: Date.now(),
                score: 0
            }),
            addXP(userData, EXPERIENCE_TABLE.POST)
        ]);

        return new Response(JSON.stringify({ id: post.id,user: userData }), {
            status: 201,
            headers: { "Content-Type": "application/json" }
        });
    }else{
        return new Response(JSON.stringify({ error: "Unable to create post, please try again with an other image." }), {
            status: 501,
            headers: { "Content-Type": "application/json" }
        });
    }


}

export async function getPost(id) {
    const kv = await Deno.openKv();
    const postData = await kv.get(["posts",id]);

    if (!postData.value) {
        return new Response("Post not found", { status: 404 });
    }

    const userData = await kv.get(["discordUser",postData.value.userId]);

    postData.value.username = userData.value.username;

    if(!postData.value.views){
        postData.value.views = 0;
    }

    postData.value.views ++;

    await kv.set(["posts", postData.value.id], postData.value);

    return new Response(JSON.stringify(postData.value), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function getPostList(userId) {
    const kv = await Deno.openKv();
    const postList = await kv.get(["users",userId, "posts"]);

    if (!postList.value) {
        return new Response("no post found", { status: 404 });
    }

    return new Response(JSON.stringify(postList.value), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function likePost(id, userData) {
    const kv = await Deno.openKv();
    const postData = await kv.get(["posts",id]);

    if (!postData) {
        return new Response("Post not found", { status: 404 });
    }

    await Promise.all([
        kv.set(["posts_stats", id, "likes", userData.id], Date.now()),
        kv.set(["users_stats", userData.id, "likes", id], Date.now()),
        kv.set(["users_stats", userData.id, "interacted_posts", id], Date.now()),
        addXP(userData, EXPERIENCE_TABLE.LIKE)
    ]);

    return new Response(JSON.stringify({user: userData}), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function dislikePost(id, userData) {
    const kv = await Deno.openKv();
    const postData = await kv.get(["posts",id]);

    if (!postData) {
        return new Response("Post not found", { status: 404 });
    }

    await Promise.all([
        kv.set(["posts_stats", id, "dislikes", userData.id], Date.now()),
        kv.set(["users_stats", userData.id, "dislikes", id], Date.now()),
        kv.set(["users_stats", userData.id, "interacted_posts", id], Date.now()),
        await addXP(userData, EXPERIENCE_TABLE.DISLIKE)
    ]);

    return new Response(JSON.stringify({user: userData}), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function skipPost(id, userData) {
    const kv = await Deno.openKv();
    const postData = await kv.get(["posts",id]);

    if (!postData) {
        return new Response("Post not found", { status: 404 });
    }

    await Promise.all([
        kv.set(["posts_stats", id, "skip", userData.id], Date.now()),
        kv.set(["users_stats", userData.id, "skip", id], Date.now()),
        kv.set(["users_stats", userData.id, "interacted_posts", id], Date.now()),
        await addXP(userData, EXPERIENCE_TABLE.SKIP)
    ]);

    return new Response(JSON.stringify({user: userData}), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

export async function getNextFeedPost(userid) {
    const kv = await Deno.openKv();

    const iter = kv.list({prefix: ["trend", "posts"]});

    const trending_posts = [];
    for await (const res of iter) trending_posts.push(res.key.pop());

    console.log("Trending posts:");
    console.log(trending_posts);

    if(userid === "anonymous"){

        console.log("Sending feed as anonymous");

        const selected_post = trending_posts[Math.floor(Math.random()*trending_posts.length)];

        return getPost(selected_post);
    }else{

        console.log("Like user id " + userid);

        const iter2 = kv.list({prefix: ["users_stats", userid, "interacted_posts"]});

        const interacted_posts = [];
        for await (const res of iter2) interacted_posts.push(res.key.pop());

        console.log("INTERACTED POSTS");
        console.log(interacted_posts);

        let selected_post = trending_posts[Math.floor(Math.random()*trending_posts.length)];

        let retries = 100;

        while(interacted_posts.includes(selected_post)){
            if(retries < 0){
                break;
            }
            selected_post = trending_posts[Math.floor(Math.random()*trending_posts.length)];
            retries--;
        }

        console.log("Selected post:", selected_post);

        return getPost(selected_post);
    }


}

async function uploadToBunnyCDN(file, postId){
    const fileExtension = file.name.split('.').pop();  // Extract the file extension
    const fileName = `${postId}.${fileExtension}`;     // Construct the file name using the post ID and the extension
    const accessKey = Deno.env.get("BUNNY_CDN_ACCESSKEY");
    const storageZoneUrl = Deno.env.get("BUNNY_CDN_STORAGE_URL");

    if (!accessKey || !storageZoneUrl) {
        throw new Error("Bunny CDN configuration is missing from environment variables.");
    }

    const uploadUrl = `${storageZoneUrl}/vapr/posts/${fileName}`;  // Updated to use the new file name with extension

    // Read the file as an ArrayBuffer and convert to a Blob
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });

    const response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "AccessKey": accessKey,
            "Content-Type": "application/octet-stream",  // Setting the content type as required
            "accept": "application/json"
        },
        body: blob  // Send the blob directly as binary data
    });

    if (!response.ok) {
        console.error("Failed to upload media. Response:", await response.text());
        throw new Error("Failed to upload media.");
    }

    const data = await response.json();
    console.log("POST UPLOADED IMAGE");
    console.log(data);
    return data.HttpPath; // Adjust according to Bunny CDN response
}
