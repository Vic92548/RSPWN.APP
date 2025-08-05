async function initializeTebexIntegration() {
    if (!window.tebexCart) {
        window.tebexCart = new TebexCart();
    }

    if (isUserLoggedIn()) {
        await tebexCart.initialize();
    }
}

async function addToCart(tebexPackageId) {
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }

    await tebexCart.addItem(tebexPackageId);
}

function openCart() {
    if (!isUserLoggedIn()) {
        openRegisterModal();
        return;
    }

    cardManager.show('cart-modal');
    tebexCart.refreshCart();
}

function closeCart() {
    cardManager.hide('cart-modal');
}

function handleCheckoutSuccess() {
    tebexCart.clearCart();

    notify.success('Purchase completed successfully!');

    if (window.loadLibraryData) {
        loadLibraryData();
    }
}

function handleCheckoutCancel() {
    notify.info('Checkout cancelled');
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);

    if (window.location.pathname === '/checkout/success') {
        handleCheckoutSuccess();
        window.history.replaceState({}, '', '/');
    } else if (window.location.pathname === '/checkout/cancel') {
        handleCheckoutCancel();
        window.history.replaceState({}, '', '/');
    }

    if (isUserLoggedIn()) {
        initializeTebexIntegration();
    }
});

cardManager.register('cart-modal', {
    onShow: () => {
        tebexCart.refreshCart();
    }
});

window.addToCart = addToCart;
window.openCart = openCart;
window.closeCart = closeCart;