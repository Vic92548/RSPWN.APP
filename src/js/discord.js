async function updateDiscordMembers(element) {
    if (!element) {
        console.warn('Discord members element not found');
        return;
    }

    console.log('Fetching Discord members for element:', element);

    try {
        const response = await fetch('https://discord.com/api/guilds/1226141081964515449/widget.json');
        if (!response.ok) throw new Error('Discord API error');

        const data = await response.json();
        const memberCount = data.presence_count || 0;

        console.log('Discord member count:', memberCount);
        element.innerHTML = `<i class="fa-solid fa-users"></i> ${memberCount.toLocaleString()}`;
    } catch (error) {
        console.error('Failed to fetch Discord member count:', error);
        if (element) {
            element.innerHTML = '<i class="fa-solid fa-users"></i> N/A';
        }
    }
}

window.updateDiscordMembers = updateDiscordMembers;

if (window.VAPR) {
    VAPR.on('#discord_members', 'mounted', (element) => {
        updateDiscordMembers(element.querySelector('.menu-badge'));
    });
}