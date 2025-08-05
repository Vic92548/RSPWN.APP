let user_previous_reaction = null;
let isProcessingReaction = false;

function initEnhancedReactions() {
    const reactionButtons = DOM.queryAll('.reactions button');

    reactionButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            createRipple(e, this);
        });
    });
}

function createRipple(event, button) {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = DOM.create('span', {
        style: {
            position: 'absolute',
            width: `${size}px`,
            height: `${size}px`,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.5)',
            pointerEvents: 'none',
            transform: `translate(${x}px, ${y}px) scale(0)`,
            animation: 'rippleEffect 0.6s ease-out'
        }
    });

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
}

function incrementEmoji(emoji) {
    const emoji_count = DOM.get(emoji);
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
    const emoji_count = DOM.get(emoji);
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
    const emoji_count = DOM.get(emoji);
    emoji_count.textContent = "0";
}

function addReaction(emoji) {
    if (!isUserLoggedIn()) {
        const reactionsContainer = DOM.query('.reactions');
        reactionsContainer.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            reactionsContainer.style.animation = '';
            openRegisterModal();
        }, 500);
        return;
    }

    if (isProcessingReaction) return;

    isProcessingReaction = true;

    const currentBtn = DOM.query(`[data-reaction="${emoji}"]`);
    const wasActive = currentBtn.classList.contains('active');

    if (user_previous_reaction && user_previous_reaction !== emoji) {
        const prevBtn = DOM.query(`[data-reaction="${user_previous_reaction}"]`);
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

    APIHandler.handle(
        () => api.addReaction(current_post_id, emoji),
        {
            onSuccess: (data) => {
                console.log('Reaction added:', data);
                user_previous_reaction = emoji;
                isProcessingReaction = false;
            },
            onError: (error) => {
                console.error('Error adding reaction:', error);
                if (user_previous_reaction) {
                    incrementEmoji(user_previous_reaction);
                    decrementEmoji(emoji);
                }
                currentBtn.classList.toggle('active');
                isProcessingReaction = false;
            }
        }
    );
}

function animateReactionIcon(icon) {
    icon.style.animation = 'none';
    setTimeout(() => {
        icon.style.animation = 'bounce 0.5s ease';
    }, 10);
}

function createFloatingReaction(emoji, button) {
    const rect = button.getBoundingClientRect();

    const floater = DOM.create('div', {
        class: 'floating-reaction',
        style: {
            position: 'fixed',
            left: `${rect.left + rect.width / 2}px`,
            top: `${rect.top}px`,
            fontSize: '30px',
            pointerEvents: 'none',
            zIndex: '1000',
            animation: 'floatUp 1s ease-out forwards'
        }
    }, emoji);

    document.body.appendChild(floater);
    setTimeout(() => floater.remove(), 1000);
}

function displayReactions() {
    DOM.queryAll('.reactions button').forEach(btn => {
        btn.classList.remove('active');
    });

    resetEmoji('💩');
    resetEmoji('👀');
    resetEmoji('😂');
    resetEmoji('💯');

    console.log("Post id : " + current_post_id);

    APIHandler.handle(
        () => api.getReactions(current_post_id),
        {
            onSuccess: (data) => {
                console.log('Reactions received:', data);
                user_previous_reaction = null;

                data.reactions.forEach((reaction, index) => {
                    setTimeout(() => {
                        incrementEmoji(reaction.emoji);

                        if (reaction.userId === window.user?.id) {
                            user_previous_reaction = reaction.emoji;
                            const btn = DOM.query(`[data-reaction="${reaction.emoji}"]`);
                            btn.classList.add('active');
                        }
                    }, index * 50);
                });
            }
        }
    );
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initEnhancedReactions);
}