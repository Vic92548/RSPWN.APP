function createSignupPageTemplate(content) {
    return `
    <section id="signup-page" class="auth-container signup-page" style="display:none;">
        <div class="auth-body">
            <div class="auth-content">
                ${content}
            </div>
        </div>
    </section>`;
}

function createSignupContent() {
    return `
        <!-- Step Indicator -->
        <div class="signup-steps">
            <div class="step-indicator">
                <div class="step active" id="step-1-indicator">
                    <div class="step-number">1</div>
                    <span>Choose Username</span>
                </div>
                <div class="step-line"></div>
                <div class="step" id="step-2-indicator">
                    <div class="step-number">2</div>
                    <span>Verify Email</span>
                </div>
            </div>
        </div>

        <!-- Step 1: Username Selection -->
        <div class="auth-welcome-section" id="signup-step-1">
            <div class="welcome-content">
                <h2>Create Your Account</h2>
                <p class="welcome-description">Choose a unique username to represent you in the RSPWN community.</p>

                <div class="auth-form">
                    <div class="username-input-container">
                        <input type="text" id="signup-username" placeholder="Choose your username" class="email-input username-input" maxlength="20">
                        <div class="username-feedback" id="username-feedback"></div>
                    </div>

                    <button onclick="checkUsernameAndProceed()" class="get-started-btn primary" id="continue-btn" disabled>
                        <div class="btn-content">
                            <i class="fa-solid fa-arrow-right"></i>
                            <span>Continue</span>
                        </div>
                        <div class="btn-glow"></div>
                    </button>

                    <div id="signup-status-step1" class="auth-status"></div>
                </div>

                <div class="auth-switch">
                    <p>Already have an account? <button onclick="openSigninPage()" class="link-btn">Sign in here</button></p>
                </div>
            </div>
        </div>

        <!-- Step 2: Email Authentication -->
        <div class="auth-welcome-section" id="signup-step-2" style="display: none;">
            <div class="welcome-content">
                <h2>Verify Your Email</h2>
                <p class="welcome-description">Great choice! Username <strong id="chosen-username"></strong> is yours. Now let's verify your email address.</p>

                <div class="auth-form">
                    <input type="email" id="signup-email" placeholder="Enter your email" class="email-input">

                    <button onclick="signupWithMagicLink()" class="magic-link-btn">
                        <div class="btn-content">
                            <i class="fa-solid fa-envelope"></i>
                            <span>Send Magic Link</span>
                        </div>
                        <div class="btn-glow"></div>
                    </button>

                    <div class="divider">
                        <span>or</span>
                    </div>

                    <button onclick="signupWithOTP()" class="otp-btn">
                        <div class="btn-content">
                            <i class="fa-solid fa-key"></i>
                            <span>Send OTP Code</span>
                        </div>
                    </button>

                    <div id="signup-otp-section" class="otp-section" style="display: none;">
                        <input type="text" id="signup-otp-input" placeholder="Enter 6-digit code" class="otp-input" maxlength="6">
                        <button onclick="verifySignupOTP()" class="verify-btn">
                            <div class="btn-content">
                                <span>Create Account</span>
                            </div>
                        </button>
                    </div>

                    <button onclick="goBackToStep1()" class="back-btn">
                        <i class="fa-solid fa-arrow-left"></i>
                        <span>Back to Username</span>
                    </button>

                    <div id="signup-status" class="auth-status"></div>
                </div>
            </div>
        </div>
    `;
}

function openSignupPage() {
    let signupPage = DOM.get('signup-page');
    const feed = DOM.get('feed');

    if (!signupPage) {
        const signupContent = createSignupContent();
        const signupPageHTML = createSignupPageTemplate(signupContent);

        const main = document.querySelector('main');
        if (main) {
            main.insertAdjacentHTML('beforeend', signupPageHTML);
            signupPage = DOM.get('signup-page');
        }
    }

    if (signupPage && feed) {
        hideAllPages();
        signupPage.style.display = 'flex';

        const signupBody = signupPage.querySelector('.auth-body');
        if (signupBody) {
            signupBody.scrollTop = 0;
        }

        if (window.history && window.history.pushState) {
            window.history.pushState({page: 'signup'}, 'Sign Up - RSPWN', '/signup');
        }

        document.title = 'Sign Up - RSPWN';

        // Setup username validation after page is shown
        setTimeout(() => {
            setupUsernameValidation();
        }, 100);
    }
}

function hideAllPages() {
    const pages = ['feed', 'auth-page', 'signup-page', 'signin-page'];
    pages.forEach(pageId => {
        const page = DOM.get(pageId);
        if (page) page.style.display = 'none';
    });
}

let selectedUsername = '';

function setupUsernameValidation() {
    const usernameInput = document.getElementById('signup-username');
    const continueBtn = document.getElementById('continue-btn');
    const feedbackDiv = document.getElementById('username-feedback');

    if (!usernameInput) return;

    let debounceTimer;

    usernameInput.addEventListener('input', function() {
        const username = this.value.trim();

        clearTimeout(debounceTimer);
        continueBtn.disabled = true;

        if (!username) {
            feedbackDiv.innerHTML = '';
            return;
        }

        if (username.length < 3) {
            feedbackDiv.innerHTML = '<div class="feedback error"><i class="fa-solid fa-times"></i> Username must be at least 3 characters</div>';
            return;
        }

        if (username.length > 20) {
            feedbackDiv.innerHTML = '<div class="feedback error"><i class="fa-solid fa-times"></i> Username must be 20 characters or less</div>';
            return;
        }

        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            feedbackDiv.innerHTML = '<div class="feedback error"><i class="fa-solid fa-times"></i> Only letters, numbers, underscores, and hyphens allowed</div>';
            return;
        }

        feedbackDiv.innerHTML = '<div class="feedback checking"><i class="fa-solid fa-spinner fa-spin"></i> Checking availability...</div>';

        debounceTimer = setTimeout(() => checkUsernameAvailability(username), 500);
    });
}

async function checkUsernameAvailability(username) {
    const feedbackDiv = document.getElementById('username-feedback');
    const continueBtn = document.getElementById('continue-btn');

    try {
        const response = await fetch('/api/auth/check-username', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });

        const result = await response.json();

        if (result.success) {
            feedbackDiv.innerHTML = '<div class="feedback success"><i class="fa-solid fa-check"></i> Username is available!</div>';
            continueBtn.disabled = false;
            selectedUsername = username;
        } else {
            feedbackDiv.innerHTML = `<div class="feedback error"><i class="fa-solid fa-times"></i> ${result.message}</div>`;
            continueBtn.disabled = true;
        }
    } catch (error) {
        feedbackDiv.innerHTML = '<div class="feedback error"><i class="fa-solid fa-times"></i> Error checking username</div>';
        continueBtn.disabled = true;
    }
}

function checkUsernameAndProceed() {
    if (!selectedUsername) return;

    // Update step indicator
    document.getElementById('step-1-indicator').classList.remove('active');
    document.getElementById('step-1-indicator').classList.add('completed');
    document.getElementById('step-2-indicator').classList.add('active');

    // Show step 2, hide step 1
    document.getElementById('signup-step-1').style.display = 'none';
    document.getElementById('signup-step-2').style.display = 'block';

    // Update chosen username display
    document.getElementById('chosen-username').textContent = selectedUsername;

    // Focus on email input
    setTimeout(() => {
        document.getElementById('signup-email').focus();
    }, 300);
}

function goBackToStep1() {
    // Update step indicator
    document.getElementById('step-2-indicator').classList.remove('active');
    document.getElementById('step-1-indicator').classList.remove('completed');
    document.getElementById('step-1-indicator').classList.add('active');

    // Show step 1, hide step 2
    document.getElementById('signup-step-2').style.display = 'none';
    document.getElementById('signup-step-1').style.display = 'block';

    // Clear any error states
    const otpSection = document.getElementById('signup-otp-section');
    if (otpSection) otpSection.style.display = 'none';
}

async function signupWithMagicLink() {
    const emailInput = document.getElementById('signup-email');
    const email = emailInput?.value?.trim();
    const button = document.querySelector('.magic-link-btn');

    if (!selectedUsername) {
        showSignupStatus('Please complete step 1 first', true);
        return;
    }

    if (!email) {
        showSignupStatus('Please enter your email address', true);
        return;
    }

    if (!isValidEmail(email)) {
        showSignupStatus('Please enter a valid email address', true);
        return;
    }

    // Add loading state
    const originalText = button.querySelector('span').textContent;
    button.querySelector('span').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    button.disabled = true;

    try {
        const response = await fetch('/api/auth/signup/magic-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: selectedUsername, email })
        });

        const result = await response.json();

        if (result.success) {
            showSignupStatus('Magic link sent! Check your email and click the link to complete signup.');
            button.querySelector('span').innerHTML = '<i class="fa-solid fa-check"></i> Sent!';
        } else {
            showSignupStatus(result.message || 'Failed to send magic link', true);
            button.querySelector('span').textContent = originalText;
            button.disabled = false;
        }
    } catch (error) {
        console.error('Error sending signup magic link:', error);
        showSignupStatus('Failed to send magic link', true);
        button.querySelector('span').textContent = originalText;
        button.disabled = false;
    }
}

async function signupWithOTP() {
    const emailInput = document.getElementById('signup-email');
    const email = emailInput?.value?.trim();

    if (!selectedUsername) {
        showSignupStatus('Please complete step 1 first', true);
        return;
    }

    if (!email) {
        showSignupStatus('Please enter your email address', true);
        return;
    }

    if (!isValidEmail(email)) {
        showSignupStatus('Please enter a valid email address', true);
        return;
    }

    try {
        const response = await fetch('/api/auth/signup/otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: selectedUsername, email })
        });

        const result = await response.json();

        if (result.success) {
            showSignupStatus('OTP sent! Check your email for the 6-digit code.');
            document.getElementById('signup-otp-section').style.display = 'block';
            document.getElementById('signup-otp-input').focus();
        } else {
            showSignupStatus(result.message || 'Failed to send OTP', true);
        }
    } catch (error) {
        console.error('Error sending signup OTP:', error);
        showSignupStatus('Failed to send OTP', true);
    }
}

async function verifySignupOTP() {
    const emailInput = document.getElementById('signup-email');
    const otpInput = document.getElementById('signup-otp-input');
    const email = emailInput?.value?.trim();
    const code = otpInput?.value?.trim();

    if (!selectedUsername || !email || !code) {
        showSignupStatus('Please fill in all fields', true);
        return;
    }

    if (code.length !== 6) {
        showSignupStatus('OTP code must be 6 digits', true);
        return;
    }

    try {
        const response = await fetch('/api/auth/signup/verify-otp', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: selectedUsername, email, code })
        });

        const result = await response.json();

        if (result.success) {
            showSignupStatus('Account created successfully! Redirecting...');
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            showSignupStatus(result.message || 'Invalid OTP code', true);
        }
    } catch (error) {
        console.error('Error verifying signup OTP:', error);
        showSignupStatus('Failed to verify OTP', true);
    }
}

function signupWithDiscord() {
    showSignupStatus('Discord authentication coming soon!', true);
}

function showSignupStatus(message, isError = false) {
    const statusDiv = document.getElementById('signup-status');
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
    if (path === '/signup' || path === '/register') {
        setTimeout(() => {
            openSignupPage();
        }, 100);
    }
});

if (typeof window !== 'undefined') {
    window.openSignupPage = openSignupPage;
    window.signupWithMagicLink = signupWithMagicLink;
    window.signupWithOTP = signupWithOTP;
    window.signupWithDiscord = signupWithDiscord;
    window.verifySignupOTP = verifySignupOTP;
}