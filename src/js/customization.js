// Open background gallery card
function openCustomizationMenu() {
    if (!isUserLoggedIn() && MainPage) {
        openRegisterModal();
        return;
    }

    // Hide menu if open
    hideMenu();

    // Hide the current post
    const post = document.getElementsByClassName("post")[0];
    if (post) {
        post.style.display = "none";
    }

    // Show the backgrounds card
    const backgroundsCard = document.getElementById("backgrounds-card");
    if (backgroundsCard) {
        backgroundsCard.style.display = "block";

        // Trigger the show animation
        setTimeout(() => {
            backgroundsCard.classList.add("show");
        }, 10);
    }

    // Display backgrounds
    displayBackgroundImages();
}

// Close backgrounds card
function closeBackgroundsCard() {
    const backgroundsCard = document.getElementById("backgrounds-card");
    const post = document.getElementsByClassName("post")[0];

    if (backgroundsCard) {
        backgroundsCard.classList.remove("show");

        // Wait for animation to complete
        setTimeout(() => {
            backgroundsCard.style.display = "none";

            // Show the post again
            if (post) {
                post.style.display = "block";
            }
        }, 800);
    }
}

// Replace closeCustomizationMenu with the new function
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

    // Get current equipped background
    const currentBackground = localStorage.getItem('background_url');

    background_images.forEach((bg, index) => {
        const isUnlocked = user.level >= bg.unlock;
        const isEquipped = currentBackground === bg.image_url;
        const progress = Math.min((user.level / bg.unlock) * 100, 100);

        const card = document.createElement('div');
        card.className = `background-item ${!isUnlocked ? 'locked' : ''} ${isEquipped ? 'equipped' : ''}`;

        let rarityClass = `rarity-${bg.rarity}`;
        let rarityText = bg.rarity.charAt(0).toUpperCase() + bg.rarity.slice(1);

        card.innerHTML = `
            <div class="rarity-badge ${rarityClass}">${rarityText}</div>
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
                        colors: ['#4ecdc4', '#44a3aa', '#3d9a92']
                    });
                }

                // Update UI to show new equipped state
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

    const saved_background = localStorage.getItem('background_url');

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

            // Show success notification
            if (typeof Swal !== 'undefined') {
                const Toast = Swal.mixin({
                    toast: true,
                    position: "top-end",
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });

                Toast.fire({
                    icon: "success",
                    title: "Background equipped!"
                });
            }
        })
        .catch(error => {
            console.error('Failed to update background:', error);
            alert('Failed to update background. Please try again.');
        });
}