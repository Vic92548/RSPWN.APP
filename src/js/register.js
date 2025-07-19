/* JavaScript function to close the modal */
function closeRegisterModal() {
    document.getElementById("register").style.display = "none";
}

/* Update CTA user count when modal opens */
document.addEventListener('DOMContentLoaded', function() {
    const userCountEl = document.getElementById('user_count');
    const userCountCtaEl = document.getElementById('user_count_cta');

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