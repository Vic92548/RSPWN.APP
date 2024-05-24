import { createPost } from "./posts/create.js"; // Import the createPost function

export { createPost }; // Re-export createPost

import { addReaction, getReactionsByPostId } from "./posts/reactions.js";
export { addReaction, getReactionsByPostId };

import { likePost, viewPost, dislikePost, skipPost, clickLink } from "./posts/interactions.js";
export { likePost, viewPost, dislikePost, skipPost, clickLink };

import { followPost, unfollowPost, checkIfUserFollowsCreator, notifyFollowers } from "./posts/follow.js";
export { followPost, unfollowPost, checkIfUserFollowsCreator, notifyFollowers };

import { acceptInvitation } from "./posts/invitations.js";
export { acceptInvitation };

import { getNextFeedPosts } from "./posts/feed.js";
export { getNextFeedPosts };

import { getPostData, getPost, getPostList } from "./posts/get_post.js";
export { getPostData, getPost, getPostList };
