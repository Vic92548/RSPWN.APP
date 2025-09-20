function createSigninPageTemplate(content) {
    return `
    <section id="signin-page" class="signin-container" style="display:none;">
        <button id="signin_menu_btn" class="create-post-btn glass_bt" onclick="openMenu()"><i class="fa-solid fa-bars"></i></button>

        <div class="signin-body">
            <div class="signin-content">
                ${content}
            </div>
        </div>
    </section>`;
}

function createSigninContent() {
    return `
        <div class="signin-step-container">
            <div class="signin-step-content">
                <div class="step-header">
                    <h2 class="step-title">Sign In</h2>
                    <p class="step-description">Welcome back! Sign in to your RSPWN account using your email address.</p>
                </div>

                <div class="signin-form">
                    <div class="input-group">
                        <div class="input-container">
                            <div class="input-icon">
                                <i class="fa-solid fa-envelope"></i>
                            </div>
                            <input type="email" id="signin-email" placeholder="Enter your email address" class="signup-input" autocomplete="email">
                        </div>
                    </div>

                    <div class="auth-methods">
                        <button onclick="signinWithMagicLink()" class="signin-auth-btn magic-link-method">
                            <div class="btn-content">
                                <i class="fa-solid fa-link"></i>
                                <span>Send Magic Link</span>
                            </div>
                        </button>

                        <button onclick="signinWithOTP()" class="signin-auth-btn otp-method">
                            <div class="btn-content">
                                <i class="fa-solid fa-key"></i>
                                <span>Send OTP Code</span>
                            </div>
                        </button>

                        <div class="method-divider">
                            <span>or continue with</span>
                        </div>

                        <div class="social-auth-grid">
                            <button onclick="signinWithDiscord()" class="social-auth-btn discord">
                                <i class="fa-brands fa-discord"></i>
                                <span>Discord</span>
                            </button>

                            <button onclick="signinWithTwitch()" class="social-auth-btn twitch">
                                <i class="fa-brands fa-twitch"></i>
                                <span>Twitch</span>
                            </button>

                            <button onclick="signinWithGoogle()" class="social-auth-btn google">
                                <i class="fa-brands fa-google"></i>
                                <span>Google</span>
                            </button>

                            <button onclick="signinWithApple()" class="social-auth-btn apple">
                                <i class="fa-brands fa-apple"></i>
                                <span>Apple</span>
                            </button>

                            <button onclick="signinWithFacebook()" class="social-auth-btn facebook">
                                <i class="fa-brands fa-facebook"></i>
                                <span>Facebook</span>
                            </button>

                            <button onclick="signinWithLinkedin()" class="social-auth-btn linkedin">
                                <i class="fa-brands fa-linkedin"></i>
                                <span>LinkedIn</span>
                            </button>
                        </div>
                    </div>

                    <div id="signin-otp-section" class="otp-verification" style="display: none;">
                        <div class="input-group">
                            <div class="input-container">
                                <div class="input-icon">
                                    <i class="fa-solid fa-lock"></i>
                                </div>
                                <input type="text" id="signin-otp-input" placeholder="Enter 6-digit code" class="signup-input otp-input" maxlength="6" pattern="[0-9]{6}">
                            </div>
                        </div>
                        <button onclick="verifySigninOTP()" class="signin-auth-btn verify-btn">
                            <div class="btn-content">
                                <i class="fa-solid fa-right-to-bracket"></i>
                                <span>Sign In</span>
                            </div>
                        </button>
                    </div>

                    <div id="signin-status" class="status-message"></div>
                </div>

                <div class="signin-footer">
                    <p>Don't have an account? <button onclick="openSignupPage()" class="link-button">Create one here</button></p>
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

function signinWithTwitch() {
    showSigninStatus('Twitch authentication coming soon!', true);
}

function signinWithGoogle() {
    showSigninStatus('Google authentication coming soon!', true);
}

function signinWithApple() {
    showSigninStatus('Apple authentication coming soon!', true);
}

function signinWithFacebook() {
    showSigninStatus('Facebook authentication coming soon!', true);
}

function signinWithLinkedin() {
    showSigninStatus('LinkedIn authentication coming soon!', true);
}

function showSigninStatus(message, isError = false) {
    const statusDiv = document.getElementById('signin-status');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${isError ? 'error' : 'success'}`;
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