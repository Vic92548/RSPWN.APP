let user_previous_reaction = null;

function incrementEmoji(emoji) {
    const emoji_count = document.getElementById(emoji);
    emoji_count.textContent = (parseInt(emoji_count.textContent) + 1).toString();
}

function decrementEmoji(emoji) {
    const emoji_count = document.getElementById(emoji);
    emoji_count.textContent = (parseInt(emoji_count.textContent) - 1).toString();
}

function resetEmoji(emoji) {
    const emoji_count = document.getElementById(emoji);
    emoji_count.textContent = "0";
}

function addReaction(emoji) {
    if (!isUserLoggedIn()) {
        openRegisterModal();  // Ensure the user is logged in before allowing a reaction
        return;
    }

    window.analytics.track('Add reaction', {
        post: current_post,
        emoji,
    });

    if (user_previous_reaction) {
        decrementEmoji(user_previous_reaction);
    }

    incrementEmoji(emoji);

    const path = `/add-reaction?postId=${current_post_id}&emoji=${encodeURIComponent(emoji)}`;
    makeApiRequest(path).then(data => {
        console.log('Reaction added:', data);
        user_previous_reaction = emoji;
    }).catch(error => {
        console.error('Error adding reaction:', error);
        alert('Error adding reaction. Please try again.');
        if (user_previous_reaction) {
            // Revert the changes on error
            incrementEmoji(user_previous_reaction);
            decrementEmoji(emoji);
        }
    });
}

function displayReactions() {
    resetEmoji('💩');
    resetEmoji('👀');
    resetEmoji('😂');
    resetEmoji('❤️');
    resetEmoji('💯');

    const path = `/get-reactions?postId=${current_post_id}`;

    console.log("Post id : " + current_post_id);

    makeApiRequest(path, false).then(data => {
        console.log('Reactions received:', data);

        user_previous_reaction = null;

        for (let i = 0; i < data.reactions.length; i++) {
            incrementEmoji(data.reactions[i].emoji);

            if(data.reactions[i].userId){
                user_previous_reaction = data.reactions[i].emoji;
            }
        }

        // Assuming you have a way to get the current user's reaction from the data


    }).catch(error => {
        console.error('Error retrieving reactions:', error);
        alert('Error retrieving reactions. Please refresh the page.');
    });
}
