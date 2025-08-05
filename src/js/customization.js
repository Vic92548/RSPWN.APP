cardManager.register('backgrounds-card', {
    onShow: () => {
        displayBackgroundImages();
    }
});

function openCustomizationMenu() {
    if (!isUserLoggedIn() && MainPage) {
        openRegisterModal();
        return;
    }

    cardManager.show('backgrounds-card');
}

function closeBackgroundsCard() {
    cardManager.hide('backgrounds-card');
}

function closeCustomizationMenu() {
    closeBackgroundsCard();
}

function displayBackgroundImages() {
    if (!isUserLoggedIn() && MainPage) {
        openRegisterModal();
        return;
    }

    const container = document.getElementById("backgrounds-grid");
    container.innerHTML = '';

    const currentBackground = localStorage.getItem('background_url');

    background_images.forEach((bg, index) => {
        const isUnlocked = user.level >= bg.unlock;
        const isEquipped = currentBackground === bg.image_url;
        const progress = Math.min((user.level / bg.unlock) * 100, 100);

        const card = document.createElement('div');
        card.className = `background-item ${!isUnlocked ? 'locked' : ''} ${isEquipped ? 'equipped' : ''}`;

        card.innerHTML = `
            ${bg.new && isUnlocked ? '<div class="new-badge">NEW</div>' : ''}
            
            <img src="${bg.image_url}" class="background-preview" alt="${bg.title}" loading="lazy">
            
            <div class="background-info">
                <h4 class="background-title">${bg.title}</h4>
                <p class="background-description">${bg.description}</p>
                ${bg.link ? `
                    <a href="${bg.link}" target="_blank" class="background-link" onclick="event.stopPropagation()">
                        <i class="fa-solid fa-external-link-alt"></i>
                        ${bg.link_text || 'View Source'}
                    </a>
                ` : ''}
            </div>
            
            ${!isUnlocked ? `
                <div class="lock-overlay">
                    <i class="fa-solid fa-lock lock-icon"></i>
                    <div class="unlock-text">Unlock at Level ${bg.unlock}</div>
                    <div class="unlock-progress">
                        <div class="unlock-progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
            ` : ''}
        `;

        if (isUnlocked && !isEquipped) {
            card.onclick = () => {
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 100);

                updateBackgroundId(bg.id);
                equipBackground(bg.image_url);

                if (typeof confetti !== 'undefined') {
                    confetti({
                        particleCount: 50,
                        spread: 50,
                        origin: { y: 0.6 },
                        colors: ['#4ecdc4', '#44a3aa', '#3d9a92']
                    });
                }

                displayBackgroundImages();
            };
        }

        container.appendChild(card);
    });
}

function equipBackground(url, save = true) {
    if(!MainPage){
        return;
    }

    document.body.style.backgroundImage = 'url(' + url + ')';

    if (save) {
        localStorage.setItem('background_url', url);

        const bgData = background_images.find(bg => bg.image_url === url);
        if (bgData) {
            localStorage.setItem('background_id', bgData.id);
        }
    }
}

function updateBackgroundId(newBackgroundId) {
    if (!isUserLoggedIn()) {
        alert('You must be logged in to update your background.');
        return;
    }

    if (!navigator.onLine) {
        localStorage.setItem('pending_background_id', newBackgroundId);

        const bg = background_images.find(b => b.id === newBackgroundId);
        if (bg) {
            equipBackground(bg.image_url, true);
        }

        notify.info('Offline Mode', 'Background will be synced when you\'re back online');
        return;
    }

    api.updateBackground(newBackgroundId)
        .then(response => {
            console.log('Background updated successfully:', response);

            if (window.user) {
                window.user.backgroundId = newBackgroundId;
            }

            notify.success("Background equipped!");
        })
        .catch(error => {
            console.error('Failed to update background:', error);
            alert('Failed to update background. Please try again.');
        });
}

async function migrateLocalBackgroundToBackend() {
    if (!isUserLoggedIn()) return;

    if (!window.user.backgroundId) {
        const localBackgroundId = localStorage.getItem('background_id');
        const localBackgroundUrl = localStorage.getItem('background_url');

        if (localBackgroundId) {
            try {
                await api.updateBackground(localBackgroundId);
                console.log('Migrated local background to backend');
            } catch (error) {
                console.error('Failed to migrate background:', error);
            }
        } else if (localBackgroundUrl) {
            const bgData = background_images.find(bg => bg.image_url === localBackgroundUrl);
            if (bgData) {
                try {
                    await api.updateBackground(bgData.id);
                    localStorage.setItem('background_id', bgData.id);
                    console.log('Migrated local background URL to backend');
                } catch (error) {
                    console.error('Failed to migrate background:', error);
                }
            }
        }
    }
}

window.addEventListener('online', async () => {
    if (isUserLoggedIn()) {
        const pendingBackgroundId = localStorage.getItem('pending_background_id');
        if (pendingBackgroundId) {
            try {
                await api.updateBackground(pendingBackgroundId);
                localStorage.removeItem('pending_background_id');
                console.log('Synced pending background change');
            } catch (error) {
                console.error('Failed to sync pending background:', error);
            }
        }
    }
});