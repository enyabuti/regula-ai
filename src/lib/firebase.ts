import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Use environment variables for production, but you can use the provided config for local testing
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCNwpPX8bxptRKwAopl20qgE_GW636ImZc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "regula-ai-752c9.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "regula-ai-752c9",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "regula-ai-752c9.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "962585695287",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:962585695287:web:17974b7d4dcd08dfb55bb2",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-7N4Y8TS6ZC"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Analytics only works in the browser
export let analytics: ReturnType<typeof getAnalytics> | undefined = undefined;
if (typeof window !== 'undefined') {
  isSupported().then((yes) => {
    if (yes) analytics = getAnalytics(app);
  });
} 