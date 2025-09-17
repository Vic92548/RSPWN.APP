let user_previous_reaction = null;
let isProcessingReaction = false;
let isEmojiDropdownOpen = false;

function initEnhancedReactions() {
    // Add click listener to close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        const emojiOverlay = DOM.query('.emoji-reaction-overlay');
        if (emojiOverlay && !emojiOverlay.contains(e.target) && isEmojiDropdownOpen) {
            closeEmojiDropdown();
        }
    });

    // Initialize the emoji trigger button with default emoji
    updateEmojiTrigger();
}

function toggleEmojiDropdown() {
    if (!isUserLoggedIn()) {
        const emojiTrigger = DOM.get('emoji-trigger');
        emojiTrigger.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            emojiTrigger.style.animation = '';
            openRegisterModal();
        }, 500);
        return;
    }

    const dropdown = DOM.get('emoji-dropdown');
    const triggerBtn = DOM.get('emoji-trigger');

    if (isEmojiDropdownOpen) {
        closeEmojiDropdown();
    } else {
        openEmojiDropdown();
    }
}

function openEmojiDropdown() {
    const dropdown = DOM.get('emoji-dropdown');
    const triggerBtn = DOM.get('emoji-trigger');

    dropdown.style.display = 'block';
    triggerBtn.classList.add('active');
    isEmojiDropdownOpen = true;

    // Update reaction counts in dropdown
    updateDropdownCounts();
}

function closeEmojiDropdown() {
    const dropdown = DOM.get('emoji-dropdown');
    const triggerBtn = DOM.get('emoji-trigger');

    dropdown.style.display = 'none';
    triggerBtn.classList.remove('active');
    isEmojiDropdownOpen = false;
}

function selectReaction(emoji) {
    if (isProcessingReaction) return;

    // Close dropdown immediately for better UX
    closeEmojiDropdown();

    // Handle reaction selection
    addReaction(emoji);
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
    const emoji_count = DOM.get(`count-${emoji}`);
    if (!emoji_count) return;

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
    const emoji_count = DOM.get(`count-${emoji}`);
    if (!emoji_count) return;

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
    const emoji_count = DOM.get(`count-${emoji}`);
    if (emoji_count) {
        emoji_count.textContent = "0";
    }
}

function updateEmojiTrigger() {
    const currentEmojiEl = DOM.get('current-emoji');
    if (!currentEmojiEl) return;

    if (user_previous_reaction) {
        currentEmojiEl.textContent = user_previous_reaction;
    } else {
        currentEmojiEl.textContent = '😊';
    }
}

function updateDropdownCounts() {
    // Update all emoji counts in the dropdown from the current post data
    const emojis = ['💩', '👀', '😂', '💯'];
    emojis.forEach(emoji => {
        const countEl = DOM.get(`count-${emoji}`);
        if (countEl) {
            // The count should already be updated from displayReactions
            // This ensures the dropdown shows current counts
        }
    });

    // Update active state for current user's reaction
    DOM.queryAll('.emoji-option').forEach(btn => {
        btn.classList.remove('active');
    });

    if (user_previous_reaction) {
        const activeBtn = DOM.query(`[data-reaction="${user_previous_reaction}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }
}

function addReaction(emoji) {
    if (!isUserLoggedIn()) {
        const emojiTrigger = DOM.get('emoji-trigger');
        emojiTrigger.style.animation = 'shake 0.5s ease';
        setTimeout(() => {
            emojiTrigger.style.animation = '';
            openRegisterModal();
        }, 500);
        return;
    }

    if (isProcessingReaction) return;

    isProcessingReaction = true;

    // Handle removing previous reaction
    if (user_previous_reaction && user_previous_reaction !== emoji) {
        decrementEmoji(user_previous_reaction);
    }

    // Handle new reaction
    let wasRemoving = false;
    if (emoji === null || (user_previous_reaction === emoji)) {
        // Remove current reaction
        if (user_previous_reaction) {
            decrementEmoji(user_previous_reaction);
        }
        emoji = null;
        wasRemoving = true;
    } else {
        // Add new reaction
        incrementEmoji(emoji);
        createFloatingReaction(emoji);
    }

    APIHandler.handle(
        () => api.addReaction(current_post_id, emoji),
        {
            onSuccess: (data) => {
                console.log('Reaction updated:', data);
                user_previous_reaction = emoji;
                updateEmojiTrigger();
                isProcessingReaction = false;
            },
            onError: (error) => {
                console.error('Error updating reaction:', error);
                // Revert the changes on error
                if (wasRemoving && user_previous_reaction) {
                    incrementEmoji(user_previous_reaction);
                } else if (!wasRemoving && emoji) {
                    decrementEmoji(emoji);
                }
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

function createFloatingReaction(emoji) {
    const triggerBtn = DOM.get('emoji-trigger');
    if (!triggerBtn) return;

    const rect = triggerBtn.getBoundingClientRect();

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
    // Reset all emoji counts
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
                        }
                    }, index * 50);
                });

                // Update the emoji trigger button after all reactions are loaded
                setTimeout(() => {
                    updateEmojiTrigger();
                }, data.reactions.length * 50 + 100);
            }
        }
    );
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initEnhancedReactions);
}