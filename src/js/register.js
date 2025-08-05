function closeRegisterModal() {
    DOM.hide("register");
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