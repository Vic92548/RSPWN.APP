let user_previous_reaction = null;
let isProcessingReaction = false;

function initEnhancedReactions() {
    const reactionButtons = document.querySelectorAll('.reactions button');

    reactionButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            createRipple(e, this);
        });
    });
}

function createRipple(event, button) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        pointer-events: none;
        transform: translate(${x}px, ${y}px) scale(0);
        animation: rippleEffect 0.6s ease-out;
    `;

    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
}

function incrementEmoji(emoji) {
    const emoji_count = document.getElementById(emoji);
    const currentCount = parseInt(emoji_count.textContent);
    const newCount = currentCount + 1;

    emoji_count.style.transform = 'scale(1.5)';
    emoji_count.style.color = '#4ecdc4';

    setTimeout(() => {
        emoji_count.textContent = newCount;
        emoji_count.style.transform = 'scale(1)';
        emoji_count.style.color = '';
    }, 200);
}

function decrementEmoji(emoji) {
    const emoji_count = document.getElementById(emoji);
    const currentCount = parseInt(emoji_count.textContent);
    const newCount = Math.max(0, currentCount - 1);

    emoji_count.style.transform = 'scale(0.8)';
    emoji_count.style.color = '#e74c3c';

    setTimeout(() => {
        emoji_count.textContent = newCount;
        emoji_count.style.transform = 'scale(1)';
        emoji_count.style.color = '';
    }, 200);
}

function resetEmoji(emoji) {
    const emoji_count = document.getElementById(emoji);
    emoji_count.textContent = "0";
}

function addReaction(emoji) {
    if (!isUserLoggedIn()) {
        const reactionsContainer = document.querySelector('.reactions');
        reactionsContainer.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            reactionsContainer.style.animation = '';
            openRegisterModal();
        }, 500);
        return;
    }

    if (isProcessingReaction) return;

    isProcessingReaction = true;

    const currentBtn = document.querySelector(`[data-reaction="${emoji}"]`);
    const wasActive = currentBtn.classList.contains('active');

    if (user_previous_reaction && user_previous_reaction !== emoji) {
        const prevBtn = document.querySelector(`[data-reaction="${user_previous_reaction}"]`);
        prevBtn.classList.remove('active');
        decrementEmoji(user_previous_reaction);
    }

    if (!wasActive) {
        currentBtn.classList.add('active');
        incrementEmoji(emoji);
        animateReactionIcon(currentBtn.querySelector('.reaction_icon'));
        createFloatingReaction(emoji, currentBtn);
    } else {
        currentBtn.classList.remove('active');
        decrementEmoji(emoji);
        emoji = null;
    }

    const path = `/add-reaction?postId=${current_post_id}&emoji=${encodeURIComponent(emoji)}`;
    api.addReaction(current_post_id, emoji).then(data => {
        console.log('Reaction added:', data);
        user_previous_reaction = emoji;
        isProcessingReaction = false;
    }).catch(error => {
        console.error('Error adding reaction:', error);

        if (user_previous_reaction) {
            incrementEmoji(user_previous_reaction);
            decrementEmoji(emoji);
        }

        currentBtn.classList.toggle('active');
        isProcessingReaction = false;
    });
}

function animateReactionIcon(icon) {
    icon.style.animation = 'none';
    setTimeout(() => {
        icon.style.animation = 'bounce 0.5s ease';
    }, 10);
}

function createFloatingReaction(emoji, button) {
    const floater = document.createElement('div');
    floater.className = 'floating-reaction';
    floater.textContent = emoji;

    const rect = button.getBoundingClientRect();
    floater.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top}px;
        font-size: 30px;
        pointer-events: none;
        z-index: 1000;
        animation: floatUp 1s ease-out forwards;
    `;

    document.body.appendChild(floater);
    setTimeout(() => floater.remove(), 1000);
}

function displayReactions() {
    document.querySelectorAll('.reactions button').forEach(btn => {
        btn.classList.remove('active');
    });

    resetEmoji('💩');
    resetEmoji('👀');
    resetEmoji('😂');
    resetEmoji('❤️');
    resetEmoji('💯');

    const path = `/get-reactions?postId=${current_post_id}`;

    console.log("Post id : " + current_post_id);

    api.getReactions(current_post_id).then(data => {
        console.log('Reactions received:', data);

        user_previous_reaction = null;

        data.reactions.forEach((reaction, index) => {
            setTimeout(() => {
                incrementEmoji(reaction.emoji);

                if (reaction.userId === window.user?.id) {
                    user_previous_reaction = reaction.emoji;
                    const btn = document.querySelector(`[data-reaction="${reaction.emoji}"]`);
                    btn.classList.add('active');
                }
            }, index * 50);
        });

    }).catch(error => {
        console.error('Error retrieving reactions:', error);
    });
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initEnhancedReactions);
}