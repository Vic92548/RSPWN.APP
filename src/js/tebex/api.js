class TebexAPI {
    constructor(webstoreToken) {
        this.baseURL = 'https://headless.tebex.io/api';
        this.webstoreToken = webstoreToken;
    }

    async request(path, options = {}) {
        const url = `${this.baseURL}${path}`;

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });

            if (!response.ok) {
                throw new Error(`Tebex API error: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Tebex API request failed:', error);
            throw error;
        }
    }

    async getCategories(includePackages = true) {
        return this.request(`/accounts/${this.webstoreToken}/categories${includePackages ? '?includePackages=1' : ''}`);
    }

    async getPackages() {
        return this.request(`/accounts/${this.webstoreToken}/packages`);
    }

    async getPackage(packageId) {
        return this.request(`/accounts/${this.webstoreToken}/packages/${packageId}`);
    }

    async createBasket(completeUrl, cancelUrl) {
        return this.request(`/accounts/${this.webstoreToken}/baskets`, {
            method: 'POST',
            body: JSON.stringify({
                complete_url: completeUrl,
                cancel_url: cancelUrl,
                complete_auto_redirect: true
            })
        });
    }

    async addToBasket(basketIdent, packageId, quantity = 1) {
        return this.request(`/baskets/${basketIdent}/packages`, {
            method: 'POST',
            body: JSON.stringify({
                package_id: packageId,
                quantity: quantity
            })
        });
    }

    async getBasket(basketIdent) {
        return this.request(`/accounts/${this.webstoreToken}/baskets/${basketIdent}`);
    }

    async applyCoupon(basketIdent, couponCode) {
        return this.request(`/accounts/${this.webstoreToken}/baskets/${basketIdent}/coupons`, {
            method: 'POST',
            body: JSON.stringify({
                coupon_code: couponCode
            })
        });
    }

    async removeCoupon(basketIdent) {
        return this.request(`/accounts/${this.webstoreToken}/baskets/${basketIdent}/coupons/remove`, {
            method: 'POST'
        });
    }

    async removeFromBasket(basketIdent, packageId) {
        return this.request(`/baskets/${basketIdent}/packages/remove`, {
            method: 'POST',
            body: JSON.stringify({
                package_id: packageId
            })
        });
    }

    async applyCreatorCode(basketIdent, creatorCode) {
        return this.request(`/accounts/${this.webstoreToken}/baskets/${basketIdent}/creator-codes`, {
            method: 'POST',
            body: JSON.stringify({
                creator_code: creatorCode
            })
        });
    }

    async removeCreatorCode(basketIdent) {
        return this.request(`/accounts/${this.webstoreToken}/baskets/${basketIdent}/creator-codes/remove`, {
            method: 'POST'
        });
    }
}

window.tebexAPI = new TebexAPI('vrvh-cc39f45169dbd59b22582030e84f4e13d69d29a3');