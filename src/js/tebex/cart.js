class TebexCart {

    async getGameIdFromPackageId(packageId) {
        const tebexGame = gamesData.tebexGames?.find(g => g.tebexId === packageId);
        if (tebexGame) {
            const vaprGameId = await findVAPRGameIdByTitle(tebexGame.title);
            return vaprGameId;
        }
        return null;
    }
}

window.tebexCart = new TebexCart();