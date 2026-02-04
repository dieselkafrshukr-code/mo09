// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBhSvldtpt-Xibu9_n-AAzVRCjW1Az-Aps",
    authDomain: "mo90-3d9ee.firebaseapp.com",
    projectId: "mo90-3d9ee",
    storageBucket: "mo90-3d9ee.firebasestorage.app",
    messagingSenderId: "290556247714",
    appId: "1:290556247714:web:0913f47cf51a85378461fb",
    measurementId: "G-SKTW979JPC"
};

// Initialize Firebase (Compat mode)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
