// Login Page JavaScript - Using BugzyAI Auth Service
// Import will be handled by module loading
let bugzyAuth = null;

// Import firebase auth service when available
try {
    import('./firebase-auth.js').then(module => {
        bugzyAuth = module.default;
        console.log('BugzyAI Auth service loaded');
    });
} catch (error) {
    console.warn('Firebase auth service not available:', error);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeLoginPage();
});

let currentMode = 'login'; // 'login' or 'register'

function initializeLoginPage() {
    // Initialize form handlers
    initializeFormHandlers();
    
    // Initialize password strength checker
    initializePasswordStrength();
    
    // Check if user is already authenticated
    checkAuthState();
    
    // Initialize message system
    initializeMessageSystem();
    
    // Wait for auth service to be ready
    setTimeout(() => {
        if (!bugzyAuth || !bugzyAuth.isReady()) {
            addDemoModeNotice();
        }
    }, 1000);
}

function initializeFormHandlers() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (!password) {
        showMessage('Please enter your password', 'error');
        return;
    }
    
    // Check if Firebase is configured
    if (!bugzyAuth.isReady()) {
        showMessage('Authentication not configured. Please set up Firebase.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const user = await bugzyAuth.signInWithEmail(email, password);
        
        // Store user preference
        if (rememberMe) {
            localStorage.setItem('rememberUser', 'true');
        }
        
        showMessage('Login successful! Redirecting...', 'success');
        
        // Redirect handled by auth service
        bugzyAuth.redirectAfterAuth('/pipeline');
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validation
    if (!name.trim()) {
        showMessage('Please enter your full name', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    if (!agreeTerms) {
        showMessage('Please agree to the Terms of Service and Privacy Policy', 'error');
        return;
    }
    
    // Check if Firebase is configured
    if (!bugzyAuth.isReady()) {
        showMessage('Authentication not configured. Please set up Firebase.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const user = await bugzyAuth.createAccountWithEmail(email, password, name);
        
        showMessage('Account created successfully! Redirecting...', 'success');
        
        // Redirect handled by auth service
        bugzyAuth.redirectAfterAuth('/pipeline');
        
    } catch (error) {
        console.error('Registration error:', error);
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function signInWithGoogle() {
    // Check if Firebase is configured
    if (!bugzyAuth.isReady()) {
        showMessage('Authentication not configured. Please set up Firebase.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const user = await bugzyAuth.signInWithGoogle();
        
        showMessage('Google sign-in successful! Redirecting...', 'success');
        
        // Redirect handled by auth service
        bugzyAuth.redirectAfterAuth('/pipeline');
        
    } catch (error) {
        console.error('Google sign-in error:', error);
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function signInAsGuest() {
    // Check if Firebase is configured
    if (!bugzyAuth.isReady()) {
        showMessage('Authentication not configured. Please set up Firebase.', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const user = await bugzyAuth.signInAsGuest();
        
        showMessage('Signed in as guest! Redirecting...', 'success');
        
        // Redirect handled by auth service
        bugzyAuth.redirectAfterAuth('/pipeline');
        
    } catch (error) {
        console.error('Guest sign-in error:', error);
        showMessage(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function storeUserData(user, additionalData = {}) {
    const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData.displayName || 'User',
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        isGuest: additionalData.isGuest || false,
        loginTime: new Date().toISOString(),
        ...additionalData
    };
    
    // Store in localStorage for quick access
    localStorage.setItem('userData', JSON.stringify(userData));
    
    // Store in sessionStorage as backup
    sessionStorage.setItem('userData', JSON.stringify(userData));
    
    // Here you could also send to your backend API
    try {
        await fetch('/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
    } catch (error) {
        console.warn('Failed to sync user data with backend:', error);
    }
}

function checkAuthState() {
    // Check if user is already logged in
    const userData = localStorage.getItem('userData');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            // Optionally verify token is still valid
            console.log('User already logged in:', user.displayName);
        } catch (error) {
            localStorage.removeItem('userData');
        }
    }
}

function handleAuthError(error) {
    let message = 'An error occurred. Please try again.';
    
    // Handle Firebase configuration errors first
    if (error.message && error.message.includes('Firebase not configured')) {
        message = 'Authentication service not configured. Please contact support.';
        showMessage(message, 'error');
        return;
    }
    
    switch (error.code) {
        case 'auth/api-key-not-valid':
            message = 'Authentication service configuration error. Please contact support.';
            break;
        case 'auth/user-not-found':
            message = 'No account found with this email address.';
            break;
        case 'auth/wrong-password':
            message = 'Incorrect password. Please try again.';
            break;
        case 'auth/email-already-in-use':
            message = 'An account with this email already exists.';
            break;
        case 'auth/weak-password':
            message = 'Password is too weak. Please choose a stronger password.';
            break;
        case 'auth/invalid-email':
            message = 'Please enter a valid email address.';
            break;
        case 'auth/too-many-requests':
            message = 'Too many failed attempts. Please try again later.';
            break;
        case 'auth/network-request-failed':
            message = 'Network error. Please check your connection.';
            break;
        case 'auth/popup-closed-by-user':
            message = 'Sign-in popup was closed. Please try again.';
            break;
        case 'auth/configuration-not-found':
        case 'auth/project-not-found':
            message = 'Authentication service not properly configured. Please contact support.';
            break;
        default:
            if (error.message) {
                // Clean up Firebase error messages for user display
                message = error.message
                    .replace('Firebase: ', '')
                    .replace(/Error \(auth\/[^)]+\)\./, '')
                    .trim();
                
                if (message.includes('api-key')) {
                    message = 'Authentication service configuration error. Please contact support.';
                }
            }
    }
    
    showMessage(message, 'error');
    
    // Log full error for debugging
    console.error('Full auth error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
    });
}

function initializePasswordStrength() {
    const passwordInput = document.getElementById('registerPassword');
    if (!passwordInput) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        updatePasswordStrengthUI(strength);
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 8) {
        score += 25;
    } else {
        feedback.push('Use at least 8 characters');
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
        score += 25;
    } else {
        feedback.push('Add uppercase letters');
    }
    
    // Lowercase check
    if (/[a-z]/.test(password)) {
        score += 25;
    } else {
        feedback.push('Add lowercase letters');
    }
    
    // Number check
    if (/\d/.test(password)) {
        score += 15;
    } else {
        feedback.push('Add numbers');
    }
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 10;
    } else {
        feedback.push('Add special characters');
    }
    
    return { score, feedback };
}

function updatePasswordStrengthUI(strength) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthFill || !strengthText) return;
    
    const { score, feedback } = strength;
    
    strengthFill.style.width = `${score}%`;
    
    let color, text;
    if (score < 30) {
        color = '#ff4757';
        text = 'Weak';
    } else if (score < 60) {
        color = '#ffa502';
        text = 'Fair';
    } else if (score < 90) {
        color = '#2ed573';
        text = 'Good';
    } else {
        color = '#00ff88';
        text = 'Strong';
    }
    
    strengthFill.style.background = color;
    strengthText.textContent = `${text} password`;
    strengthText.style.color = color;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
        }
    }
}

function initializeMessageSystem() {
    // Create message container if it doesn't exist
    if (!document.getElementById('messageContainer')) {
        const container = document.createElement('div');
        container.id = 'messageContainer';
        container.className = 'message-container';
        document.body.appendChild(container);
    }
}

function showMessage(text, type = 'info', duration = 5000) {
    const container = document.getElementById('messageContainer');
    if (!container) return;
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    
    const icon = getMessageIcon(type);
    message.innerHTML = `
        <i class="${icon}"></i>
        <span>${text}</span>
    `;
    
    container.appendChild(message);
    
    // Auto remove after duration
    setTimeout(() => {
        if (message.parentNode) {
            message.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                message.remove();
            }, 300);
        }
    }, duration);
    
    // Add slide out animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    if (!document.head.querySelector('style[data-message-animations]')) {
        style.setAttribute('data-message-animations', 'true');
        document.head.appendChild(style);
    }
}

function getMessageIcon(type) {
    switch (type) {
        case 'success':
            return 'fas fa-check-circle';
        case 'error':
            return 'fas fa-exclamation-circle';
        case 'warning':
            return 'fas fa-exclamation-triangle';
        default:
            return 'fas fa-info-circle';
    }
}

// Utility function to logout user
function logout() {
    if (window.firebaseAuth) {
        window.firebaseAuth.signOut().then(() => {
            localStorage.removeItem('userData');
            sessionStorage.removeItem('userData');
            showMessage('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = '/login';
            }, 1000);
        }).catch((error) => {
            console.error('Logout error:', error);
            showMessage('Error logging out', 'error');
        });
    }
}

// Export for global access (for any remaining inline handlers)
window.logout = logout;
window.showMessage = showMessage;
window.signInWithGoogle = signInWithGoogle;
window.signInAsGuest = signInAsGuest;

// Handle browser back/forward buttons
window.addEventListener('popstate', function(event) {
    // Handle navigation state if needed
});

// Prevent form submission on Enter key in certain fields
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && event.target.tagName !== 'BUTTON' && event.target.type !== 'submit') {
        // Allow Enter in textarea and specific inputs
        if (event.target.tagName !== 'TEXTAREA') {
            const form = event.target.closest('form');
            if (form) {
                event.preventDefault();
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton) {
                    submitButton.click();
                }
            }
        }
    }
});

function addDemoModeNotice() {
    const loginCard = document.querySelector('.login-card');
    if (!loginCard) return;
    
    const demoNotice = document.createElement('div');
    demoNotice.innerHTML = `
        <div style="
            background: rgba(139, 92, 246, 0.1);
            border: 1px solid rgba(139, 92, 246, 0.3);
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 1rem;
            color: #c084fc;
            font-size: 0.9rem;
            text-align: center;
        ">
            <i class="fas fa-info-circle" style="margin-right: 0.5rem;"></i>
            <strong>Demo Mode:</strong> Firebase not configured. 
            <button onclick="testDemoLogin()" style="
                background: none;
                border: 1px solid rgba(139, 92, 246, 0.5);
                color: #c084fc;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                margin-left: 0.5rem;
                cursor: pointer;
                font-size: 0.8rem;
            ">Test Demo</button>
        </div>
    `;
    
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.insertBefore(demoNotice, loginForm.firstChild);
    }
}

window.testDemoLogin = function() {
    showLoading(true);
    showMessage('Demo mode: Simulating login...', 'success');
    
    setTimeout(() => {
        showLoading(false);
        showMessage('Demo login successful! Redirecting to pipeline...', 'success');
        
        // Store demo user data
        const demoUser = {
            uid: 'demo-user-' + Date.now(),
            email: 'demo@bugzyai.com',
            displayName: 'Demo User',
            isDemo: true,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('userData', JSON.stringify(demoUser));
        
        setTimeout(() => {
            window.location.href = '/pipeline';
        }, 1500);
    }, 2000);
};
