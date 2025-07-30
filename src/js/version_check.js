let versionCheckInterval = null;
let isVersionCheckModalOpen = false;

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
    }

    const downloadUrl = `https://github.com/Vic92548/VAPR/releases/download/v${versionInfo.required_version}/VAPR_${versionInfo.required_version}_x64_en-US.msi`;

    const modal = document.createElement('div');
    modal.id = 'version-update-modal';
    modal.className = 'version-modal-overlay';
    modal.innerHTML = `
        <div class="version-modal-content">
            <div class="version-modal-header">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <h2>Update Required</h2>
            </div>
            <div class="version-modal-body">
                <p>Your VAPR desktop app is outdated and needs to be updated to continue.</p>
                <div class="version-info">
                    <div class="version-item">
                        <span class="version-label">Your version:</span>
                        <span class="version-value outdated">v${versionInfo.current_version}</span>
                    </div>
                    <div class="version-item">
                        <span class="version-label">Required version:</span>
                        <span class="version-value required">v${versionInfo.required_version}</span>
                    </div>
                </div>
                <p class="version-note">Please download and install the latest version to access all features and ensure compatibility.</p>
            </div>
            <div class="version-modal-actions">
                <button class="version-download-btn" onclick="downloadLatestDesktopVersion('${downloadUrl}')">
                    <i class="fa-solid fa-download"></i>
                    Download Latest Version
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const style = document.createElement('style');
    style.textContent = `
        .version-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .version-modal-content {
            background: rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            border-radius: 20px;
            padding: 0;
            width: 90%;
            max-width: 500px;
            color: #fff;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            animation: slideIn 0.3s ease;
            overflow: hidden;
        }

        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .version-modal-header {
            background: rgba(231, 76, 60, 0.1);
            border-bottom: 1px solid rgba(231, 76, 60, 0.2);
            padding: 30px;
            text-align: center;
        }

        .version-modal-header i {
            font-size: 48px;
            color: #e74c3c;
            margin-bottom: 15px;
            display: block;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.8; }
            50% { transform: scale(1.1); opacity: 1; }
        }

        .version-modal-header h2 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
            color: rgba(255, 255, 255, 0.95);
        }

        .version-modal-body {
            padding: 30px;
        }

        .version-modal-body p {
            margin: 0 0 20px 0;
            font-size: 16px;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.8);
        }

        .version-info {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
        }

        .version-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
        }

        .version-item:first-child {
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 15px;
            margin-bottom: 5px;
        }

        .version-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.6);
        }

        .version-value {
            font-size: 16px;
            font-weight: 600;
            font-family: monospace;
        }

        .version-value.outdated {
            color: #e74c3c;
        }

        .version-value.required {
            color: #4ecdc4;
        }

        .version-note {
            font-size: 14px !important;
            color: rgba(255, 255, 255, 0.6) !important;
            margin-bottom: 0 !important;
            text-align: center;
        }

        .version-modal-actions {
            padding: 20px 30px 30px;
            text-align: center;
        }

        .version-download-btn {
            background: linear-gradient(135deg, #4ecdc4 0%, #44a3aa 100%);
            border: none;
            color: white;
            padding: 16px 32px;
            font-size: 18px;
            font-weight: 700;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(78, 205, 196, 0.3);
            width: 100%;
            justify-content: center;
        }

        .version-download-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 30px rgba(78, 205, 196, 0.4);
            background: linear-gradient(135deg, #5eded6 0%, #52b5bc 100%);
        }

        .version-download-btn:active {
            transform: translateY(0);
        }

        .version-download-btn i {
            font-size: 20px;
        }
    `;
    document.head.appendChild(style);
}

function downloadLatestDesktopVersion(downloadUrl) {
    window.open(downloadUrl, '_blank');

    setTimeout(() => {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'info',
                title: 'Download Started',
                html: `
                    <p>The download should begin shortly.</p>
                    <p style="margin-top: 15px; font-size: 14px; color: rgba(255, 255, 255, 0.7);">
                        After installing the new version, please restart VAPR to continue.
                    </p>
                `,
                confirmButtonText: 'OK',
                confirmButtonColor: '#4ecdc4'
            });
        }
    }, 500);
}

function initVersionCheck() {
    if (!isRunningInTauri()) return;

    setTimeout(() => {
        checkDesktopVersion();

        versionCheckInterval = setInterval(checkDesktopVersion, 5 * 60 * 1000);
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