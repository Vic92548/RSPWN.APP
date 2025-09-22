let githubStarsCache = null;
let githubStarsFetching = false;
const processedGithubElements = new WeakSet();

async function updateGitHubStars(element) {
    if (!element) {
        console.warn('GitHub stars element not found');
        return;
    }

    if (processedGithubElements.has(element)) {
        return;
    }
    processedGithubElements.add(element);

    if (githubStarsCache !== null) {
        element.innerHTML = `<i class="fa-solid fa-star"></i> ${githubStarsCache}`;
        return;
    }

    if (githubStarsFetching) {
        return;
    }

    githubStarsFetching = true;
    console.log('Fetching GitHub stars for element:', element);

    try {
        const response = await fetch('https://api.github.com/repos/Vic92548/VAPR');
        if (!response.ok) throw new Error('GitHub API error');

        const data = await response.json();
        const stars = data.stargazers_count;
        githubStarsCache = stars;

        console.log('GitHub stars count:', stars);

        document.querySelectorAll('#github_stars .menu-badge, .menu-badge.stars').forEach(el => {
            el.innerHTML = `<i class="fa-solid fa-star"></i> ${stars}`;
        });
    } catch (error) {
        console.error('Failed to fetch GitHub stars:', error);
        document.querySelectorAll('#github_stars .menu-badge, .menu-badge.stars').forEach(el => {
            el.innerHTML = '<i class="fa-solid fa-star"></i> N/A';
        });
    } finally {
        githubStarsFetching = false;
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