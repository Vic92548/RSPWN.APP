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

    const mediaUrl = file ? await uploadToBunnyCDN(file, postId) : null;

    if(mediaUrl){
        content = mediaUrl;
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

    return new Response(postData, {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}

async function uploadToBunnyCDN(file: File, postId: string): Promise<string> {
    const formData = new FormData();
    const fileExtension = file.name.split('.').pop();  // Extract the file extension
    const fileName = `${postId}.${fileExtension}`;     // Construct the file name using the post ID and the extension
    formData.append("file", file, fileName);

    const accessKey = Deno.env.get("BUNNY_CDN_ACCESSKEY");
    const storageZoneUrl = Deno.env.get("BUNNY_CDN_STORAGE_URL");

    if (!accessKey || !storageZoneUrl) {
        throw new Error("Bunny CDN configuration is missing from environment variables.");
    }

    const uploadUrl = `${storageZoneUrl}/posts/${fileName}`;  // Updated to use the new file name with extension

    const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
            "AccessKey": accessKey
        },
        body: formData
    });

    if (!response.ok) {
        console.log(response);
        throw new Error("Failed to upload media.");
    }

    const data = await response.json();
    return data.HttpPath; // Adjust according to Bunny CDN response
}
