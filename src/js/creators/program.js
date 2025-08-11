window.creatorData = {
    isCreator: false,
    creatorCode: null,
    application: null,
    stats: null
};

cardManager.register('creator-program-card', {
    route: '/creator-program',
    onLoad: async () => {
        await loadCreatorStatus();
        updateApplyUIForAuth();
    }
});

cardManager.register('creator-dashboard-card', {
    route: '/creator-dashboard',
    onLoad: async () => {
        await loadCreatorStats();
    }
});

async function loadCreatorStatus() {
    try {
        DOM.show('creator-loading');
        DOM.hide('creator-info-section');
        DOM.hide('creator-status-section');

        const response = await api.request('/api/creators/status');

        if (response.success) {
            creatorData.isCreator = response.isCreator;

            if (response.isCreator) {
                creatorData.creatorCode = response.creatorCode;
                showCreatorApproved();
            } else if (response.application) {
                creatorData.application = response.application;
                showApplicationStatus(response.application);
            } else {
                showCreatorInfo();
            }
        }
    } catch (error) {
        console.error('Error loading creator status:', error);
        showCreatorInfo();
    } finally {
        DOM.hide('creator-loading');
        updateApplyUIForAuth();
    }
}

async function submitCreatorApplication(event) {
    event.preventDefault();

    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }

    const applyButton = DOM.get('apply-button');
    const tebexWalletId = DOM.get('tebex-wallet-id').value.trim();

    if (!tebexWalletId) {
        notify.warning('Missing Information', 'Please enter your Tebex wallet ID');
        return;
    }

    applyButton.disabled = true;
    applyButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';

    try {
        const response = await api.request('/api/creators/apply', {
            method: 'POST',
            body: { tebexWalletId }
        });

        if (response.success) {
            notify.success('Application submitted successfully!');
            await loadCreatorStatus();
        } else {
            throw new Error(response.error || 'Failed to submit application');
        }
    } catch (error) {
        console.error('Error submitting application:', error);
        notify.error('Application Failed', error.message);
    } finally {
        applyButton.disabled = false;
        applyButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Application';
    }
}

async function loadCreatorStats() {
    try {
        const response = await api.request('/api/creators/stats');

        if (response.success) {
            creatorData.stats = response.stats;

            DOM.setText('dashboard-creator-code', response.creatorCode);
            DOM.setText('creator-total-clicks', formatNumber(response.stats.totalClicks));
            DOM.setText('creator-total-sales', formatNumber(response.stats.totalSales));
            DOM.setText('creator-total-revenue', `$${response.stats.totalRevenue.toFixed(2)}`);
        }
    } catch (error) {
        console.error('Error loading creator stats:', error);
    }
}

function showCreatorInfo() {
    DOM.hide('creator-status-section');
    DOM.show('creator-info-section');
}

function showApplicationStatus(application) {
    DOM.show('creator-status-section');
    DOM.hide('creator-info-section');

    DOM.hide('creator-pending');
    DOM.hide('creator-approved');
    DOM.hide('creator-rejected');

    if (application.status === 'pending') {
        DOM.show('creator-pending');
        DOM.setText('application-date', new Date(application.createdAt).toLocaleDateString());
    } else if (application.status === 'rejected') {
        DOM.show('creator-rejected');
        DOM.setText('rejection-reason', application.message || 'Your application was not approved at this time.');
    }
}

function showCreatorApproved() {
    DOM.show('creator-status-section');
    DOM.hide('creator-info-section');

    DOM.hide('creator-pending');
    DOM.show('creator-approved');
    DOM.hide('creator-rejected');

    DOM.setText('creator-code', creatorData.creatorCode);
}

function updateApplyUIForAuth() {
    const applyButton = DOM.get('apply-button');
    const applyForm = DOM.get('creator-apply-form');
    const tebexInput = DOM.get('tebex-wallet-id');
    const loginPrompt = DOM.get('creator-login-prompt');
    const applySection = DOM.query('.creator-apply-section');

    if (!applySection) return;

    if (!isUserLoggedIn()) {
        if (loginPrompt) DOM.show('creator-login-prompt');
        if (applySection) DOM.hide(applySection);
        if (tebexInput) tebexInput.disabled = true;
        if (applyButton) {
            applyButton.type = 'button';
            applyButton.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign in to apply';
            applyButton.onclick = () => openRegisterModal();
        }
    } else {
        if (loginPrompt) DOM.hide('creator-login-prompt');
        if (applySection) DOM.show(applySection);
        if (tebexInput) tebexInput.disabled = false;
        if (applyButton) {
            applyButton.type = 'submit';
            applyButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Application';
            applyButton.onclick = null;
        }
    }
}

function openCreatorProgram() {
    hideMenu();
    router.navigate('/creator-program', true);
}

function closeCreatorProgramCard() {
    cardManager.hide('creator-program-card');
}

function openCreatorDashboard() {
    hideMenu();
    router.navigate('/creator-dashboard', true);
}

function closeCreatorDashboard() {
    cardManager.hide('creator-dashboard-card');
}

function copyCreatorCode() {
    if (creatorData.creatorCode) {
        notify.copyToClipboard(creatorData.creatorCode, 'Creator code copied to clipboard!');
    }
}

async function updateCreatorMenuItem() {
    if (!isUserLoggedIn()) return;

    try {
        const response = await api.request('/api/creators/status');

        if (response.success && response.isCreator) {
            const creatorMenuItem = DOM.query('.menu-item[onclick="openCreatorProgram()"]');
            if (creatorMenuItem) {
                creatorMenuItem.onclick = openCreatorDashboard;
                const title = creatorMenuItem.querySelector('.menu-item-title');
                if (title) title.textContent = 'Creator Dashboard';
                const desc = creatorMenuItem.querySelector('.menu-item-desc');
                if (desc) desc.textContent = 'View your earnings';
            }
        }
    } catch (error) {
        console.error('Error checking creator status:', error);
    }
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (isUserLoggedIn()) {
            updateCreatorMenuItem();
        }
        updateApplyUIForAuth();
    });
}