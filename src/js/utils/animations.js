const AnimationUtils = {
    animateCounter(element, start, end, duration = 1000, formatter = null) {
        if (!element) return;

        const startTime = performance.now();
        const defaultFormatter = (val) => this.formatNumber(val);
        const format = formatter || defaultFormatter;

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = Math.floor(start + (end - start) * easeOutQuart);

            element.textContent = format(currentValue);

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    },

    formatNumber(num) {
        if (num < 1000) return num.toString();
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
        return (num / 1000000000).toFixed(1) + 'B';
    },

    timeAgo(dateParam) {
        if (!dateParam) return null;

        const date = typeof dateParam === 'object' ? dateParam : new Date(dateParam);
        const today = new Date();
        const seconds = Math.round((today - date) / 1000);
        const minutes = Math.round(seconds / 60);
        const hours = Math.round(minutes / 60);
        const days = Math.round(hours / 24);
        const months = Math.round(days / 30.4);
        const years = Math.round(days / 365);

        if (seconds < 60) {
            return `${seconds}s ago`;
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 30) {
            return `${days}d ago`;
        } else if (months < 12) {
            return `${months}mo ago`;
        } else {
            return `${years}y ago`;
        }
    },

    createRipple(event, button) {
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
    },

    addShimmerEffect(element) {
        element.classList.add('glass-shimmer');
    },

    formatViews(viewCount) {
        return this.formatNumber(viewCount);
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.animateCounter = AnimationUtils.animateCounter.bind(AnimationUtils);
window.formatNumber = AnimationUtils.formatNumber;
window.timeAgo = AnimationUtils.timeAgo;
window.formatViews = AnimationUtils.formatViews;
window.escapeHtml = AnimationUtils.escapeHtml;