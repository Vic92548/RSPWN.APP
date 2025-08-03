async function updateGithubStars(element) {
    try {
        const response = await fetch('https://api.github.com/repos/Vic92548/VAPR');
        if (!response.ok) throw new Error('GitHub API error');

        const data = await response.json();
        const stars = data.stargazers_count;

        element.innerHTML = `<i class="fa-solid fa-star"></i> ${stars}`;
    } catch (error) {
        console.error('Failed to fetch GitHub stars:', error);
        element.innerHTML = '<i class="fa-solid fa-star"></i> N/A';
    }
}

if (window.VAPR) {
    VAPR.on('#github_stars', 'mounted', (element) => {
        console.log({element});
        console.log(element.querySelector('.menu-badge'));
        updateGithubStars(element.querySelector('.menu-badge'));
    });
}