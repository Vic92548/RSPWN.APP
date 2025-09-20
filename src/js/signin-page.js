function createSigninPageTemplate(content) {
    return `
    <section id="signin-page" class="auth-container signin-page" style="display:none;">
        <div class="auth-body">
            <div class="auth-content">
                ${content}
            </div>
        </div>
    </section>`;
}

function createSigninContent() {
    return `
        <!-- Main Welcome Section -->
        <div class="auth-welcome-section">
            <div class="welcome-content">
                <h2>Welcome Back</h2>
                <p class="welcome-description">Sign in to your RSPWN account using your email address.</p>

                <div class="auth-form">
                    <input type="email" id="signin-email" placeholder="Enter your email" class="email-input">

                    <button onclick="signinWithMagicLink()" class="magic-link-btn">
                        <div class="btn-content">
                            <i class="fa-solid fa-envelope"></i>
                            <span>Send Magic Link</span>
                        </div>
                        <div class="btn-glow"></div>
                    </button>

                    <div class="divider">
                        <span>or</span>
                    </div>

                    <button onclick="signinWithOTP()" class="otp-btn">
                        <div class="btn-content">
                            <i class="fa-solid fa-key"></i>
                            <span>Send OTP Code</span>
                        </div>
                    </button>

                    <div id="signin-otp-section" class="otp-section" style="display: none;">
                        <input type="text" id="signin-otp-input" placeholder="Enter 6-digit code" class="otp-input" maxlength="6">
                        <button onclick="verifySigninOTP()" class="verify-btn">
                            <div class="btn-content">
                                <span>Sign In</span>
                            </div>
                        </button>
                    </div>

                    <div id="signin-status" class="auth-status"></div>
                </div>

                <div class="security-badges">
                    <div class="security-badge">
                        <i class="fa-solid fa-lock"></i>
                        <span>Secure Login</span>
                    </div>
                    <div class="security-badge">
                        <i class="fa-solid fa-shield-halved"></i>
                        <span>Passwordless</span>
                    </div>
                </div>

                <div class="auth-switch">
                    <p>Don't have an account? <button onclick="openSignupPage()" class="link-btn">Create one here</button></p>
                </div>
            </div>
        </div>
    `;
}

function openSigninPage() {
    let signinPage = DOM.get('signin-page');
    const feed = DOM.get('feed');

    if (!signinPage) {
        const signinContent = createSigninContent();
        const signinPageHTML = createSigninPageTemplate(signinContent);

        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('beforeend', signinPageHTML);
            signinPage = DOM.get('signin-page');
        }
    }

    if (signinPage && feed) {
        hideAllPages();
        signinPage.style.display = 'flex';

        const signinBody = signinPage.querySelector('.auth-body');
        if (signinBody) {
            signinBody.scrollTop = 0;
        }

        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'signin'}, 'Sign In - RSPWN', '/signin');
        }

        document.title = 'Sign In - RSPWN';
    }
}

async function signinWithMagicLink() {
    const emailInput = document.getElementById('signin-email');
    const email = emailInput?.value?.trim();

    if (!email) {
        showSigninStatus('Please enter your email address', true);
        return;
    }

    if (!isValidEmail(email)) {
        showSigninStatus('Please enter a valid email address', true);
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
            showSigninStatus('Magic link sent! Check your email and click the link to sign in.');
        } else {
            showSigninStatus(result.message || 'Failed to send magic link', true);
        }
    } catch (error) {
        console.error('Error sending signin magic link:', error);
        showSigninStatus('Failed to send magic link', true);
    }
}

async function signinWithOTP() {
    const emailInput = document.getElementById('signin-email');
    const email = emailInput?.value?.trim();

    if (!email) {
        showSigninStatus('Please enter your email address', true);
        return;
    }

    if (!isValidEmail(email)) {
        showSigninStatus('Please enter a valid email address', true);
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
            showSigninStatus('OTP sent! Check your email for the 6-digit code.');
            document.getElementById('signin-otp-section').style.display = 'block';
            document.getElementById('signin-otp-input').focus();
        } else {
            showSigninStatus(result.message || 'Failed to send OTP', true);
        }
    } catch (error) {
        console.error('Error sending signin OTP:', error);
        showSigninStatus('Failed to send OTP', true);
    }
}

async function verifySigninOTP() {
    const emailInput = document.getElementById('signin-email');
    const otpInput = document.getElementById('signin-otp-input');
    const email = emailInput?.value?.trim();
    const code = otpInput?.value?.trim();

    if (!email || !code) {
        showSigninStatus('Please enter both email and OTP code', true);
        return;
    }

    if (code.length !== 6) {
        showSigninStatus('OTP code must be 6 digits', true);
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
            showSigninStatus('Sign in successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            showSigninStatus(result.message || 'Invalid OTP code', true);
        }
    } catch (error) {
        console.error('Error verifying signin OTP:', error);
        showSigninStatus('Failed to verify OTP', true);
    }
}

function signinWithDiscord() {
    showSigninStatus('Discord authentication coming soon!', true);
}

function showSigninStatus(message, isError = false) {
    const statusDiv = document.getElementById('signin-status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `auth-status ${isError ? 'error' : 'success'}`;
        statusDiv.style.display = 'block';
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const path = window.location.pathname;
    if (path === '/signin' || path === '/login') {
        setTimeout(() => {
            openSigninPage();
        }, 100);
    }
});

if (typeof window !== 'undefined') {
    window.openSigninPage = openSigninPage;
    window.signinWithMagicLink = signinWithMagicLink;
    window.signinWithOTP = signinWithOTP;
    window.signinWithDiscord = signinWithDiscord;
    window.verifySigninOTP = verifySigninOTP;
}