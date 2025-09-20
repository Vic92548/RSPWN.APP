// Authentication Page System
function createAuthPageTemplate(content) {
    return `
    <section id="auth-page" class="auth-container" style="display:none;">
        <div class="auth-header">
            <div class="auth-header-content">
                <div class="auth-title-section">
                    <h1 class="auth-title">
                        <span class="letter-r">R</span>
                        <span class="letter-s">S</span>
                        <span class="letter-p">P</span>
                        <span class="letter-w">W</span>
                        <span class="letter-n">N</span>
                    </h1>
                    <p class="auth-subtitle">The Gamer's Social Network</p>
                </div>
            </div>
        </div>

        <div class="auth-body">
            <div class="auth-content">
                ${content}
            </div>
        </div>
    </section>`;
}

function createAuthContent() {
    return `
        <!-- Main Welcome Section -->
        <div class="auth-welcome-section">
            <div class="welcome-content">
                <h2>Join the Gaming Revolution</h2>
                <p class="welcome-description">Connect with thousands of gamers, share your content, and grow your audience on RSPWN - the platform built by gamers, for gamers.</p>

                <div class="auth-form">
                    <input type="email" id="email-input" placeholder="Enter your email" class="email-input">
                    <button onclick="sendMagicLink()" class="magic-link-btn">
                        <div class="btn-content">
                            <i class="fa-solid fa-envelope"></i>
                            <span>Send Magic Link</span>
                        </div>
                        <div class="btn-glow"></div>
                    </button>
                    <div class="divider">
                        <span>or</span>
                    </div>
                    <button onclick="sendOTP()" class="otp-btn">
                        <div class="btn-content">
                            <i class="fa-solid fa-key"></i>
                            <span>Send OTP Code</span>
                        </div>
                    </button>
                    <div id="otp-section" class="otp-section" style="display: none;">
                        <input type="text" id="otp-input" placeholder="Enter 6-digit code" class="otp-input" maxlength="6">
                        <button onclick="verifyOTP()" class="verify-btn">
                            <span>Verify Code</span>
                        </button>
                    </div>
                    <div id="auth-status" class="auth-status"></div>
                </div>

                <div class="security-badges">
                    <div class="security-badge">
                        <i class="fa-solid fa-lock"></i>
                        <span>Secure OAuth</span>
                    </div>
                    <div class="security-badge">
                        <i class="fa-solid fa-server"></i>
                        <span>Passwordless login</span>
                    </div>
                    <div class="security-badge">
                        <i class="fa-solid fa-user-shield"></i>
                        <span>Privacy protected</span>
                    </div>
                </div>

                <div class="auth-switch">
                    <p>Prefer separate flows? <button onclick="openSignupPage()" class="link-btn">Sign up</button> or <button onclick="openSigninPage()" class="link-btn">Sign in</button></p>
                </div>
            </div>
        </div>

        <!-- Features Section -->
        <div class="auth-features-section">
            <h3 class="section-title">Why Gamers Choose RSPWN</h3>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon-wrapper">
                        <i class="fa-solid fa-chart-line"></i>
                        <div class="feature-icon-bg"></div>
                    </div>
                    <h4>Advanced Analytics</h4>
                    <p>Track views, engagement, and growth with professional analytics dashboard</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon-wrapper">
                        <i class="fa-solid fa-trophy"></i>
                        <div class="feature-icon-bg"></div>
                    </div>
                    <h4>Gamified Experience</h4>
                    <p>Level up, earn XP, and unlock exclusive backgrounds as you grow</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon-wrapper">
                        <i class="fa-solid fa-users"></i>
                        <div class="feature-icon-bg"></div>
                    </div>
                    <h4>Growing Community</h4>
                    <p>Connect with gamers who share your passion and grow together</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon-wrapper">
                        <i class="fa-brands fa-github"></i>
                        <div class="feature-icon-bg"></div>
                    </div>
                    <h4>100% Open Source</h4>
                    <p>Built transparently by the community, for the community</p>
                </div>
            </div>
        </div>

        <!-- Community Stats -->
        <div class="auth-stats-section">
            <h3 class="section-title">Join Our Growing Community</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fa-solid fa-users"></i>
                    </div>
                    <div class="stat-number" id="user_count_auth">1,000+</div>
                    <div class="stat-label">Active Creators</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fa-solid fa-image"></i>
                    </div>
                    <div class="stat-number">50K+</div>
                    <div class="stat-label">Posts Shared</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fa-solid fa-heart"></i>
                    </div>
                    <div class="stat-number">250K+</div>
                    <div class="stat-label">Reactions Given</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fa-solid fa-gamepad"></i>
                    </div>
                    <div class="stat-number">500+</div>
                    <div class="stat-label">Games Discussed</div>
                </div>
            </div>
        </div>

        <!-- Final CTA -->
        <div class="auth-cta-section">
            <div class="cta-content">
                <h3>Ready to Start Your Journey?</h3>
                <p>Join <span id="user_count_cta_auth">thousands</span> of creators already growing on RSPWN</p>

                <button onclick="scrollToAuthForm()" class="get-started-btn primary">
                    <div class="btn-content">
                        <i class="fa-solid fa-rocket"></i>
                        <span>Get Started Now</span>
                    </div>
                    <div class="btn-glow"></div>
                </button>
            </div>
        </div>

        <!-- Footer Links -->
        <div class="auth-footer-links">
            <a href="https://github.com/Vic92548/RSPWN.APP" target="_blank" class="footer-link">
                <i class="fa-brands fa-github"></i>
                <span>View on GitHub</span>
            </a>
            <a href="https://discord.gg/vtsnj3zphd" target="_blank" class="footer-link">
                <i class="fa-brands fa-discord"></i>
                <span>Join Discord</span>
            </a>
        </div>
    `;
}

function openAuthPage() {
    let authPage = DOM.get('auth-page');
    const feed = DOM.get('feed');

    // If auth page doesn't exist, create it like store/legal pages do
    if (!authPage) {
        const authContent = createAuthContent();
        const authPageHTML = createAuthPageTemplate(authContent);

        // Insert the page into the main element as a sibling to feed (like store/legal pages)
        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('beforeend', authPageHTML);
            authPage = DOM.get('auth-page');
        }
    }

    if (authPage && feed) {
        // Hide the feed and show auth page (like store/legal pages do)
        feed.style.display = 'none';
        authPage.style.display = 'flex';

        // Scroll to top
        const authBody = authPage.querySelector('.auth-body');
        if (authBody) {
            authBody.scrollTop = 0;
        }

        // Update URL without page reload
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'auth'}, 'Join RSPWN - The Gamer\'s Social Network', '/join');
        }

        // Update page title
        document.title = 'Join RSPWN - The Gamer\'s Social Network';

        // Update user count if available
        updateAuthUserCount();
    }
}

function closeAuthPage() {
    const authPage = DOM.get('auth-page');
    const feed = DOM.get('feed');

    if (authPage && feed) {
        // Hide the auth page and show the feed (like store/legal pages do)
        authPage.style.display = 'none';
        feed.style.display = 'block';

        // Update URL back to home
        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'home'}, 'RSPWN - The Gamer\'s Social Network', '/');
        }

        // Update page title back
        document.title = 'RSPWN';
    }
}

function hideAllPages() {
    const pages = ['feed', 'auth-page', 'signup-page', 'signin-page'];
    pages.forEach(pageId => {
        const page = DOM.get(pageId);
        if (page) page.style.display = 'none';
    });
}

function updateAuthUserCount() {
    // Update user count from existing elements if available
    const mainUserCount = DOM.get('user_count');
    const authUserCount = DOM.get('user_count_auth');
    const authUserCountCta = DOM.get('user_count_cta_auth');

    if (mainUserCount && authUserCount) {
        authUserCount.textContent = mainUserCount.textContent;
    }

    if (mainUserCount && authUserCountCta) {
        authUserCountCta.textContent = mainUserCount.textContent;
    }
}

function scrollToAuthForm() {
    const authForm = document.querySelector('.auth-form');
    if (authForm) {
        authForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const emailInput = document.getElementById('email-input');
        if (emailInput) {
            setTimeout(() => emailInput.focus(), 500);
        }
    }
}

function showAuthStatus(message, isError = false) {
    const statusDiv = document.getElementById('auth-status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `auth-status ${isError ? 'error' : 'success'}`;
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

async function sendMagicLink() {
    const emailInput = document.getElementById('email-input');
    const email = emailInput?.value?.trim();

    if (!email) {
        showAuthStatus('Please enter your email address', true);
        return;
    }

    if (!isValidEmail(email)) {
        showAuthStatus('Please enter a valid email address', true);
        return;
    }

    try {
        const response = await fetch('/api/auth/magic-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (result.success) {
            showAuthStatus('Magic link sent! Check your email and click the link to log in.');
        } else {
            showAuthStatus(result.message || 'Failed to send magic link', true);
        }
    } catch (error) {
        console.error('Error sending magic link:', error);
        showAuthStatus('Failed to send magic link', true);
    }
}

async function sendOTP() {
    const emailInput = document.getElementById('email-input');
    const email = emailInput?.value?.trim();

    if (!email) {
        showAuthStatus('Please enter your email address', true);
        return;
    }

    if (!isValidEmail(email)) {
        showAuthStatus('Please enter a valid email address', true);
        return;
    }

    try {
        const response = await fetch('/api/auth/otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const result = await response.json();

        if (result.success) {
            showAuthStatus('OTP sent! Check your email for the 6-digit code.');
            document.getElementById('otp-section').style.display = 'block';
            document.getElementById('otp-input').focus();
        } else {
            showAuthStatus(result.message || 'Failed to send OTP', true);
        }
    } catch (error) {
        console.error('Error sending OTP:', error);
        showAuthStatus('Failed to send OTP', true);
    }
}

async function verifyOTP() {
    const emailInput = document.getElementById('email-input');
    const otpInput = document.getElementById('otp-input');
    const email = emailInput?.value?.trim();
    const code = otpInput?.value?.trim();

    if (!email || !code) {
        showAuthStatus('Please enter both email and OTP code', true);
        return;
    }

    if (code.length !== 6) {
        showAuthStatus('OTP code must be 6 digits', true);
        return;
    }

    try {
        const response = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, code })
        });

        const result = await response.json();

        if (result.success) {
            showAuthStatus('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            showAuthStatus(result.message || 'Invalid OTP code', true);
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        showAuthStatus('Failed to verify OTP', true);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle direct navigation to /join URL
document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path === '/join' || path === '/auth' || path === '/register' || path === '/login') {
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            openAuthPage();
        }, 100);
    }
});

// Export functions for global access
if (typeof window !== 'undefined') {
    window.openAuthPage = openAuthPage;
    window.closeAuthPage = closeAuthPage;
    window.updateAuthUserCount = updateAuthUserCount;
    window.hideAllPages = hideAllPages;
    window.isValidEmail = isValidEmail;
}