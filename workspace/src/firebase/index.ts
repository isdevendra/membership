'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (!getApps().length) {
    let firebaseApp;
    try {
      firebaseApp = initializeApp();
    } catch (e) {
      if (process.env.NODE_ENV === "production") {
        console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
    }
    return getSdks(firebaseApp);
  }
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);

  // Connect to emulators if running in development and configured to do so
  if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true' && process.env.NODE_ENV === 'development') {
    const host = process.env.NEXT_PUBLIC_EMULATOR_HOST || '127.0.0.1';
    const authPort = parseInt(process.env.NEXT_PUBLIC_AUTH_EMULATOR_PORT || '9099', 10);
    const firestorePort = parseInt(process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR_PORT || '8080', 10);
    
    // Check if emulators are already connected to avoid re-connecting on hot reloads
    // @ts-ignore - _isInitialized is an internal property that's useful here
    if (!auth.emulatorConfig) {
        connectAuthEmulator(auth, `http://${host}:${authPort}`);
    }
    // @ts-ignore - _isInitialized is an internal property that's useful here
    if (!firestore.emulator) {
        connectFirestoreEmulator(firestore, host, firestorePort);
    }
  }

  return {
    firebaseApp,
    auth,
    firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
