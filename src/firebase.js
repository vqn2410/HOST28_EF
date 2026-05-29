import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase provista por el usuario
const firebaseConfig = {
  apiKey: "AIzaSyBPxiQ9fy-45q3clg-8oLoQTd8PneVIE10",
  authDomain: "partesees28.firebaseapp.com",
  projectId: "partesees28",
  storageBucket: "partesees28.firebasestorage.app",
  messagingSenderId: "769365076413",
  appId: "1:769365076413:web:a5dd2081c455a1f7cdcad4",
  measurementId: "G-HXK6B5L6C0"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Analytics desactivado por compatibilidad del empaquetador
const analytics = null;

export { app, db, analytics };
