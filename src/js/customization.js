function equipBackground(url, save = true) {

    if(!MainPage){
        return;
    }

    const saved_background = localStorage.getItem('background_url');
    closeCustomizationMenu();
    hideMenu();

    if(!saved_background){
        localStorage.setItem('background_url', url);
    }else if(saved_background !== url) {
        localStorage.setItem('background_url', url);
    }
    document.body.style.backgroundImage = 'url(' + url + ')';
}

function updateBackgroundId(newBackgroundId) {
    if (!isUserLoggedIn()) {
        alert('You must be logged in to update your background.');
        return;
    }

    const path = `/me/update-background?backgroundId=${encodeURIComponent(newBackgroundId)}`;
    makeApiRequest(path, true)
        .then(response => {
            console.log('Background updated successfully:', response);
            // Optionally refresh user data or UI components if necessary
        })
        .catch(error => {
            console.error('Failed to update background:', error);
            alert('Failed to update background. Please try again.');
        });
}

function openCustomizationMenu() {
    displayBackgroundImages();
    document.getElementById("background_images").style.display = "flex";
}

function closeCustomizationMenu() {
    document.getElementById("background_images").style.display = "none";
}

function displayBackgroundImages() {
    if (!isUserLoggedIn() && MainPage) {
        openRegisterModal();
        return;
    }

    const container = document.getElementById("background_images_container");
    container.innerHTML = '';

    // Get current equipped background
    const currentBackground = localStorage.getItem('background_url');

    background_images.forEach(bg => {
        const isUnlocked = user.level >= bg.unlock;
        const isEquipped = currentBackground === bg.image_url;
        const progress = Math.min((user.level / bg.unlock) * 100, 100);

        const card = document.createElement('li');
        card.className = `background-card ${!isUnlocked ? 'locked' : ''} ${isEquipped ? 'equipped' : ''}`;

        let rarityClass = `rarity-${bg.rarity}`;
        let rarityText = bg.rarity.charAt(0).toUpperCase() + bg.rarity.slice(1);

        card.innerHTML = `
            <div class="rarity-badge ${rarityClass}">${rarityText}</div>
            ${bg.new && isUnlocked ? '<div class="new-badge">NEW</div>' : ''}
            
            <img src="${bg.image_url}" class="background-preview" alt="${bg.title}">
            
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
                // Add selection animation
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 100);

                updateBackgroundId(bg.id);
                equipBackground(bg.image_url);

                // Show success animation
                if (typeof confetti !== 'undefined') {
                    confetti({
                        particleCount: 50,
                        spread: 50,
                        origin: { y: 0.6 },
                        colors: ['#ff6b6b', '#4ecdc4', '#ffe66d']
                    });
                }

                // Update UI to show new equipped state
                displayBackgroundImages();
            };
        }

        container.appendChild(card);
    });
}