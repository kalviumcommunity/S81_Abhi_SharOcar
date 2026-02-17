// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAUKbxteYzMd0FV3T6QcZprqVKPomA7Hs0",
  authDomain: "shareocar-ae5c1.firebaseapp.com",
  projectId: "shareocar-ae5c1",
  storageBucket: "shareocar-ae5c1.firebasestorage.app",
  messagingSenderId: "163324725891",
  appId: "1:163324725891:web:434f866a6a3bde863469b6",
  measurementId: "G-6HF03FNJ8Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);