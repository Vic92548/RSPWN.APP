const NotificationUtils = {
    getToast() {
        if (typeof Swal === 'undefined') return null;

        return Swal.mixin({
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.onmouseenter = Swal.stopTimer;
                toast.onmouseleave = Swal.resumeTimer;
            }
        });
    },

    success(title, options = {}) {
        const Toast = this.getToast();
        if (!Toast) return;

        Toast.fire({
            icon: "success",
            title,
            ...options
        });
    },

    error(title, text = null, options = {}) {
        if (typeof Swal === 'undefined') return;

        if (text) {
            Swal.fire({
                icon: 'error',
                title,
                text,
                ...options
            });
        } else {
            const Toast = this.getToast();
            Toast?.fire({
                icon: "error",
                title,
                ...options
            });
        }
    },

    info(title, text = null, options = {}) {
        if (typeof Swal === 'undefined') {
            console.error('SweetAlert2 not loaded');
            return Promise.resolve({ isConfirmed: false });
        }

        if (text) {
            return Swal.fire({
                icon: 'info',
                title,
                text,
                ...options
            });
        } else {
            const Toast = this.getToast();
            if (Toast) {
                Toast.fire({
                    icon: "info",
                    title,
                    ...options
                });
            }
            return Promise.resolve({ isConfirmed: false });
        }
    },

    warning(title, text, options = {}) {
        if (typeof Swal === 'undefined') return;

        Swal.fire({
            icon: 'warning',
            title,
            text,
            ...options
        });
    },

    async confirm(title, text, options = {}) {
        if (typeof Swal === 'undefined') return false;

        const result = await Swal.fire({
            title,
            text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#4ecdc4',
            ...options
        });

        return result.isConfirmed;
    },

    async confirmDanger(title, text, confirmText = 'Yes, delete it', options = {}) {
        if (typeof Swal === 'undefined') return false;

        const result = await Swal.fire({
            title,
            text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#e74c3c',
            ...options
        });

        return result.isConfirmed;
    },

    levelUp(level) {
        if (typeof confetti !== 'undefined') {
            confetti({
                particleCount: 50,
                spread: 50,
                origin: { y: 0.3 },
                colors: ['#ffffff', '#4ecdc4', '#667eea']
            });
        }

        this.success(`Level ${level} reached! 🎉`);
    },

    showXP(amount) {
        const notification = DOM.get('xp-notification');
        if (!notification) return;

        notification.textContent = `+${amount} XP`;
        notification.classList.add('show');

        setTimeout(() => {
            notification.classList.remove('show');
        }, 2500);
    },

    showActionFeedback(action) {
        const feedback = DOM.create('div', {
            class: 'action-feedback ' + action
        });
        feedback.innerHTML = `<i class="fa-solid fa-${action === 'liked' ? 'heart' : action === 'passed' ? 'heart-crack' : 'forward'}"></i> ${action.charAt(0).toUpperCase() + action.slice(1)}!`;

        document.body.appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 1000);
    },

    desktopAppPrompt(onConfirm) {
        if (typeof Swal === 'undefined') return;

        Swal.fire({
            title: 'Desktop App Required',
            html: `
                <p>To download and play games, you need the VAPR desktop app.</p>
                <p style="margin-top: 20px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
                    The desktop app allows you to:
                </p>
                <ul style="text-align: left; margin: 10px 0; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
                    <li>Download and install games directly</li>
                    <li>Launch games with one click</li>
                    <li>Track your playtime</li>
                    <li>Get automatic updates</li>
                </ul>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: '<i class="fa-solid fa-download"></i> Download Desktop App',
            cancelButtonText: 'Maybe Later',
            confirmButtonColor: '#4ecdc4',
            customClass: {
                container: 'download-prompt-container'
            }
        }).then((result) => {
            if (result.isConfirmed && onConfirm) {
                onConfirm();
            }
        });
    },

    copyToClipboard(text, successMessage = 'Copied to clipboard!') {
        navigator.clipboard.writeText(text).then(() => {
            this.success(successMessage);
        }).catch(() => {
            const textArea = DOM.create('textarea', {
                value: text,
                style: {
                    position: 'absolute',
                    left: '-9999px'
                }
            });
            document.body.appendChild(textArea);
            textArea.select();
            textArea.setSelectionRange(0, 99999);

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    this.success(successMessage);
                } else {
                    this.error('Failed to copy to clipboard');
                }
            } catch (err) {
                this.error('Failed to copy to clipboard');
            }

            document.body.removeChild(textArea);
        });
    }
};

window.notify = NotificationUtils;
window.showToast = (type, title, options) => NotificationUtils[type](title, options);