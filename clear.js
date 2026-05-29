import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = ["usuarios", "alumnos", "cursosConfig", "partes", "solicitudes", "informes"];

async function clearCollections() {
  console.log("=============================================================");
  console.log("Iniciando el vaciado de documentos en Firebase Firestore...");
  console.log("=============================================================");

  try {
    for (const colName of COLLECTIONS) {
      console.log(`-> Vaciando colección: '${colName}'...`);
      const qSnapshot = await getDocs(collection(db, colName));
      
      if (qSnapshot.empty) {
        console.log(`   [INFO] La colección '${colName}' ya está vacía.`);
        continue;
      }

      let deletedCount = 0;
      for (const docSnap of qSnapshot.docs) {
        await deleteDoc(doc(db, colName, docSnap.id));
        deletedCount++;
      }
      console.log(`   [OK] Eliminados ${deletedCount} documentos de '${colName}'.`);
    }

    console.log("=============================================================");
    console.log("¡ÉXITO! Todas las colecciones han sido vaciadas por completo.");
    console.log("=============================================================");
    process.exit(0);

  } catch (error) {
    console.error("Error crítico durante el vaciado de colecciones:", error);
    process.exit(1);
  }
}

clearCollections();
