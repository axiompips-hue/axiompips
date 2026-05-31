// File: src/lib/firebase/config.ts
// Description: Firebase initialization and configuration
// This file sets up Firebase with your project credentials

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration
function validateConfig() {
  const requiredKeys = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingKeys = requiredKeys.filter(
    (key) => !firebaseConfig[key as keyof typeof firebaseConfig]
  );

  if (missingKeys.length > 0) {
    console.error(
      'Missing Firebase configuration:',
      missingKeys.map((key) => `NEXT_PUBLIC_FIREBASE_${key.toUpperCase()}`)
    );
    return false;
  }

  return true;
}

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== 'undefined') {
  const isConfigValid = validateConfig();

  if (isConfigValid) {
    // Initialize Firebase only if not already initialized
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase initialized successfully');
    } else {
      app = getApps()[0];
    }

    // Initialize Auth
    auth = getAuth(app);

    // Initialize Firestore
    db = getFirestore(app);

    // Enable offline persistence
    // This allows the app to work offline and sync when back online
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn(
          'Firestore persistence failed: Multiple tabs open. Only one tab can have persistence enabled.'
        );
      } else if (err.code === 'unimplemented') {
        console.warn(
          'Firestore persistence is not available in this browser.'
        );
      }
    });
  } else {
    console.error(
      'Firebase not initialized: Missing required environment variables'
    );
  }
}

// Export instances
export { app, auth, db };

// Export a helper to check if Firebase is enabled
export const isFirebaseEnabled = (): boolean => {
  return (
    process.env.NEXT_PUBLIC_FIREBASE_SYNC_ENABLED === 'true' &&
    app !== undefined &&
    auth !== undefined &&
    db !== undefined
  );
};

// Export config for debugging (without sensitive values)
export const getFirebaseStatus = () => {
  return {
    isEnabled: isFirebaseEnabled(),
    hasApp: app !== undefined,
    hasAuth: auth !== undefined,
    hasDb: db !== undefined,
    projectId: firebaseConfig.projectId || 'not-configured',
  };
};
