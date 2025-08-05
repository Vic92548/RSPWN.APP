async function loadTebexGames() {
    try {
        const tebexResponse = await tebexAPI.getPackages();
        const tebexGames = tebexResponse.data || [];

        console.log({tebexGames});

        const transformedGames = transformTebexGames(tebexGames);

        gamesData.tebexGames = transformedGames;

        displayGames();
    } catch (error) {
        console.error('Error loading Tebex games:', error);
    }
}

function transformTebexGames(tebexPackages) {
    return tebexPackages.map(pkg => ({
        id: `tebex-${pkg.id}`,
        title: pkg.name,
        description: pkg.description,
        coverImage: pkg.image || 'https://via.placeholder.com/300x169',
        price: pkg.total_price,
        currency: pkg.currency,
        isTebexProduct: true,
        tebexId: pkg.id,
        category: pkg.category?.name || 'Games',
        onSale: pkg.discount > 0,
        originalPrice: pkg.base_price,
        salePrice: pkg.total_price,
        discount: pkg.discount
    }));
}