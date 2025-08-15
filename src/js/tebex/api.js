class TebexAPI {
    constructor() {
        this.baseURL = 'https://headless.tebex.io/api';
        this.configs = [];
    }

    async loadConfigs() {
        try {
            const response = await fetch('/api/tebex-configs', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                this.configs = data.configs;
            }
        } catch (error) {
            console.error('Failed to load Tebex configurations:', error);
        }
    }

    async request(path, options = {}, webstoreToken = null) {
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

    async getAllPackages() {
        await this.loadConfigs();

        const allPackages = [];

        for (const config of this.configs) {
            try {
                const response = await this.request(`/accounts/${config.webstoreToken}/packages`);
                const packages = response.data || [];

                const packagesWithStore = packages.map(pkg => ({
                    ...pkg,
                    storeInfo: {
                        userId: config.userId,
                        username: config.username,
                        storeName: config.storeName,
                        webstoreToken: config.webstoreToken
                    }
                }));

                allPackages.push(...packagesWithStore);
            } catch (error) {
                console.error(`Failed to load packages for store ${config.storeName}:`, error);
            }
        }

        return { data: allPackages };
    }

    async getPackagesForStore(webstoreToken) {
        return this.request(`/accounts/${webstoreToken}/packages`);
    }

    async getPackage(packageId, webstoreToken) {
        return this.request(`/accounts/${webstoreToken}/packages/${packageId}`);
    }

    async createBasket(completeUrl, cancelUrl, webstoreToken) {
        return this.request(`/accounts/${webstoreToken}/baskets`, {
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

    async getBasket(basketIdent, webstoreToken) {
        return this.request(`/accounts/${webstoreToken}/baskets/${basketIdent}`);
    }

    async applyCreatorCode(basketIdent, creatorCode, webstoreToken) {
        return this.request(`/accounts/${webstoreToken}/baskets/${basketIdent}/creator-codes`, {
            method: 'POST',
            body: JSON.stringify({
                creator_code: creatorCode
            })
        });
    }
}

window.tebexAPI = new TebexAPI();