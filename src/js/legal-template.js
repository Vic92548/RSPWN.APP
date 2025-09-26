// Legal Page Template Helper Functions using VAPR Template Engine

function createLegalPage(config) {
    const {
        pageId,
        pageTitle,
        lastUpdated,
        version = "1.0",
        closeFunction,
        content
    } = config;

    // Create the legal page element using VAPR template engine
    const legalPage = window.VAPR.createElement('legal-page', {
        'page-id': pageId,
        'page-title': pageTitle,
        'last-updated': lastUpdated,
        'close-function': closeFunction
    });

    // Set the content
    legalPage.innerHTML = content;

    // Get the HTML string from the element
    const wrapper = document.createElement('div');
    wrapper.appendChild(legalPage);

    // Process the element through the template engine
    window.VAPR.render(legalPage);

    return wrapper.innerHTML;
}

function createLegalSection(title, content) {
    return `
    <div class="legal-section">
        <h2 class="section-header">${title}</h2>
        ${content}
    </div>`;
}

function createLegalList(items) {
    const listItems = items.map(item => `<li>${item}</li>`).join('');
    return `<ul class="legal-list">${listItems}</ul>`;
}

// Export functions for global access
if (typeof window !== 'undefined') {
    window.createLegalPage = createLegalPage;
    window.createLegalSection = createLegalSection;
    window.createLegalList = createLegalList;
}