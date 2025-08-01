let versionCheckInterval = null;
let isVersionCheckModalOpen = false;
let hasSkippedVersion = null;

function getWebVersion() {
    const versionElement = document.querySelector('.menu-version span');
    if (versionElement) {
        const versionText = versionElement.textContent;
        const versionMatch = versionText.match(/v(\d+\.\d+\.\d+)/);
        if (versionMatch) {
            return versionMatch[1];
        }
    }
    return null;
}

function getDesktopVersion() {
    if (window.__TAURI__ && window.__TAURI__.app) {
        return window.__TAURI__.app.getVersion();
    }
    return null;
}

async function checkDesktopVersion() {
    if (!isRunningInTauri() || isVersionCheckModalOpen) {
        return;
    }

    try {
        const webVersion = getWebVersion();
        const desktopVersion = await getDesktopVersion();

        if (!webVersion || !desktopVersion) {
            console.error('Could not retrieve version information');
            return;
        }

        if (webVersion !== desktopVersion) {
            showVersionUpdateModal({
                current_version: desktopVersion,
                required_version: webVersion
            });
        }
    } catch (error) {
        console.error('Version check failed:', error);
    }
}

function showVersionUpdateModal(versionInfo) {
    if (isVersionCheckModalOpen) return;

    isVersionCheckModalOpen = true;

    if (versionCheckInterval) {
        clearInterval(versionCheckInterval);
        versionCheckInterval = null;
    }

    const downloadUrl = `https://github.com/Vic92548/VAPR/releases/download/v${versionInfo.required_version}/VAPR_${versionInfo.required_version}_x64_en-US.msi`;

    const modal = document.createElement('div');
    modal.id = 'version-update-modal';
    modal.className = 'version-modal-overlay';
    modal.innerHTML = `
        <div class="version-modal-content">
            <div class="version-modal-header">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <h2>Update Available</h2>
            </div>
            <div class="version-modal-body">
                <p>A new version of VAPR desktop app is available. Update now for the latest features and improvements.</p>
                <div class="version-info">
                    <div class="version-item">
                        <span class="version-label">Your version:</span>
                        <span class="version-value outdated">v${versionInfo.current_version}</span>
                    </div>
                    <div class="version-item">
                        <span class="version-label">Latest version:</span>
                        <span class="version-value required">v${versionInfo.required_version}</span>
                    </div>
                </div>
                <p class="version-note">We recommend updating to ensure the best experience and compatibility.</p>
            </div>
            <div class="version-modal-actions">
                <button class="version-download-btn" onclick="downloadLatestDesktopVersion('${downloadUrl}')">
                    <i class="fa-solid fa-download"></i>
                    Download Latest Version
                </button>
                <button class="version-skip-btn" onclick="skipVersionUpdate('${versionInfo.required_version}')">
                    <i class="fa-solid fa-clock"></i>
                    Skip for now <span class="skip-warning">(not recommended, may cause bugs)</span>
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

function skipVersionUpdate(skippedVersion) {
    const modal = document.getElementById('version-update-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = '';
    }

    isVersionCheckModalOpen = false;
}

function downloadLatestDesktopVersion(downloadUrl) {
    window.open(downloadUrl, '_blank');

    setTimeout(() => {
        notify.info(
            'Download Started',
            `<p>The download should begin shortly.</p>
            <p style="margin-top: 15px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
                After installing the new version, please restart VAPR to continue.
            </p>`,
            {
                confirmButtonText: 'OK',
                confirmButtonColor: '#4ecdc4'
            }
        );
    }, 500);
}

function initVersionCheck() {
    if (!isRunningInTauri()) return;

    setTimeout(() => {
        checkDesktopVersion();
    }, 3000);
}

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        initVersionCheck();
    });

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && document.querySelector('.menu-version span')) {
                observer.disconnect();
                checkDesktopVersion();
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

window.checkDesktopVersion = checkDesktopVersion;
window.downloadLatestDesktopVersion = downloadLatestDesktopVersion;
window.skipVersionUpdate = skipVersionUpdate;