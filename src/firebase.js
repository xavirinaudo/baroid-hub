import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyAv8DY4jqdOQDXkxfVG7jROG3MgqObQtH8",
    authDomain: "baroidhub.firebaseapp.com",
    projectId: "baroidhub",
    storageBucket: "baroidhub.firebasestorage.app",
    messagingSenderId: "745971447995",
    appId: "1:745971447995:web:ce728d93789aeb56e7919e"
};

// Inicializa Firebase
let app;
let auth;
let db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (error) {
    console.error("Error inicializando Firebase:", error);
}

export { auth, db };
export default app;
