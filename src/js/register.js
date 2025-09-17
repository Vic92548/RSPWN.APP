// Legacy function - redirects to new auth page
function closeRegisterModal() {
    // If called, redirect to auth page instead
    openAuthPage();
}

// Backwards compatibility
function openRegisterModal() {
    openAuthPage();
}

document.addEventListener('DOMContentLoaded', function() {
    const userCountEl = DOM.get('user_count');
    const userCountCtaEl = DOM.get('user_count_cta');

    if (userCountEl && userCountCtaEl) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'characterData') {
                    userCountCtaEl.textContent = userCountEl.textContent;
                }
            });
        });

        observer.observe(userCountEl, { childList: true, characterData: true, subtree: true });
    }
});

// Export legacy functions for global access
if (typeof window !== 'undefined') {
    window.closeRegisterModal = closeRegisterModal;
    window.openRegisterModal = openRegisterModal;
}