async function updateGithubStars(element) {
    try {
        const response = await fetch('https://api.github.com/repos/Vic92548/VAPR');
        if (!response.ok) throw new Error('GitHub API error');

        const data = await response.json();
        const stars = data.stargazers_count;

        element.textContent = `${stars} ⭐`;
    } catch (error) {
        console.error('Failed to fetch GitHub stars:', error);
        element.textContent = '⭐️ N/A';
    }
}

if(MainPage){
    updateGithubStars(document.getElementById('github_stars'));
}