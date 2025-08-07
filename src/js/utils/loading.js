const LoadingUtils = {
    loadingElement: null,
    loadingCount: 0,

    init() {
        if (!this.loadingElement) {
            const loading = document.createElement('div');
            loading.id = 'global-loading';
            loading.className = 'global-loading';
            loading.innerHTML = `
                <div class="loading-spinner">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                </div>
            `;
            document.body.appendChild(loading);
            this.loadingElement = loading;
        }
    },

    show() {
        this.init();
        this.loadingElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    hide() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
            document.body.style.overflow = '';
        }
    }
};

window.loading = LoadingUtils;