// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAh8zgC6yboMgWG56Q3z-GC6VqOWLR3AHY",
    authDomain: "mm10-719bf.firebaseapp.com",
    projectId: "mm10-719bf",
    storageBucket: "mm10-719bf.firebasestorage.app",
    messagingSenderId: "965633154475",
    appId: "1:965633154475:web:7528fbe7d5a5d79eea86ee",
    measurementId: "G-1J6G73W5MN"
};

// Initialize Firebase (Compat mode)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();
