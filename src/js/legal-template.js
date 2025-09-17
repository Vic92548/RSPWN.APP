// Legal Page Template Helper Functions

function createLegalPage(config) {
    const {
        pageId,
        pageTitle,
        lastUpdated,
        version = "1.0",
        closeFunction,
        content
    } = config;

    return `
    <section id="${pageId}" class="legal-container" style="display:none;">
        <button id="legal_menu_btn" class="create-post-btn glass_bt" onclick="openMenu()"><i class="fa-solid fa-bars"></i></button>
        <div class="legal-header">
            <div class="legal-header-content">
                <button class="legal-back-btn" onclick="${closeFunction}()">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <div class="legal-title-section">
                    <h1 class="legal-title">${pageTitle}</h1>
                    <p class="legal-subtitle">${lastUpdated}</p>
                </div>
            </div>
        </div>

        <div class="legal-body">
            <div class="legal-content">
                ${content}
            </div>

            <div class="legal-footer">
                <div class="legal-footer-content">
                    <div class="legal-contact">
                        <h3>Contact Information</h3>
                        <p>For questions regarding this document, please contact us:</p>
                        <div class="legal-contact-links">
                            <a href="https://discord.gg/vtsnj3zphd" target="_blank" class="legal-contact-btn">
                                <i class="fa-brands fa-discord"></i>
                                <span>Discord Server</span>
                            </a>
                            <a href="mailto:legal@vapr.club" class="legal-contact-btn">
                                <i class="fa-solid fa-envelope"></i>
                                <span>legal@vapr.club</span>
                            </a>
                        </div>
                    </div>

                    <div class="legal-nav">
                        <h3>Legal Documents</h3>
                        <div class="legal-nav-links">
                            <a href="#" onclick="openTermsPage()" class="legal-nav-link">
                                <i class="fa-solid fa-scale-balanced"></i>
                                <span>Terms of Service</span>
                            </a>
                            <a href="#" onclick="openPrivacyPage()" class="legal-nav-link">
                                <i class="fa-solid fa-shield-halved"></i>
                                <span>Privacy Policy</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div class="legal-copyright">
                    <p>&copy; 2025 VAPR. All rights reserved. Document version ${version} - ${lastUpdated}</p>
                </div>
            </div>
        </div>
    </section>`;
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