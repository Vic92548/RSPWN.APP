function openStorePage() {
    let storePage = DOM.get('store-page');
    const feed = DOM.get('feed');

    // If store page doesn't exist, create it using the legal template system
    if (!storePage) {
        const storeContent = createStoreContent();
        const storePageHTML = createLegalPage({
            pageId: 'store-page',
            pageTitle: 'Game Store',
            lastUpdated: 'Discover amazing games and digital content',
            version: '1.0',
            closeFunction: 'closeStorePage',
            content: storeContent
        });

        // Insert the page into the DOM
        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('beforeend', storePageHTML);
            storePage = DOM.get('store-page');
        }
    }

    if (storePage && feed) {
        // Hide the feed and show store page instantly
        feed.style.display = 'none';
        storePage.style.display = 'flex';

        // Scroll to top
        const storeBody = storePage.querySelector('.legal-body');
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
        // Hide the store page and show the feed instantly
        storePage.style.display = 'none';
        feed.style.display = 'block';

        // Update URL back to home
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'home'}, 'VAPR - The Gamer\'s Social Network', '/');
        }

        // Update page title back
        document.title = 'VAPR';
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
        <div class="store-search-section">
            <div class="store-search">
                <div class="search-input-wrapper">
                    <i class="fa-solid fa-search search-icon"></i>
                    <input type="text" class="store-search-input" placeholder="Search games..." id="store-search-input">
                </div>
            </div>
        </div>

        <div class="store-filters" id="store-filters">
            ${createStoreFilters()}
        </div>

        <div class="store-grid" id="store-grid">
            ${createStoreGrid()}
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

function viewGameDetails(gameId) {
    // Mock game details functionality
    alert(`Game details for ${gameId} would be implemented here`);
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
    window.viewGameDetails = viewGameDetails;
}