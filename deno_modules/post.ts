interface Post {
    id: string;
    title: string;
    content: string;
    userId: string;
    timestamp: number;
    likes: string[];
    dislikes: string[];
    neutral: string[];
    comments: string[];
}

export async function createPost(request: Request, userData): Promise<Response> {
    if (!request.headers.get("Content-Type")?.includes("multipart/form-data")) {
        return new Response("Invalid content type", { status: 400 });
    }

    const formData = await request.formData();
    const title = formData.get("title");
    let content = formData.get("content");
    const file = formData.get("file") as File;

    const userId = userData.id;

    if (typeof title !== "string" || typeof content !== "string" || typeof userId !== "string") {
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
    const post: Post = {
        id: postId,
        title,
        content,
        userId,
        timestamp: Date.now(),
        likes: [],
        dislikes: [],
        neutral: [],
        comments: []
    };

    await kv.set(["posts", post.id], post);

    return new Response(JSON.stringify({ id: post.id }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
}

export async function getPost(id: string): Promise<Response> {
    const kv = await Deno.openKv();
    const postData = await kv.get(["posts",id]);

    if (!postData) {
        return new Response("Post not found", { status: 404 });
    }

    const userData = await kv.get(["discordUser",postData.value.userId]);
    postData.value.username = userData.value.username;

    return new Response(JSON.stringify(postData.value), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

async function uploadToBunnyCDN(file: File, postId: string): Promise<string> {
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
