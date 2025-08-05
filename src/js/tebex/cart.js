class TebexCart {
    constructor() {
        this.basketIdent = null;
        this.basketData = null;
        this.isProcessing = false;
    }

    async initialize() {
        try {
            const response = await tebexAPI.createBasket(
                `${window.location.origin}/checkout/success`,
                `${window.location.origin}/checkout/cancel`
            );

            this.basketIdent = response.data.ident;
            this.basketData = response.data;
            this.updateCartUI();
        } catch (error) {
            console.error('Failed to initialize cart:', error);
        }
    }

    async addItem(packageId, quantity = 1) {
        if (!this.basketIdent) {
            await this.initialize();
        }

        if (this.isProcessing) return;

        this.isProcessing = true;
        cardManager.showLoading('games-card');

        try {
            await tebexAPI.addToBasket(this.basketIdent, packageId, quantity);
            await this.refreshCart();

            notify.success('Item added to cart!');

            const cartButton = document.getElementById('cart-button');
            if (cartButton) {
                cartButton.style.display = 'flex';
            }

            setTimeout(() => {
                openCart();
            }, 300);

        } catch (error) {
            console.error('Failed to add item:', error);
            notify.error('Failed to add item to cart');
        } finally {
            this.isProcessing = false;
            cardManager.hideLoading('games-card');
        }
    }

    async removeItem(packageId) {
        if (!this.basketIdent || this.isProcessing) return;

        this.isProcessing = true;

        try {
            await tebexAPI.removeFromBasket(this.basketIdent, packageId);
            await this.refreshCart();
            notify.info('Item removed from cart');
        } catch (error) {
            console.error('Failed to remove item:', error);
            notify.error('Failed to remove item');
        } finally {
            this.isProcessing = false;
        }
    }

    async refreshCart() {
        if (!this.basketIdent) return;

        try {
            const response = await tebexAPI.getBasket(this.basketIdent);
            this.basketData = response.data;
            this.updateCartUI();
            this.renderCartItems();
        } catch (error) {
            console.error('Failed to refresh cart:', error);
        }
    }

    renderCartItems() {
        const container = document.getElementById('cart-items');
        if (!container) return;

        if (!this.basketData?.packages || this.basketData.packages.length === 0) {
            container.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            return;
        }

        container.innerHTML = this.basketData.packages.map(item => `
        <div class="cart-item">
            <div class="item-image-container">
                <img src="${item.image || 'https://via.placeholder.com/80'}" class="item-image" alt="${item.name}">
            </div>
            <div class="item-details">
                <h4>${item.name}</h4>
                <div class="item-price">${this.basketData.currency || 'EUR'} ${(item.in_basket.price || 0).toFixed(2)}</div>
            </div>
            <div class="item-quantity">
                <span>Qty: ${item.in_basket.quantity || 1}</span>
            </div>
            <button class="remove-item-btn" onclick="tebexCart.removeItem(${item.id})">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        const cartButton = document.getElementById('cart-button');

        if (this.basketData) {
            const totalItems = this.basketData.packages?.reduce((sum, item) => sum + (item.in_basket?.quantity || 1), 0) || 0;

            if (cartCount) {
                cartCount.textContent = totalItems;
                cartCount.style.display = totalItems > 0 ? 'block' : 'none';
            }

            if (cartButton && isUserLoggedIn()) {
                cartButton.style.display = totalItems > 0 ? 'flex' : 'none';
            }
        }

        if (cartTotal && this.basketData) {
            cartTotal.textContent = `${this.basketData.currency || 'EUR'} ${(this.basketData.total_price || 0).toFixed(2)}`;
        }
    }

    async applyCoupon(code) {
        if (!this.basketIdent || !code) return;

        try {
            await tebexAPI.applyCoupon(this.basketIdent, code);
            await this.refreshCart();
            notify.success('Coupon applied successfully!');
        } catch (error) {
            notify.error('Invalid coupon code');
        }
    }

    async checkout() {
        if (!this.basketIdent || !this.basketData) return;

        if (!this.basketData.packages || this.basketData.packages.length === 0) {
            notify.warning('Your cart is empty');
            return;
        }

        try {
            const response = await tebexAPI.getBasket(this.basketIdent);
            const checkoutUrl = response.data.links.checkout;

            window.location.href = checkoutUrl;
        } catch (error) {
            console.error('Checkout failed:', error);
            notify.error('Failed to proceed to checkout');
        }
    }

    showCartPreview() {
        const cartPreview = document.getElementById('cart-preview');
        if (cartPreview) {
            cartPreview.classList.add('show');
            setTimeout(() => {
                cartPreview.classList.remove('show');
            }, 3000);
        }
    }

    clearCart() {
        this.basketIdent = null;
        this.basketData = null;
        this.updateCartUI();
        this.renderCartItems();
    }
}

window.tebexCart = new TebexCart();