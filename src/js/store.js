function createStorePage(content) {
    return `
    <section id="store-page" class="store-container" style="display:none;">
        <button id="store_menu_btn" class="create-post-btn glass_bt" onclick="openMenu()"><i class="fa-solid fa-bars"></i></button>

        <div class="store-header">
            <div class="store-header-content">
                <div class="store-title-section">
                    <h1 class="store-title">RSPWN</h1>
                    <p class="store-subtitle">Discover amazing games and digital content</p>
                </div>
                <div class="store-header-search">
                    <div class="search-input-wrapper">
                        <i class="fa-solid fa-search search-icon"></i>
                        <input type="text" class="store-search-input" placeholder="Search games..." id="store-search-input">
                    </div>
                </div>
            </div>
        </div>

        <div class="store-body">
            <div class="store-content">
                ${content}
            </div>
        </div>
    </section>`;
}

function openStorePage() {
    let storePage = DOM.get('store-page');
    const feed = DOM.get('feed');

    // If store page doesn't exist, create it like legal pages do
    if (!storePage) {
        const storeContent = createStoreContent();
        const storePageHTML = createStorePage(storeContent);

        // Insert the page into the main element as a sibling to feed
        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('beforeend', storePageHTML);
            storePage = DOM.get('store-page');
        }
    }

    if (storePage && feed) {
        // Hide the feed and show store page (like legal pages do)
        feed.style.display = 'none';
        storePage.style.display = 'flex';

        // Scroll to top
        const storeBody = storePage.querySelector('.store-body');
        if (storeBody) {
            storeBody.scrollTop = 0;
        }

        // Update URL without page reload
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'store'}, 'Game Store - VAPR', '/store');
        }

        // Update page title
        document.title = 'Game Store - VAPR';

        // Initialize store functionality
        setTimeout(() => {
            initializeStore();
        }, 100);
    }
}

function closeStorePage() {
    const storePage = DOM.get('store-page');
    const feed = DOM.get('feed');

    if (storePage && feed) {
        // Hide the store page and show the feed (like legal pages do)
        storePage.style.display = 'none';
        feed.style.display = 'block';

        // Update URL back to home
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'home'}, 'RSPWN - The Gamer\'s Social Network', '/');
        }

        // Update page title back
        document.title = 'RSPWN';
    }
}

// Handle direct navigation to /store URL
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path === '/store') {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            openStorePage();
        }, 100);
    }
});

function createStoreContent() {
    return `
        <div class="featured-carousel-section">
            ${createFeaturedCarousel()}
        </div>

        <div class="store-filters" id="store-filters">
            ${createStoreFilters()}
        </div>

        <div class="store-grid" id="store-grid">
            ${createStoreGrid()}
        </div>
    `;
}

function createFeaturedCarousel() {
    const featuredGames = [
        {
            id: 'featured-1',
            title: 'Cyber Warriors 2077',
            description: 'Experience the ultimate cyberpunk adventure in a dystopian future. Battle through neon-lit streets, hack corporate systems, and uncover dark conspiracies that threaten humanity\'s last hope.',
            price: '$29.99',
            originalPrice: '$59.99',
            discount: '50%',
            category: 'action',
            rating: '4.8',
            reviews: '2.1k',
            image: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            backgroundImage: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            badge: 'featured',
            tags: ['Action', 'RPG', 'Cyberpunk', 'Open World']
        },
        {
            id: 'featured-2',
            title: 'Mystic Realms',
            description: 'Embark on an epic fantasy journey through magical worlds filled with ancient mysteries. Discover powerful artifacts, battle mythical creatures, and shape the destiny of entire realms.',
            price: '$24.99',
            originalPrice: '$39.99',
            discount: '37%',
            category: 'adventure',
            rating: '4.6',
            reviews: '1.8k',
            image: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            backgroundImage: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            badge: 'new',
            tags: ['Adventure', 'Fantasy', 'Magic', 'Story Rich']
        },
        {
            id: 'featured-3',
            title: 'Space Colony Alpha',
            description: 'Build and manage thriving colonies across the galaxy. Master resource management, research cutting-edge technologies, and ensure the survival of humanity among the stars.',
            price: '$27.99',
            originalPrice: '$44.99',
            discount: '38%',
            category: 'strategy',
            rating: '4.5',
            reviews: '780',
            image: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            backgroundImage: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            badge: 'featured',
            tags: ['Strategy', 'Simulation', 'Space', 'Colony Management']
        }
    ];

    return `
        <div class="featured-carousel">
            <div class="featured-main" id="featured-main">
                ${createFeaturedMainDisplay(featuredGames[0])}
            </div>
            <div class="featured-sidebar">
                <h3 class="featured-sidebar-title">Featured Games</h3>
                <div class="featured-list" id="featured-list">
                    ${featuredGames.map((game, index) => createFeaturedListItem(game, index)).join('')}
                </div>
            </div>
        </div>
    `;
}

function createFeaturedMainDisplay(game) {
    return `
        <div class="featured-main-bg" style="background-image: url('${game.image}')"></div>
        <div class="featured-main-overlay"></div>
        <div class="featured-main-content">
            <div class="featured-game-info">
                <h1 class="featured-title">${game.title}</h1>
                <div class="featured-price-section">
                    <div class="featured-discount">-${game.discount}</div>
                    <div class="featured-prices">
                        <span class="featured-original-price">${game.originalPrice}</span>
                        <span class="featured-current-price">${game.price}</span>
                    </div>
                </div>
                <div class="featured-actions">
                    <button class="featured-buy-btn" onclick="purchaseGame('${game.id}')">
                        <i class="fa-solid fa-shopping-cart"></i>
                        Buy Now
                    </button>
                    <button class="featured-wishlist-btn" onclick="addToWishlist('${game.id}')">
                        <i class="fa-solid fa-heart"></i>
                        Wishlist
                    </button>
                </div>
            </div>
        </div>
    `;
}

function createFeaturedListItem(game, index) {
    return `
        <div class="featured-list-item ${index === 0 ? 'active' : ''}" data-game-index="${index}" onclick="selectFeaturedGame(${index})">
            <div class="featured-item-image">
                <img src="${game.image}" alt="${game.title}" loading="lazy">
            </div>
            <div class="featured-item-info">
                <h4 class="featured-item-title">${game.title}</h4>
                <div class="featured-item-price">${game.price}</div>
            </div>
            <div class="featured-item-progress">
                <div class="progress-bar" id="progress-${index}">
                    <div class="progress-fill"></div>
                </div>
            </div>
        </div>
    `;
}

function createStoreFilters() {
    const filters = [
        { category: 'all', label: 'All Games', active: true },
        { category: 'action', label: 'Action', active: false },
        { category: 'adventure', label: 'Adventure', active: false },
        { category: 'strategy', label: 'Strategy', active: false },
        { category: 'indie', label: 'Indie', active: false },
        { category: 'featured', label: 'Featured', active: false }
    ];

    return filters.map(filter =>
        `<store-filter category="${filter.category}" label="${filter.label}" ${filter.active ? 'active="true"' : ''}></store-filter>`
    ).join('');
}

function createStoreGrid() {
    const mockGames = [
        {
            id: 'game-1',
            title: 'Cyber Warriors 2077',
            description: 'An epic cyberpunk adventure in a dystopian future. Battle through neon-lit streets and uncover corporate conspiracies.',
            price: '$29.99',
            category: 'action',
            rating: '4.8',
            reviews: '2.1k',
            image: 'https://via.placeholder.com/300x180/0066cc/ffffff?text=Cyber+Warriors',
            badge: 'featured',
            isFeatured: true
        },
        {
            id: 'game-2',
            title: 'Mystic Realms',
            description: 'Explore magical worlds filled with ancient mysteries and powerful artifacts. Your destiny awaits.',
            price: '$24.99',
            category: 'adventure',
            rating: '4.6',
            reviews: '1.8k',
            image: 'https://via.placeholder.com/300x180/8b5cf6/ffffff?text=Mystic+Realms',
            badge: 'new'
        },
        {
            id: 'game-3',
            title: 'Empire Builder',
            description: 'Build and manage your own civilization. Lead armies, research technologies, and conquer new lands.',
            price: '$34.99',
            category: 'strategy',
            rating: '4.7',
            reviews: '950',
            image: 'https://via.placeholder.com/300x180/059669/ffffff?text=Empire+Builder',
            badge: ''
        },
        {
            id: 'game-4',
            title: 'Neon Racer',
            description: 'High-speed racing through futuristic cities. Customize your vehicle and dominate the competition.',
            price: '$19.99',
            category: 'action',
            rating: '4.4',
            reviews: '1.2k',
            image: 'https://via.placeholder.com/300x180/dc2626/ffffff?text=Neon+Racer',
            badge: ''
        },
        {
            id: 'game-5',
            title: 'Pixel Quest',
            description: 'A charming indie adventure with retro graphics and modern gameplay. Perfect for casual gaming sessions.',
            price: '$14.99',
            category: 'indie',
            rating: '4.9',
            reviews: '3.4k',
            image: 'https://via.placeholder.com/300x180/f59e0b/ffffff?text=Pixel+Quest',
            badge: 'featured',
            isFeatured: true
        },
        {
            id: 'game-6',
            title: 'Space Colony Alpha',
            description: 'Manage resources and build thriving colonies across the galaxy. The future of humanity is in your hands.',
            price: '$27.99',
            category: 'strategy',
            rating: '4.5',
            reviews: '780',
            image: 'https://via.placeholder.com/300x180/7c3aed/ffffff?text=Space+Colony',
            badge: 'new'
        },
        {
            id: 'game-7',
            title: 'Shadow Legends',
            description: 'An epic fantasy RPG with deep character customization and engaging storylines.',
            price: '$39.99',
            category: 'adventure',
            rating: '4.3',
            reviews: '2.7k',
            image: 'https://via.placeholder.com/300x180/1f2937/ffffff?text=Shadow+Legends',
            badge: ''
        },
        {
            id: 'game-8',
            title: 'Retro Arcade Mix',
            description: 'A collection of classic arcade games reimagined for modern players. Nostalgia meets innovation.',
            price: '$12.99',
            category: 'indie',
            rating: '4.6',
            reviews: '1.5k',
            image: 'https://via.placeholder.com/300x180/ec4899/ffffff?text=Retro+Arcade',
            badge: ''
        }
    ];

    return mockGames.map(game => createStoreItem(game)).join('');
}

function createStoreItem(game) {
    const stars = '★'.repeat(Math.floor(parseFloat(game.rating)));

    return `<store-item
        id="${game.id}"
        title="${game.title}"
        description="${game.description}"
        price="${game.price}"
        category="${game.category}"
        rating="${game.rating}"
        reviews="${game.reviews}"
        image="${game.image}"
        stars="${stars}"
        ${game.badge ? `badge="${game.badge}"` : ''}
    ></store-item>`;
}

function initializeStore() {
    // Wait for templates to be processed, then initialize functionality
    setTimeout(() => {
        initializeStoreFilters();
        initializeStoreSearch();
        initializeFeaturedCarousel();
    }, 100);
}

function initializeStoreFilters() {
    // Initialize filter functionality using template system
    const filterBtns = document.querySelectorAll('.store-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            filterGames(category);

            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function initializeStoreSearch() {
    // Initialize search functionality
    const searchInput = document.getElementById('store-search-input');
    const mobileSearchInput = document.getElementById('store-search-mobile-input');

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            searchGames(this.value);
        });
    }

    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('input', function() {
            searchGames(this.value);
        });
    }

    // Show mobile search on smaller screens
    if (window.innerWidth <= 768) {
        const mobileSearch = document.querySelector('.store-search-mobile');
        if (mobileSearch) {
            mobileSearch.style.display = 'block';
        }
    }
}

function filterGames(category) {
    const storeItems = document.querySelectorAll('.store-item');

    storeItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function searchGames(query) {
    const storeItems = document.querySelectorAll('.store-item');
    const lowercaseQuery = query.toLowerCase();

    storeItems.forEach(item => {
        const title = item.querySelector('.store-item-title').textContent.toLowerCase();
        const description = item.querySelector('.store-item-description').textContent.toLowerCase();
        const category = item.dataset.category.toLowerCase();

        if (title.includes(lowercaseQuery) ||
            description.includes(lowercaseQuery) ||
            category.includes(lowercaseQuery)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function purchaseGame(gameId) {
    // Mock purchase functionality
    alert(`Purchase functionality for game ${gameId} would be implemented here`);
}


function addToWishlist(gameId) {
    // Mock wishlist functionality
    alert(`Added ${gameId} to wishlist`);
}

// Featured Carousel Variables
let currentFeaturedIndex = 0;
let carouselInterval;
let progressIntervals = [];
const CAROUSEL_DURATION = 8000; // 8 seconds per game

function initializeFeaturedCarousel() {
    const featuredGames = getFeaturedGamesData();

    if (featuredGames.length === 0) return;

    // Start the carousel
    startCarouselTimer();

    // Initialize progress bars
    startProgressBars();
}

function getFeaturedGamesData() {
    // Same data as in createFeaturedCarousel function
    return [
        {
            id: 'featured-1',
            title: 'Cyber Warriors 2077',
            description: 'Experience the ultimate cyberpunk adventure in a dystopian future. Battle through neon-lit streets, hack corporate systems, and uncover dark conspiracies that threaten humanity\'s last hope.',
            price: '$29.99',
            originalPrice: '$59.99',
            discount: '50%',
            category: 'action',
            rating: '4.8',
            reviews: '2.1k',
            image: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            backgroundImage: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            badge: 'featured',
            tags: ['Action', 'RPG', 'Cyberpunk', 'Open World']
        },
        {
            id: 'featured-2',
            title: 'Mystic Realms',
            description: 'Embark on an epic fantasy journey through magical worlds filled with ancient mysteries. Discover powerful artifacts, battle mythical creatures, and shape the destiny of entire realms.',
            price: '$24.99',
            originalPrice: '$39.99',
            discount: '37%',
            category: 'adventure',
            rating: '4.6',
            reviews: '1.8k',
            image: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            backgroundImage: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            badge: 'new',
            tags: ['Adventure', 'Fantasy', 'Magic', 'Story Rich']
        },
        {
            id: 'featured-3',
            title: 'Space Colony Alpha',
            description: 'Build and manage thriving colonies across the galaxy. Master resource management, research cutting-edge technologies, and ensure the survival of humanity among the stars.',
            price: '$27.99',
            originalPrice: '$44.99',
            discount: '38%',
            category: 'strategy',
            rating: '4.5',
            reviews: '780',
            image: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            backgroundImage: 'https://vapr-club.b-cdn.net/posts/0c31c343-a6ab-4e3d-937f-ae6bc757e9df.png',
            badge: 'featured',
            tags: ['Strategy', 'Simulation', 'Space', 'Colony Management']
        }
    ];
}

function selectFeaturedGame(index) {
    const featuredGames = getFeaturedGamesData();

    if (index < 0 || index >= featuredGames.length) return;

    currentFeaturedIndex = index;

    // Update main display
    updateFeaturedMainDisplay(featuredGames[index]);

    // Update active states
    updateFeaturedListActive(index);

    // Reset timers
    resetCarouselTimer();
    resetProgressBars();
    startProgressBars();
}

function updateFeaturedMainDisplay(game) {
    const mainDisplay = document.getElementById('featured-main');
    if (mainDisplay) {
        mainDisplay.innerHTML = createFeaturedMainDisplay(game);
    }
}

function updateFeaturedListActive(activeIndex) {
    const listItems = document.querySelectorAll('.featured-list-item');
    listItems.forEach((item, index) => {
        if (index === activeIndex) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function startCarouselTimer() {
    carouselInterval = setInterval(() => {
        const featuredGames = getFeaturedGamesData();
        currentFeaturedIndex = (currentFeaturedIndex + 1) % featuredGames.length;
        selectFeaturedGame(currentFeaturedIndex);
    }, CAROUSEL_DURATION);
}

function resetCarouselTimer() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    startCarouselTimer();
}

function startProgressBars() {
    const featuredGames = getFeaturedGamesData();

    // Clear existing intervals
    progressIntervals.forEach(interval => clearInterval(interval));
    progressIntervals = [];

    // Reset all progress backgrounds
    featuredGames.forEach((_, index) => {
        const listItem = document.querySelector(`.featured-list-item[data-game-index="${index}"]`);
        if (listItem) {
            listItem.style.setProperty('--progress-width', '0%');
        }
    });

    // Start progress for current active item
    startProgressForItem(currentFeaturedIndex);
}

function startProgressForItem(index) {
    const listItem = document.querySelector(`.featured-list-item[data-game-index="${index}"]`);
    if (!listItem) return;

    let progress = 0;
    const increment = 100 / (CAROUSEL_DURATION / 50); // Update every 50ms

    const interval = setInterval(() => {
        progress += increment;
        const progressWidth = Math.min(progress, 100);
        listItem.style.setProperty('--progress-width', `${progressWidth}%`);

        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 50);

    progressIntervals.push(interval);
}

function resetProgressBars() {
    // Clear all progress intervals
    progressIntervals.forEach(interval => clearInterval(interval));
    progressIntervals = [];

    // Reset all progress backgrounds to 0
    const featuredGames = getFeaturedGamesData();
    featuredGames.forEach((_, index) => {
        const listItem = document.querySelector(`.featured-list-item[data-game-index="${index}"]`);
        if (listItem) {
            listItem.style.setProperty('--progress-width', '0%');
        }
    });
}

// Template event listeners
if (typeof window.VAPR !== 'undefined') {
    // Store filter button events
    VAPR.on('store-filter', 'mounted', (element) => {
        element.addEventListener('click', function() {
            const category = this.dataset.category;
            filterGames(category);

            // Update active state
            const filterBtns = document.querySelectorAll('.store-filter-btn');
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Store item events
    VAPR.on('store-item', 'mounted', (element) => {
        // Any additional store item initialization can go here
        console.log('Store item mounted:', element.dataset.gameId);
    });
}

// Export functions for global access
if (typeof window !== 'undefined') {
    window.openStorePage = openStorePage;
    window.closeStorePage = closeStorePage;
    window.purchaseGame = purchaseGame;
    window.addToWishlist = addToWishlist;
    window.selectFeaturedGame = selectFeaturedGame;
}