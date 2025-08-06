
// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";

// Your web app's Firebase configuration for timewise-px35l
const firebaseConfig = {
  "projectId": "timewise-px35l",
  "appId": "1:717085140579:web:2ece2ea4445a1cc7583a56",
  "storageBucket": "timewise-px35l.firebasestorage.app",
  "apiKey": "AIzaSyBAtfqN7HNiQEJAMUdINeOrjEmuQOnPghg",
  "authDomain": "timewise-px35l.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "717085140579"
};

// Initialize Firebase
let app;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApps()[0];
}

export { app };
