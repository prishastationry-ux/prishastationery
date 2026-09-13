import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0958955246",
  appId: "1:767560405682:web:3089ca4f301b13ff042fab",
  apiKey: "AIzaSyBtbdzHASASU0rxb3wuWrldtbHATBWs4b4",
  authDomain: "gen-lang-client-0958955246.firebaseapp.com",
  storageBucket: "gen-lang-client-0958955246.firebasestorage.app",
  messagingSenderId: "767560405682",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "ai-studio-prishastationery-078f1f9e-2724-4c68-837f-5a6cd2f9d7c1");
