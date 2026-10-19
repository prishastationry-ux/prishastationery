import { initializeApp } from 'firebase/app';
import { initializeFirestore, setLogLevel } from 'firebase/firestore';

// Set Firebase log level to silent so backoff and transport warnings are suppressed
try {
  setLogLevel('silent');
} catch (e) {}

// Suppress noisy Firestore WebChannel transport warning logs and quota exhaustion errors in console
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const msg = args.join(' ');
    if (
      msg.includes('WebChannelConnection') ||
      msg.includes('transport errored') ||
      msg.includes('RPC \'Listen\'') ||
      msg.includes('resource-exhausted') ||
      msg.includes('Quota limit') ||
      msg.includes('Using maximum backoff delay') ||
      msg.includes('@firebase/firestore') ||
      msg.includes('WebSocket')
    ) {
      return; // Ignore
    }
    originalWarn(...args);
  };

  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.join(' ');
    if (
      msg.includes('resource-exhausted') ||
      msg.includes('Quota limit') ||
      msg.includes('Quota exceeded') ||
      msg.includes('429') ||
      msg.includes('RPC \'Write\'') ||
      msg.includes('Using maximum backoff delay') ||
      msg.includes('@firebase/firestore') ||
      msg.includes('WebSocket')
    ) {
      return; // Ignore
    }
    originalError(...args);
  };
}

const firebaseConfig = {
  projectId: "gen-lang-client-0958955246",
  appId: "1:767560405682:web:3089ca4f301b13ff042fab",
  apiKey: "AIzaSyBtbdzHASASU0rxb3wuWrldtbHATBWs4b4",
  authDomain: "gen-lang-client-0958955246.firebaseapp.com",
  storageBucket: "gen-lang-client-0958955246.firebasestorage.app",
  messagingSenderId: "767560405682",
};

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
}, "ai-studio-prishastationery-078f1f9e-2724-4c68-837f-5a6cd2f9d7c1");

