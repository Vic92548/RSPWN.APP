function openPrivacyPage() {
    console.log('openPrivacyPage function called');
    let privacyPage = DOM.get('privacy-page');
    const feed = DOM.get('feed');
    console.log('privacyPage element:', privacyPage);
    console.log('feed element:', feed);

    // If privacy page doesn't exist, create it using the legal template
    if (!privacyPage) {
        console.log('Creating privacy page...');
        console.log('createPrivacyContent exists:', typeof createPrivacyContent);
        console.log('createLegalPage exists:', typeof createLegalPage);

        const privacyContent = createPrivacyContent();
        console.log('Privacy content created, length:', privacyContent.length);

        const privacyPageHTML = createLegalPage({
            pageId: 'privacy-page',
            pageTitle: 'Privacy Policy',
            lastUpdated: 'Last updated: January 17, 2025',
            version: '1.0',
            closeFunction: 'closePrivacyPage',
            content: privacyContent
        });
        console.log('Privacy page HTML created, length:', privacyPageHTML.length);

        // Insert the page into the DOM
        const main = document.querySelector('main');
        console.log('Main element found:', !!main);
        if (main) {
            main.insertAdjacentHTML('beforeend', privacyPageHTML);
            privacyPage = DOM.get('privacy-page');
            console.log('Privacy page after insertion:', privacyPage);
        }
    }

    if (privacyPage && feed) {
        // Hide the feed and show privacy page instantly
        feed.style.display = 'none';
        privacyPage.style.display = 'flex';

        // Scroll to top
        const privacyBody = privacyPage.querySelector('.legal-body');
        if (privacyBody) {
            privacyBody.scrollTop = 0;
        }

        // Update URL without page reload
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'privacy'}, 'Privacy Policy - VAPR', '/privacy');
        }

        // Update page title
        document.title = 'Privacy Policy - VAPR';
    }
}

function closePrivacyPage() {
    const privacyPage = DOM.get('privacy-page');
    const feed = DOM.get('feed');

    if (privacyPage && feed) {
        // Hide the privacy page and show the feed instantly
        privacyPage.style.display = 'none';
        feed.style.display = 'block';

        // Update URL back to home
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'home'}, 'VAPR - The Gamer\'s Social Network', '/');
        }

        // Update page title back
        document.title = 'VAPR';
    }
}

// Handle direct navigation to /privacy URL
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path === '/privacy') {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            openPrivacyPage();
        }, 100);
    }
});

function createPrivacyContent() {
    return `
        ${createLegalSection('1. Information We Collect', `
            <p>We collect information you provide directly to us, such as when you create an account, post content, or contact us. This includes:</p>
            ${createLegalList([
                'Discord account information (username, email, profile picture)',
                'Content you post on our platform (text, images, videos)',
                'Messages and communications with us',
                'Usage data and analytics information'
            ])}
        `)}

        ${createLegalSection('2. How We Use Your Information', `
            <p>We use the information we collect to provide, maintain, and improve our services:</p>
            ${createLegalList([
                'Operating and maintaining the VAPR platform',
                'Personalizing your experience and content feed',
                'Communicating with you about updates and features',
                'Ensuring platform security and preventing abuse',
                'Analytics and improving our services'
            ])}
        `)}

        ${createLegalSection('3. Information Sharing', `
            <p>We do not sell, trade, or otherwise transfer your personal information to third parties, except in the following circumstances:</p>
            ${createLegalList([
                'With your explicit consent',
                'To comply with legal obligations or court orders',
                'To protect our rights and prevent fraud or abuse',
                'With service providers who assist in operating our platform',
                'In connection with business transfers or acquisitions'
            ])}
        `)}

        ${createLegalSection('4. Data Storage and Security', `
            <p>We implement appropriate security measures to protect your personal information:</p>
            ${createLegalList([
                'Encrypted data transmission using industry-standard protocols',
                'Secure server infrastructure and database protection',
                'Regular security audits and vulnerability assessments',
                'Limited access to personal data on a need-to-know basis',
                'Incident response procedures for potential data breaches'
            ])}
        `)}

        ${createLegalSection('5. Discord Integration', `
            <p>VAPR uses Discord for authentication and user identification. By using our service, you acknowledge:</p>
            ${createLegalList([
                'We access basic Discord profile information for account creation',
                'Discord\'s Privacy Policy also applies to authentication data',
                'We do not store Discord passwords or sensitive authentication tokens',
                'You can revoke Discord access through your Discord account settings'
            ])}
        `)}

        ${createLegalSection('6. Cookies and Tracking', `
            <p>We use cookies and similar technologies to enhance your experience:</p>
            ${createLegalList([
                'Essential cookies for platform functionality and security',
                'Analytics cookies to understand usage patterns (via Umami and PostHog)',
                'Preference cookies to remember your settings',
                'You can control cookie preferences through your browser settings'
            ])}
        `)}

        ${createLegalSection('7. Your Rights and Choices', `
            <p>You have certain rights regarding your personal information:</p>
            ${createLegalList([
                'Access and review your personal data',
                'Request correction of inaccurate information',
                'Delete your account and associated data',
                'Export your content and data',
                'Opt out of non-essential communications'
            ])}
        `)}

        ${createLegalSection('8. Data Retention', `
            <p>We retain your information for as long as necessary to provide our services and comply with legal obligations. Specifically:</p>
            ${createLegalList([
                'Account data is retained while your account is active',
                'Content may be retained for platform integrity after account deletion',
                'Analytics data is anonymized and retained for service improvement',
                'Legal compliance may require longer retention periods'
            ])}
        `)}

        ${createLegalSection('9. International Data Transfers', `
            <p>VAPR operates globally, and your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers.</p>
        `)}

        ${createLegalSection('10. Children\'s Privacy', `
            <p>Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will take steps to delete the information.</p>
        `)}

        ${createLegalSection('11. Changes to Privacy Policy', `
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last updated" date. Your continued use of the service after changes constitutes acceptance of the updated policy.</p>
        `)}

        ${createLegalSection('12. Contact Information', `
            <p>If you have questions about this Privacy Policy or our data practices, please contact us using the information provided in the footer below.</p>
        `)}
    `;
}

// Export functions for global access
if (typeof window !== 'undefined') {
    window.openPrivacyPage = openPrivacyPage;
    window.closePrivacyPage = closePrivacyPage;
}