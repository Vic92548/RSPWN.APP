async function remove(){
    const kv = await Deno.openKv("https://api.deno.com/databases/a439e854-8fad-4eb5-b954-5468f9194a81/connect");

    const userId = "329624064333447168";

// Retrieve the list of posts by the user
    const userPostsData = await kv.get(["users", userId, "posts"]);

    if (!userPostsData || !userPostsData.value || userPostsData.value.length === 0) {
        console.log("No posts found for user ID:", userId);
    }

// List of promises to handle all deletions
    const deletionPromises = [];

// Loop through each post and delete it from the KV store
    userPostsData.value.forEach(post => {
        deletionPromises.push(kv.delete(["posts", post.id]));
        deletionPromises.push(kv.delete(["trend", "posts", post.id]));  // Assuming trending info needs to be removed as well
    });

// Also remove the user's posts entry
//deletionPromises.push(kv.delete(["users", userId, "posts"]));

// Await all deletions to complete
    await Promise.all(deletionPromises);

    console.log(`All posts by user ID ${userId} have been successfully removed.`);
}

remove();