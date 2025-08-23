// Firebase Configuration for BugzyAI
// This file contains the centralized Firebase configuration used across the application

import dotenv from 'dotenv';
dotenv.config();

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

// Firebase Auth Configuration
export const authConfig = {
    // Additional auth settings
    persistence: 'local', // Keep users logged in
    emailVerification: false, // Set to true if you want to require email verification
    allowGuests: true, // Allow anonymous/guest users
};

// Contact Form Configuration
export const contactConfig = {
    // Email settings for contact form
    adminEmail: "admin@bugzyai.com",
    autoReply: true,
    saveToFirestore: true, // Set to true if you want to save contact submissions to Firestore
};

// Application Configuration
export const appConfig = {
    name: "BugzyAI",
    version: "1.0.0",
    environment: "production", // development, staging, production
    debug: false,
};

// Export default config for easy importing
export default {
    firebase: firebaseConfig,
    auth: authConfig,
    contact: contactConfig,
    app: appConfig
};
