function openTermsPage() {
    console.log('openTermsPage function called');
    let termsPage = DOM.get('terms-page');
    const feed = DOM.get('feed');
    console.log('termsPage element:', termsPage);
    console.log('feed element:', feed);

    // If terms page doesn't exist, create it using the legal template
    if (!termsPage) {
        const termsContent = createTermsContent();
        const termsPageHTML = createLegalPage({
            pageId: 'terms-page',
            pageTitle: 'Terms of Service',
            lastUpdated: 'Last updated: January 17, 2025',
            version: '1.0',
            closeFunction: 'closeTermsPage',
            content: termsContent
        });

        // Insert the page into the DOM
        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('beforeend', termsPageHTML);
            termsPage = DOM.get('terms-page');
        }
    }

    if (termsPage && feed) {
        // Hide the feed and show terms page instantly
        feed.style.display = 'none';
        termsPage.style.display = 'flex';

        // Scroll to top
        const termsBody = termsPage.querySelector('.legal-body');
        if (termsBody) {
            termsBody.scrollTop = 0;
        }

        // Update URL without page reload
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'terms'}, 'Terms of Service - VAPR', '/terms');
        }

        // Update page title
        document.title = 'Terms of Service - VAPR';
    }
}

function closeTermsPage() {
    const termsPage = DOM.get('terms-page');
    const feed = DOM.get('feed');

    if (termsPage && feed) {
        // Hide the terms page and show the feed instantly
        termsPage.style.display = 'none';
        feed.style.display = 'block';

        // Update URL back to home
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'home'}, 'VAPR - The Gamer\'s Social Network', '/');
        }

        // Update page title back
        document.title = 'VAPR';
    }
}


// Handle direct navigation to /terms URL
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path === '/terms') {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            openTermsPage();
        }, 100);
    }
});

function createTermsContent() {
    return `
        ${createLegalSection('1. Acceptance of Terms', `
            <p>By accessing and using VAPR ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>
        `)}

        ${createLegalSection('2. Description of Service', `
            <p>VAPR is a gamified social platform where creators share content through a swipe-based interface. The platform includes user authentication via Discord, content posting with reactions, and an XP/leveling system.</p>
            ${createLegalList([
                'Social content sharing and discovery',
                'Gamification features including XP and leveling',
                'Creator tools and analytics',
                'Game integration and digital marketplace'
            ])}
        `)}

        ${createLegalSection('3. User Accounts', `
            <p>To access certain features of the Service, you must create an account using Discord authentication. You are responsible for:</p>
            ${createLegalList([
                'Maintaining the confidentiality of your account',
                'All activities that occur under your account',
                'Notifying us immediately of any unauthorized use',
                'Ensuring your account information is accurate and up-to-date'
            ])}
        `)}

        ${createLegalSection('4. Content Guidelines', `
            <p>Users are responsible for all content they post. Prohibited content includes:</p>
            ${createLegalList([
                'Illegal, harmful, or offensive material',
                'Content that violates intellectual property rights',
                'Spam, harassment, or abusive behavior',
                'Adult content or material inappropriate for all audiences',
                'False or misleading information'
            ])}
            <p>We reserve the right to remove content and suspend accounts that violate these guidelines.</p>
        `)}

        ${createLegalSection('5. Creator Program', `
            <p>Our Creator Program allows eligible users to monetize their content. Participation requires:</p>
            ${createLegalList([
                'Compliance with all platform guidelines',
                'Original, high-quality content creation',
                'Active engagement with the community',
                'Valid payment information for revenue sharing'
            ])}
            <p>Creator Program terms may change with notice to participants.</p>
        `)}

        ${createLegalSection('6. Game Integration', `
            <p>VAPR integrates with various games and digital platforms. Users acknowledge:</p>
            ${createLegalList([
                'Game keys and digital items are subject to third-party terms',
                'We are not responsible for external platform policies',
                'Digital purchases are final and non-refundable unless required by law',
                'Game availability may change without notice'
            ])}
        `)}

        ${createLegalSection('7. Privacy and Data', `
            <p>Your privacy is important to us. Please review our Privacy Policy for details on how we collect, use, and protect your information. By using VAPR, you consent to our data practices as outlined in our Privacy Policy.</p>
        `)}

        ${createLegalSection('8. Intellectual Property', `
            <p>The Service and its original content, features, and functionality are owned by VAPR and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.</p>
        `)}

        ${createLegalSection('9. Limitation of Liability', `
            <p>In no event shall VAPR, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.</p>
        `)}

        ${createLegalSection('10. Termination', `
            <p>We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.</p>
        `)}

        ${createLegalSection('11. Changes to Terms', `
            <p>We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.</p>
        `)}
    `;
}

// Export functions for global access
if (typeof window !== 'undefined') {
    window.openTermsPage = openTermsPage;
    window.closeTermsPage = closeTermsPage;
}