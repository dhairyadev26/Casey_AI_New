// BugzyAI Firebase Authentication Service
// This file provides a centralized Firebase authentication service for the entire application

import dotenv from 'dotenv';
dotenv.config();
import { firebaseConfig, authConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signInWithPopup, 
    GoogleAuthProvider, 
    signInAnonymously,
    signOut,
    onAuthStateChanged,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';

class BugzyAIAuth {
    constructor() {
        this.app = null;
        this.auth = null;
        this.googleProvider = null;
        this.analytics = null;
        this.initialized = false;
        this.currentUser = null;
        
        this.init();
    }

    async init() {
        try {
            // Initialize Firebase
            this.app = initializeApp(firebaseConfig);
            this.auth = getAuth(this.app);
            this.googleProvider = new GoogleAuthProvider();
            this.analytics = getAnalytics(this.app);
            
            // Configure Google Provider
            this.googleProvider.addScope('email');
            this.googleProvider.addScope('profile');
            
            // Set up auth state listener
            onAuthStateChanged(this.auth, (user) => {
                this.currentUser = user;
                this.onAuthStateChange(user);
            });
            
            this.initialized = true;
            console.log("✅ BugzyAI Auth Service initialized successfully");
            
        } catch (error) {
            console.error("❌ BugzyAI Auth Service initialization failed:", error);
            this.initialized = false;
        }
    }

    // Auth state change handler
    onAuthStateChange(user) {
        if (user) {
            console.log("👤 User signed in:", user.displayName || user.email);
            this.storeUserData(user);
        } else {
            console.log("👋 User signed out");
            this.clearUserData();
        }
        
        // Emit custom event for other parts of the app
        window.dispatchEvent(new CustomEvent('authStateChanged', { 
            detail: { user, isAuthenticated: !!user } 
        }));
    }

    // Check if service is ready
    isReady() {
        return this.initialized && this.auth;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Sign in with email and password
    async signInWithEmail(email, password) {
        if (!this.isReady()) {
            throw new Error('Auth service not initialized');
        }
        
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return userCredential.user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Create account with email and password
    async createAccountWithEmail(email, password, displayName) {
        if (!this.isReady()) {
            throw new Error('Auth service not initialized');
        }
        
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Update profile with display name
            if (displayName) {
                await updateProfile(user, { displayName });
            }
            
            return user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Sign in with Google
    async signInWithGoogle() {
        if (!this.isReady()) {
            throw new Error('Auth service not initialized');
        }
        
        try {
            const result = await signInWithPopup(this.auth, this.googleProvider);
            return result.user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Sign in anonymously (guest)
    async signInAsGuest() {
        if (!this.isReady()) {
            throw new Error('Auth service not initialized');
        }
        
        try {
            const result = await signInAnonymously(this.auth);
            return result.user;
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Sign out
    async signOut() {
        if (!this.isReady()) {
            throw new Error('Auth service not initialized');
        }
        
        try {
            await signOut(this.auth);
            this.clearUserData();
        } catch (error) {
            throw this.handleAuthError(error);
        }
    }

    // Store user data locally
    storeUserData(user, additionalData = {}) {
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'User',
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            isAnonymous: user.isAnonymous,
            isGuest: user.isAnonymous,
            loginTime: new Date().toISOString(),
            ...additionalData
        };
        
        // Store in localStorage for persistence
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('authToken', user.accessToken || 'authenticated');
        
        return userData;
    }

    // Clear user data
    clearUserData() {
        localStorage.removeItem('userData');
        localStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
    }

    // Get stored user data
    getStoredUserData() {
        try {
            const userData = localStorage.getItem('userData');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error parsing stored user data:', error);
            return null;
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser || !!this.getStoredUserData();
    }

    // Handle authentication errors
    handleAuthError(error) {
        const errorMap = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
            'auth/api-key-not-valid': 'Authentication service configuration error.',
            'auth/configuration-not-found': 'Authentication service not properly configured.',
            'auth/project-not-found': 'Authentication service not properly configured.'
        };
        
        const message = errorMap[error.code] || error.message || 'Authentication failed. Please try again.';
        
        return new Error(message);
    }

    // Utility method to redirect after authentication
    redirectAfterAuth(path = '/pipeline') {
        setTimeout(() => {
            window.location.href = path;
        }, 1500);
    }
}

// Create and export singleton instance
const bugzyAuth = new BugzyAIAuth();

// Make available globally for backwards compatibility
window.bugzyAuth = bugzyAuth;

// Export for ES6 imports
export default bugzyAuth;
