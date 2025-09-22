let discordMembersCache = null;
let discordMembersFetching = false;
const processedDiscordElements = new WeakSet();

async function updateDiscordMembers(element) {
    if (!element) {
        console.warn('Discord members element not found');
        return;
    }

    if (processedDiscordElements.has(element)) {
        return;
    }
    processedDiscordElements.add(element);

    if (discordMembersCache !== null) {
        element.innerHTML = `<i class="fa-solid fa-users"></i> ${discordMembersCache.toLocaleString()}`;
        return;
    }

    if (discordMembersFetching) {
        return;
    }

    discordMembersFetching = true;
    console.log('Fetching Discord members for element:', element);

    try {
        const response = await fetch('https://discord.com/api/guilds/1226141081964515449/widget.json');
        if (!response.ok) throw new Error('Discord API error');

        const data = await response.json();
        const memberCount = data.presence_count || 0;
        discordMembersCache = memberCount;

        console.log('Discord member count:', memberCount);

        document.querySelectorAll('#discord_members .menu-badge, .menu-badge.members').forEach(el => {
            el.innerHTML = `<i class="fa-solid fa-users"></i> ${memberCount.toLocaleString()}`;
        });
    } catch (error) {
        console.error('Failed to fetch Discord member count:', error);
        document.querySelectorAll('#discord_members .menu-badge, .menu-badge.members').forEach(el => {
            el.innerHTML = '<i class="fa-solid fa-users"></i> N/A';
        });
    } finally {
        discordMembersFetching = false;
    }
}

window.updateDiscordMembers = updateDiscordMembers;

if (window.VAPR) {
    VAPR.on('#discord_members', 'mounted', (element) => {
        updateDiscordMembers(element.querySelector('.menu-badge'));
    });
}