async function updateGitHubStars(element) {
    if (!element) {
        console.warn('GitHub stars element not found');
        return;
    }

    console.log('Fetching GitHub stars for element:', element);

    try {
        const response = await fetch('https://api.github.com/repos/Vic92548/VAPR');
        if (!response.ok) throw new Error('GitHub API error');

        const data = await response.json();
        const stars = data.stargazers_count;

        console.log('GitHub stars count:', stars);
        element.innerHTML = `<i class="fa-solid fa-star"></i> ${stars}`;
    } catch (error) {
        console.error('Failed to fetch GitHub stars:', error);
        if (element) {
            element.innerHTML = '<i class="fa-solid fa-star"></i> N/A';
        }
    }
}

window.updateGitHubStars = updateGitHubStars;

if (window.VAPR) {
    VAPR.on('#github_stars', 'mounted', (element) => {
        const badgeElement = element.querySelector('.menu-badge');
        if (badgeElement) {
            updateGitHubStars(badgeElement);
        }
    });
}