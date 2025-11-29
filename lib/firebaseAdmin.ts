// lib/firebaseAdmin.ts
import admin from 'firebase-admin';

declare global {
  // allow global variable during development to avoid reinit errors (Next.js hot reload)
  var _firebaseAdminApp: admin.app.App | undefined;
}

export function getFirebaseAdmin() {
  if (global._firebaseAdminApp) {
    return global._firebaseAdminApp;
  }

  // Initialize with environment variables instead of service account file
  const app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });

  global._firebaseAdminApp = app;
  return app;
}

export const firestore = () => getFirebaseAdmin().firestore();
